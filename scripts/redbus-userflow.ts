import { chromium } from 'playwright';

async function run() {

  const browser = await chromium.launch({
    headless:false
  });

  const page = await browser.newPage();

  const url =
'https://www.redbus.in/bus-tickets/delhi-to-jaipur?fromCityId=733&fromCityName=Delhi&toCityId=807&toCityName=Jaipur&onward=23-Jun-2026&doj=23-Jun-2026&ref=search';

  console.log('Opening route');

  await page.goto(
    url,
    {
      waitUntil:'networkidle',
      timeout:60000
    }
  );

  console.log(
    page.url()
  );

  await page.waitForTimeout(
    5000
  );

  await page.screenshot({
    path:'results.png',
    fullPage:true
  });

  const selectors=[

    '.bus-item',

    '.row-sec',

    '[class*=row-sec]',

    '[class*=bus-item]'

  ];

  let selector='';

  for(const s of selectors){

    const count=
      await page.locator(s).count();

    console.log(
      s,
      count
    );

    if(count>0){

      selector=s;

      break;
    }
  }

  if(!selector){

    console.log(
      'No buses found'
    );

    await browser.close();

    return;
  }

  const cards=
    await page.locator(
      selector
    ).all();

  console.log(
    'Buses:',
    cards.length
  );

  const limit=
    Math.min(
      5,
      cards.length
    );

  for(

    let i=0;

    i<limit;

    i++

  ){

    const text=

      await cards[i]
      .innerText();

    console.log(
      '\n-----------'
    );

    console.log(
      text
    );
  }

  await page.waitForTimeout(
    10000
  );

  await browser.close();

}

run();
