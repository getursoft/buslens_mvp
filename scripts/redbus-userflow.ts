import { chromium } from 'playwright';

async function run() {

 const browser = await chromium.launch({
   headless:false
 });

 const page = await browser.newPage();

 await page.goto(
   'https://www.redbus.in',
   {
     waitUntil:'load'
   }
 );

 // search logic here

}

run();
