import { searchBuses } from '../providers/redbus';
import fs from 'fs';
import path from 'path';

async function runTest() {
  console.log('======================================================================');
  console.log('           REDBUS LIVESTREAM INTEGRATION & AUDIT TEST                ');
  console.log('                 Route: Delhi ➔ Jaipur (Strict)                       ');
  console.log('======================================================================\n');

  try {
    const journeyDate = '2026-06-15';
    // Clear old validation report if exists to avoid stale results
    const jsonPath = '/debug/redbus/validation_report.json';
    if (fs.existsSync(jsonPath)) {
      try {
        fs.unlinkSync(jsonPath);
      } catch (_) {}
    }

    console.log('[Audit] Invoking redBus direct scraper search (Mocking Disabled)...');
    const listings = await searchBuses('Delhi', 'Jaipur', journeyDate);

    console.log('\n========================= TEST RESULTS =========================');
    console.log(`* Real RedBus Listings Fetched : ${listings.length}`);
    
    if (listings.length > 0) {
      const sortedByPrice = [...listings].sort((a, b) => a.price - b.price);
      console.log(`* Cheapest Real Fare Extracted : INR ${sortedByPrice[0].price} (${sortedByPrice[0].operatorName})`);

      console.log('\nSample Live Records Extracted:');
      const sampleCount = Math.min(3, listings.length);
      for (let i = 0; i < sampleCount; i++) {
        const item = listings[i];
        console.log(`\n--- Record ${i + 1} ---`);
        console.log(`  Source Core : Real redBus Live Page DOM`);
        console.log(`  Operator    : ${item.operatorName}`);
        console.log(`  Timing      : ${item.departureTime} -> ${item.arrivalTime} (Duration: ${item.duration})`);
        console.log(`  Bus Type    : ${item.busType}`);
        console.log(`  Fare        : INR ${item.price}`);
        console.log(`  Rating      : ${item.rating}/5.0`);
        console.log(`  Seats Left  : ${item.seatsAvailable}`);
        console.log(`  Boarding    : ${item.boardingPoint}`);
        console.log(`  Dropping    : ${item.droppingPoint}`);
      }
    } else {
      console.log('\nStatus: Playwright live extraction returned 0 listings.');
      console.log('Note: Mock/Simulated fallbacks have been completely disabled, yielding empty array as instructed.');
    }

    console.log('\n==================== AUDIT VALIDATION REPORT ===================');
    const reportPath = '/logs/redbus/validation_report.txt';
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf-8');
      console.log(content);
    } else {
      console.warn('Validation report file has not been created in /logs/redbus.');
    }

  } catch (err: any) {
    console.error('Fatal execution error occurred during integration test:', err.message);
  }

  console.log('\n======================================================================');
}

runTest();
