import { exactKeys, text } from './domain.js';
import { MAX_REQUEST_BYTES } from './learning.js';

function body(req     )                  {
  return new Promise((resolve, reject) => {
    let size = 0, finished = false;
    const chunks           = [];
    const fail = (error       ) => { if (finished) return; finished = true; reject(error); };
    req.on('data', (chunk     ) => {
      if (finished) return;
      const buffer = Buffer.from(chunk); size += buffer.length;
      if (size > MAX_REQUEST_BYTES) { fail(Object.assign(new Error('请求内容过大'), { status: 413 })); return; }
      chunks.push(buffer);
    });
    req.on('end', () => { if (!finished) { finished = true; resolve(Buffer.concat(chunks).toString('utf8')); } });
    req.on('error', fail);
    req.on('aborted', () => fail(new Error('请求已取消')));
  });
}
export function rpcRoute(connection     , dispatch                                                , currentRoot                      ) {
  return async (req     , res     ) => {
    let rpcId = 'invalid-request';
    const send = (status        , result     ) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify({ type: 'server-response', rpcId, result })); };
    try {
      const rejection = connection.requestRejection(req);
      if (rejection !== undefined) { send(rejection, { ok: false, error: { code: 'daily-learning/access', message: rejection === 401 ? '请先登录宿主' : '请求来源不可信', details: {} } }); return; }
      if (req.method !== 'POST') { send(405, { ok: false, error: { code: 'daily-learning/method', message: '需要 POST 请求', details: {} } }); return; }
      if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new Error('需要 JSON 请求');
      if (Number(req.headers['content-length'] || 0) > MAX_REQUEST_BYTES) throw Object.assign(new Error('请求内容过大'), { status: 413 });
      const input = JSON.parse(await body(req));
      exactKeys(input, ['type', 'rpcId', 'method', 'payload']);
      rpcId = text(input.rpcId, 100, '请求标识');
      const method = new URL(req.url, 'http://localhost').pathname.slice('/daily-learning/'.length);
      if (input.type !== 'client-request' || input.method !== method) throw new Error('请求方法与路径不匹配');
      if (currentRoot && ['prepare', 'check', 'preferences', 'routeGenerate'].includes(method) && input.payload?.expectedDataRoot !== currentRoot()) throw new Error('数据目录已更换，请关闭并重新打开设置后重试；原草稿尚未保存。');
      send(200, await dispatch(method, input.payload));
    } catch (error     ) { send(error.status || 200, { ok: false, error: { code: 'daily-learning/request', message: error.message || '请求失败', details: {} } }); }
  };
}
