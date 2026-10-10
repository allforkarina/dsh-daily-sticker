import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { rpcRoute } from '../src/routes.ts';

function request(body, extra = {}) { const req = Readable.from([JSON.stringify(body)]); return Object.assign(req, { url: '/daily-learning/state', method: 'POST', headers: { 'content-type': 'application/json' }, ...extra }); }
function response() { return { status: null, text: '', writeHead(status) { this.status = status; }, end(text) { this.text = text; }, get json() { return JSON.parse(this.text); } }; }
const body = { type: 'client-request', rpcId: 'test-id', method: 'state', payload: {} };
test('unauthenticated request is rejected before dispatch', async () => {
  let calls = 0; const res = response();
  await rpcRoute({ requestRejection: () => 401 }, async () => { calls++; })(request(body), res);
  assert.equal(res.status, 401); assert.equal(calls, 0);
});
test('trusted request returns correlated connection response envelope', async () => {
  const res = response();
  await rpcRoute({ requestRejection: () => undefined }, async () => ({ ok: true, value: 4 }))(request(body), res);
  assert.equal(res.status, 200); assert.equal(res.json.rpcId, 'test-id'); assert.equal(res.json.result.value, 4);
});
test('content-length and method mismatches never dispatch', async () => {
  let calls = 0; const route = rpcRoute({ requestRejection: () => undefined }, async () => { calls++; });
  const large = response(); await route(request(body, { headers: { 'content-type': 'application/json', 'content-length': '262145' } }), large); assert.equal(large.status, 413);
  const mismatch = response(); await route(request({ ...body, method: 'check' }), mismatch); assert.equal(mismatch.json.result.ok, false);
  assert.equal(calls, 0);
});

test('four long Chinese requirements fit authenticated RPC while streamed oversized bodies are rejected', async () => {
  let calls = 0; const route = rpcRoute({ requestRejection: () => undefined }, async () => { calls++; return { ok: true }; });
  const content = { ...body, payload: { learningRequests: Object.fromEntries(['algorithm', 'llm', 'agent', 'explore'].map(c => [c, '学'.repeat(12000)])) } };
  const good = response(); await route(request(content), good);
  assert.equal(good.status, 200); assert.equal(good.json.result.ok, true); assert.equal(calls, 1);
  const large = response(); await route(request({ ...body, payload: { text: '学'.repeat(100000) } }), large);
  assert.equal(large.status, 413); assert.equal(calls, 1);
});

test('mutations from an old directory never dispatch into a new directory even when revisions match', async () => {
  let currentRoot='D:/Learning/B',calls=0;
  const route=rpcRoute({requestRejection:()=>undefined},async()=>{calls++;return {ok:true};},()=>currentRoot);
  const payload={preferences:{project:'draft A'},revision:1,expectedDataRoot:'D:/Learning/A'};
  const input={...body,method:'preferences',payload};
  const stale=response(); await route(request(input,{url:'/daily-learning/preferences'}),stale);
  assert.equal(stale.json.result.ok,false); assert.match(stale.json.result.error.message,/目录/); assert.equal(calls,0);
  currentRoot='D:/Learning/A';
  const valid=response();await route(request(input,{url:'/daily-learning/preferences'}),valid);
  assert.equal(valid.json.result.ok,true);assert.equal(calls,1);
  const missing=response();await route(request({...input,payload:{revision:1}},{url:'/daily-learning/preferences'}),missing);
  assert.equal(missing.json.result.ok,false);assert.equal(calls,1);
});
