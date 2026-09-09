import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRakutenItem } from '../api/_core.mjs';

test('Rakuten item is normalized and prefers affiliate URL',()=>{
  const item=mapRakutenItem({
    itemCode:'shop:item-1',
    itemName:'五条悟 アクリルスタンド',
    catchcopy:'限定',
    itemPrice:2480,
    itemUrl:'https://item.rakuten.co.jp/shop/item-1/',
    affiliateUrl:'https://hb.afl.rakuten.co.jp/example',
    mediumImageUrls:['https://example.invalid/item.jpg'],
    availability:1,
    postageFlag:0,
    shopName:'テストショップ',
    reviewCount:12,
    reviewAverage:4.5
  },0,'2026-08-17T00:00:00.000Z');

  assert.equal(item.source,'楽天市場');
  assert.equal(item.price,2480);
  assert.equal(item.shipping,0);
  assert.equal(item.status,'販売中');
  assert.equal(item.url,'https://hb.afl.rakuten.co.jp/example');
  assert.equal(item.canonicalUrl,'https://item.rakuten.co.jp/shop/item-1/');
  assert.equal(item.affiliate,true);
  assert.equal(item.imageVerified,true);
});

test('Rakuten item keeps shipping unknown when postage is not included',()=>{
  const item=mapRakutenItem({
    itemCode:'shop:item-2',
    itemName:'缶バッジ',
    itemPrice:900,
    itemUrl:'https://item.rakuten.co.jp/shop/item-2/',
    availability:1,
    postageFlag:1
  });
  assert.equal(item.shipping,null);
  assert.equal(item.affiliate,false);
});
