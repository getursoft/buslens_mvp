import { chromium } from 'playwright';

async function run() {

  const source = 'Delhi';
  const destination = 'Lucknow';

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  try {

    await page.goto(
      'https://www.redbus.in/',
      {
        waitUntil: 'load',
        timeout: 60000
      }
    );

    console.log('Homepage loaded');

    await page.waitForTimeout(3000);

    // ---------------- FROM ----------------

    await page.locator('div')
      .filter({ hasText: /^From$/ })
      .nth(1)
      .click();

    await page.getByRole(
      'combobox',
      { name: 'From' }
    ).fill(source);

    await page.waitForTimeout(2000);

    await page.getByRole(
      'heading',
      { name: source }
    ).first().click();

    console.log('From selected');

    console.log(
      'After FROM:',
      await page.url()
    );

    // ---------------- TO ----------------

    await page.locator('div')
      .filter({ hasText: /^To$/ })
      .first()
      .click();

    await page.getByRole(
      'combobox',
      { name: 'To' }
    ).fill(destination);

    await page.waitForTimeout(2000);

    await page.getByRole(
      'heading',
      { name: destination }
    ).first().click();

    console.log('To selected');

    console.log(
      'After TO:',
      await page.url()
    );

    // ---------------- DATE ----------------

    await page.getByRole(
      'combobox',
      {
        name: 'Select Date of Journey.'
      }
    ).click();

    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const day = tomorrow.getDate();

    await page.locator(
      `[aria-label*="${day}"]`
    ).first().click();

    console.log('Date selected');

    console.log(
      'After DATE:',
      await page.url()
    );

    await page.waitForTimeout(3000);

    // ---------------- SEARCH ----------------

    try {

      const searchBtn = page.getByRole(
        'button',
        {
          name: /search/i
        }
      );

      if (await searchBtn.isVisible()) {

        await searchBtn.click();

        console.log(
          'Search clicked'
        );

      }

    }

    catch(e){

      console.log(
        'Search button not found, maybe auto-search'
      );

    }

    // ---------------- WAIT ----------------

    await page.waitForTimeout(
      10000
    );

    console.log(
      'Final URL:',
      await page.url()
    );

    await page.screenshot({

      path:'results.png',

      fullPage:true

    });

    console.log(
      'results.png created'
    );

    // Keep browser open

    await page.waitForTimeout(
      120000
    );

  }

  catch(err:any){

    console.log(err);

  }

  await browser.close();

}

run();
