import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const item={id:'delayed-1',source:'Yahoo!ショッピング',title:'星街すいせい アクリルスタンド',price:1000,shipping:null,status:'販売中',origin:'official-api',verifiedAt:'2026-09-08T00:00:00Z',url:'https://store.shopping.yahoo.co.jp/test/1.html'};
const empty={items:[],providers:{yahooShopping:{ok:true,count:0}}};

function boot(){
  const nodes=new Map(),requests=[],timers=new Map(),errors=[];let timerId=0;
  function element(){const classes=new Set();return{value:'',checked:false,hidden:false,dataset:{},textContent:'',innerHTML:'',style:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,force){const on=force===undefined?!classes.has(c):force;if(on)classes.add(c);else classes.delete(c)}},addEventListener(){},setAttribute(){},focus(){}}}
  const source=Object.assign(element(),{value:'Yahoo!ショッピング',checked:true});
  const document={querySelector(selector){if(selector==='#productGrid .skeleton')return nodes.get('#productGrid')?.innerHTML.includes('skeleton')?element():null;if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector)},querySelectorAll(selector){return selector.startsWith('.source-check')?[source]:[]}};
  document.querySelector('#q').value='星街すいせい アクスタ';document.querySelector('#maxPrice').value='15000';
  const context={document,window:{addEventListener(){}},localStorage:{getItem:()=>'[]',setItem(){}},console:{error:e=>errors.push(e)},AbortController,
    setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),
    fetch:(url,opts)=>new Promise((resolve,reject)=>requests.push({url,opts,resolve:body=>resolve({ok:true,text:async()=>JSON.stringify(body)}),reject}))};
  vm.createContext(context);vm.runInContext(app,context,{timeout:1000});
  return{nodes,requests,timers,errors,context,initial:requests.find(r=>r.url.includes('initial=1')),live:requests.find(r=>r.url.includes('live-search-v8')),diag:context.window.__OSHIRU_SEARCH_DIAGNOSTICS__,node:s=>document.querySelector(s)};
}
const assertWaiting=env=>{
  assert.equal(env.node('#emptyState').classList.contains('hidden'),true,'not-found message must stay hidden');
  assert.match(env.node('#productGrid').innerHTML,/skeleton/);
  assert.equal(env.node('#searchBtn').textContent,'検索中…');
  assert.doesNotMatch(env.node('#resultMeta').textContent,/0件|ありません/);
};

test('every query gets the same eight direct-search destinations and snapshots remain identified',async()=>{
  const env=boot();env.initial.resolve(empty);env.live.resolve(empty);await flush();
  for(const query of ['初音ミク アクスタ','東雲絵名 6c','五条悟 サンリオ','見知らぬ作品 キーホルダー']){
    const links=vm.runInContext(`directLinks(${JSON.stringify(query)})`,env.context);
    assert.equal(links.length,8);
    for(const source of ['メルカリ','Yahoo!フリマ','Yahoo!オークション','Amazon','Yahoo!検索','Google'])assert.ok(links.some(link=>link.source===source&&decodeURIComponent(link.url).includes(query)),source+' '+query);
  }
  assert.equal(vm.runInContext("originLabel('web-index-snapshot')",env.context),'過去の確認情報');
  assert.equal(vm.runInContext("sourceMode('メルカリ')",env.context),'過去情報・外部検索');
  assert.equal(vm.runInContext("sourceMode('Yahoo!フリマ')",env.context),'過去情報・外部検索');
});

test('empty snapshot does not flash not-found before a delayed live success',async()=>{
  const env=boot();env.initial.resolve(empty);await flush();assertWaiting(env);
  assert.equal([...env.timers.values()].some(t=>t.ms===12000),true,'snapshot completion must retain the overall deadline');
  env.live.resolve({items:[item],providers:{yahooShopping:{ok:true,count:1}}});await flush();
  assert.match(env.node('#productGrid').innerHTML,/delayed-1/);assert.doesNotMatch(env.node('#productGrid').innerHTML,/skeleton/);
  assert.equal(env.node('#emptyState').classList.contains('hidden'),true);assert.equal(env.node('#searchBtn').textContent,'横断検索');
  assert.equal(env.timers.size,0);
});

