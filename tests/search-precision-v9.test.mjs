import test from 'node:test';
import assert from 'node:assert/strict';
import precisionHandler,{dedupeItems,effectiveQuery,relevant} from '../api/_live-search-v8.js';
import searchHandler from '../api/search.js';
import {buildSearchVariants,detectIntent,resolveSearchQuery} from '../api/_search-language.mjs';

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

test('context-aware aliases keep Felix and Kiriko merchandise precise without duplicate suffixes',()=>{
  const felixIntent=detectIntent('Felix ボイスキーホルダー');
  assert.deepEqual(felixIntent.entityGroups.map(group=>group.key),['stray-kids-felix']);
  assert.deepEqual(felixIntent.merchGroups.map(group=>group.key),['voice-keyholder']);
  assert.equal(effectiveQuery('Felix ボイスキーホルダー'),'Stray Kids フィリックス ボイスキーホルダー');
  assert.equal(relevant({title:'FELIX THE CAT キーホルダー 欧州限定'},'Felix ボイスキーホルダー'),false);
  assert.equal(relevant({title:'Stray Kids Felix ボイスキーホルダー SKZ 公式'},'Felix ボイスキーホルダー'),true);

  const malformed='felix ボイス キーホルダー ホルダー スキズ';
  const canonical=buildSearchVariants(malformed).find(variant=>variant.reason==='canonical')?.query||'';
  assert.equal(canonical,'Stray Kids フィリックス ボイスキーホルダー');
  assert.doesNotMatch(canonical,/(キーホルダー\s*ホルダー|ホルダー\s*キーホルダー|ぐるみ\s*ぐるみ)/);

  assert.equal(effectiveQuery('OW キリコ ぬい'),'オーバーウォッチ キリコ ぬいぐるみ');
  assert.equal(relevant({title:'OVERWATCH キリコ コスプレ 衣装'},'OW キリコ ぬい'),false);
  assert.equal(relevant({title:'ぽちゃだっこ土偶ぬいぐるみ'},'OW キリコ ぬい'),false);
  assert.equal(relevant({title:'Overwatch 2 キリコ ぬいぐるみ マスコット'},'OW キリコ ぬい'),true);
});

test('ambiguous names, residual collaboration terms and ordinary goods searches remain strict',()=>{
  assert.equal(effectiveQuery('Felix キーホルダー'),'Stray Kids フィリックス キーホルダー');
  assert.equal(relevant({title:'FELIX THE CAT 真鍮キーホルダー'},'Felix キーホルダー'),false);
  assert.equal(relevant({title:'Stray Kids Felix SKZOO キーホルダー 公式'},'Felix キーホルダー'),true);
  assert.equal(effectiveQuery('Felix THE CAT キーホルダー'),'felix the cat キーホルダー');
  assert.equal(relevant({title:'FELIX THE CAT 公式 キーホルダー'},'Felix THE CAT キーホルダー'),true);
  assert.equal(relevant({title:'呪術廻戦 五条悟 5周年 アクリルスタンド'},'五条悟 サンリオ'),false);
  assert.equal(relevant({title:'呪術廻戦 五条悟 シナモロール サンリオ アクリルスタンド'},'五条悟 サンリオ'),true);
});

test('typos and incomplete merchandise words are resolved before final relevance filtering',()=>{
  assert.equal(resolveSearchQuery('五条悟 アクスラ').resolved,'五条悟 アクリルスタンド');
  assert.equal(effectiveQuery('五条悟 アクスラ'),'呪術廻戦 五条悟 アクリルスタンド');
  assert.equal(relevant({title:'呪術廻戦 五条悟 アクリルスタンド 公式'},'五条悟 アクスラ'),true);
  assert.equal(resolveSearchQuery('初音ミク ぬいぐる').resolved,'初音ミク ぬいぐるみ');
  assert.equal(effectiveQuery('星町すいせい アクスタ'),'ホロライブ 星街すいせい アクリルスタンド');
  assert.equal(effectiveQuery('フリーレソ グッズ'),'葬送のフリーレン グッズ');
});

test('unknown but valid titles are not overcorrected to a registered entity',()=>{
  for(const query of ['名探偵コナン アクスタ','ハイキュー グッズ','ちいかわ ぬい','サンリオ キーホルダー','ONE PIECE フィギュア']){
    const resolution=resolveSearchQuery(query);
    assert.equal(resolution.changed,false,`${query} was overcorrected to ${resolution.resolved}`);
    assert.equal(resolution.resolved,query);
  }
});

test('identical titles are deduplicated within one marketplace but preserved across marketplaces',()=>{
  const items=[
    {id:'a',source:'Yahoo!ショッピング',title:'初音ミク ぬいぐるみ',url:'https://example.com/a',price:3000},
    {id:'b',source:'Yahoo!ショッピング',title:'初音ミク　ぬいぐるみ',url:'https://example.com/b',price:3200},
    {id:'c',source:'楽天市場',title:'初音ミク ぬいぐるみ',url:'https://example.com/c',price:3100}
  ];
  assert.deepEqual(dedupeItems(items).map(item=>item.id),['a','c']);
});

test('initial search returns verified precise results without waiting for live providers',async()=>{
  const started=Date.now();
  const result=await invoke(precisionHandler,'/api/search?initial=1&q='+encodeURIComponent('五条悟 サンリオ'));
  assert.equal(result.status,200);
  assert.equal(result.data.initial,true);
  assert.equal(result.data.precisionVersion,'2026-09-05.18');
  assert.ok(result.data.items.length>=4);
  assert.ok(result.data.items.every(item=>/五条悟/.test(`${item.title} ${item.character||''}`)));
  assert.ok(Date.now()-started<1000,`initial snapshot took ${Date.now()-started}ms`);
});

test('precision endpoint keeps verified marketplace fallback when live APIs return zero',async()=>{
  const result=await invoke(precisionHandler,'/api/live-search-v8?q='+encodeURIComponent('五条悟 サンリオ'));
  assert.equal(result.status,200);
  assert.equal(result.data.precisionVersion,'2026-09-05.18');
  assert.ok(result.data.items.length>=4);
  assert.ok(result.data.items.every(item=>/五条悟/.test(`${item.title} ${item.character||''}`)));
  assert.ok(new Set(result.data.items.map(item=>item.source)).size>=2);
  assert.ok(result.data.snapshotCount>=4);
});

test('primary search endpoint uses the same precision path from the first response',async()=>{
  const result=await invoke(searchHandler,'/api/search?q='+encodeURIComponent('東雲絵名 6c'));
  assert.equal(result.status,200);
  assert.equal(result.data.precisionVersion,'2026-09-05.18');
  assert.ok(result.data.items.some(item=>item.url==='https://jp.mercari.com/item/m42733344317'&&item.price===2666));
  assert.ok(result.data.items.every(item=>/東雲絵名|6c/i.test(`${item.title} ${item.character||''} ${(item.tags||[]).join(' ')}`)));
});
