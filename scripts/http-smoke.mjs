import { randomUUID } from 'node:crypto';
const base = `http://127.0.0.1:${process.env.DSH_TEST_PORT || '31297'}`;
const entry = await fetch(`${base}/daily-test-entry`, { redirect: 'manual' });
const exchange = await fetch(entry.headers.get('location'), { redirect: 'manual' });
const cookie = exchange.headers.get('set-cookie')?.split(';')[0];
if (!cookie) throw new Error('Test authentication exchange failed');
const response = await fetch(`${base}/daily-learning/state`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method: 'state', payload: {} }) });
console.log('Authenticated state POST:', response.status, (await response.text()).slice(0, 800));
