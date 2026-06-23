import { chromium } from 'playwright';

async function run() {

  const source = 'Delhi';
  const destination = 'Jaipur';

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  try {

    await page.goto(
      'https://www.redbus.in',
      {
        waitUntil: 'load',
        timeout: 60000
      }
    );

    console.log('Homepage loaded');

    await page.waitForTimeout(3000);

    // Close popup if present

    try {

      const closeBtn = page.locator(
        '[aria-label="Close"]'
      );

      if (await closeBtn.isVisible()) {

        await closeBtn.click();

      }

    } catch (_) {}

    // ---------------- FROM ----------------

    await page.keyboard.type(source);

    await page.waitForTimeout(2000);

    await page.keyboard.press('ArrowDown');

    await page.keyboard.press('Enter');

    console.log('From selected');

    // ---------------- TO ----------------

    await page.keyboard.type(destination);

    await page.waitForTimeout(2000);

    await page.keyboard.press('ArrowDown');

    await page.keyboard.press('Enter');

    console.log('To selected');

    // ---------------- SEARCH ----------------

    const searchBtn = page.getByRole(
      'button',
      {
        name: /search buses/i
      }
    );

    if (await searchBtn.isVisible()) {

      await searchBtn.click();

    }

    console.log('Search clicked');

    await page.waitForTimeout(10000);

    console.log(
      'Current URL:',
      await page.url()
    );

    await page.screenshot({

      path: 'results.png',

      fullPage: true

    });

    console.log(
      'Results screenshot saved'
    );

  }

  catch(err:any){

    console.log(err);

  }

  await page.waitForTimeout(5000);

  await browser.close();

}

run();
