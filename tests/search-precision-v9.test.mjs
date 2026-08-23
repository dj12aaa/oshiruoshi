import test from 'node:test';
import assert from 'node:assert/strict';
import precisionHandler,{effectiveQuery,relevant} from '../api/_live-search-v8.js';
import searchHandler from '../api/search.js';

function invoke(handler,url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const res={
      statusCode:200,
      setHeader(name,value){headers[String(name).toLowerCase()]=value},
      status(code){this.statusCode=code;return this},
      json(data){resolve({status:this.statusCode,headers,data});return this}
    };
    Promise.resolve(handler({method:'GET',url},res)).catch(reject);
  });
}

test('precision filter rejects ordinary retail noise but keeps oshi merchandise',()=>{
  const hairpin={title:'ヘアピン 2個セット プラパッチンピン なると',type:'通販',tags:['ヘアピン']};
  const manga={title:'なると！ 第7巻 コミック',type:'通販',tags:['コミック']};
  const merch={title:'NARUTO ナルト 疾風伝 公式 アクリルスタンド',type:'アクスタ',tags:['NARUTO','ナルト','グッズ']};
  assert.equal(relevant(hairpin,'ナルト'),false);
  assert.equal(relevant(manga,'ナルト'),false);
  assert.equal(relevant(merch,'ナルト'),true);
  assert.match(effectiveQuery('ナルト'),/NARUTO.*グッズ/);
});

test('precision endpoint keeps verified marketplace fallback when live APIs return zero',async()=>{
  const result=await invoke(precisionHandler,'/api/live-search-v8?q='+encodeURIComponent('五条悟 サンリオ'));
  assert.equal(result.status,200);
  assert.equal(result.data.precisionVersion,'2026-08-22.9');
  assert.ok(result.data.items.length>=4);
  assert.ok(result.data.items.every(item=>/五条悟/.test(`${item.title} ${item.character||''}`)));
  assert.ok(new Set(result.data.items.map(item=>item.source)).size>=2);
  assert.ok(result.data.snapshotCount>=4);
});

test('primary search endpoint uses the same precision path from the first response',async()=>{
  const result=await invoke(searchHandler,'/api/search?q='+encodeURIComponent('東雲絵名 6c'));
  assert.equal(result.status,200);
  assert.equal(result.data.precisionVersion,'2026-08-22.9');
  assert.ok(result.data.items.some(item=>item.url==='https://jp.mercari.com/item/m42733344317'&&item.price===2666));
  assert.ok(result.data.items.every(item=>/東雲絵名|6c/i.test(`${item.title} ${item.character||''} ${(item.tags||[]).join(' ')}`)));
});
