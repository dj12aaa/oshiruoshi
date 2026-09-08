// Isolated browser fixtures: delay/fail responses in this test context only.
// No marketplace data, production configuration or user records are changed.
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.OSHIRU_TEST_BASE_URL||'https://oshiruoshi.vercel.app';
const query='星街すいせい アクスタ';
const item={id:'lifecycle-fixture',source:'Yahoo!ショッピング',title:'星街すいせい アクリルスタンド（検証用）',price:1000,shipping:0,status:'販売中',condition:'新品',origin:'official-api',verifiedAt:'2026-09-08T00:00:00Z',url:'https://store.shopping.yahoo.co.jp/example/lifecycle.html'};
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function inspect(browser,width,mode){
  const context=await browser.newContext({viewport:{width,height:900},locale:'ja-JP',isMobile:width<600,hasTouch:width<600});
  const page=await context.newPage();let release;
  const gate=new Promise(resolve=>{release=resolve});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.route('**/api/search?**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({query,items:[],providers:{snapshot:{ok:true,count:0}}})}));
  await page.route('**/api/live-search-v8?**',async route=>{
    await gate;
    const body=mode==='failure'?{error:'simulated_provider_failure'}:{query,items:mode==='success'?[item]:[],providers:{yahooShopping:{ok:true,count:mode==='success'?1:0}}};
    await route.fulfill({status:mode==='failure'?503:200,contentType:'application/json',body:JSON.stringify(body)});
  });
  try{
    await page.goto(`${base}/?q=${encodeURIComponent(query)}`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>window.__OSHIRU_SEARCH_DIAGNOSTICS__?.initial==='complete',null,{timeout:10000});
    // Hold live response for two seconds AFTER the zero-item initial response.
    const premature=[];
    for(let index=0;index<8;index++){
      const sample=await page.evaluate(()=>({empty:!document.getElementById('emptyState').classList.contains('hidden'),button:document.getElementById('searchBtn').textContent,meta:document.getElementById('resultMeta').textContent,skeletons:document.querySelectorAll('#productGrid .skeleton').length}));
      if(sample.empty||sample.button!=='検索中…'||/0件|ありません/.test(sample.meta)||sample.skeletons===0)premature.push(sample);
      await page.waitForTimeout(250);
    }
    await page.screenshot({path:`verification/screenshots/lifecycle-${width}-${mode}-pending.png`,fullPage:false});
    assert(premature.length===0,`${width}/${mode}: premature empty UI ${JSON.stringify(premature)}`);
    release();
    await page.waitForFunction(()=>['complete','error'].includes(window.__OSHIRU_SEARCH_DIAGNOSTICS__?.live),null,{timeout:6000});
    const result=await page.evaluate(()=>({
      cards:document.querySelectorAll('#productGrid [data-card-id]').length,
      skeletons:document.querySelectorAll('#productGrid .skeleton').length,
      emptyVisible:!document.getElementById('emptyState').classList.contains('hidden'),
      message:document.getElementById('emptyState').textContent,
      button:document.getElementById('searchBtn').textContent,
      fallbackVisible:document.getElementById('webSearchFallback').getBoundingClientRect().height>0,
      links:[...document.querySelectorAll('#webSearchFallback a')].map(a=>a.href),
      overflow:document.documentElement.scrollWidth>innerWidth+2
    }));
    assert(result.skeletons===0&&result.button==='横断検索'&&!result.overflow,`${width}/${mode}: failed to settle ${JSON.stringify(result)}`);
    if(mode==='success')assert(result.cards===1&&!result.emptyVisible,`${width}: delayed result was not rendered`);
    else{
      assert(result.emptyVisible&&result.fallbackVisible,`${width}/${mode}: fallback missing`);
      assert(mode==='failure'?result.message.includes('検索を完了できませんでした'):result.message.includes('条件に合う商品がありません'),`${width}/${mode}: wrong terminal message`);
      for(const [host,param] of [['search.yahoo.co.jp','p'],['www.google.com','q']])assert(result.links.some(link=>{const url=new URL(link);return url.hostname===host&&url.searchParams.get(param)===query}),`${width}/${mode}: query was not preserved for ${host}`);
    }
    assert(errors.length===0,`${width}/${mode}: runtime errors ${errors.join('; ')}`);
    await page.screenshot({path:`verification/screenshots/lifecycle-${width}-${mode}-settled.png`,fullPage:false});
    console.log('search-lifecycle',JSON.stringify({width,mode,prematureEmptyFrames:premature.length,...result}));
    return{width,mode,prematureEmptyFrames:premature.length,...result};
  }finally{release();await context.close()}
}

(async()=>{
  fs.mkdirSync('verification/screenshots',{recursive:true});
  const browser=await chromium.launch({headless:true}),results=[];
  try{for(const width of [390,1440])for(const mode of ['success','failure','zero'])results.push(await inspect(browser,width,mode))}finally{await browser.close()}
  fs.writeFileSync('verification/v22-search-lifecycle.json',JSON.stringify({version:'2026-09-08.22',checkedAt:new Date().toISOString(),fixtureOnly:true,results},null,2)+'\n');
})().catch(error=>{console.error(error);process.exit(1)});
