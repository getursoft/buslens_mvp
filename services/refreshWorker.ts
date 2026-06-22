import { prisma } from './prismaClient';
import { searchBusesAllProviders } from './searchAggregator';

// Helper to get future date strings
function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Executes a single route cache-refresh run
 */
async function refreshSingleRoute(source: string, destination: string): Promise<void> {
  const datesToRefresh = [
    getOffsetDateString(0), // Today
    getOffsetDateString(1)  // Tomorrow
  ];

  for (const dateStr of datesToRefresh) {
    try {
      console.log(`[Refresh Worker] Refreshing hot route: "${source} -> ${destination}" for date ${dateStr}...`);
      
      // Let searchBusesAllProviders handle scraping and cache upsert
      await searchBusesAllProviders(source, destination, dateStr);
      
      // Sleep slightly between requests to throttled scrape nicely
      await new Promise(resolve => setTimeout(resolve, 2500));
    } catch (err: any) {
      console.warn(`[Refresh Worker] Exception in background refresh for "${source} -> ${destination}" on ${dateStr}: ${err.message}`);
    }
  }
}

/**
 * Worker execution tick: processes up to 100 top searched routes
 */
async function executeWorkerTick(): Promise<void> {
  const startTime = Date.now();
  console.log(`[Refresh Worker] Periodic tick starting at ${new Date().toISOString()}`);

  try {
    // 1. Fetch top 100 routes by search count from route_stats
    const topRoutes = await prisma.routeStats.findMany({
      orderBy: {
        searchCount: 'desc'
      },
      take: 100
    });

    if (topRoutes.length === 0) {
      console.log('[Refresh Worker] No search hot-routes in route_stats database yet. Sleeping until next tick.');
      return;
    }

    console.log(`[Refresh Worker] Found ${topRoutes.length} popular routes to refresh. Beginning throttled sync...`);

    // 2. Iterate sequentially with slight pauses to achieve minimal operating/computational costs
    for (const route of topRoutes) {
      const source = route.sourceCity;
      const destination = route.destinationCity;
      await refreshSingleRoute(source, destination);
    }

    console.log(`[Refresh Worker] Tick completed successfully in ${Math.round((Date.now() - startTime) / 1000)}s.`);
  } catch (err: any) {
    console.error(`[Refresh Worker] Critical error in worker execution tick:`, err);
  }
}

/**
 * BOOTSTRAP BACKGROUND WORKER
 * Running every 5 minutes (300,000ms)
 */
export function startBackgroundRefreshWorker(): void {
  console.log(`[Refresh Worker] Initializing BusLens background cache refresh worker...`);
  
  // Run on startup
  setTimeout(() => {
    executeWorkerTick()
      .catch(e => console.error('[Refresh Worker] Startup tick error:', e));
  }, 10000); // 10s delay on server boostrap to avoid slowing down main server initialization

  // Schedule every 5 minutes
  setInterval(async () => {
    try {
      await executeWorkerTick();
    } catch (err) {
      console.error('[Refresh Worker] Scheduled ticking crashed:', err);
    }
  }, 5 * 60 * 1000).unref?.();
}
