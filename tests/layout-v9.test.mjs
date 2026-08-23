import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('homepage directly loads critical gallery, image search and taskbar assets',()=>{
  const html=read('index.html'),seo=read('seo-structured-data.js');
  assert.match(html,/gallery-v8\.css\?v=20260822-9/);
  assert.match(html,/home-experience-v8\.js\?v=20260822-9/);
  assert.match(html,/navigation-extra-v7\.js\?v=20260822-9/);
  assert.doesNotMatch(seo,/loadScript|data-gallery-v8|home-experience-v8/);
});

test('dense grid has deterministic widths and controls are born inside the image',()=>{
  const css=read('gallery-v8.css'),app=read('app.js');
  for(const token of ['repeat(8,minmax(0,1fr))','repeat(7,minmax(0,1fr))','repeat(3,minmax(0,1fr))','aspect-ratio:1/1!important','overflow-x:hidden'])assert.ok(css.includes(token),token);
  assert.match(css,/\.gallery-compare\.is-selected/);
  const cardStart=app.indexOf('function card(i)'),cardEnd=app.indexOf('function bindCards()',cardStart),card=app.slice(cardStart,cardEnd);
  assert.ok(card.indexOf('gallery-price')<card.indexOf('</div><div class="card-body">'));
  assert.ok(card.indexOf('gallery-compare')<card.indexOf('</div><div class="card-body">'));
  assert.match(card,/aria-pressed/);
  assert.doesNotMatch(card,/<div class="card-actions"><button/);
});

test('search returns an immediate precision snapshot and always leaves the loading state',()=>{
  const html=read('index.html'),app=read('app.js'),performance=read('performance-v3.js'),precision=read('api/_live-search-v8.js'),live=read('api/live-search.js');
  for(const token of ['oshiru-search-ui-version" content="2026-08-23.12','/performance-v3.js?v=20260823-12','/app.js?v=20260823-12'])assert.ok(html.includes(token),token);
  for(const token of ["SEARCH_UI_VERSION='2026-08-23.12'",'timeoutMs=10000','initial=1','timeoutMs:6000','const livePromise=refreshLive(q,seq)','timeoutMs:12000','setTimeout(()=>{if(seq!==state.searchSeq)return','finishSearchUi','mergeItems(state.all,data.items||[])','finally{clearTimeout(watchdog)','検索中表示は終了しました'])assert.ok(app.includes(token),token);
  assert.ok(app.indexOf('const livePromise=refreshLive(q,seq)')<app.indexOf('const data=await json(`/api/search?initial=1'));
  for(const token of ["function initialUrl(q)","u.searchParams.set('initial','1')","nativeFetch(initialUrl(q).href,init)"])assert.ok(performance.includes(token),token);
  for(const token of ["u.searchParams.get('initial')==='1'","initial:true","fast=1"])assert.ok(precision.includes(token),token);
  for(const token of ["fast?1:4","provider_timeout","fast?5500:6500"])assert.ok(live.includes(token),token);
});

test('latest hub uses current official visuals, source labels and controllable rotation',()=>{
  const html=read('latest-goods.html'),js=read('latest-goods.js'),css=read('latest-goods.css'),nav=read('navigation-extra-v7.js');
  for(const token of ['latest-goods.css?v=20260823-10','latest-goods.js?v=20260823-10','確認日：2026年8月23日','先斗寧誕生日グッズ2026','獅白ぼたん 活動6周年記念','SOLD OUT 8/23','data-live-until','data-checked-at','jujutsukaisen.jp/news/images','straykidsjapan.com/runitjapan/img/og.png','official-preview-source','railToggle'])assert.ok(html.includes(token),token);
  for(const token of ['pruneExpired','Date.parse(el.dataset.liveUntil','filter(card=>!card.hidden)','setInterval(advance,4200)','pointerdown','prefers-reduced-motion','manualPaused','railState'])assert.ok(js.includes(token),token);
  for(const token of ['scroll-snap-type:x mandatory','height:220px','overflow-x:auto','.latest-badge.sold-out','.rail-status button'])assert.ok(css.includes(token),token);
  for(const token of ['画像検索','最新グッズ','data-open-image-search','/latest-goods'])assert.ok(nav.includes(token),token);
});
