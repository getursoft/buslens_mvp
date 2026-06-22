import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function runMvpScraper() {
  const startedAt = new Date().toISOString();
  console.log('======================================================================');
  console.log('             REDBUS MVP GITHUB ACTION SCRAPER (PHASE 1)              ');
  console.log(`             Execution Started at: ${startedAt}                      `);
  console.log('======================================================================\n');

  // Hardcode only one route: Delhi -> Jaipur
  const sourceCity = 'Delhi';
  const destinationCity = 'Jaipur';
  
  // Calculate travel date 3 days in the future to keep it fresh
  const d = new Date();
  d.setDate(d.getDate() + 3);
  const journeyDate = d.toISOString().split('T')[0];

  console.log(`[Target Config] Route: ${sourceCity} ➔ ${destinationCity} on ${journeyDate}`);

  // Setup outputs directory
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clear any existing outputs
  const latestJsonPath = path.join(outputDir, 'redbus-latest.json');
  const reportJsonPath = path.join(outputDir, 'execution-report.json');

  let browser: any = null;
  let page: any = null;
  let success = false;
  let recordsFound = 0;
  let failureReason = '';
  const screenshotsCaptured: string[] = [];
  const extractedBuses: any[] = [];

  try {
    // 1. Browser Launches
    console.log('[Step 1/6] Launching Playwright Chromium...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/437.36',
      viewport: { width: 1280, height: 800 }
    });
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    console.log('Browser launched successfully.');

    // 2. Homepage Loads
    console.log('\n[Step 2/6] Loading redBus homepage...');
    await page.goto('https://www.redbus.in/', { waitUntil: 'load', timeout: 20000 });
    const homepageTitle = await page.title();
    console.log(`Homepage loaded successfully. Title: "${homepageTitle}"`);

    // Capture homepage screenshot
    const homepageScr = path.join(outputDir, 'homepage.png');
    await page.screenshot({ path: homepageScr });
    screenshotsCaptured.push('homepage.png');
    console.log(`Homepage screenshot captured.`);

    // 3. Search Page Loads
    console.log('\n[Step 3/6] Navigating to search URL...');
    const sCity = sourceCity.toLowerCase().replace(/\s+/g, '-');
    const dCity = destinationCity.toLowerCase().replace(/\s+/g, '-');
    const searchUrl = `https://www.redbus.in/bus-tickets/${sCity}-to-${dCity}?fromCityName=${encodeURIComponent(sourceCity)}&toCityName=${encodeURIComponent(destinationCity)}&onDate=${journeyDate}`;
    
    console.log(`Navigating to URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'load', timeout: 20000 });
    console.log('Search page navigation finished.');

    const searchScr = path.join(outputDir, 'search_loaded.png');
    await page.screenshot({ path: searchScr });
    screenshotsCaptured.push('search_loaded.png');

    // 4. Results Page Loads
    console.log('\n[Step 4/6] Parsing results page...');
    await page.waitForTimeout(4000); // Wait for extra content to load

    const cardSelectors = ['.bus-item', 'li.row-sec', 'div[class*="row-sec"]', '.bus-items > div', '.bus-item-details', '.bus-card'];
    let foundSelector = null;
    for (const sel of cardSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 5000 });
        foundSelector = sel;
        console.log(`Identified matching container selector: "${sel}"`);
        break;
      } catch (_) {}
    }

    if (!foundSelector) {
      throw new Error('Results selector missing. No results containers populated on the DOM.');
    }

    // Capture results page screenshot
    const resultsScr = path.join(outputDir, 'results.png');
    await page.screenshot({ path: resultsScr, fullPage: true });
    screenshotsCaptured.push('results.png');
    console.log(`Results page screenshot captured.`);

    // 5. First Bus Extracted
    console.log('\n[Step 5/6] Extracting bus details...');
    const busItems = await page.$$(foundSelector);
    console.log(`Total listings identified on live DOM: ${busItems.length}`);

    if (busItems.length === 0) {
      throw new Error('Found zero elements matching valid bus card container selectors.');
    }

    const limit = Math.min(5, busItems.length);
    for (let i = 0; i < limit; i++) {
      const item = busItems[i];
      const extractText = async (selArray: string[]) => {
        for (const s of selArray) {
          try {
            const val = await item.$eval(s, (el: any) => el.textContent?.trim());
            if (val) return val;
          } catch (_) {}
        }
        return '';
      };

      const operatorName = await extractText(['.travels', 'div[class*="travels"]', '.operator', 'div.operator', 'div.travel-name']);
      const departureTime = await extractText(['.dp-time', 'div[class*="dp-time"]', '.dep-time', 'span.dp-time']);
      const arrivalTime = await extractText(['.bp-time', 'div[class*="bp-time"]', '.arr-time', 'span.bp-time']);
      const duration = await extractText(['.dur', 'div[class*="dur"]', '.duration', 'span.dur']);
      const busType = await extractText(['.bus-type', 'div[class*="bus-type"]', '.type', 'span.bus-type']);
      const ratingRaw = await extractText(['.rating', '.rating-sec', 'span[class*="rating"]', 'div.rating']);
      const priceRaw = await extractText(['.fare span', '.fare', 'span.f-19', 'span.f-bold', 'span[class*="fare"]']);
      const seatsRaw = await extractText(['.seat-left', 'div[class*="seat-left"]', '.seats-left', 'span.seats']);

      extractedBuses.push({
        operatorName: operatorName || 'Unknown Operator',
        departureTime: departureTime || 'N/A',
        arrivalTime: arrivalTime || 'N/A',
        duration: duration || 'N/A',
        busType: busType || 'N/A',
        rating: ratingRaw || '0.0',
        price: priceRaw || '0',
        seatsAvailable: seatsRaw || '0'
      });
    }

    recordsFound = extractedBuses.length;
    console.log(`Successfully extracted ${recordsFound} buses raw listings!`);
    success = true;

  } catch (err: any) {
    console.error(`\n[Extraction Failure] ${err.message}`);
    failureReason = err.message || 'Unknown error occurred during browser scraping';
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser process closed safely.');
      } catch (_) {}
    }
  }

  const finishedAt = new Date().toISOString();

  // 6. Save results to output/redbus-latest.json
  console.log(`\n[Saving Data] Writing search results to: ${latestJsonPath}`);
  fs.writeFileSync(latestJsonPath, JSON.stringify(extractedBuses, null, 2), 'utf-8');

  // 7. Save report to output/execution-report.json
  const report = {
    success,
    recordsFound,
    startedAt,
    finishedAt,
    screenshotsCaptured,
    source: 'redBus',
    ...(failureReason ? { error: failureReason } : {})
  };

  console.log(`[Saving Report] Writing execution status update to: ${reportJsonPath}`);
  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n======================================================================');
  console.log('                        MVP PHASE 1 COMPLETE                           ');
  console.log('======================================================================');
  console.log(`- Success Status      : ${success}`);
  console.log(`- Records Found       : ${recordsFound}`);
  console.log(`- Elapsed Duration    : ${Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000)}s`);
  console.log(`- Screenshots Saved   : [${screenshotsCaptured.join(', ')}]`);
  console.log('======================================================================\n');

  process.exit(success ? 0 : 1);
}

runMvpScraper();
