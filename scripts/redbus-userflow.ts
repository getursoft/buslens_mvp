import { chromium } from 'playwright';

async function run() {

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

    // FROM

    await page.locator('div')
      .filter({ hasText: /^From$/ })
      .nth(1)
      .click();

    await page.getByRole(
      'heading',
      { name: 'Kashmiri Gate' }
    ).click();

    console.log('From selected');

    // TO

    await page.getByRole(
      'heading',
      { name: 'Jaipur (Rajasthan)' }
    ).click();

    console.log('To selected');

    // DATE

    await page.getByRole(
      'combobox',
      { name: 'Select Date of Journey.' }
    ).click();

    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const day = tomorrow.getDate();

    await page.locator(
      `button[aria-label*="${day}"]`
    ).first().click();

    console.log('Date selected');

    // SEARCH

    await page.getByRole(
      'button',
      {
        name: 'Search buses'
      }
    ).click();

    console.log('Search clicked');

    // Wait results

    await page.waitForTimeout(
      10000
    );

    await page.screenshot({
      path: 'results.png',
      fullPage: true
    });

    console.log(
      'Results page loaded'
    );

  }

  catch(err:any){

    console.log(err);

  }

  await page.waitForTimeout(
    10000
  );

  await browser.close();

}

run();
