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

test('latest hub uses current official visuals, source labels and controllable rotation',()=>{
  const html=read('latest-goods.html'),js=read('latest-goods.js'),css=read('latest-goods.css'),nav=read('navigation-extra-v7.js');
  for(const token of ['先斗寧誕生日グッズ2026','獅白ぼたん 活動6周年記念','jujutsukaisen.jp/news/images','straykidsjapan.com/runitjapan/img/og.png','official-preview-source','railToggle'])assert.ok(html.includes(token),token);
  for(const token of ['setInterval(advance,4200)','pointerdown','prefers-reduced-motion','manualPaused','railState'])assert.ok(js.includes(token),token);
  for(const token of ['scroll-snap-type:x mandatory','height:220px','overflow-x:auto','.rail-status button'])assert.ok(css.includes(token),token);
  for(const token of ['画像検索','最新グッズ','data-open-image-search','/latest-goods'])assert.ok(nav.includes(token),token);
});
