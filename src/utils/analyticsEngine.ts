import fs from 'fs';
import path from 'path';

// --- Interface Definitions ---
export interface SearchRecord {
  id: string;
  sourceCity: string;
  destinationCity: string;
  searchedAt: string;
  passengers: number;
}

export interface ClickRecord {
  id: string;
  routeId: string;
  busListingId?: string;
  platformId?: string;
  clickedAt: string;
  clickType: 'details' | 'book';
}

export interface RouteMetric {
  id: string;
  sourceCity: string;
  destinationCity: string;
  distanceKm: number;
  averagePrice: number;
  tags: string[];
  trendingScore: number;
  totalSearches: number;
  totalBookings: number;
  weekendSurgePercent: number;
  image: string;
  tagline: string;
}

export interface SeasonalSuggestion {
  id: string;
  title: string;
  category: 'Summer Escape' | 'Monsoon Drive' | 'Heritage Walk' | 'Beach Escape';
  sourceCity: string;
  destinationCity: string;
  bestMonth: string;
  startingPrice: number;
  attractionText: string;
  distanceKm: number;
  image: string;
}

export interface RecommendResult extends RouteMetric {
  reason: string;
  matchScore: number; // 0 - 100
}

// Store path
const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'analyticsStore.json');

// Memory cache
let searches: SearchRecord[] = [];
let clicks: ClickRecord[] = [];

