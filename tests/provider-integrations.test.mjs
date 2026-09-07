import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { yahooAffiliateId, yahooSearchParams, providerCapabilities } from '../api/_provider-config.mjs';
import { mapYahooHit, mapRakutenItem, liveSearch } from '../api/_core.mjs';
import { rankSearchItems } from '../api/_search-language.mjs';
import { relevant } from '../api/_live-search-v8.js';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const app=read('app.js');
const helper=name=>app.split('\n').find(line=>line.startsWith('function '+name+'('));
const affiliate='https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=123456&pid=987654&vc_url=';

test('Yahoo affiliate configuration is opt-in, validated and encoded exactly once',()=>{
  assert.equal(yahooAffiliateId(affiliate),affiliate);
  assert.equal(yahooAffiliateId(encodeURIComponent(affiliate)),affiliate);
  for(const bad of ['', '123456','javascript:alert(1)',affiliate.replace('valuecommerce.com','example.com'),affiliate+'https://example.com'])assert.equal(yahooAffiliateId(bad),null);
  const plain=yahooSearchParams('五条悟 アクスタ',{YAHOO_CLIENT_ID:'synthetic-client'});
  assert.equal(plain.has('affiliate_type'),false);
  const linked=yahooSearchParams('五条悟 アクスタ',{YAHOO_CLIENT_ID:'synthetic-client',YAHOO_AFFILIATE_ID:encodeURIComponent(affiliate)});
  assert.equal(new URLSearchParams(linked.toString()).get('affiliate_id'),affiliate);
  assert.equal(linked.get('affiliate_type'),'vc');
  assert.equal(linked.get('query'),plain.get('query'));
  assert.equal(linked.has('affiliate_rate_from'),false);
});

test('configuration diagnostics never claim network success or expose credentials',()=>{
  const env={YAHOO_CLIENT_ID:'synthetic-secret-client',RAKUTEN_APP_ID:'synthetic-secret-app',RAKUTEN_ACCESS_KEY:'synthetic-secret-key'};
  const providers=providerCapabilities(env),text=JSON.stringify(providers);
  for(const value of Object.values(env))assert.ok(!text.includes(value));
  assert.equal(providers.find(p=>p.id==='yahooShopping').configured,true);
  assert.equal(providers.find(p=>p.id==='rakuten').connection,'not-checked');
  assert.equal(providerCapabilities({RAKUTEN_APP_ID:'id'}).find(p=>p.id==='rakuten').configured,false);
  for(const id of ['amazon','mercari','google'])assert.equal(providers.find(p=>p.id===id).mode,'external-search');
  const context={};vm.createContext(context);vm.runInContext(helper('providerStateLabel')+'; label=providerStateLabel;',context);
  const yahoo=providers[0];
  assert.match(context.label(yahoo),/接続未検証/);
  assert.match(context.label(yahoo,{ok:false,error:'upstream_403'}),/今回取得失敗.*認証・許可/);
  assert.match(context.label(yahoo,{ok:true,count:0}),/取得成功・関連0件/);
  assert.doesNotMatch(app,/s\.yahooShopping\?'接続済み'/);
});

test('unknown prices, shipping and stock are not synthesized as free or available',()=>{
  for(const missing of [undefined,null,'',NaN,-1]){
    const yahoo=mapYahooHit({price:missing}),rakuten=mapRakutenItem({itemPrice:missing,postageFlag:missing,availability:missing});
    assert.equal(yahoo.price,null);assert.equal(rakuten.price,null);assert.equal(rakuten.shipping,null);
    assert.equal(yahoo.status,'要確認');assert.equal(rakuten.status,'要確認');
  }
});

