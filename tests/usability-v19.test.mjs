import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('app.js');
const helper=name=>app.split('\n').find(line=>line.startsWith('function '+name+'('));

test('the entire browser app registers handlers and starts search without runtime exceptions',async()=>{
  const nodes=new Map(),errors=[];
  const element=()=>({value:'',checked:false,hidden:false,dataset:{},textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},setAttribute(){},focus(){}});
  const document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector)},querySelectorAll(){return[]}};
  document.querySelector('#maxPrice').value='15000';
  const context={document,window:{addEventListener(){}},localStorage:{getItem(){return'[]'},setItem(){}},console:{error:error=>errors.push(error)},AbortController,
    setTimeout:()=>0,clearTimeout(){},fetch:async()=>({ok:true,text:async()=>JSON.stringify({items:[],providers:{},idle:true})})};
  vm.createContext(context);
  assert.doesNotThrow(()=>vm.runInContext(app,context,{timeout:1000}));
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(errors.length,0,errors.map(String).join('\n'));
  for(const selector of ['#searchBtn','#sort','#resetBtn','#saveWatchBtn','#imageSearchBtn'])assert.equal(typeof nodes.get(selector)?.onclick==='function'||typeof nodes.get(selector)?.onchange==='function',true,selector);
  assert.equal(context.window.__OSHIRU_SEARCH_DIAGNOSTICS__.initial,'complete');
});

test('damaged or wrong-shaped saved data cannot stop search startup',()=>{
  for(const raw of ['{broken','null','{}','42','"text"']){
    const context={storage:{get:()=>raw}};
    vm.createContext(context);vm.runInContext(helper('readStoredArray')+'; result=readStoredArray("test");',context);
    assert.equal(context.result.length,0,raw);
  }
  const context={storage:{get:()=>'["a","b"]'}};
  vm.createContext(context);vm.runInContext(helper('readStoredArray')+'; result=readStoredArray("test");',context);
  assert.equal(context.result.join(','),'a,b');
  assert.doesNotMatch(app,/JSON\.parse\(storage\.get\('oshiru-v5-/);
});

test('known item price obeys budget even when shipping is unknown',()=>{
  const context={total:item=>item.shipping==null?null:item.price+item.shipping};
  vm.createContext(context);vm.runInContext(helper('withinPriceLimit')+'; check=withinPriceLimit;',context);
  assert.equal(context.check({price:16000,shipping:null},15000),false);
  assert.equal(context.check({price:14900,shipping:200},15000),false);
  assert.equal(context.check({price:14900,shipping:null},15000),true);
  assert.equal(context.check({price:null,shipping:null},15000),true);
});

test('readability, search feedback and crawlable discovery are loaded deterministically',()=>{
  const html=read('index.html'),css=read('gallery-v8.css');
  assert.match(html,/id="searchStatus"[^>]*role="status"/);
  assert.match(html,/id="resultMeta"[^>]*aria-live="polite"/);
  assert.match(html,/id="sort" aria-label="検索結果の並び順"/);
  assert.match(css,/\.product-title\{font-size:12px!important;line-height:1\.5!important;height:36px/);
  assert.match(css,/\.result-top\{display:grid!important;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(app,/一部の販売元を取得できませんでした/);
  assert.match(app,/絞り込みで\$\{hidden\}件非表示/);
  assert.match(app,/class="card-detail"/);
  for(const path of ['gojo-satoru','hoshimachi-suisei','hatsune-miku'])assert.ok(html.includes('href="/character/'+path+'"'));
  assert.match(html,/検索・比較でよくある質問/);
  assert.match(html,/市場の全商品や現在の在庫を保証するものではありません/);
});
