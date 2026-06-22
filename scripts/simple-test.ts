import { chromium } from 'playwright';

async function test() {

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(
    'https://www.redbus.in',
    {
      waitUntil: 'load',
      timeout: 60000
    }
  );

  console.log(page.title());

  await page.waitForTimeout(15000);

  await browser.close();
}

test();
