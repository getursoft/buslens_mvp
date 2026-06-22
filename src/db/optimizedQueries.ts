import { prisma } from '../../services/prismaClient';

/**
 * 1. HIGHLY OPTIMIZED ROUTE SEARCH QUERY (Resolves Listings)
 * - Uses the composite index: [route_id, departure_time, final_price]
 * - Employs selective projection to minimize JSON transfer size (bypasses massive unneeded text fields)
 * - Joins Operator and Platform efficiently
 */
export async function findBusListingsOptimized(params: {
  sourceCity: string;
  destinationCity: string;
  travelDateStart: Date;
  travelDateEnd: Date;
  minPrice?: number;
  maxPrice?: number;
  busType?: string;
  sortBy?: 'price' | 'departure' | 'rating';
  limit?: number;
  offset?: number;
}) {
  const {
    sourceCity,
    destinationCity,
    travelDateStart,
    travelDateEnd,
    minPrice,
    maxPrice,
    busType,
    sortBy = 'price',
    limit = 20,
    offset = 0,
  } = params;

  // First, find the route ID using geographic B-Tree index
  const route = await prisma.route.findFirst({
    where: {
      sourceCity: { equals: sourceCity, mode: 'insensitive' },
      destinationCity: { equals: destinationCity, mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (!route) {
    return { count: 0, listings: [] };
  }

  // Build filter body
  const whereClause: any = {
    routeId: route.id,
    departureTime: {
      gte: travelDateStart,
      lte: travelDateEnd,
    },
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.finalPrice = {};
    if (minPrice !== undefined) whereClause.finalPrice.gte = minPrice;
    if (maxPrice !== undefined) whereClause.finalPrice.lte = maxPrice;
  }

  if (busType) {
    whereClause.busType = { contains: busType, mode: 'insensitive' };
  }

  // Map sort strategy to optimized index keys
  let orderByClause: any = {};
  if (sortBy === 'price') {
    orderByClause = { finalPrice: 'asc' };
  } else if (sortBy === 'departure') {
    orderByClause = { departureTime: 'asc' };
  } else if (sortBy === 'rating') {
    orderByClause = { rating: 'desc' };
  }

  // Count total matching items matching filter for pagination metadata
  const totalCount = await prisma.busListing.count({
    where: whereClause,
  });

  // Query actual ticket listings with deep relation fetching
  const listings = await prisma.busListing.findMany({
    where: whereClause,
    orderBy: orderByClause,
    take: limit,
    skip: offset,
    select: {
      id: true,
      busName: true,
      busType: true,
      departureTime: true,
      arrivalTime: true,
      durationMinutes: true,
      boardingPoint: true,
      droppingPoint: true,
      originalPrice: true,
      discountedPrice: true,
      taxes: true,
      finalPrice: true,
      availableSeats: true,
      rating: true,
      reviewsCount: true,
      liveTracking: true,
      chargingPort: true,
      wifi: true,
      blanket: true,
      waterBottle: true,
      platformRedirectUrl: true,
      operator: {
        select: {
          id: true,
          operatorName: true,
          operatorLogo: true,
          rating: true,
          isVerified: true,
        },
      },
      platform: {
        select: {
          id: true,
          platformName: true,
          logoUrl: true,
          isActive: true,
        },
      },
    },
  });

  return {
    count: totalCount,
    listings,
  };
}

/**
 * 2. PERFORMANCE INSIGHTS & FARE TREND QUERY (Fare History)
 * - Queries historical pricing snapshot averages using composite B-Tree indexes on RoutePriceHistory
 */
export async function getRouteFareHistoryOptimized(sourceCity: string, destinationCity: string, daysLookback = 30) {
  const route = await prisma.route.findFirst({
    where: {
      sourceCity: { equals: sourceCity, mode: 'insensitive' },
      destinationCity: { equals: destinationCity, mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (!route) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysLookback);

  return prisma.routePriceHistory.findMany({
    where: {
      routeId: route.id,
      recordedDate: {
        gte: startDate,
      },
    },
    orderBy: {
      recordedDate: 'asc',
    },
    select: {
      recordedDate: true,
      minPrice: true,
      maxPrice: true,
      avgPrice: true,
    },
  });
}

/**
 * 3. SEO CURATED PAGES LOOKUP (SEO Generator & Tags Pre-rendering)
 * - Ultra-fast slug key read optimized by the unique index constraints
 */
export async function findSeoPageBySlug(slug: string) {
  return prisma.seoPage.findUnique({
    where: { slug: slug.trim().toLowerCase() },
    select: {
      id: true,
      slug: true,
      sourceCity: true,
      destinationCity: true,
      title: true,
      metaDescription: true,
      distanceKm: true,
      averageDuration: true,
      lowestPrice: true,
      averagePrice: true,
      totalOperators: true,
      busTypes: true,
      boardingPoints: true,
      droppingPoints: true,
      faqsJson: true,
      reviewsJson: true,
      insights: true,
      similarRoutes: true,
      priceTrends: true,
      topOperators: true,
      pageViews: true,
    },
  });
}

/**
 * 4. INCREMENT SEO PAGE VIEW WITH LOCKS
 * - Increment slug page view counters gracefully without full records locking
 */
export async function incrementSeoPageView(slug: string) {
  try {
    return await prisma.seoPage.update({
      where: { slug: slug.trim().toLowerCase() },
      data: {
        pageViews: {
          increment: 1,
        },
      },
      select: { id: true, pageViews: true },
    });
  } catch (err) {
    console.error('Failed to increment SEO view counter safely:', err);
    return null;
  }
}

/**
 * 5. SAAS INTEGRATED KPI METRIC AGGREGATION
 * - Aggregates bookings, searches, clicks, and affiliate earnings within clean analytics limits
 */
export async function fetchSaaSAnalyticsSummary(startDate: Date, endDate: Date) {
  return prisma.saaSAnalytics.findMany({
    where: {
      recordedDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      recordedDate: 'asc',
    },
    select: {
      recordedDate: true,
      totalSearches: true,
      totalClicks: true,
      revenueGenerated: true,
      activeUsers: true,
      conversionRate: true,
      cacheHitRatio: true,
    },
  });
}

/**
 * 6. USER DEEP INVENTORY PROFILE (Users, Alerts & Favorite Bookmark associations)
 * - Efficiently fetches standard user relationship blocks in dry JSON packages
 */
export async function getUserDashboardProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isVerified: true,
      createdAt: true,
      favoriteRoutes: {
        select: {
          id: true,
          route: {
            select: {
              id: true,
              sourceCity: true,
              destinationCity: true,
              distanceKm: true,
            },
          },
        },
      },
      priceAlerts: {
        where: { notificationSent: false },
        select: {
          id: true,
          sourceCity: true,
          destinationCity: true,
          targetPrice: true,
          travelDate: true,
          createdAt: true,
        },
      },
      searchHistories: {
        orderBy: { searchedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          sourceCity: true,
          destinationCity: true,
          travelDate: true,
          searchedAt: true,
        },
      },
    },
  });
}
