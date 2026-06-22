import { chromium } from 'playwright';
import fs from 'fs';

async function run() {

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  try {

    const source = 'Delhi';
    const destination = 'Jaipur';

    await page.goto(
      'https://www.redbus.in',
      {
        waitUntil: 'load',
        timeout: 60000
      }
    );

    console.log('Homepage loaded');

    // FROM

    await page.locator('div').filter({
      hasText: /^From$/
    }).nth(1).click();

    await page.getByText(source).nth(1).click();

    // TO

    await page.getByRole(
      'heading',
      {
        name: `${destination} (Rajasthan)`
      }
    ).click();

    // DATE

    await page.getByRole(
      'combobox',
      {
        name: 'Select Date of Journey.'
      }
    ).click();

    // Tomorrow

    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    const day = tomorrow.getDate();

    await page.locator(
      `button[aria-label*="${day}"]`
    ).first().click();

    // SEARCH

    await page.getByRole(
      'button',
      {
        name: 'Search buses'
      }
    ).click();

    console.log('Search submitted');

    // Wait results

    await page.waitForTimeout(
      10000
    );

    // Screenshot

    await page.screenshot({

      path: 'results.png',

      fullPage: true

    });

    // Extract first 5 buses

    const buses = await page.evaluate(() => {

      const rows = document.querySelectorAll(
        '.bus-item,.row-sec'
      );

      return Array.from(rows)
        .slice(0,5)
        .map((x:any) => ({

          text: x.innerText

        }));

    });

    console.log(buses);

    fs.writeFileSync(

      'redbus-output.json',

      JSON.stringify(

        buses,

        null,

        2

      )

    );

    console.log(
      'Completed'
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
