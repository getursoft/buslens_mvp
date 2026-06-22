import { prisma } from './prismaClient';
import { NormalizedBusListing } from '../providers/types';
import { searchBuses as searchRedbus } from '../providers/redbus';
import { searchBuses as searchAbhibus } from '../providers/abhibus';
import { searchBuses as searchConfirmtkt } from '../providers/confirmtkt';
import { searchBuses as searchPaytm } from '../providers/paytm';
import { searchBuses as searchMakemytrip } from '../providers/makemytrip';
import { searchBuses as searchGoibibo } from '../providers/goibibo';
import { providerTelemetry } from './providerTelemetry';

export interface RouteStatsData {
  source: string;
  destination: string;
  searchCount: number;
  lastSearched: Date;
}

/**
 * Checks route popular level to determine cache freshness TTL limit (in minutes)
 * Popular (>= 50 searches) -> 5 mins
 * Medium (>= 15 searches) -> 15 mins
 * Low (< 15 searches)     -> 30 mins
 */
async function getCacheTtlMinutes(source: string, destination: string): Promise<number> {
  try {
    const stats = await prisma.routeStats.findFirst({
      where: {
        sourceCity: { equals: source.trim(), mode: 'insensitive' },
        destinationCity: { equals: destination.trim(), mode: 'insensitive' }
      }
    });
    if (!stats) return 30; // default to 30 mins for low/new routes
    if (stats.searchCount >= 50) return 5;
    if (stats.searchCount >= 15) return 15;
    return 30;
  } catch (err) {
    console.warn('[searchAggregator] Error resolving route cache TTL, defaulting to 30 mins:', err);
    return 30;
  }
}

/**
 * Updates search popularity statistics for a route
 */
async function updateRouteStats(source: string, destination: string): Promise<void> {
  const src = source.trim();
  const dest = destination.trim();
  try {
    await prisma.routeStats.upsert({
      where: {
        sourceCity_destinationCity: {
          sourceCity: src,
          destinationCity: dest
        }
      },
      update: {
        searchCount: { increment: 1 },
        lastSearched: new Date()
      },
      create: {
        sourceCity: src,
        destinationCity: dest,
        searchCount: 1,
        lastSearched: new Date()
      }
    });
  } catch (err) {
    console.warn('[searchAggregator] Error updating route stats:', err);
  }
}

/**
 * Records the cheapest fares of each successfully scraped platform to fare_history
 */
async function recordFareHistory(
  source: string,
  destination: string,
  journeyDateStr: string,
  listings: NormalizedBusListing[]
): Promise<void> {
  const routeName = `${source.trim()} to ${destination.trim()}`;
  const journeyDate = new Date(journeyDateStr);

  // Group listings by provider and get the min price for each
  const minFaresByProvider: { [prov: string]: number } = {};
  for (const item of listings) {
    if (!minFaresByProvider[item.provider] || item.price < minFaresByProvider[item.provider]) {
      minFaresByProvider[item.provider] = item.price;
    }
  }

  // Insert histories
  for (const [provider, price] of Object.entries(minFaresByProvider)) {
    try {
      await prisma.fareHistory.create({
        data: {
          provider,
          route: routeName,
          journeyDate,
          price,
          capturedAt: new Date()
        }
      });
    } catch (innerErr) {
      console.warn(`[searchAggregator] Error creating fare history for ${provider}:`, innerErr);
    }
  }
}

/**
 * Orchestrates calls to all 6 scrapers in parallel
 */
async function triggerLiveScraping(
  source: string,
  destination: string,
  journeyDate: string
): Promise<NormalizedBusListing[]> {
  console.log(`[searchAggregator] Triggering live scraping across all 6 providers in parallel for ${source} -> ${destination} on ${journeyDate}...`);
  
  const providers = [
    { name: 'redBus', run: () => searchRedbus(source, destination, journeyDate) },
    { name: 'AbhiBus', run: () => searchAbhibus(source, destination, journeyDate) },
    { name: 'ConfirmTkt', run: () => searchConfirmtkt(source, destination, journeyDate) },
    { name: 'Paytm', run: () => searchPaytm(source, destination, journeyDate) },
    { name: 'MakeMyTrip', run: () => searchMakemytrip(source, destination, journeyDate) },
    { name: 'Goibibo', run: () => searchGoibibo(source, destination, journeyDate) }
  ];

  const startTime = Date.now();
  const promises = providers.map(async (p) => {
    const pStart = Date.now();
    try {
      const res = await p.run();
      const durationMs = Date.now() - pStart;
      console.log(`[searchAggregator] Provider ${p.name} completed in ${durationMs}ms returning ${res.length} items`);
      providerTelemetry.record(p.name, durationMs, true);
      return { provider: p.name, listings: res, durationMs, success: true };
    } catch (err: any) {
      const durationMs = Date.now() - pStart;
      console.error(`[searchAggregator] Provider ${p.name} failed: ${err.message}`);
      providerTelemetry.record(p.name, durationMs, false);
      return { provider: p.name, listings: [], durationMs, success: false };
    }
  });

  const runResults = await Promise.all(promises);
  
  // Aggregate listings from all successful runs
  const aggregated: NormalizedBusListing[] = [];
  for (const run of runResults) {
    if (run.success && run.listings && run.listings.length > 0) {
      aggregated.push(...run.listings);
    }
  }

  return aggregated;
}

