import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
const origin=`http://127.0.0.1:${process.env.DSH_TEST_PORT || '31303'}`;
const entry=await fetch(`${origin}/daily-test-entry`,{redirect:'manual'});
const exchange=await fetch(entry.headers.get('location'),{redirect:'manual'});
const cookie=exchange.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie,'Isolated authentication required');
async function call(method,payload){
  const response=await fetch(`${origin}/daily-learning/${method}`,{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({type:'client-request',rpcId:randomUUID(),method,payload})});
  const result=(await response.json()).result;assert.ok(result.ok,result.error?.message);return result.value;
}
function evidence(view){return {dataRoot:view.config.dataRoot,revision:view.state.revision,requests:view.state.preferences.learningRequests,versions:view.state.routes.llm.versions.map(r=>r.id),activeId:view.state.routes.llm.activeId,plan:view.state.days[view.today]};}
if(process.argv.includes('--before')){
  const dirs=(await readdir('.test-runtime')).filter(n=>/^data-learning-ui-\d+$/.test(n)).sort((a,b)=>Number(b.split('-').at(-1))-Number(a.split('-').at(-1)));
  let root;
  for(const dir of dirs){const path=resolve('.test-runtime',dir);const state=JSON.parse(await readFile(join(path,'store/state.json'),'utf8'));if(state.routes?.llm?.versions.length===2){root=path;break;}}
  assert.ok(root,'A completed route UI acceptance directory must exist');
  const current=await call('state',{});
  await call('configure',{...current.config,dataRoot:root,autoPrepareOnOpen:true,expectedConfig:current.config});
  const view=await call('state',{});assert.equal(view.state.routes.llm.versions.length,2);assert.equal(view.state.days[view.today].tasks.filter(t=>t.done).length,1);
  await writeFile('.test-runtime/routes-restart-before.json',JSON.stringify(evidence(view)));
  await writeFile('.test-runtime/fixture-calls.json',JSON.stringify({calls:-1}));
  console.log('Prepared isolated restart evidence: two route versions, one completed task');
}else{
  const expected=JSON.parse(await readFile('.test-runtime/routes-restart-before.json','utf8'));
  assert.deepEqual(evidence(await call('state',{})),expected);
  assert.equal(JSON.parse(await readFile('.test-runtime/fixture-calls.json','utf8')).calls,-1);
  console.log('Restart restored requests, route versions, exact daily plan and revision with zero model calls');
}
