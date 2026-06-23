import { chromium } from 'playwright';

async function run() {

  const browser = await chromium.launch({
    headless: false
  });

  const page = await browser.newPage();

  await page.goto(
    'https://www.redbus.in'
  );

  console.log('Homepage loaded');

  // FROM

  await page.locator(
    'div'
  ).filter({
    hasText:/^From$/
  }).nth(1).click();

  await page.getByRole(
    'combobox',
    {name:'From'}
  ).fill('delhi');

  await page.getByRole(
    'option',
    {name:'Delhi'}
  ).first().click();

  console.log('From selected');

  // TO

  await page.getByRole(
    'combobox',
    {name:'To'}
  ).fill('lucknow');

  await page.getByRole(
    'option',
    {name:/Lucknow/i}
  ).first().click();

  console.log('To selected');

  // DATE

  await page.getByRole(
    'combobox',
    {
      name:'Select Date of Journey.'
    }
  ).click();

  await page.waitForTimeout(
    2000
  );

  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate()+1
  );

  const day =
    tomorrow.getDate();

  await page.locator(
    `button[aria-label*="${day}"]`
  ).first().click();

  console.log(
    'Date selected'
  );

  // SEARCH

  await page.waitForTimeout(
    1000
  );

  await page.getByRole(
    'button',
    {
      name:/Search buses/i
    }
  ).click();

  console.log(
    'Search clicked'
  );

  await page.waitForLoadState(
    'networkidle'
  );

  console.log(
    page.url()
  );

  await page.screenshot({
    path:'results.png',
    fullPage:true
  });

  await page.waitForTimeout(
    10000
  );

  await browser.close();
}

run();
