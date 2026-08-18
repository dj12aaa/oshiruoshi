import test from 'node:test';
import assert from 'node:assert/strict';
import { mapYahooHit, cleanQuery } from '../api/_core.mjs';

test('Yahoo Shopping hit is normalized for OSHIRU cards',()=>{
  const item=mapYahooHit({
    code:'shop_001',name:'五条悟 アクリルスタンド',price:2480,inStock:true,condition:'new',
    url:'https://store.shopping.yahoo.co.jp/example/item.html',
    exImage:{url:'https://item-shopping.c.yimg.jp/i/n/example_001'},
    shipping:{code:2,name:'送料無料'},seller:{sellerId:'example',name:'サンプルストア'},janCode:'4900000000000'
  },0,'2026-08-17T12:00:00.000Z');
  assert.equal(item.source,'Yahoo!ショッピング');
  assert.equal(item.price,2480);
  assert.equal(item.shipping,0);
  assert.equal(item.status,'販売中');
  assert.equal(item.condition,'新品');
  assert.equal(item.shop,'サンプルストア');
  assert.equal(item.imageVerified,true);
});

test('Yahoo conditional/unknown shipping is not falsely treated as free',()=>{
  const item=mapYahooHit({code:'x',name:'商品',price:1000,inStock:true,condition:'used',url:'https://store.shopping.yahoo.co.jp/example/x.html',shipping:{code:3,name:'条件付き送料無料'}},0);
  assert.equal(item.shipping,null);
  assert.equal(item.condition,'中古');
});

test('queries are normalized and capped',()=>{
  assert.equal(cleanQuery('  五条悟\n  アクスタ  '),'五条悟 アクスタ');
  assert.equal(cleanQuery('x'.repeat(120)).length,80);
});
