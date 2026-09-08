import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=path=>fs.readFileSync(new URL(path,root),'utf8');
test('guide is crawlable and all diagrams, images and internal steps have a real target',()=>{
  const html=read('how-to-use.html');
  assert.match(html,/canonical" href="https:\/\/oshiruoshi.vercel.app\/how-to-use"/);
  for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${match[1]}"`),match[1]);
  for(const match of html.matchAll(/(?:src|href)="\/(assets\/guide\/[^"?]+|how-to-use\.(?:css|js))[^\"]*"/g))assert.ok(fs.existsSync(new URL(match[1],root)),match[1]);
  assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/API未接続/);assert.match(html,/過去情報/);assert.match(html,/約5分ごと/);assert.match(html,/取得時刻は新発売日ではありません/);
  assert.match(html,/form id="guideSearchForm" action="\/" method="get"/);assert.match(html,/name="q"/);
  const json=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];assert.doesNotThrow(()=>JSON.parse(json));
  assert.ok(read('index.html').includes('href="/how-to-use"'));assert.ok(read('latest-goods.html').includes('href="/how-to-use"'));
  assert.ok(JSON.parse(read('vercel.json')).rewrites.some(rule=>rule.source==='/how-to-use'&&rule.destination==='/how-to-use.html'));
  assert.ok(read('api/sitemap.js').includes("{path:'/how-to-use',lastmod:'2026-09-08'}"));
});
