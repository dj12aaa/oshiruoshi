import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allowedUrl,topicQuery,FEED_TOPICS,selectFeedItems,buildLatestFeed} from '../api/_latest-feed.mjs';
const now=Date.parse('2026-09-08T03:00:00Z');
const fixture=(id,extra={})=>({id,title:'星街すいせい アクリルスタンド',source:'Yahoo!ショッピング',shop:'ショップA',origin:'official-api',image:'https://item-shopping.c.yimg.jp/i/g/test',url:`https://store.shopping.yahoo.co.jp/test/${id}.html`,status:'販売中',verifiedAt:new Date(now).toISOString(),...extra});
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('feed topics are bounded and rotate without accepting arbitrary URLs or queries',()=>{
  assert.equal(Object.keys(FEED_TOPICS).length,5);
  for(const category of Object.keys(FEED_TOPICS)){assert.ok(topicQuery(category,now));assert.notEqual(topicQuery(category,now),topicQuery(category,now+900000))}
  for(const invalid of ['__proto__','constructor','https://127.0.0.1','unknown'])assert.equal(topicQuery(invalid,now),null);
  assert.equal(allowedUrl('https://item-shopping.c.yimg.jp/a',['c.yimg.jp']),'https://item-shopping.c.yimg.jp/a');
  for(const value of ['http://item-shopping.c.yimg.jp/a','https://c.yimg.jp.evil.test/a','https://user@c.yimg.jp/a','javascript:alert(1)','https://127.0.0.1/a'])assert.equal(allowedUrl(value,['c.yimg.jp']),null);
});
test('feed preserves relevance, allowed image provenance and current API observations',()=>{
  const valid=fixture('valid'),items=[valid,fixture('noise',{title:'一般 収納ケース アクリルスタンド'}),fixture('snapshot',{origin:'verified-snapshot'}),fixture('old',{verifiedAt:'2026-08-23T00:00:00Z'}),fixture('future',{verifiedAt:'2027-01-01T00:00:00Z'}),fixture('sold',{status:'在庫なし'}),fixture('image',{image:null}),fixture('host',{image:'https://evil.test/a.jpg'}),fixture('redirect',{url:'https://evil.test/a'}),fixture('unapproved',{source:'ニュースサイト'})];
  const selected=selectFeedItems(items,'星街すいせい アクスタ','vtuber',now);
  assert.deepEqual(selected.map(item=>item.id),['valid']);assert.equal(selected[0].imagePolicy,'provider-api');
});
test('feed rotates across merchants, deduplicates and caps each category at eight',()=>{
  const items=Array.from({length:15},(_,i)=>fixture('a'+i));items.push(fixture('b',{shop:'ショップB'}),fixture('r',{source:'楽天市場',shop:'ショップC',image:'https://thumbnail.image.rakuten.co.jp/a.jpg',url:'https://item.rakuten.co.jp/test/r/',affiliate:true}));
  const selected=selectFeedItems([...items,items[0]],'星街すいせい アクスタ','vtuber',now);
  assert.equal(selected.length,8);assert.deepEqual(selected.slice(0,3).map(item=>item.shop),['ショップA','ショップB','ショップC']);assert.equal(new Set(selected.map(item=>item.id)).size,8);assert.equal(selected[2].affiliate,true);
});
test('feed reports partial provider failure and does not invent publication dates',async()=>{
  let requested;
  const data=await buildLatestFeed('vtuber',{now,search:async(query,options)=>{requested={query,options};return{items:[fixture('a',{title:query})],providers:{yahooShopping:{ok:true},rakuten:{ok:false,error:'upstream_403'}}}}});
  assert.equal(data.items.length,1);assert.equal(data.partial,true);assert.equal(data.providers.rakuten.error,'upstream_403');assert.equal(data.freshnessBasis,'retrieval-time-not-publication');assert.equal(data.items[0].releaseDate,null);assert.equal(requested.options.marketplacesOnly,true);
  const missing=await buildLatestFeed('music',{now,search:async()=>({items:[],providers:{}})});assert.equal(missing.providers.yahooShopping.error,'not_configured');
  assert.equal(await buildLatestFeed('not-real',{search:()=>{throw new Error('must not call')}}),null);
});
test('feed deadline handles a hanging provider without accepting a late result',async()=>{
  await assert.rejects(buildLatestFeed('vtuber',{now,search:()=>new Promise(()=>{}),timeoutMs:5}),/provider_timeout/);
});
test('latest page exposes accurate crawlable metadata, source policy and deterministic feed assets',()=>{
  const html=read('latest-goods.html'),js=read('latest-feed.js'),css=read('latest-feed.css'),search=read('api/search.js');
  for(const token of ['oshiru-feed-version" content="2026-09-08.23','latest-feed.css?v=20260908-23','latest-feed.js?v=20260908-23','id="feedPolicy"','取得日時は発売日・発表日ではありません','/discover/vtuber','/guide/how-oshiru-compares','<noscript>'])assert.ok(html.includes(token),token);
  for(const token of ['REFRESH_MS=300000','MAX_AGE_MS=600000','controller.abort(),10000','prefers-reduced-motion','pointercancel','pageshow','data.feedVersion!==VERSION','sponsored'])assert.ok(js.includes(token),token);
  assert.ok(search.indexOf("get('feed')==='latest'")<search.indexOf('if(!q)'));
  assert.match(css,/object-fit:contain/);assert.match(css,/scroll-snap-type:x mandatory/);
  assert.ok(html.includes('確認日：2026年8月23日'),'page edit is not a new manual news verification');
  assert.ok(read('api/sitemap.js').includes("{path:'/latest-goods',lastmod:'2026-09-08'}"));
});
