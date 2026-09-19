import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const out='test-results/final-product-audit';
const browser=await chromium.launch();const rows=[];
try {
for (const width of [1440,390]) {
const ctx=await browser.newContext({viewport:{width,height:900},colorScheme:'dark',reducedMotion:'reduce'});
await ctx.addInitScript(()=>{localStorage.setItem('tc-cookie-consent','declined');localStorage.setItem('tc-script-skip','1');});
const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [id,path,step] of [
['home','/',null],['learn','/learn',null],['world','/worlds/deep-orbit',null],['pricing','/pricing',null],
['intro-brief','/worlds/deep-orbit/foundations/introduction-to-tensors',0],
['intro-concept','/worlds/deep-orbit/foundations/introduction-to-tensors',1],
['shapes-concept','/worlds/deep-orbit/foundations/tensor-shapes',1],
['normalization-concept','/worlds/deep-orbit/foundations/normalization',1],
['normalization-challenge','/worlds/deep-orbit/foundations/normalization',3],
['normalization-ending','/worlds/deep-orbit/foundations/normalization',5]]) {
if(step!==null) await page.addInitScript(({path,step})=>{const slug=path.split('/').pop();localStorage.setItem('tc_step_deep-orbit_'+slug,String(step));localStorage.setItem('tc_step_max_deep-orbit_'+slug,'5');},{path,step});
const response=await page.goto('http://127.0.0.1:3118'+path,{waitUntil:'domcontentloaded'});
if(step!==null) await expect(page.getByRole('group',{name:`Step ${step+1} of 6:`,exact:false})).toBeVisible();
await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
await page.screenshot({path:`${out}/${id}-${width}.png`});
await page.screenshot({path:`${out}/${id}-${width}-full.png`,fullPage:true});
rows.push({id,width,path,step,status:response.status(),errors:[...errors],...await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,visibleText:document.body.innerText,paragraphs:[...document.querySelectorAll('p')].filter(e=>e.getBoundingClientRect().height>0).slice(0,12).map(e=>({font:getComputedStyle(e).fontSize,width:e.getBoundingClientRect().width,text:e.innerText.slice(0,80)}))}))});
console.log(id,width,response.status());
}
await ctx.close();
}
} finally {await browser.close();writeFileSync(`${out}/observations.json`,JSON.stringify(rows,null,2));}