test('zero live results do not flash not-found while the snapshot is still pending',async()=>{
  const env=boot();env.live.resolve(empty);await flush();assertWaiting(env);
  env.initial.resolve({items:[{...item,origin:'verified-snapshot'}],providers:{snapshot:{ok:true,count:1}}});await flush();
  assert.match(env.node('#productGrid').innerHTML,/delayed-1/);assert.equal(env.node('#emptyState').classList.contains('hidden'),true);
});

test('not-found is shown only after both requests actually finish with zero items',async()=>{
  const env=boot();env.initial.resolve(empty);await flush();assertWaiting(env);
  env.live.resolve(empty);await flush();
  assert.match(env.node('#emptyState').innerHTML,/条件に合う商品がありません/);
  assert.equal(env.node('#emptyState').classList.contains('hidden'),false);assert.equal(env.node('#productGrid').innerHTML,'');
  assert.equal(env.node('#webSearchFallback').hidden,false);
});

test('blank input gives a search prompt rather than claiming no merchandise exists',async()=>{
  const env=boot();env.initial.resolve(empty);env.live.resolve(empty);await flush();
  env.node('#q').value='';vm.runInContext('runSearch()',env.context);env.requests.at(-1).resolve(empty);await flush();
  assert.match(env.node('#emptyState').innerHTML,/推し・作品名で検索してください/);
});

test('hidden expiry and Web fallback states cannot be overridden by layout CSS',()=>{
  const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(read('gallery-v8.css'),/\.web-search-fallback\[hidden\]\{display:none!important\}/);
  assert.match(read('latest-goods.css'),/body\.latest-goods-page \[hidden\]\{display:none!important\}/);
  assert.match(read('.github/workflows/dense-latest-production-smoke.yml'),/node scripts\/verify-search-lifecycle\.cjs/);
});

test('network failure is not presented as absence of merchandise and offers Yahoo and Google',async()=>{
  const env=boot();env.initial.resolve(empty);await flush();env.live.reject(new Error('upstream_503'));await flush();
  assert.match(env.node('#emptyState').innerHTML,/検索を完了できませんでした/);assert.doesNotMatch(env.node('#emptyState').innerHTML,/条件に合う商品がありません/);
  assert.equal(env.node('#webSearchFallback').hidden,false);
  const links=env.node('#webSearchFallback').innerHTML;
  assert.match(links,/https:\/\/search\.yahoo\.co\.jp\/search\?p=/);assert.match(links,/https:\/\/www\.google\.com\/search\?q=/);
  assert.ok(decodeURIComponent(links).includes('星街すいせい アクスタ'));
  assert.equal(env.node('#searchBtn').textContent,'横断検索');assert.doesNotMatch(env.node('#productGrid').innerHTML,/skeleton/);
});

test('initial failure keeps waiting for live data and previously returned items survive partial failure',async()=>{
  const first=boot();first.initial.reject(new Error('initial_failed'));await flush();assertWaiting(first);first.live.resolve({items:[item],providers:{yahooShopping:{ok:true,count:1}}});await flush();
  assert.match(first.node('#productGrid').innerHTML,/delayed-1/);
  const second=boot();second.initial.resolve({items:[item],providers:{snapshot:{ok:true,count:1}}});await flush();
  assert.match(second.node('#productGrid').innerHTML,/delayed-1/);second.live.reject(new Error('offline'));await flush();
  assert.match(second.node('#productGrid').innerHTML,/delayed-1/);assert.equal(second.node('#emptyState').classList.contains('hidden'),true);
});

test('overall deadline ends pending UI and late or superseded requests cannot repaint it',async()=>{
  const env=boot();env.initial.resolve(empty);await flush();
  const deadline=[...env.timers.values()].find(t=>t.ms===12000);deadline.fn();
  assert.equal(env.diag.live,'timeout');assert.equal(env.node('#searchBtn').textContent,'横断検索');assert.doesNotMatch(env.node('#productGrid').innerHTML,/skeleton/);
  env.live.resolve({items:[item],providers:{yahooShopping:{ok:true,count:1}}});await flush();assert.doesNotMatch(env.node('#productGrid').innerHTML,/delayed-1/);
  const current=boot();current.node('#q').value='なると';vm.runInContext('runSearch()',current.context);await flush();
  current.live.resolve({items:[item]});current.initial.resolve({items:[item]});await flush();assert.doesNotMatch(current.node('#productGrid').innerHTML,/delayed-1/);assert.equal(current.diag.query,'なると');
});
