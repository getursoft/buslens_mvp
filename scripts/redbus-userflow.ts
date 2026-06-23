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

    // FROM

    await page.locator('div')
      .filter({ hasText: /^From$/ })
      .nth(1)
      .click();

    await page.getByRole(
      'combobox',
      {
        name: 'From'
      }
    ).fill(source);

    await page.getByRole(
      'heading',
      {
        name: source
      }
    ).first().click();

    console.log('From selected');

    // TO

    await page.locator('div')
      .filter({ hasText: /^To$/ })
      .first()
      .click();

    await page.getByRole(
      'combobox',
      {
        name: 'To'
      }
    ).fill(destination);

    await page.getByRole(
      'heading',
      {
        name: destination
      }
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

    await page.waitForTimeout(
      10000
    );

    console.log(
      await page.url()
    );

    await page.screenshot({

      path: 'results.png',

      fullPage: true

    });

    // EXTRACT FIRST 10 BUSES

    const buses = await page.evaluate(() => {

      const rows = document.querySelectorAll(
        '.bus-item,.row-sec'
      );

      return Array.from(rows)

      .slice(0,10)

      .map((row:any) => ({

        text: row.innerText

      }));

    });

    fs.writeFileSync(

      'redbus-output.json',

      JSON.stringify(

        buses,

        null,

        2

      )

    );

    console.log(
      `Extracted ${buses.length} buses`
    );

  }

  catch(err:any){

    console.log(err);

  }

  await page.waitForTimeout(
    5000
  );

  await browser.close();

}

run();