test('affiliate URLs for different products do not collapse into one result',()=>{
  const a=mapYahooHit({code:'a',name:'五条悟 アクリルスタンド A',url:affiliate+encodeURIComponent('https://store.shopping.yahoo.co.jp/shop/a.html')});
  const b=mapYahooHit({code:'b',name:'五条悟 アクリルスタンド B',url:affiliate+encodeURIComponent('https://store.shopping.yahoo.co.jp/shop/b.html')});
  assert.equal(a.affiliate,true);assert.equal(a.canonicalUrl,'https://store.shopping.yahoo.co.jp/shop/a.html');
  const context={};vm.createContext(context);vm.runInContext(helper('mergeItems')+'; merge=mergeItems;',context);
  assert.equal(context.merge([a,b],[{...a,url:a.canonicalUrl}]).length,2);
  assert.equal(context.merge([a,b],[{...a,id:'snapshot-a',url:a.canonicalUrl}]).length,2);
  vm.runInContext(helper('productRel')+'; rel=productRel;',context);
  assert.match(context.rel(a),/sponsored/);
  assert.doesNotMatch(context.rel({}),/sponsored/);
});

test('affiliate flags do not change relevance, required terms or ranking',()=>{
  const items=[{id:'a',title:'呪術廻戦 五条悟 アクリルスタンド'},{id:'b',title:'呪術廻戦 五条悟 缶バッジ'},{id:'c',title:'呪術廻戦 虎杖悠仁 アクリルスタンド'}];
  const query='五条悟 アクスタ';
  const order=rows=>rankSearchItems(rows.filter(item=>relevant(item,query)),query).map(item=>item.id);
  assert.deepEqual(order(items),['a']);
  assert.deepEqual(order(items.map(item=>({...item,affiliate:true}))),order(items));
});

test('one provider failing cannot erase another provider response or reset item timestamps',async t=>{
  const names=['YAHOO_CLIENT_ID','YAHOO_AFFILIATE_ID','RAKUTEN_APP_ID','RAKUTEN_ACCESS_KEY','X_BEARER_TOKEN'];
  const previous=Object.fromEntries(names.map(key=>[key,process.env[key]]));
  t.after(()=>{for(const key of names){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key]}});
  Object.assign(process.env,{YAHOO_CLIENT_ID:'test-client',YAHOO_AFFILIATE_ID:affiliate,RAKUTEN_APP_ID:'test-app',RAKUTEN_ACCESS_KEY:'test-key'});delete process.env.X_BEARER_TOKEN;
  t.mock.method(globalThis,'fetch',async url=>String(url).includes('shopping.yahooapis.jp')?{ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({hits:[{code:'live-1',name:'五条悟 アクリルスタンド',price:1000,inStock:true,url:'https://store.shopping.yahoo.co.jp/shop/live.html'}]})}:{ok:false,status:403,headers:{get:()=>null},text:async()=>'forbidden'});
  const result=await liveSearch('五条悟 アクスタ 連携テスト');
  assert.equal(result.providers.yahooShopping.ok,true);assert.equal(result.providers.rakuten.ok,false);
  assert.equal(result.providers.rakuten.error,'upstream_403');assert.equal(result.items.length,1);
  const context={dt:value=>value};vm.createContext(context);vm.runInContext(helper('freshnessLabel')+'; label=freshnessLabel;',context);
  assert.match(context.label({origin:'verified-snapshot',verifiedAt:'2026-06-30'}),/^過去確認 2026-06-30$/);
});

test('mobile verification uses the visible search dialog and ad fallback respects CSP',()=>{
  const workflow=read('.github/workflows/dense-latest-production-smoke.yml');
  assert.match(workflow,/page\.locator\('#mobilePredictiveInput'\)\.fill\('なると'\)/);
  assert.match(workflow,/name:'この言葉で検索'/);
  const widget=read('rakuten-widget.html');
  assert.doesNotMatch(widget,/<script>/);
  assert.match(widget,/src="\/rakuten-widget-fallback\.js/);
  assert.doesNotMatch(read('vercel.json'),/script-src[^;]*unsafe-inline/);
  assert.match(read('index.html'),/id="providerDetailsBtn"/);
});
