import { exactKeys, text } from './domain.ts';

function body(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0, finished = false;
    const chunks: Buffer[] = [];
    const fail = (error: Error) => { if (finished) return; finished = true; reject(error); };
    req.on('data', (chunk: any) => {
      if (finished) return;
      const buffer = Buffer.from(chunk); size += buffer.length;
      if (size > 65536) { fail(Object.assign(new Error('请求内容过大'), { status: 413 })); return; }
      chunks.push(buffer);
    });
    req.on('end', () => { if (!finished) { finished = true; resolve(Buffer.concat(chunks).toString('utf8')); } });
    req.on('error', fail);
    req.on('aborted', () => fail(new Error('请求已取消')));
  });
}
export function rpcRoute(connection: any, dispatch: (method: string, payload: any) => Promise<any>) {
  return async (req: any, res: any) => {
    let rpcId = 'invalid-request';
    const send = (status: number, result: any) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify({ type: 'server-response', rpcId, result })); };
    try {
      const rejection = connection.requestRejection(req);
      if (rejection !== undefined) { send(rejection, { ok: false, error: { code: 'daily-learning/access', message: rejection === 401 ? '请先登录宿主' : '请求来源不可信', details: {} } }); return; }
      if (req.method !== 'POST') { send(405, { ok: false, error: { code: 'daily-learning/method', message: '需要 POST 请求', details: {} } }); return; }
      if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new Error('需要 JSON 请求');
      if (Number(req.headers['content-length'] || 0) > 65536) throw Object.assign(new Error('请求内容过大'), { status: 413 });
      const input = JSON.parse(await body(req));
      exactKeys(input, ['type', 'rpcId', 'method', 'payload']);
      rpcId = text(input.rpcId, 100, '请求标识');
      const method = new URL(req.url, 'http://localhost').pathname.slice('/daily-learning/'.length);
      if (input.type !== 'client-request' || input.method !== method) throw new Error('请求方法与路径不匹配');
      send(200, await dispatch(method, input.payload));
    } catch (error: any) { send(error.status || 200, { ok: false, error: { code: 'daily-learning/request', message: error.message || '请求失败', details: {} } }); }
  };
}
