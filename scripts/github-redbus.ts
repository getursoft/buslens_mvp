import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runMvpScraper() {

  const startedAt = new Date().toISOString();

  console.log('========================================');
  console.log('BusLens GitHub RedBus MVP');
  console.log('========================================');

  const sourceCity = 'Delhi';
  const destinationCity = 'Jaipur';

  const outputDir = path.join(
    process.cwd(),
    'output'
  );

  fs.mkdirSync(
    outputDir,
    { recursive: true }
  );

  const latestJsonPath = path.join(
    outputDir,
    'redbus-latest.json'
  );

  const reportJsonPath = path.join(
    outputDir,
    'execution-report.json'
  );

  let browser: any = null;

  let success = false;

  let recordsFound = 0;

  let failureReason = '';

  const screenshotsCaptured: string[] = [];

  const extractedBuses: any[] = [];

  try {

    browser = await chromium.launch({

      headless: true,

      args: [

        '--disable-blink-features=AutomationControlled',

        '--disable-dev-shm-usage',

        '--disable-setuid-sandbox',

        '--disable-gpu',

        '--disable-features=IsolateOrigins,site-per-process',

        '--no-sandbox'

      ]

    });

    const context = await browser.newContext({

      viewport: {

        width: 1366,

        height: 768

      },

      locale: 'en-IN',

      timezoneId: 'Asia/Kolkata',

      userAgent:

      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',

      extraHTTPHeaders: {

        'Accept-Language':

        'en-IN,en;q=0.9'

      }

    });

    const page = await context.newPage();

    page.setDefaultTimeout(60000);

    await page.addInitScript(() => {

      Object.defineProperty(

        navigator,

        'webdriver',

        {

          get: () => false

        }

      );

    });

    const searchUrl =

'https://www.redbus.in/bus-tickets/delhi-to-jaipur';

    console.log(

      `Opening ${searchUrl}`

    );

    let navigationSuccess = false;

    for (

      let attempt = 1;

      attempt <= 3;

      attempt++

    ) {

      try {

        console.log(

          `Attempt ${attempt}`

        );

        await page.waitForTimeout(

          3000

        );

        const response =

        await page.goto(

          searchUrl,

          {

            waitUntil:

            'domcontentloaded',

            timeout: 60000

          }

        );

        console.log(

          `HTTP ${response?.status()}`

        );

        if (

          response &&

          response.status() < 400

        ) {

          navigationSuccess = true;

          break;

        }

      }

      catch (err:any) {

        console.log(

          err.message

        );

        await page.waitForTimeout(

          5000

        );

      }

    }

    if (

      !navigationSuccess

    ) {

      throw new Error(

        'GitHub runner blocked by redBus'

      );

    }

    await page.waitForTimeout(

      8000

    );

    const searchShot =

    path.join(

      outputDir,

      'search_loaded.png'

    );

    await page.screenshot({

      path: searchShot,

      fullPage: true

    });

    screenshotsCaptured.push(

      'search_loaded.png'

    );

    const selectors = [

      '.bus-item',

      '.row-sec',

      'li.row-sec',

      '[class*=bus-item]',

      '[class*=row-sec]'

    ];

    let selector = '';

    for (

      const s of selectors

    ) {

      try {

        const count =

        await page

        .locator(s)

        .count();

        if (count > 0) {

          selector = s;

          break;

        }

      }

      catch (_) {}

    }

    if (!selector) {

      throw new Error(

        'No bus cards found'

      );

    }

    const cards =

    await page

    .locator(selector)

    .all();

    const limit = Math.min(

      cards.length,

      5

    );

    for (

      let i = 0;

      i < limit;

      i++

    ) {

      const text =

      await cards[i]

      .innerText();

      extractedBuses.push({

        source:

        'redBus',

        route:

        `${sourceCity}-${destinationCity}`,

        rawText: text

      });

    }

    recordsFound =

    extractedBuses.length;

    success = true;

    const resultShot =

    path.join(

      outputDir,

      'results.png'

    );

    await page.screenshot({

      path: resultShot,

      fullPage: true

    });

    screenshotsCaptured.push(

      'results.png'

    );

  }

  catch (err:any) {

    failureReason =

    err.message;

  }

  finally {

    if (browser) {

      await browser.close();

    }

  }

  fs.writeFileSync(

    latestJsonPath,

    JSON.stringify(

      extractedBuses,

      null,

      2

    )

  );

  const finishedAt =

  new Date().toISOString();

  fs.writeFileSync(

    reportJsonPath,

    JSON.stringify(

      {

        success,

        recordsFound,

        startedAt,

        finishedAt,

        screenshotsCaptured,

        source:

        'redBus',

        error:

        failureReason

      },

      null,

      2

    )

  );

  console.log({

    success,

    recordsFound,

    error:

    failureReason

  });

  process.exit(

    success ? 0 : 1

  );

}

runMvpScraper();
