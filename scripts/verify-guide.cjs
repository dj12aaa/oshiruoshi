const fs=require('node:fs');
const {chromium}=require('playwright');
const base=process.env.OSHIRU_TEST_BASE_URL||'https://oshiruoshi.vercel.app';
const assert=(value,message)=>{if(!value)throw new Error(message)};
(async()=>{
  fs.mkdirSync('verification/screenshots',{recursive:true});const browser=await chromium.launch({headless:true}),results=[];
  try{
    for(const width of [390,1440]){
      const context=await browser.newContext({viewport:{width,height:900},locale:'ja-JP'}),page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(String(error)));
      await page.goto(`${base}/how-to-use.html`,{waitUntil:'networkidle',timeout:30000});
      await page.locator('.phone-figure').scrollIntoViewIfNeeded();
      assert(await page.locator('.phone-figure img').evaluate(img=>img.complete&&img.naturalWidth>0),'guide screenshot did not load');
      await page.locator('.spot-search').click();assert(new URL(page.url()).hash==='#step-search','numbered hotspot did not reach search instructions');
      await page.locator('[data-example="五条悟 サンリオ アクスタ"]').click();
      assert(await page.locator('#guideQuery').inputValue()==='五条悟 サンリオ アクスタ','example selector did not populate input');
      await page.locator('#trouble details').nth(1).locator('summary').click();
      assert(await page.locator('#trouble details').nth(1).getAttribute('open')!==null,'FAQ cannot be opened');
      for(const size of [width,320,768]){
        await page.setViewportSize({width:size,height:900});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`guide overflow at ${size}`);
      }
      await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`verification/screenshots/guide-${width}.png`,fullPage:true});
      await page.locator('#guideSearchForm button[type="submit"]').click();
      await page.waitForURL(url=>url.pathname==='/'&&url.searchParams.get('q')==='五条悟 サンリオ アクスタ',{timeout:10000});
      assert(errors.length===0,`guide runtime errors ${errors}`);
      results.push({width,hotspot:true,example:true,faq:true,formNavigation:true,overflow:false,errors});
      await context.close();
    }
    fs.writeFileSync('verification/v24-guide.json',JSON.stringify({version:'2026-09-08.24',checkedAt:new Date().toISOString(),results},null,2)+'\n');console.log('guide',JSON.stringify(results));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