// Base routes dictionary for compiling analytics
const KNOWN_ROUTES = [
  { id: 'route-del-lko', sourceCity: 'Delhi', destinationCity: 'Lucknow', distanceKm: 554, averagePrice: 799, image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=450&h=300&fit=crop', tagline: 'Experience premium multi-axle sleeper rides.' },
  { id: 'route-del-jpr', sourceCity: 'Delhi', destinationCity: 'Jaipur', distanceKm: 270, averagePrice: 349, image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=450&h=300&fit=crop', tagline: 'Perfect short roadtrip to the Pink City.' },
  { id: 'route-blr-hyd', sourceCity: 'Bangalore', destinationCity: 'Hyderabad', distanceKm: 575, averagePrice: 899, image: 'https://images.unsplash.com/photo-1608958223405-f370cedae6df?w=450&h=300&fit=crop', tagline: 'Unwind in luxury Volvo multiaxle sleeper coaches.' },
  { id: 'route-pat-del', sourceCity: 'Patna', destinationCity: 'Delhi', distanceKm: 1050, averagePrice: 1599, image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=450&h=300&fit=crop', tagline: 'Comfortable long-haul cabin comfort with wifi.' },
  { id: 'route-bom-pne', sourceCity: 'Mumbai', destinationCity: 'Pune', distanceKm: 148, averagePrice: 299, image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=450&h=300&fit=crop', tagline: 'Breeze through the scenic Western Ghats expressways.' },
  { id: 'route-blr-coo', sourceCity: 'Bangalore', destinationCity: 'Coorg', distanceKm: 265, averagePrice: 449, image: 'https://images.unsplash.com/photo-1588598126712-42da099bc3a6?w=450&h=300&fit=crop', tagline: 'A lush green tea plantation retreat.' },
  { id: 'route-del-ddn', sourceCity: 'Delhi', destinationCity: 'Dehradun', distanceKm: 245, averagePrice: 399, image: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=450&h=300&fit=crop', tagline: 'Cool breeze, pine trees & Himalayan gateway.' },
  { id: 'route-bom-goa', sourceCity: 'Mumbai', destinationCity: 'Goa', distanceKm: 590, averagePrice: 999, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=450&h=300&fit=crop', tagline: 'Sun, sand & incredible seafood.' }
];

// Seed initial analytical data
function seedInitialData() {
  const seedSearches: SearchRecord[] = [];
  const seedClicks: ClickRecord[] = [];
  const now = new Date();

  // Seed data over last 14 days
  for (let i = 0; i < 150; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000);
    const route = KNOWN_ROUTES[Math.floor(Math.random() * KNOWN_ROUTES.length)];
    
    // Core searches
    seedSearches.push({
      id: `seed-search-${i}`,
      sourceCity: route.sourceCity,
      destinationCity: route.destinationCity,
      searchedAt: date.toISOString(),
      passengers: Math.floor(Math.random() * 3) + 1
    });

    // Clicks on route matching searches
    if (Math.random() > 0.4) {
      seedClicks.push({
        id: `seed-click-${i}-det`,
        routeId: route.id,
        clickedAt: new Date(date.getTime() + 10 * 60 * 1000).toISOString(),
        clickType: 'details',
        platformId: ['plat-redbus', 'plat-abhibus', 'plat-makemytrip', 'plat-paytm'][Math.floor(Math.random() * 4)]
      });

      // Checkout click
      if (Math.random() > 0.5) {
        seedClicks.push({
          id: `seed-click-${i}-bk`,
          routeId: route.id,
          clickedAt: new Date(date.getTime() + 15 * 60 * 1000).toISOString(),
          clickType: 'book',
          platformId: ['plat-redbus', 'plat-abhibus', 'plat-makemytrip', 'plat-paytm'][Math.floor(Math.random() * 4)]
        });
      }
    }
  }

  // Ensure directories exist
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const payload = { searches: seedSearches, clicks: seedClicks };
  fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  searches = seedSearches;
  clicks = seedClicks;
}

// Load from disk
export function initStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      searches = parsed.searches || [];
      clicks = parsed.clicks || [];
    } else {
      seedInitialData();
    }
  } catch (err) {
    console.warn('[Analytics] Failed to read store from disk, using in-memory fallback:', err);
    if (searches.length === 0) {
      seedInitialData();
    }
  }
}

// Write to disk
function saveToDisk() {
  try {
    const payload = { searches, clicks };
    fs.writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('[Analytics] Failed to persist analytics state to disk:', err);
  }
}

// Log a search
export function recordSearch(sourceCity: string, destinationCity: string, passengers: number = 1) {
  const newSearch: SearchRecord = {
    id: `srch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sourceCity: sourceCity.trim(),
    destinationCity: destinationCity.trim(),
    searchedAt: new Date().toISOString(),
    passengers
  };
  searches.push(newSearch);
  saveToDisk();
}

// Log a click
export function recordClick(routeId: string, clickType: 'details' | 'book', busListingId?: string, platformId?: string) {
  const newClick: ClickRecord = {
    id: `clk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    routeId,
    clickType,
    busListingId,
    platformId,
    clickedAt: new Date().toISOString()
  };
  clicks.push(newClick);
  saveToDisk();
}

// --- Dynamic Analytics Algorithms ---

// 1. Trending routes algorithm calculating recent velocity
export function calculateTrendingRoutes(): RouteMetric[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return KNOWN_ROUTES.map(route => {
    // Count searches for this route
    const routeSearches = searches.filter(s => 
      s.sourceCity.toLowerCase() === route.sourceCity.toLowerCase() && 
      s.destinationCity.toLowerCase() === route.destinationCity.toLowerCase()
    );

    const recentSearches = routeSearches.filter(s => new Date(s.searchedAt) >= sevenDaysAgo);
    
    // Count clicks for this route
    const routeClicks = clicks.filter(c => c.routeId === route.id);
    const recentClicks = routeClicks.filter(c => new Date(c.clickedAt) >= sevenDaysAgo);
    const bookings = routeClicks.filter(c => c.clickType === 'book');

    // TRENDING SCORE ALGORITHM: (Recent clicks * 4) + (Recent Searches * 2.5) + (Lifetime searches * 0.5)
    const recentClickWeight = recentClicks.length * 4.0;
    const recentSearchWeight = recentSearches.length * 2.5;
    const lifetimeSearchWeight = routeSearches.length * 0.5;

    const trendingScore = Math.round(recentClickWeight + recentSearchWeight + lifetimeSearchWeight);

    // Calculate weekend surge (Friday, Saturday, Sunday)
    const weekendSearches = routeSearches.filter(s => {
      const d = new Date(s.searchedAt).getDay();
      return d === 0 || d === 5 || d === 6; // Sun = 0, Fri = 5, Sat = 6
    });

    const weekendSurgePercent = routeSearches.length > 0 
      ? Math.round((weekendSearches.length / routeSearches.length) * 100)
      : Math.floor(Math.random() * 20) + 20;

    // Compile tags
    const tags = ['Live GPS Tracker'];
    if (trendingScore > 40) tags.push('Hottest Demand');
    if (route.averagePrice < 400) tags.push('Cheapest Deal');
    if (bookings.length > 15) tags.push('Most Trusted');

    return {
      ...route,
      trendingScore,
      totalSearches: routeSearches.length,
      totalBookings: bookings.length,
      weekendSurgePercent,
      tags
    };
  }).sort((a, b) => b.trendingScore - a.trendingScore);
}

// 2. Recommend engine that custom matches travel routes
export function recommendRoutes(userSessionSearches: Array<{ source: string, destination: string }>): RecommendResult[] {
  const trending = calculateTrendingRoutes();
  
  if (!userSessionSearches || userSessionSearches.length === 0) {
    // Fallback: Recommend top trending routes with neutral tags
    return trending.map((item, idx) => ({
      ...item,
      reason: idx === 0 ? 'Rated #1 high demand path this week.' : 'Extremely popular quick route comparison.',
      matchScore: 95 - idx * 5
    })).slice(0, 4);
  }

  // Get matching user historical preferences
  const searchedSources = new Set(userSessionSearches.map(s => s.source.trim().toLowerCase()));
  const searchedDestinations = new Set(userSessionSearches.map(s => s.destination.trim().toLowerCase()));

  return trending.map(item => {
    let matchScore = 50; // base weight
    let reason = 'Consistently recommended cheap operator prices.';

    const matchesSource = searchedSources.has(item.sourceCity.toLowerCase());
    const matchesDest = searchedDestinations.has(item.destinationCity.toLowerCase());

    if (matchesSource && matchesDest) {
      matchScore = 100;
      reason = `Matches your recent search for flights/buses departing ${item.sourceCity} to ${item.destinationCity}`;
    } else if (matchesSource) {
      matchScore = 85;
      reason = `Frequent bus routes originating from ${item.sourceCity} to ease your departure.`;
    } else if (matchesDest) {
      matchScore = 75;
      reason = `Alternative budget choices returning safely to ${item.destinationCity}.`;
    } else if (item.trendingScore > 45) {
      matchScore = 65;
      reason = `High volume ticket alert: ${item.sourceCity} to ${item.destinationCity} is spiking today.`;
    }

    return {
      ...item,
      matchScore,
      reason
    };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
}

// 3. Current Seasonal suggestions static dynamic lists
export function getSeasonalTravelSuggestions(): SeasonalSuggestion[] {
  return [
    {
      id: 'seas-mon-blr-coo',
      title: 'Monsoon Highland Drive',
      category: 'Monsoon Drive',
      sourceCity: 'Bangalore',
      destinationCity: 'Coorg',
      bestMonth: 'June - September',
      startingPrice: 449,
      attractionText: 'Lush green tea estates, misty coffee plantations and roaring Abbey water cascades.',
      distanceKm: 265,
      image: 'https://images.unsplash.com/photo-1588598126712-42da099bc3a6?w=450&h=300&fit=crop'
    },
    {
      id: 'seas-sum-del-ddn',
      title: 'Summer Foothill Mussoorie Retreat',
      category: 'Summer Escape',
      sourceCity: 'Delhi',
      destinationCity: 'Dehradun',
      bestMonth: 'April - July',
      startingPrice: 399,
      attractionText: 'Escape peak Indian plains summer warmth into refreshing mountain weather and pine valleys.',
      distanceKm: 245,
      image: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=450&h=300&fit=crop'
    },
    {
      id: 'seas-her-del-lko',
      title: 'Royal Awadhi Heritage Trail',
      category: 'Heritage Walk',
      sourceCity: 'Delhi',
      destinationCity: 'Lucknow',
      bestMonth: 'October - March',
      startingPrice: 799,
      attractionText: 'Beautiful asymmetric Imambaras, majestic Rumi Darwaza and spectacular Awadhi gastronomy.',
      distanceKm: 554,
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=450&h=300&fit=crop'
    },
    {
      id: 'seas-bch-bom-goa',
      title: 'Vibrant Coastal Beach Sunset Escape',
      category: 'Beach Escape',
      sourceCity: 'Mumbai',
      destinationCity: 'Goa',
      bestMonth: 'November - May',
      startingPrice: 999,
      attractionText: 'Spectacular golden sand beaches, colonial architecture walks, and lively ocean shacks.',
      distanceKm: 590,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=450&h=300&fit=crop'
    }
  ];
}

// --- Full SaaS Analytics Summary compiler ---
export interface AnalyticsSummary {
  totalSearches: number;
  totalClicks: number;
  totalBookings: number;
  conversionRate: number;
  totalRevenue: number;
  routePerformance: Array<{
    routeName: string;
    sourceCity: string;
    destinationCity: string;
    searchedAt?: string;
    searches: number;
    clicks: number;
    bookings: number;
    revenue: number;
    conversionRate: number;
  }>;
  deviceAnalytics: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  cityTraffic: Array<{
    city: string;
    searches: number;
    bookings: number;
    sharePercent: number;
  }>;
  searchTrendPoints: Array<{
    label: string;
    searches: number;
    clicks: number;
    revenue: number;
  }>;
}

export function compileAnalyticsSummary(range: '7d' | '30d' | 'all'): AnalyticsSummary {
  const now = new Date();
  let limitDate = new Date(0); // 'all' fallback
  if (range === '7d') {
    limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    limitDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const filteredSearches = searches.filter(s => new Date(s.searchedAt) >= limitDate);
  const filteredClicks = clicks.filter(c => new Date(c.clickedAt) >= limitDate);

  const totalSearches = filteredSearches.length;
  const totalClicks = filteredClicks.length;
  const totalBookings = filteredClicks.filter(c => c.clickType === 'book').length;

  const conversionRate = totalSearches > 0 
    ? Math.round((totalBookings / totalSearches) * 1000) / 10 
    : 0;

  let totalRevenue = 0;
  filteredClicks.forEach(c => {
    if (c.clickType === 'book') {
      const routeObj = KNOWN_ROUTES.find(r => r.id === c.routeId);
      const price = routeObj ? routeObj.averagePrice : 600;
      totalRevenue += price * 0.08; // 8% commission per ticket
    }
  });
  totalRevenue = Math.round(totalRevenue);

  // Device analytics attribution
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;

  filteredSearches.forEach(s => {
    const lastChar = s.id[s.id.length - 1] || '0';
    const charCode = lastChar.charCodeAt(0);
    if (charCode % 3 === 0) {
      mobileCount += s.passengers;
    } else if (charCode % 3 === 1) {
      desktopCount += s.passengers;
    } else {
      tabletCount += s.passengers;
    }
  });

  const totalDevices = mobileCount + desktopCount + tabletCount || 1;
  const mobile = Math.round((mobileCount / totalDevices) * 100);
  const desktop = Math.round((desktopCount / totalDevices) * 100);
  const tablet = Math.max(0, 100 - mobile - desktop);

  // City-wise Traffic (Source and Destination)
  const cityMap: Record<string, { searches: number; bookings: number }> = {};
  filteredSearches.forEach(s => {
    const sCity = s.sourceCity;
    const dCity = s.destinationCity;
    if (!cityMap[sCity]) cityMap[sCity] = { searches: 0, bookings: 0 };
    if (!cityMap[dCity]) cityMap[dCity] = { searches: 0, bookings: 0 };
    
    cityMap[sCity].searches++;
  });

  filteredClicks.forEach(c => {
    if (c.clickType === 'book') {
      const routeObj = KNOWN_ROUTES.find(r => r.id === c.routeId);
      if (routeObj) {
        const src = routeObj.sourceCity;
        const dest = routeObj.destinationCity;
        if (!cityMap[src]) cityMap[src] = { searches: 0, bookings: 0 };
        if (!cityMap[dest]) cityMap[dest] = { searches: 0, bookings: 0 };
        
        cityMap[src].bookings++;
        cityMap[dest].bookings += 0.5; // attribute portion of conversion
      }
    }
  });

  const cityTraffic = Object.entries(cityMap).map(([city, data]) => ({
    city,
    searches: data.searches,
    bookings: Math.round(data.bookings),
    sharePercent: 0
  }));

  const totalCitySearches = cityTraffic.reduce((acc, curr) => acc + curr.searches, 0) || 1;
  cityTraffic.forEach(item => {
    item.sharePercent = Math.round((item.searches / totalCitySearches) * 100);
  });
  cityTraffic.sort((a, b) => b.searches - a.searches);

  // Route Performance
  const routePerformance = KNOWN_ROUTES.map(route => {
    const rSearches = filteredSearches.filter(s => 
      s.sourceCity.toLowerCase() === route.sourceCity.toLowerCase() && 
      s.destinationCity.toLowerCase() === route.destinationCity.toLowerCase()
    ).length;

    const rClicks = filteredClicks.filter(c => c.routeId === route.id && c.clickType === 'details').length;
    const rBookings = filteredClicks.filter(c => c.routeId === route.id && c.clickType === 'book').length;
    const rRevenue = Math.round(rBookings * route.averagePrice * 0.08);

    return {
      routeName: `${route.sourceCity} ➔ ${route.destinationCity}`,
      sourceCity: route.sourceCity,
      destinationCity: route.destinationCity,
      searches: rSearches,
      clicks: rClicks,
      bookings: rBookings,
      revenue: rRevenue,
      conversionRate: rSearches > 0 ? Math.round((rBookings / rSearches) * 100) : 0
    };
  }).sort((a, b) => b.searches - a.searches);

  // Trend mapping over previous discrete days
  const searchTrendPoints: Array<{ label: string; searches: number; clicks: number; revenue: number }> = [];
  const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : 45;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    
    let label = '';
    if (range === '7d') {
      label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      label = `${monthNames[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')}`;
    }

    const daySearches = filteredSearches.filter(s => s.searchedAt.startsWith(dateStr)).length;
    const dayClicks = filteredClicks.filter(c => c.clickedAt.startsWith(dateStr) && c.clickType === 'details').length;
    
    let dayRevenue = 0;
    filteredClicks.forEach(c => {
      if (c.clickedAt.startsWith(dateStr) && c.clickType === 'book') {
        const routeObj = KNOWN_ROUTES.find(r => r.id === c.routeId);
        const price = routeObj ? routeObj.averagePrice : 600;
        dayRevenue += price * 0.08;
      }
    });

    searchTrendPoints.push({
      label,
      searches: daySearches,
      clicks: dayClicks,
      revenue: Math.round(dayRevenue)
    });
  }

  return {
    totalSearches,
    totalClicks,
    totalBookings,
    conversionRate,
    totalRevenue,
    routePerformance,
    deviceAnalytics: {
      mobile,
      desktop,
      tablet
    },
    cityTraffic,
    searchTrendPoints
  };
}
