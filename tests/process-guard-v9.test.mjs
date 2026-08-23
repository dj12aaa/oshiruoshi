import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { listVercelFunctions } from '../scripts/check-vercel-function-budget.mjs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('project instructions force correction logging and exact production verification',()=>{
  const instructions=read('AGENTS.md');
  for(const token of [
    'docs/QUALITY_LESSONS.md',
    'symptom, root cause, permanent fix, automated guard, and production evidence',
    'https://oshiruoshi.vercel.app',
    'Never report deployment complete',
    'npm test'
  ])assert.ok(instructions.includes(token),token);
});

test('quality ledger keeps every known root cause and release gate',()=>{
  const lessons=read('docs/QUALITY_LESSONS.md');
  for(const id of ['QL-001','QL-002','QL-003','QL-004','QL-005','QL-006','QL-007','QL-008','QL-009','QL-010','QL-011','QL-012','QL-013','QL-014','QL-015'])assert.ok(lessons.includes(id),id);
  for(const token of [
    '動的挿入',
    '一般小売ノイズ除外',
    'MutationObserver',
    '販売期間',
    'data-live-until',
    '全品SOLD OUT',
    'production alias',
    '390pxと1440px',
    '文脈必須の複合entity',
    'スケルトンが終了せず',
    'live検索を並行開始',
    'UI版marker',
    '自己再発火',
    '別Node heredoc',
    'oshiruoshi.vercel.app',
    'V9の本番反映と実ブラウザ検査は未完了'
  ])assert.ok(lessons.includes(token),token);
});

test('production verification waits for real cards and serializes result writers',()=>{
  const browser=read('.github/workflows/dense-latest-production-smoke.yml');
  for(const token of ['.product-card[data-card-id]','startup-diagnostics','requestfailed','startup search did not render merchandise','controlsInsideVisual','card overlays escaped the image area',"q.value='なると'",'search did not return live merchandise','SEARCH_UI_VERSION','HOME_EXPERIENCE_VERSION',"oshiru-search-ui-version\" content=\"2026-08-23.12",'oshiru-home-version','console.log(name,JSON.stringify(metrics))','if: always()','if-no-files-found: warn'])assert.ok(browser.includes(token),token);
  const http=read('.github/workflows/dense-latest-check.yml');
  for(const token of ['ready=0','OSHIRU gallery v9',"SEARCH_UI_VERSION='2026-08-23.12'",'oshiru-search-ui-version','test "$ready" = 1'])assert.ok(http.includes(token),token);
  const quality=read('.github/workflows/v7-quality.yml');
  assert.ok(quality.includes("seo=fs.readFileSync('seo-structured-data.js','utf8'),home=fs.readFileSync('home-experience-v8.js','utf8')"));
  const writers=['affiliate-health.yml','dense-latest-production-smoke.yml','public-smoke.yml','search-quality.yml','ux-smoke.yml'];
  for(const workflow of writers){
    const source=read(`.github/workflows/${workflow}`);
    assert.ok(source.includes('group: oshiru-production-verification-writers'),workflow);
    assert.ok(source.includes('queue: max'),workflow);
    assert.ok(source.includes("bash .github/scripts/push-verification.sh"),workflow);
  }
  const affiliate=read('.github/workflows/affiliate-health.yml');
  assert.ok(affiliate.indexOf("fs.writeFileSync('/tmp/aff-url','')")<affiliate.indexOf('if(!r)'));
});

test('main production checks target the canonical domain and responsive browser flow',()=>{
  const http=read('.github/workflows/dense-latest-check.yml');
  const browser=read('.github/workflows/dense-latest-production-smoke.yml');
  assert.match(http,/base='https:\/\/oshiruoshi\.vercel\.app'/);
  assert.match(http,/precisionVersion/);
  for(const token of ['https://oshiruoshi.vercel.app','390','1440','overflow','latest-goods'])assert.ok(browser.includes(token),token);
});

test('Vercel Hobby function budget counts every runtime extension and excludes utilities intentionally',()=>{
  const apiDir=new URL('../api/',import.meta.url);
  const functions=listVercelFunctions(apiDir);
  assert.equal(functions.length,11,functions.join(', '));
  assert.ok(fs.existsSync(new URL('../api/_search-language.mjs',import.meta.url)));
  assert.ok(fs.existsSync(new URL('../api/_live-search-v8.js',import.meta.url)));
  assert.equal(fs.existsSync(new URL('../api/search-language.mjs',import.meta.url)),false);
  assert.equal(fs.existsSync(new URL('../api/live-search-v8.js',import.meta.url)),false);
  const config=JSON.parse(read('vercel.json'));
  assert.ok(config.rewrites.some(rule=>rule.source==='/api/live-search-v8'&&rule.destination==='/api/search'));
  for(const workflow of ['.github/workflows/dense-latest-check.yml','.github/workflows/v7-quality.yml']){
    const source=read(workflow);
    assert.ok(source.includes('node scripts/check-vercel-function-budget.mjs'));
  }
  const guard=read('scripts/check-vercel-function-budget.mjs');
  for(const token of ['readdirSync(directory,{withFileTypes:true})','RUNTIME_EXTENSION','reserve=1','Vercel function budget exceeded'])assert.ok(guard.includes(token),token);
});
