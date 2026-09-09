// Repository CI browser test. Fixtures are isolated from all real users.
const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.OSHIRU_TEST_BASE_URL||'https://oshiruoshi.vercel.app';
const live=process.env.OSHIRU_FEED_LIVE==='1';
const assert=(value,message)=>{if(!value)throw new Error(message)};
const categories=['vtuber','anime','games','character','music'];
const now=()=>new Date().toISOString();
async function inspect(browser,width,fail=false){
  const context=await browser.newContext({viewport:{width,height:900},locale:'ja-JP',isMobile:width<600,hasTouch:width<600});
  const page=await context.newPage(),errors=[],responses=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('response',response=>{if(response.url().includes('feed=latest'))responses.push({url:response.url(),status:response.status()})});
  if(!live){
    await page.route('**/api/search?feed=latest&category=*',async route=>{
      const category=new URL(route.request().url()).searchParams.get('category');
      if(fail)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"fixture_unavailable"}'});
      const items=Array.from({length:3},(_,i)=>({id:category+i,category,title:`${category} アクリルスタンド ${i}（検証用）`,source:i===0?'楽天市場':'Yahoo!ショッピング',shop:`検証ショップ${i}`,query:'星街すいせい アクスタ',price:1200,condition:'新品',verifiedAt:now(),image:`https://item-shopping.c.yimg.jp/feed-fixture/${category}${i}.svg`,url:`https://store.shopping.yahoo.co.jp/test/${category}${i}.html`,affiliate:i===0}));
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({feedVersion:'2026-09-08.23',category,items,partial:true,providers:{yahooShopping:{ok:true},rakuten:{ok:false,error:'fixture_403'}}})});
    });
    await page.route('**/feed-fixture/**',route=>route.request().url().includes('vtuber0')?route.abort():route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#f0d9df"/></svg>'}));
  }
  try{
    await page.goto(`${base}/latest-goods.html`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.getElementById('liveGoods')?.dataset.feedState!=='loading',null,{timeout:15000});
    const initial=await page.evaluate(()=>({state:document.getElementById('liveGoods')?.dataset.feedState,cards:document.querySelectorAll('[data-feed-item]').length,shops:[...new Set([...document.querySelectorAll('.feed-shop')].map(el=>el.textContent))],sources:[...new Set([...document.querySelectorAll('.feed-source')].map(el=>el.textContent))],status:document.getElementById('liveGoodsStatus').textContent,refreshDisabled:document.getElementById('liveGoodsRefresh').disabled,overflow:document.documentElement.scrollWidth>innerWidth+2}));
    assert(!initial.overflow&&!initial.refreshDisabled,`${width}: UI did not settle ${JSON.stringify(initial)}`);
    if(fail){
      assert(initial.state==='unavailable'&&initial.cards===0&&/取得できません/.test(initial.status),'all-provider failure was not explicit');
      assert(await page.locator('.feed-web-links a').count()===2,'web fallback links missing');
    }else{
      assert(initial.state==='ready'&&initial.cards>=3&&initial.shops.length>=2,`${width}: multiple merchant feed not populated ${JSON.stringify(initial)}`);
      await page.locator('#liveGoodsRail').scrollIntoViewIfNeeded();
      await page.mouse.move(0,0);
      const before=await page.locator('#liveGoodsRail').evaluate(el=>el.scrollLeft);
      await page.waitForTimeout(4700);
      const after=await page.locator('#liveGoodsRail').evaluate(el=>el.scrollLeft);
      assert(after>before+2,`${width}: live feed did not auto-slide ${before}/${after}`);
      await page.locator('#liveGoodsToggle').click();
      assert(await page.locator('#liveGoodsToggle').getAttribute('aria-pressed')==='true','pause state missing');
      await page.waitForTimeout(600);
      const pausedAt=await page.locator('#liveGoodsRail').evaluate(el=>el.scrollLeft);
      await page.waitForTimeout(4300);
      assert(Math.abs(await page.locator('#liveGoodsRail').evaluate(el=>el.scrollLeft)-pausedAt)<2,'paused carousel still moved');
      if(!live){
        await page.locator('[data-feed-category="music"]').first().click();
        assert(await page.locator('[data-feed-item]').count()===3,'category filter mixed unrelated cards');
        await page.locator('[data-feed-category="all"]').first().click();
        await page.locator('#liveGoodsRefresh').click();
        await page.waitForFunction(()=>document.getElementById('liveGoods').dataset.feedState==='ready');
        assert(await page.locator('[data-feed-item]').count()===15,'refresh duplicated or lost items');
        assert(await page.locator('.feed-image-fallback:not([hidden])').count()>=1,'broken image fallback missing');
        assert(await page.locator('.feed-card a[rel~="sponsored"]').count()>0,'affiliate disclosure missing');
      }
      initial.autoMoved=after-before;initial.pauseWorked=true;
      initial.loadedImages=await page.locator('.feed-image img').evaluateAll(images=>images.filter(img=>img.complete&&img.naturalWidth>0).length);
      assert(initial.loadedImages>0,`${width}: no product image loaded`);
    }
    assert(errors.length===0,`${width}: runtime errors ${JSON.stringify(errors)}`);
    await page.screenshot({path:`verification/screenshots/feed-${live?'live':'fixture'}-${width}-${fail?'failure':'success'}.png`,fullPage:false});
    const result={width,live,fail,...initial,errors,responses};console.log('latest-feed',JSON.stringify(result));return result;
  }finally{await context.close()}
}
(async()=>{
  fs.mkdirSync('verification/screenshots',{recursive:true});const browser=await chromium.launch({headless:true});
  try{
    const results=[];for(const width of [390,1440]){results.push(await inspect(browser,width));if(!live)results.push(await inspect(browser,width,true))}
    fs.writeFileSync(`verification/v23-feed-${live?'live':'fixtures'}.json`,JSON.stringify({version:'2026-09-08.23',checkedAt:now(),live,results},null,2)+'\n');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
