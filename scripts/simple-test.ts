import { chromium } from 'playwright';

async function test() {

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  try {

    const response = await page.goto(
      'https://www.redbus.in',
      {
        waitUntil: 'load',
        timeout: 60000
      }
    );

    console.log('Status:', response?.status());

    console.log('Title:', await page.title());

  } catch (err:any) {

    console.log(err.message);

  }

  await page.waitForTimeout(15000);

  await browser.close();

}

test();
