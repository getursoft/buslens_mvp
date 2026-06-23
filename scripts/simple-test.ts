import { chromium } from 'playwright';
import fs from 'fs';

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

    // FROM

    await page.locator('div')
      .filter({ hasText: /^From$/ })
      .nth(1)
      .click();

    await page.getByRole(
      'combobox',
      { name: 'From' }
    ).fill(source);

    await page.waitForTimeout(1500);

    await page.getByRole(
      'heading',
      { name: source }
    ).first().click();

    console.log('From selected');

    // TO

    await page.locator('div')
      .filter({ hasText: /^To$/ })
      .first()
      .click();

    await page.getByRole(
      'combobox',
      { name: 'To' }
    ).fill(destination);

    await page.waitForTimeout(1500);

    await page.getByRole(
      'heading',
      { name: destination }
    ).first().click();

    console.log('To selected');

    // DATE

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

    // SEARCH

    await page.getByRole(
      'button',
      {
        name: 'Search buses'
      }
    ).click();

    console.log('Search clicked');

    // WAIT

    await page.waitForLoadState(
      'networkidle',
      {
        timeout: 30000
      }
    ).catch(() => {});

    await page.waitForTimeout(
      10000
    );

    console.log(
      'Current URL:',
      await page.url()
    );

    // SAVE SCREENSHOT

    await page.screenshot({

      path: 'results.png',

      fullPage: true

    });

    // DEBUG DOM

    const debug = await page.evaluate(() => {

      return Array.from(
        document.querySelectorAll(
          'div'
        )
      )

      .slice(0,100)

      .map((x:any)=>({

        className:x.className,

        text:x.innerText?.substring(
          0,
          100
        )

      }));

    });

    fs.writeFileSync(

      'debug-dom.json',

      JSON.stringify(

        debug,

        null,

        2

      )

    );

    console.log(
      'debug-dom.json generated'
    );

  }

  catch(err:any){

    console.log(err);

  }

  // Keep browser open

  await page.waitForTimeout(
    60000
  );

  await browser.close();

}

run();