/**
 * Refreshes cache asynchronously
 */
async function refreshCacheInBackground(
  routeKey: string,
  source: string,
  destination: string,
  journeyDateStr: string
): Promise<void> {
  try {
    const freshListings = await triggerLiveScraping(source, destination, journeyDateStr);
    if (freshListings.length === 0) return;

    const journeyDate = new Date(journeyDateStr);

    // Save/Update cache table
    await prisma.searchCache.upsert({
      where: {
        routeKey_journeyDate: {
          routeKey,
          journeyDate
        }
      },
      update: {
        responseJson: freshListings as any,
        lastUpdated: new Date()
      },
      create: {
        routeKey,
        journeyDate,
        responseJson: freshListings as any,
        lastUpdated: new Date()
      }
    });

    // Record fare tracking metrics
    await recordFareHistory(source, destination, journeyDateStr, freshListings);
    console.log(`[searchAggregator] [Background Worker] Successfully updated cache for ${routeKey} on ${journeyDateStr}`);
  } catch (err) {
    console.error(`[searchAggregator] [Background Worker] Error refreshing cache:`, err);
  }
}

/**
 * HIGH LEVEL SEARCH METHOD (CACHE-FIRST ARCHITECTURE)
 */
export async function searchBusesAllProviders(
  source: string,
  destination: string,
  journeyDateStr: string
): Promise<{
  listings: NormalizedBusListing[];
  cached: boolean;
  fresh: boolean;
  ttlMinutes: number;
  lastUpdated: Date | null;
}> {
  const routeKey = `${source.trim().toLowerCase()}-${destination.trim().toLowerCase()}`;
  const journeyDate = new Date(journeyDateStr);

  // 1. Update route statistics popularity counter
  await updateRouteStats(source, destination);

  // 2. Fetch cache TTL freshness limit
  const ttlMinutes = await getCacheTtlMinutes(source, destination);

  // 3. Inspect PostgreSQL cache
  let cachedRecord = null;
  try {
    cachedRecord = await prisma.searchCache.findUnique({
      where: {
        routeKey_journeyDate: {
          routeKey,
          journeyDate
        }
      }
    });
  } catch (err) {
    console.warn('[searchAggregator] Error querying cache table:', err);
  }

  if (cachedRecord) {
    const lastUpdated = cachedRecord.lastUpdated;
    const lastUpdatedDate = lastUpdated instanceof Date ? lastUpdated : new Date(lastUpdated);
    const cacheAgeMs = Date.now() - lastUpdatedDate.getTime();
    const isCacheFresh = cacheAgeMs <= ttlMinutes * 60 * 1000;

    const cachedListings = cachedRecord.responseJson as any as NormalizedBusListing[];

    if (isCacheFresh) {
      console.log(`[searchAggregator] Cache HIT (Fresh, age: ${Math.round(cacheAgeMs / 1000)}s, TTL: ${ttlMinutes}m) for route ${routeKey} on ${journeyDateStr}`);
      return {
        listings: cachedListings,
        cached: true,
        fresh: true,
        ttlMinutes,
        lastUpdated
      };
    } else {
      console.log(`[searchAggregator] Cache HIT (Stale, age: ${Math.round(cacheAgeMs / 1000)}s, TTL: ${ttlMinutes}m). Returning immediatly and dispatching background refresh.`);
      
      // Dispatch background refresh (fully non-blocking)
      setImmediate(() => {
        refreshCacheInBackground(routeKey, source, destination, journeyDateStr)
          .catch(e => console.error('[searchAggregator] Background cache refresh error:', e));
      });

      return {
        listings: cachedListings,
        cached: true,
        fresh: false,
        ttlMinutes,
        lastUpdated
      };
    }
  }

  // 4. Cache MISS -> Trigger scrapers in parallel
  console.log(`[searchAggregator] Cache MISS for route ${routeKey} on ${journeyDateStr}. Scraping live sources directly.`);
  const startScrape = Date.now();
  const liveListings = await triggerLiveScraping(source, destination, journeyDateStr);
  const aggregateDuration = Date.now() - startScrape;

  if (liveListings.length > 0) {
    // Save to PostgreSQL Cache
    try {
      await prisma.searchCache.upsert({
        where: {
          routeKey_journeyDate: {
            routeKey,
            journeyDate
          }
        },
        update: {
          responseJson: liveListings as any,
          lastUpdated: new Date()
        },
        create: {
          routeKey,
          journeyDate,
          responseJson: liveListings as any,
          lastUpdated: new Date()
        }
      });

      // Record fare metrics
      await recordFareHistory(source, destination, journeyDateStr, liveListings);
    } catch (saveErr) {
      console.error('[searchAggregator] Error writing scraped data to cache table:', saveErr);
    }
  }

  return {
    listings: liveListings,
    cached: false,
    fresh: true,
    ttlMinutes,
    lastUpdated: new Date()
  };
}
