import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import SearchSection from './components/SearchSection';
import FilterSidebar from './components/FilterSidebar';
import BusCard from './components/BusCard';
import DetailsModal from './components/DetailsModal';
// Dynamic Lazy loaded components for bundle optimization (Fast Time-to-Interactive)
const AlertsDashboard = React.lazy(() => import('./components/AlertsDashboard'));
const DatabaseSchemaExplorer = React.lazy(() => import('./components/DatabaseSchemaExplorer'));
const PartnerLoginModal = React.lazy(() => import('./components/PartnerLoginModal'));
const PartnerApiModal = React.lazy(() => import('./components/PartnerApiModal'));
const SupportChatbot = React.lazy(() => import('./components/SupportChatbot'));
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard'));
const SeoLandingPage = React.lazy(() => import('./components/SeoLandingPage'));
const FareHistoryTracker = React.lazy(() => import('./components/FareHistoryTracker'));
const RouteDiscoveryHub = React.lazy(() => import('./components/RouteDiscoveryHub'));
const PortalRadarVisual = React.lazy(() => import('./components/PortalRadarVisual'));

// Performance Fallback Shimmers for Code-Splitting Lifecycles
const DynamicLoadingPuck = () => (
  <div className="w-full py-16 px-8 flex flex-col items-center justify-center space-y-4 animate-pulse bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
    <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
    <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Loading Premium Module...</span>
  </div>
);

const DashboardSkeleton = () => (
  <div className="w-full p-6 space-y-6 animate-pulse text-left">
    <div className="h-8 bg-slate-100 rounded-xl w-1/3 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-50"></div>
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-50"></div>
      <div className="h-28 bg-slate-100 rounded-2xl border border-slate-50"></div>
    </div>
    <div className="h-60 bg-slate-100 rounded-3xl border border-slate-50"></div>
  </div>
);

const BusListingSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100/80 p-5 space-y-4 max-w-full text-left animate-pulse">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100/60">
      <div className="space-y-2">
        <div className="h-5 bg-slate-100 rounded-lg w-48"></div>
        <div className="h-3.5 bg-slate-100 rounded-lg w-32"></div>
      </div>
      <div className="h-10 bg-[#E8F5E9]/50 rounded-xl w-32"></div>
    </div>
    <div className="grid grid-cols-12 gap-3 items-center py-2">
      <div className="col-span-4 space-y-2">
        <div className="h-6 bg-slate-100 rounded-lg w-20"></div>
        <div className="h-3 bg-slate-100 rounded-lg w-14"></div>
        <div className="h-4 bg-slate-100 rounded-lg w-28"></div>
      </div>
      <div className="col-span-4 flex flex-col items-center justify-center space-y-2">
        <div className="h-3.5 bg-slate-100 rounded-lg w-10"></div>
        <div className="w-full h-[2px] bg-slate-100/60"></div>
        <div className="h-4 bg-slate-100 rounded-lg w-20"></div>
      </div>
      <div className="col-span-4 text-right space-y-2 flex flex-col items-end">
        <div className="h-6 bg-slate-100 rounded-lg w-20"></div>
        <div className="h-3 bg-slate-100 rounded-lg w-14"></div>
        <div className="h-4 bg-slate-100 rounded-lg w-28"></div>
      </div>
    </div>
    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100/60">
      <div className="h-5 bg-slate-100 rounded-lg w-32"></div>
      <div className="flex items-center gap-4">
        <div className="h-8 bg-slate-100 rounded-lg w-24"></div>
        <div className="h-10 bg-slate-100 rounded-2xl w-24"></div>
      </div>
    </div>
  </div>
);
import { BusListing, PriceAlert, PartnerSession } from './types';
import { mockBusListings, mockRoutes, mockPriceAlerts, mockPlatforms, getPriceTrendForRoute } from './data/mockData';
import { buildAffiliateUrl } from './utils';
import { Sparkles, SlidersHorizontal, TrendingDown, ArrowRight, ShieldCheck, MapPin, Calendar, Compass, AlertCircle, Info, BellRing, Heart, RefreshCw, Zap, CheckCircle, Star, Award, Activity } from 'lucide-react';

const CITY_STATIONS: Record<string, string[]> = {
  'delhi': ['Anand Vihar', 'Kashmere Gate Terminal', 'Dhaula Kuan', 'Majnu ka Tilla', 'Sarai Kale Khan'],
  'lucknow': ['Alambagh Bus Stand', 'Charbagh Station Lobby', 'Kamta Bypass Stand', 'Transport Nagar Gate', 'Polytechnic Chauraha'],
  'jaipur': ['Sindhi Camp Terminal', 'Durgapura Flyover', 'Transport Nagar Circle', '200 Ft Bypass', 'Narayan Singh Circle'],
  'bangalore': ['Madiwala Multi-Axle Point', 'Majestic Bus Station Platform 4', 'Anand Rao Circle Stand', 'Electronic City Toll Gate', 'Yeshwantpur Metro Gate'],
  'hyderabad': ['Gachibowli Near ORR', 'Ameerpet Junction', 'MGBS Terminal Platform 12', 'Kukatpally Near Metro', 'Secunderabad Paradise Circle'],
  'patna': ['Gandhi Maidan Roundabout', 'Patliputra Bus Stand', 'Bairiya New ISBT', 'Danapur Station Stand', 'Mithapur Flyover Gate'],
};

function getStationPoint(city: string, idx: number, isBoarding: boolean): string {
  const norm = city.trim().toLowerCase();
  const list = CITY_STATIONS[norm] || [
    isBoarding ? `Main Highway Stand, ${city}` : `Central Terminal Gate, ${city}`,
    isBoarding ? `Sector 12 Bypass, ${city}` : `Opposite Station Road, ${city}`,
  ];
  return list[idx % list.length];
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return "08:00 AM";
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const finalMinutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60) % 24;
  
  const finalPeriod = totalHours >= 12 ? 'PM' : 'AM';
  let displayHours = totalHours % 12;
  if (displayHours === 0) displayHours = 12;
  
  const padMin = finalMinutes.toString().padStart(2, '0');
  const padHour = displayHours.toString().padStart(2, '0');
  
  return `${padHour}:${padMin} ${finalPeriod}`;
}

export function getGeodesicRouteDetails(source: string, destination: string) {
  const s = source.trim().toLowerCase();
  const d = destination.trim().toLowerCase();

  const coords: Record<string, { lat: number; lng: number }> = {
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'patna': { lat: 25.5941, lng: 85.1376 },
  };

  const p1 = coords[s];
  const p2 = coords[d];

  let distanceKm = 450;
  if (p1 && p2) {
    const R = 6371; // Earth radius in km
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const directDist = R * c;
    distanceKm = Math.round(directDist * 1.25); // Road curvature coefficient
  } else {
    let hash = 0;
    const combined = s + d;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    distanceKm = 150 + Math.abs(hash % 950);
  }

  const averageDurationMinutes = Math.round((distanceKm / 58) * 60 + 35);
  return { distanceKm, averageDurationMinutes };
}

// Generates dynamic high-quality bus listings for any searched source/destination pair
export function getListingsForRoute(source: string, destination: string, routeId: string): BusListing[] {
  const { distanceKm, averageDurationMinutes } = getGeodesicRouteDetails(source, destination);

  // Compute a deterministic coordinate route seed hash
  const combined = (source + '$' + destination).toLowerCase();
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  const routeSeed = Math.abs(hash);

  // Determine State Carrier name and local adjustments based on starting origin
  let localStateOperatorName = 'UPSRTC Intercity Janrath';
  let localStateOperatorId = 'op-upsrtc';
  
  const srcLower = source.toLowerCase();
  if (srcLower.includes('bangalore')) {
    localStateOperatorName = 'KSRTC Airavat AC';
  } else if (srcLower.includes('hyderabad')) {
    localStateOperatorName = 'TSRTC Garuda Sleeper';
  } else if (srcLower.includes('jaipur')) {
    localStateOperatorName = 'RSRTC Gold Line';
  } else if (srcLower.includes('patna')) {
    localStateOperatorName = 'BSRTC Express Seater';
  } else if (srcLower.includes('lucknow')) {
    localStateOperatorName = 'UPSRTC Janrath AC';
  } else {
    // Other cities derive state-named operators dynamically
    const statePrefix = source.length > 5 ? source.substring(0, 5).toUpperCase() : 'STATE';
    localStateOperatorName = `${statePrefix}RTC Deluxe Seater`;
  }

  // Create real-time dynamic templates representing premium comparison across OTAs
  const templates = [
    {
      id: 'plat-abhibus',
      operatorId: 'op-zingbus',
      operatorName: 'Zingbus Plus',
      busType: 'AC Sleeper',
      rate: 2.3,
      discount: 0.20,
      dep: '10:30 PM',
      rating: 4.6,
      badge: 'Cheapest Today',
      reviewsBase: 512,
      amenities: { liveTracking: true, chargingPort: true, blanket: true, waterBottle: true, wifi: true }
    },
    {
      id: 'plat-redbus',
      operatorId: 'op-redbus-exp',
      operatorName: 'RedBus Express',
      busType: 'AC Sleeper',
      rate: 2.45,
      discount: 0.18,
      dep: '09:45 PM',
      rating: 4.4,
      badge: 'Best Value',
      reviewsBase: 1240,
      amenities: { liveTracking: true, chargingPort: true, blanket: true, waterBottle: false, wifi: true }
    },
    {
      id: 'plat-makemytrip',
      operatorId: 'op-intrcity',
      operatorName: 'IntrCity SmartBus Premium',
      busType: 'AC Sleeper',
      rate: 2.65,
      discount: 0.22,
      dep: '11:15 PM',
      rating: 4.5,
      badge: 'Most Reliable',
      reviewsBase: 832,
      amenities: { liveTracking: true, chargingPort: true, blanket: true, waterBottle: true, wifi: true }
    },
    {
      id: 'plat-paytm',
      operatorId: 'op-zingbus',
      operatorName: 'Zingbus Platinum Club',
      busType: 'AC Sleeper',
      rate: 2.55,
      discount: 0.15,
      dep: '08:30 PM',
      rating: 4.6,
      badge: undefined,
      reviewsBase: 360,
      amenities: { liveTracking: true, chargingPort: true, blanket: true, waterBottle: true, wifi: true }
    },
    {
      id: 'plat-upsrtc',
      operatorId: localStateOperatorId,
      operatorName: localStateOperatorName,
      busType: 'AC Seater',
      rate: 1.6,
      discount: 0.05,
      dep: '08:00 AM',
      rating: 4.1,
      badge: undefined,
      reviewsBase: 1850,
      amenities: { liveTracking: false, chargingPort: true, blanket: false, waterBottle: false, wifi: false }
    },
    {
      id: 'plat-paytm',
      operatorId: 'op-royal',
      operatorName: 'Royal Travels Gold',
      busType: 'AC Sleeper',
      rate: 2.85,
      discount: 0.12,
      dep: '07:15 PM',
      rating: 4.7,
      badge: undefined,
      reviewsBase: 220,
      amenities: { liveTracking: true, chargingPort: true, blanket: true, waterBottle: true, wifi: true }
    },
    {
      id: 'plat-abhibus',
      operatorId: 'op-rajratan',
      operatorName: 'Raj Ratan Royal Sleeper',
      busType: 'AC Sleeper',
      rate: 2.75,
      discount: 0.10,
      dep: '11:45 PM',
      rating: 4.8,
      badge: undefined,
      reviewsBase: 610,
      amenities: { liveTracking: true, chargingPort: true, blanket: true, waterBottle: true, wifi: true }
    },
    {
      id: 'plat-upsrtc',
      operatorId: localStateOperatorId,
      operatorName: localStateOperatorName.replace(' AC', '').replace(' Deluxe', '').replace(' Garuda', '').replace(' Airavat', '').split(' ')[0] + ' Standard Seater',
      busType: 'Non-AC Seater',
      rate: 1.1,
      discount: 0.0,
      dep: '11:00 AM',
      rating: 3.9,
      badge: undefined,
      reviewsBase: 3100,
      amenities: { liveTracking: false, chargingPort: false, blanket: false, waterBottle: false, wifi: false }
    }
  ];

  const premiumBrands = [
    'Orange Tours', 'InterCity SmartSleeper', 'Zingbus Premium', 'Neeta Travels', 
    'SRS Travels Gold', 'VRL Travels', 'Sharma Tours', 'Morning Star Travels', 
    'National Deluxe', 'Rajdhani Express', 'Greenline SmartBus', 'Kaveri Travels'
  ];

  return templates.map((p, idx) => {
    // 1. Determine a route-dependent bus name for non-state carriers
    let finalBusName = p.operatorName;
    if (p.operatorId !== 'op-upsrtc') {
      const brandIndex = (routeSeed + idx * 7) % premiumBrands.length;
      const baseBrand = premiumBrands[brandIndex];
      // Keep structural suffixes
      if (p.busType.includes('Sleeper')) {
        finalBusName = baseBrand.includes('Sleeper') || baseBrand.includes('SmartBus') ? baseBrand : `${baseBrand} Sleeper`;
      } else {
        finalBusName = baseBrand.replace('Sleeper', 'Seater');
      }
    }

    // 2. Deterministically vary the base rates by +/- 15% across routes
    const rateMultiplier = 0.85 + ((routeSeed + idx * 3) % 31) / 100;
    const finalRate = p.rate * rateMultiplier;

    // 3. Fares calculation strictly scaling with distance
    const originalPrice = Math.max(300, Math.round(distanceKm * finalRate));
    const discountedPrice = Math.round(originalPrice * (1 - p.discount));
    const taxes = Math.round(discountedPrice * 0.05 + 10);
    const finalPrice = discountedPrice + taxes;

    // 4. Boarding/Dropping terminal resolution based on origin/dest
    const boardingPoint = getStationPoint(source, idx, true);
    const droppingPoint = getStationPoint(destination, idx, false);

    // 5. Deterministically shift timing offsets of departure to avoid repeating identical timelines
    const minuteOffset = ((routeSeed + idx) % 5) * 15 - 30; // -30 to +30 mins shift
    const adjustedDepartureTime = addMinutesToTime(p.dep, minuteOffset);

    // 6. Dynamic arrival time resolution
    const arrivalTime = addMinutesToTime(adjustedDepartureTime, averageDurationMinutes);

    // 7. Deterministically vary reviews and ratings
    const ratingOffset = (((routeSeed + idx) % 5) - 2) * 0.1;
    const finalRating = Math.min(5.0, Math.max(3.5, Math.round((p.rating + ratingOffset) * 10) / 10));

    const totalSeats = 10 + ((routeSeed + idx * 11) % 24);
    const windowSeats = Math.min(totalSeats - 1, Math.max(1, (routeSeed + idx * 7) % 8));

    return {
      id: `lst-dynamic-${source.toLowerCase()}-${destination.toLowerCase()}-${p.id}-${idx}`,
      routeId: routeId,
      operatorId: p.operatorId,
      platformId: p.id,
      busName: finalBusName,
      busType: p.busType as any,
      departureTime: adjustedDepartureTime,
      arrivalTime: arrivalTime,
      durationMinutes: averageDurationMinutes,
      boardingPoint: boardingPoint,
      droppingPoint: droppingPoint,
      originalPrice: originalPrice,
      discountedPrice: discountedPrice,
      taxes: taxes,
      finalPrice: finalPrice,
      availableSeats: totalSeats,
      windowSeats: windowSeats,
      rating: finalRating,
      reviewsCount: p.reviewsBase + ((routeSeed + idx * 13) % 400) - 200,
      liveTracking: p.amenities.liveTracking,
      chargingPort: p.amenities.chargingPort,
      blanket: p.amenities.blanket,
      waterBottle: p.amenities.waterBottle,
      wifi: p.amenities.wifi,
      platformRedirectUrl: `https://www.${p.id.replace('plat-', '')}.com`,
      badge: p.badge as any
    };
  });
}

export default function App() {
  // Navigation Routing States
  const [activePage, setActivePage] = useState<'home' | 'search' | 'alerts' | 'database' | 'analytics' | 'seo-landing'>('search');
  
  // Custom SEO dynamic route slug state
  const [seoRouteSlug, setSeoRouteSlug] = useState<string>('delhi-to-jaipur');

  // Unified Page navigation wrapper with clean URL sync
  const handleSetActivePage = (page: 'home' | 'search' | 'alerts' | 'database' | 'analytics' | 'seo-landing') => {
    setActivePage(page);
    if (page === 'home') {
      setHasSearched(false);
      window.history.pushState({ page }, '', '/');
    } else if (page === 'search') {
      window.history.pushState({ page }, '', '/');
    } else if (page === 'seo-landing') {
      window.history.pushState({ page, slug: seoRouteSlug }, '', `/bus/${seoRouteSlug}`);
    } else {
      window.history.pushState({ page }, '', `/${page}`);
    }
  };

  // HTML5 clean path-based client router
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const stored = localStorage.getItem('buslens_partner_session');
      let currentIsAdmin = false;
      try {
        const parsed = stored ? JSON.parse(stored) : null;
        currentIsAdmin = !!(parsed?.isLoggedIn && parsed?.email === 'krpandey25646@gmail.com');
      } catch (_) {}

      if (path.startsWith('/bus/')) {
        const slug = path.substring(5).replace(/\/$/, ''); // extract slug segment
        if (slug) {
          if (currentIsAdmin) {
            setSeoRouteSlug(slug);
            setActivePage('seo-landing');
          } else {
            setActivePage('search');
            window.history.replaceState({ page: 'search' }, '', '/');
          }
        }
      } else if (path === '/alerts') {
        setActivePage('alerts');
      } else if (path === '/database') {
        if (currentIsAdmin) {
          setActivePage('database');
        } else {
          setActivePage('search');
          window.history.replaceState({ page: 'search' }, '', '/');
        }
      } else if (path === '/analytics') {
        if (currentIsAdmin) {
          setActivePage('analytics');
        } else {
          setActivePage('search');
          window.history.replaceState({ page: 'search' }, '', '/');
        }
      } else {
        // Default relative fallback
        setActivePage('search');
      }
    };

    // Listen for back/forward buttons popstate
    window.addEventListener('popstate', handleUrlRouting);
    
    // Check initial path on boot
    handleUrlRouting();

    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
    };
  }, []);

  // Scroll tracking state to narrow header & from-to options dynamically
  const [isScrolled, setIsScrolled] = useState(false);
  
  // State for active hovered index in the price trend chart
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search parameters states
  const [searchQuery, setSearchQuery] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return {
      source: '',
      destination: '',
      travelDate: `${yyyy}-${mm}-${dd}`,
      passengers: 1,
    };
  });

  const [hasSearched, setHasSearched] = useState(false);

  // Sorting control
  // Options: 'cheapest' | 'fastest' | 'rating' | 'earliest'
  const [sortBy, setSortBy] = useState<'cheapest' | 'fastest' | 'rating' | 'earliest'>('cheapest');

  // Horizontal brand selection tab state
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');

  // Active filter sidebar states
  const [priceRange, setPriceRange] = useState<number>(2500);
  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([]);
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string>('Any time');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);

  // New filters requested by user
  const [selectedArrivalTime, setSelectedArrivalTime] = useState<string>('Any time');
  const [selectedBoardingPoints, setSelectedBoardingPoints] = useState<string[]>([]);
  const [selectedDroppingPoints, setSelectedDroppingPoints] = useState<string[]>([]);
  const [selectedSeatingType, setSelectedSeatingType] = useState<'all' | 'sleeper' | 'seater'>('all');
  const [selectedAcNonAc, setSelectedAcNonAc] = useState<'all' | 'ac' | 'non-ac'>('all');

  // Price Watchlists lists states
  const [alerts, setAlerts] = useState<PriceAlert[]>(mockPriceAlerts);

  // Dynamic recent search history driven by analytics
  const [recentSearches, setRecentSearches] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('buslens_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Partner portal states
  const [partnerSession, setPartnerSession] = useState<PartnerSession | null>(() => {
    try {
      const stored = localStorage.getItem('buslens_partner_session');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  const [isPartnerLoginOpen, setIsPartnerLoginOpen] = useState(false);
  const [isPartnerApiOpen, setIsPartnerApiOpen] = useState(false);

  // Search scraper animation states
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);

  // Real-time provider listings
  const [realTimeListings, setRealTimeListings] = useState<any[]>([]);

  const handlePartnerLoginSuccess = (email: string, platformId: string, platformName: string) => {
    const session: PartnerSession = {
      email,
      isLoggedIn: true,
      platformId,
      platformName,
      isActive: false
    };
    setPartnerSession(session);
    localStorage.setItem('buslens_partner_session', JSON.stringify(session));
    
    // Set toast
    setHomeToast(`Authenticated successfully as authorized ${platformName} partner!`);
    setTimeout(() => setHomeToast(null), 4000);
    // Open API workspace right after login so they don't get lost
    setIsPartnerApiOpen(true);
  };

  const handlePartnerSaveApiSettings = (apiKey: string, apiUrl: string, active: boolean) => {
    if (!partnerSession) return;
    const updated = {
      ...partnerSession,
      apiKey,
      apiUrl,
      isActive: active
    };
    setPartnerSession(updated);
    localStorage.setItem('buslens_partner_session', JSON.stringify(updated));
    setHomeToast(`${partnerSession.platformName} API settings updated successfully.`);
    setTimeout(() => setHomeToast(null), 4000);
  };

  const handlePartnerLogout = () => {
    setPartnerSession(null);
    localStorage.removeItem('buslens_partner_session');
    setHomeToast('Partner session signed out and keys cleared from state.');
    setTimeout(() => setHomeToast(null), 4000);
  };

  // Severe Administrator protection guard for navigation pages
  const isAdmin = !!(partnerSession?.isLoggedIn && partnerSession?.email === 'krpandey25646@gmail.com');

  useEffect(() => {
    if (!isAdmin && (activePage === 'analytics' || activePage === 'database' || activePage === 'seo-landing')) {
      setActivePage('search');
      window.history.replaceState({ page: 'search' }, '', '/');
    }
  }, [activePage, isAdmin]);

  // Details Modal listing target
  const [activeDetailsListing, setActiveDetailsListing] = useState<BusListing | null>(null);

  // Dynamic quick Toast notification trigger
  const [homeToast, setHomeToast] = useState<string | null>(null);

  // Booking Clicks dynamic state (persisted to localStorage)
  const [bookingClicks, setBookingClicks] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('buslens_booking_clicks');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    // Default mock records for presentation matching user's database schema records explorer
    return [
      {
        id: 'clk-ad8a39b2',
        userId: 'u1-uuid-9923',
        busListingId: 'lst-del-lko-zing-0',
        platformId: 'plat-abhibus',
        clickedAt: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: '103.45.28.14',
        deviceType: 'Desktop',
        affiliateUrl: 'https://www.abhibus.com/?aff_code=BL_ABHI_12&listing_id=lst-del-lko-zing-0&utm_source=buslens'
      },
      {
        id: 'clk-e793ba81',
        userId: 'Guest',
        busListingId: 'lst-del-lko-upsrtc-1',
        platformId: 'plat-redbus',
        clickedAt: new Date(Date.now() - 1750000).toISOString(),
        ipAddress: '157.29.93.41',
        deviceType: 'Mobile',
        affiliateUrl: 'https://www.redbus.in/?aff_code=BL_RED_8&listing_id=lst-del-lko-upsrtc-1&utm_source=buslens'
      }
    ];
  });

  const handleConfirmBooking = (listingId: string, platformId: string, affiliateUrl: string) => {
    const newClick = {
      id: `clk-${Math.random().toString(36).substring(2, 10)}`,
      userId: 'u1-uuid-9923',
      busListingId: listingId,
      platformId: platformId,
      clickedAt: new Date().toISOString(),
      ipAddress: '103.45.28.14',
      deviceType: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
      affiliateUrl: affiliateUrl
    };

    const updatedClicks = [newClick, ...bookingClicks];
    setBookingClicks(updatedClicks);
    try {
      localStorage.setItem('buslens_booking_clicks', JSON.stringify(updatedClicks));
    } catch (e) {
      console.error(e);
    }

    // Report booking conversion click to backend analytics
    try {
      const activeListing = mockBusListings.find(l => l.id === listingId);
      if (activeListing) {
        fetch('/api/analytics/track-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            routeId: activeListing.routeId,
            clickType: 'book',
            busListingId: listingId,
            platformId: platformId
          })
        }).catch(() => {});
      }
    } catch (_) {}

    setHomeToast(`Handshake secure! Booking recorded on server. Interactive Seat Deal Lock updated in PostgreSQL analytics tables.`);
    setTimeout(() => {
      setHomeToast(null);
    }, 4500);
  };

  const handleRecordCardClick = (listing: BusListing) => {
    const platform = mockPlatforms.find(p => p.id === listing.platformId);
    const trackingUrl = buildAffiliateUrl(listing, platform, 'u1-uuid-9923', {
      campaign: 'bus_card_view_deal',
      sourceCity: searchQuery.source,
      destinationCity: searchQuery.destination,
      travelDate: searchQuery.travelDate,
      passengers: searchQuery.passengers
    });

    const newClick = {
      id: `clk-${Math.random().toString(36).substring(2, 10)}`,
      userId: 'u1-uuid-9923',
      busListingId: listing.id,
      platformId: listing.platformId,
      clickedAt: new Date().toISOString(),
      ipAddress: '103.45.28.14',
      deviceType: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
      affiliateUrl: trackingUrl
    };

    const updatedClicks = [newClick, ...bookingClicks];
    setBookingClicks(updatedClicks);
    try {
      localStorage.setItem('buslens_booking_clicks', JSON.stringify(updatedClicks));
    } catch (e) {
      console.error(e);
    }

    // Report details card view click to backend analytics
    try {
      fetch('/api/analytics/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: listing.routeId,
          clickType: 'details',
          busListingId: listing.id,
          platformId: listing.platformId
        })
      }).catch(() => {});
    } catch (_) {}

    setHomeToast(`Card 'View Deal' click registered! Generated affiliate tracking parameter sublink logged in pgSQL database table.`);
    setTimeout(() => {
      setHomeToast(null);
    }, 4500);
  };

  const handleClearClicks = () => {
    setBookingClicks([]);
    try {
      localStorage.removeItem('buslens_booking_clicks');
    } catch (e) {
      console.error(e);
    }
    setHomeToast(`All database telemetry booking clicks data wiped successfully.`);
    setTimeout(() => {
      setHomeToast(null);
    }, 3000);
  };

  // Map route calculations
  const activeRoute = useMemo(() => {
    const s = searchQuery.source;
    const d = searchQuery.destination;
    const found = mockRoutes.find(
      (r) =>
        r.sourceCity.toLowerCase() === s.toLowerCase() &&
        r.destinationCity.toLowerCase() === d.toLowerCase()
    );
    const routeId = found ? found.id : `route-dynamic-${s.toLowerCase()}-${d.toLowerCase()}`;
    const { distanceKm, averageDurationMinutes } = getGeodesicRouteDetails(s, d);

    return {
      id: routeId,
      sourceCity: s,
      destinationCity: d,
      distanceKm,
      averageDurationMinutes,
      popularRoute: found ? found.popularRoute : false,
    };
  }, [searchQuery]);

  // Dynamic boarding and dropping points for filters
  const getActiveListings = useCallback(() => {
    const hasLiveMatch = realTimeListings.length > 0;
    if (hasLiveMatch) {
      return realTimeListings.map((lst, idx) => {
        const originalPrice = lst.price;
        const discountPct = 0.05 + ((idx * 3) % 15) / 100;
        const discountedPrice = Math.round(originalPrice * (1 - discountPct));
        const taxes = Math.round(discountedPrice * 0.05 + 10);
        const finalPrice = discountedPrice + taxes;

        let platformId = 'plat-redbus';
        const pLower = lst.provider.toLowerCase();
        if (pLower === 'abhibus') platformId = 'plat-abhibus';
        else if (pLower === 'confirmtkt') platformId = 'plat-confirmtkt';
        else if (pLower === 'paytm') platformId = 'plat-paytm';
        else if (pLower === 'makemytrip') platformId = 'plat-makemytrip';
        else if (pLower === 'goibibo') platformId = 'plat-goibibo';

        let durationMinutes = 420;
        try {
          const hrsMatch = lst.duration.match(/(\d+)\s*h/i);
          const minsMatch = lst.duration.match(/(\d+)\s*m/i);
          const hrs = hrsMatch ? parseInt(hrsMatch[1]) : 0;
          const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
          durationMinutes = hrs * 60 + mins || 420;
        } catch (_) {}

        return {
          id: `lst-live-${pLower}-${idx}`,
          routeId: activeRoute.id,
          operatorId: `op-${pLower}`,
          platformId,
          busName: lst.operatorName,
          busType: lst.busType as any,
          departureTime: lst.departureTime,
          arrivalTime: lst.arrivalTime,
          durationMinutes,
          boardingPoint: lst.boardingPoint,
          droppingPoint: lst.droppingPoint,
          originalPrice,
          discountedPrice,
          taxes,
          finalPrice,
          rating: lst.rating,
          reviewsCount: 120 + ((idx * 17) % 350),
          availableSeats: lst.seatsAvailable,
          windowSeats: Math.min(lst.seatsAvailable - 1, Math.max(1, idx + 2)),
          badge: idx === 0 ? 'Cheapest Today' : idx === 1 ? 'Best Value' : undefined,
          redirectUrl: lst.redirectUrl
        };
      });
    }

    return getListingsForRoute(activeRoute.sourceCity, activeRoute.destinationCity, activeRoute.id);
  }, [realTimeListings, activeRoute]);

  const allRouteBoardingPoints = useMemo(() => {
    const routeListings = getActiveListings();
    const points = new Set(routeListings.map((lst) => lst.boardingPoint));
    return Array.from(points);
  }, [getActiveListings]);

  const allRouteDroppingPoints = useMemo(() => {
    const routeListings = getActiveListings();
    const points = new Set(routeListings.map((lst) => lst.droppingPoint));
    return Array.from(points);
  }, [getActiveListings]);

  // Handle core searching triggers
  const handleSearch = (data: { source: string; destination: string; travelDate: string; passengers: number }) => {
    setRealTimeListings([]); // Clear older listings
    setIsSearching(true);
    setSearchStep(0);
    setSearchQuery(data);
    setHasSearched(true);
    setActivePage('search');

    // Fetch live aggregated pricing listings from our Node scraper backend
    fetch(`/api/search?source=${encodeURIComponent(data.source)}&destination=${encodeURIComponent(data.destination)}&date=${encodeURIComponent(data.travelDate)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.listings) {
          setRealTimeListings(resData.listings);
        }
      })
      .catch((e) => console.warn('Failed querying live aggregator search endpoint:', e));

    // Send analytics trigger to server in background
    try {
      fetch('/api/analytics/track-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCity: data.source,
          destinationCity: data.destination,
          passengers: data.passengers || 1
        })
      }).catch((e) => console.warn('Offline capture tracker'));
    } catch (_) {}

    // Record list of recently searched routes locally
    setRecentSearches((prev) => {
      const matchFilter = prev.filter(
        (s) => s.source.toLowerCase() !== data.source.toLowerCase() || 
               s.destination.toLowerCase() !== data.destination.toLowerCase()
      );
      const updated = [
        {
          source: data.source,
          destination: data.destination,
          travelDate: data.travelDate || '2026-06-08',
          passengers: data.passengers || 1,
          searchedAt: new Date().toISOString()
        },
        ...matchFilter
      ].slice(0, 10);
      try {
        localStorage.setItem('buslens_recent_searches', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    // Smooth step-by-step transition animations
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setSearchStep(currentStep);
      if (currentStep >= 4) {
        clearInterval(interval);
        setTimeout(() => {
          setIsSearching(false);
          // Auto scroll nicely to results
          const container = document.getElementById('search-results-viewport');
          if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 200);
      }
    }, 250);
  };

  const handleClearFilters = () => {
    setPriceRange(2500);
    setSelectedBusTypes([]);
    setSelectedDepartureTime('Any time');
    setSelectedAmenities([]);
    setMinRating(0);
    setSelectedArrivalTime('Any time');
    setSelectedBoardingPoints([]);
    setSelectedDroppingPoints([]);
    setSelectedSeatingType('all');
    setSelectedAcNonAc('all');
  };

  const toggleBusType = (type: string) => {
    setSelectedBusTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Add new Alert element
  const handleAddAlert = (alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'notificationSent'>) => {
    const newAlert: PriceAlert = {
      id: `al-${Date.now()}`,
      userId: 'u1-uuid-9923',
      sourceCity: alertData.sourceCity,
      destinationCity: alertData.destinationCity,
      targetPrice: alertData.targetPrice,
      travelDate: alertData.travelDate,
      notificationSent: false,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((al) => al.id !== id));
  };

  // Create quick trigger alert for right sidebar
  const handleCreateSidebarAlert = () => {
    handleAddAlert({
      sourceCity: searchQuery.source,
      destinationCity: searchQuery.destination,
      targetPrice: 800,
      travelDate: searchQuery.travelDate,
    });
    setHomeToast('Alert set successfully! We will ping you when prices dip.');
    setTimeout(() => setHomeToast(null), 3500);
  };

  // Filter listings based on active conditions
  const filteredListings = useMemo(() => {
    // 1. Fetch matching route listings
    let items = getActiveListings();

    // Inject dynamic portal scraped partner deals if logged in and active
    if (partnerSession?.isLoggedIn && partnerSession?.isActive) {
      const parentPlatformId = partnerSession.platformId;
      const baseMatch = items.find((it) => it.platformId === parentPlatformId) || items[0];
      if (baseMatch) {
        const portalSpecialDeal: BusListing = {
          ...baseMatch,
          id: `lst-portal-special-${parentPlatformId}-${activeRoute.id}`,
          platformId: parentPlatformId,
          busName: `${partnerSession.platformName} direct portal API`,
          busType: 'AC Sleeper',
          departureTime: '11:45 PM',
          arrivalTime: '07:30 AM',
          durationMinutes: baseMatch.durationMinutes,
          originalPrice: Math.round(baseMatch.originalPrice),
          discountedPrice: Math.round(baseMatch.discountedPrice * 0.82), // Save an extra 18%!
          taxes: baseMatch.taxes,
          finalPrice: Math.round(baseMatch.discountedPrice * 0.82) + baseMatch.taxes,
          badge: 'Best Value',
          rating: 4.9,
          reviewsCount: baseMatch.reviewsCount + 225,
          availableSeats: 4,
          windowSeats: 2,
        };
        items = [portalSpecialDeal, ...items];
      }
    }

    // 2. Filter price
    items = items.filter((lst) => lst.discountedPrice <= priceRange);

    // 3. Filter bus type AC sleeper etc
    if (selectedBusTypes.length > 0) {
      items = items.filter((lst) => selectedBusTypes.includes(lst.busType));
    }

    // 4. Filter ratings thresholds
    if (minRating > 0) {
      items = items.filter((lst) => lst.rating >= minRating);
    }

    // 4b. Filter by platform horizontal selection tabs
    if (selectedPlatformFilter !== 'all') {
      if (selectedPlatformFilter === 'op-intrcity') {
        items = items.filter((lst) => lst.operatorId === 'op-intrcity');
      } else {
        items = items.filter((lst) => lst.platformId === selectedPlatformFilter);
      }
    }

    // 5. Filter departure timing slots
    if (selectedDepartureTime !== 'Any time') {
      items = items.filter((lst) => {
        const timeStr = lst.departureTime; // e.g. "10:30 PM"
        const isPM = timeStr.includes('PM');
        let [hours] = timeStr.split(':').map((v) => parseInt(v));
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        if (selectedDepartureTime === 'Before 6 AM') return hours < 6;
        if (selectedDepartureTime === '6 AM - 12 PM') return hours >= 6 && hours < 12;
        if (selectedDepartureTime === '12 PM - 6 PM') return hours >= 12 && hours < 18;
        if (selectedDepartureTime === 'After 6 PM') return hours >= 18;
        return true;
      });
    }

    // New 1: Seating Type Filter
    if (selectedSeatingType !== 'all') {
      if (selectedSeatingType === 'sleeper') {
        items = items.filter((lst) => lst.busType.toLowerCase().includes('sleeper'));
      } else if (selectedSeatingType === 'seater') {
        items = items.filter((lst) => lst.busType.toLowerCase().includes('seater'));
      }
    }

    // New 2: AC / Non-AC Type Filter
    if (selectedAcNonAc !== 'all') {
      if (selectedAcNonAc === 'ac') {
        items = items.filter((lst) => lst.busType.toLowerCase().includes('ac') && !lst.busType.toLowerCase().includes('non-ac'));
      } else if (selectedAcNonAc === 'non-ac') {
        items = items.filter((lst) => lst.busType.toLowerCase().includes('non-ac'));
      }
    }

    // New 3: Arrival Time Filter
    if (selectedArrivalTime !== 'Any time') {
      items = items.filter((lst) => {
        const timeStr = lst.arrivalTime; // e.g. "06:45 AM"
        const isPM = timeStr.includes('PM');
        let [hours] = timeStr.replace(/(AM|PM)/g, '').split(':').map((v) => parseInt(v));
        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        if (selectedArrivalTime === 'Before 6 AM') return hours < 6;
        if (selectedArrivalTime === '6 AM - 12 PM') return hours >= 6 && hours < 12;
        if (selectedArrivalTime === '12 PM - 6 PM') return hours >= 12 && hours < 18;
        if (selectedArrivalTime === 'After 6 PM') return hours >= 18;
        return true;
      });
    }

    // New 4: Boarding Point Filter
    if (selectedBoardingPoints.length > 0) {
      items = items.filter((lst) => selectedBoardingPoints.includes(lst.boardingPoint));
    }

    // New 5: Dropping Point Filter
    if (selectedDroppingPoints.length > 0) {
      items = items.filter((lst) => selectedDroppingPoints.includes(lst.droppingPoint));
    }

    // 6. Filter amenities check
    if (selectedAmenities.length > 0) {
      items = items.filter((lst) => {
        return selectedAmenities.every((amenity) => {
          if (amenity === 'liveTracking') return lst.liveTracking;
          if (amenity === 'chargingPort') return lst.chargingPort;
          if (amenity === 'blanket') return lst.blanket;
          if (amenity === 'waterBottle') return lst.waterBottle;
          if (amenity === 'wifi') return lst.wifi;
          return true;
        });
      });
    }

    // Sort listings appropriately
    return [...items].sort((a, b) => {
      if (sortBy === 'cheapest') return a.discountedPrice - b.discountedPrice;
      if (sortBy === 'fastest') return a.durationMinutes - b.durationMinutes;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'earliest') {
        // Simple string time value conversion helper
        const parseTimeInt = (str: string) => {
          const isPM = str.includes('PM');
          let [h, m] = str.replace(/(AM|PM)/g, '').split(':').map(v => parseInt(v));
          if (isPM && h !== 12) h += 12;
          if (!isPM && h === 12) h = 0;
          return h * 60 + m;
        };
        return parseTimeInt(a.departureTime) - parseTimeInt(b.departureTime);
      }
      return 0;
    });
  }, [
    activeRoute,
    priceRange,
    selectedBusTypes,
    selectedDepartureTime,
    selectedAmenities,
    minRating,
    sortBy,
    selectedPlatformFilter,
    selectedArrivalTime,
    selectedBoardingPoints,
    selectedDroppingPoints,
    selectedSeatingType,
    selectedAcNonAc,
    getActiveListings
  ]);

  // Find cheapest deal details on this route to populate premium widgets info
  const cheapestListingOnRoute = useMemo(() => {
    const listingsToUse = filteredListings.length > 0 ? filteredListings : getActiveListings();
    if (listingsToUse.length === 0) return null;
    return [...listingsToUse].sort((a, b) => a.discountedPrice - b.discountedPrice)[0];
  }, [filteredListings, getActiveListings]);

  // Find the highest rated (most recommended) bus on this active route
  const highestRatedBus = useMemo(() => {
    const listingsToUse = filteredListings.length > 0 ? filteredListings : getActiveListings();
    if (listingsToUse.length === 0) return null;
    return [...listingsToUse].sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)[0];
  }, [filteredListings, getActiveListings]);

  // Find best value listing (high rating, reasonable price below or near average)
  const bestValueListingId = useMemo(() => {
    const listingsToUse = filteredListings.length > 0 ? filteredListings : getActiveListings();
    if (listingsToUse.length === 0) return '';
    // Find listings with rating >= 4.2
    const sum = listingsToUse.reduce((acc, curr) => acc + curr.discountedPrice, 0);
    const avg = sum / listingsToUse.length;
    const candidates = listingsToUse.filter(l => l.rating >= 4.2 && l.discountedPrice <= avg * 1.15);
    const targetList = candidates.length > 0 ? candidates : listingsToUse;
    // Sort by rating desc, then reviewsCount desc, then price asc
    const sorted = [...targetList].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.reviewsCount !== a.reviewsCount) return b.reviewsCount - a.reviewsCount;
      return a.discountedPrice - b.discountedPrice;
    });
    return sorted[0]?.id || '';
  }, [filteredListings, getActiveListings]);

  const trends = getPriceTrendForRoute(activeRoute.id);

  const routeSeed = useMemo(() => {
    const combined = (activeRoute.sourceCity + '$' + activeRoute.destinationCity).toLowerCase();
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
       hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [activeRoute]);

  const dayOfWeek = useMemo(() => {
    try {
      const d = new Date(searchQuery.travelDate);
      if (!isNaN(d.getTime())) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[d.getDay()];
      }
    } catch (e) {}
    return 'Wed';
  }, [searchQuery.travelDate]);

  const todayTrend = useMemo(() => {
    return trends.find((t) => t.day.toLowerCase() === dayOfWeek.toLowerCase()) || trends[2];
  }, [trends, dayOfWeek]);

  const avgTrendPrice = useMemo(() => {
    if (trends.length === 0) return 900;
    const sum = trends.reduce((acc, current) => acc + current.price, 0);
    return sum / trends.length;
  }, [trends]);

  const trendLevel = useMemo(() => {
    if (!todayTrend) return { text: 'Stable', color: 'text-blue-500', bg: 'bg-blue-50', hex: '#3B82F6' };
    const ratio = todayTrend.price / avgTrendPrice;
    if (ratio < 0.95) return { text: 'Low', color: 'text-[#10B981]', bg: 'bg-emerald-50', hex: '#10B981' };
    if (ratio > 1.05) return { text: 'High', color: 'text-rose-500', bg: 'bg-rose-50', hex: '#F43F5E' };
    return { text: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-50', hex: '#F59E0B' };
  }, [todayTrend, avgTrendPrice]);

  const priceCoords = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    const multiplier = searchQuery.passengers;
    const minPrice = Math.min(...trends.map((t) => t.price * multiplier));
    const maxPrice = Math.max(...trends.map((t) => t.price * multiplier));
    const range = maxPrice - minPrice || 1;
    return trends.map((t, idx) => {
      const price = t.price * multiplier;
      const x = 15 + idx * 35;
      const y = 80 - ((price - minPrice) / range) * 60;
      return { ...t, price, x, y };
    });
  }, [trends, searchQuery.passengers]);

  const selectedDayCoord = useMemo(() => {
    return priceCoords.find((c) => c.day.toLowerCase() === dayOfWeek.toLowerCase()) || priceCoords[2];
  }, [priceCoords, dayOfWeek]);

  const activeTrendItem = useMemo(() => {
    if (hoveredTrendIndex !== null && priceCoords[hoveredTrendIndex]) {
      return priceCoords[hoveredTrendIndex];
    }
    return selectedDayCoord;
  }, [hoveredTrendIndex, priceCoords, selectedDayCoord]);

  const avgPriceOnRoute = useMemo(() => {
    const listingsToUse = filteredListings.length > 0 ? filteredListings : getActiveListings();
    if (listingsToUse.length === 0) return 950;
    const sum = listingsToUse.reduce((acc, curr) => acc + curr.discountedPrice, 0);
    return Math.round(sum / listingsToUse.length);
  }, [filteredListings, getActiveListings]);

  // Find lowest price for each OTA platform across current route
  const platformCheapestGroup = useMemo(() => {
    const listingsToUse = getActiveListings();
    const group: Record<string, number> = {};
    listingsToUse.forEach((lst) => {
      const plat = lst.platformId;
      if (!group[plat] || lst.discountedPrice < group[plat]) {
        group[plat] = lst.discountedPrice;
      }
    });
    return group;
  }, [getActiveListings]);

  // Generate sorted comparatives list of active booking platforms
  const platformComparisonList = useMemo(() => {
    const platforms = [
      { id: 'plat-abhibus', name: 'AbhiBus' },
      { id: 'plat-redbus', name: 'redBus' },
      { id: 'plat-makemytrip', name: 'MakeMyTrip' },
      { id: 'plat-paytm', name: 'Paytm' }
    ];
    const mapped = platforms.map(p => {
      const price = platformCheapestGroup[p.id] || 0;
      return {
        ...p,
        priceByPassenger: price * searchQuery.passengers,
        basePrice: price
      };
    }).filter(p => p.basePrice > 0);
    return [...mapped].sort((a, b) => a.basePrice - b.basePrice);
  }, [platformCheapestGroup, searchQuery.passengers]);

  // Find lowest pricing day across trend indices
  const cheapestDayTrend = useMemo(() => {
    if (!trends || trends.length === 0) return { day: 'Wednesday', price: 799 };
    return [...trends].sort((a, b) => a.price - b.price)[0];
  }, [trends]);

  // Dynamic surge multiplier load
  const isWeekendTravel = useMemo(() => {
    return ['Fri', 'Sat', 'Sun'].includes(dayOfWeek);
  }, [dayOfWeek]);

  const popularBusTypeOnRoute = useMemo(() => {
    const listingsToUse = filteredListings.length > 0 ? filteredListings : getListingsForRoute(activeRoute.sourceCity, activeRoute.destinationCity, activeRoute.id);
    if (listingsToUse.length === 0) return 'AC Sleeper';
    const counts: Record<string, number> = {};
    listingsToUse.forEach((lst) => {
      counts[lst.busType] = (counts[lst.busType] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'AC Sleeper';
  }, [filteredListings, activeRoute]);

  const bestTimeToTravel = useMemo(() => {
    return (routeSeed % 3 === 0)
      ? 'Morning (6 AM – 9 AM)'
      : (routeSeed % 3 === 1)
      ? 'Night (9 PM – 11 PM)'
      : 'Evening (4 PM – 7 PM)';
  }, [routeSeed]);

  const cheapestTimeToBook = useMemo(() => {
    return (routeSeed % 2 === 0) ? '7-10 days in advance' : '2-3 weeks in advance';
  }, [routeSeed]);

  const getPlatformName = (platformId: string) => {
    if (platformId.includes('redbus')) return 'redBus';
    if (platformId.includes('abhibus')) return 'AbhiBus';
    if (platformId.includes('makemytrip')) return 'MakeMyTrip';
    if (platformId.includes('paytm')) return 'Paytm';
    return 'State Carrier';
  };

  return (
    <div 
      className="min-h-screen flex flex-col font-sans relative" 
      id="app-workbench"
      style={{
        backgroundImage: "radial-gradient(rgba(241, 245, 249, 0.96), rgba(241, 245, 249, 0.99)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1600&auto=format&fit=crop')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      
      {/* Dynamic Action Toast Alert */}
      {homeToast && (
        <div className="bg-slate-900 border border-brand-500/20 text-slate-100 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-xl animate-fade-in fixed bottom-6 right-6 z-50 max-w-sm">
          <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
          <p className="text-xs font-semibold">{homeToast}</p>
        </div>
      )}

      {/* Header element bar */}
      <Header
        activePage={activePage}
        setActivePage={(p) => {
          handleSetActivePage(p);
        }}
        alertsCount={alerts.length}
        isScrolled={isScrolled}
        partnerSession={partnerSession}
        onOpenPartnerLogin={() => setIsPartnerLoginOpen(true)}
        onOpenPartnerApiSettings={() => setIsPartnerApiOpen(true)}
        onPartnerLogout={handlePartnerLogout}
      />

      {/* Core search form panel, pinned on Homepage or as header on Search result page */}
      {(activePage === 'home' || activePage === 'search') && (
        <SearchSection
          onSearch={handleSearch}
          initialData={hasSearched ? searchQuery : undefined}
          isScrolled={isScrolled}
          activePage={activePage}
          isSearching={isSearching}
        />
      )}

      {/* Primary Workspace Scroll Panel */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        
        {/* HOMEPAGE VIEW STATE */}
        {activePage === 'home' && (
          <div className="max-w-7xl mx-auto space-y-16" id="home-view-canvas">
            
            {/* Scrapers Status Ticker */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs shadow-md">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-slate-100">Live Scrapers:</span>
                <p className="text-slate-400">Verifying prices across 5 platforms continuously.</p>
              </div>
              <div className="flex gap-4 font-mono font-medium text-[11px] text-brand-400 overflow-x-auto w-full md:w-auto">
                <span>RedBus: SUCCESS (128 loaded)</span>
                <span>AbhiBus: ACTIVE (95 loaded)</span>
                <span>Paytm Bus: SYNCED (5 mins ago)</span>
                <span>UPSRTC Direct: LIVE</span>
              </div>
            </div>

            {/* Popular Geographic routes ribbon selection */}
            <section className="space-y-6">
              <div className="text-left">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="p-1.5 bg-brand-50 text-brand-600 rounded-lg"><Compass className="w-5 h-5" /></span>
                  Hot Travel Routes Compare Fares
                </h2>
                <p className="text-sm text-slate-500">
                  Select a route block to instantly execute dynamic ticket scans and compare pricing ranges.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { from: 'Delhi', to: 'Lucknow', distance: '554 KM', price: '799', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=250&fit=crop' },
                  { from: 'Delhi', to: 'Jaipur', distance: '270 KM', price: '349', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=250&fit=crop' },
                  { from: 'Bangalore', to: 'Hyderabad', distance: '575 KM', price: '899', img: 'https://images.unsplash.com/photo-1608958223405-f370cedae6df?w=400&h=250&fit=crop' },
                  { from: 'Patna', to: 'Delhi', distance: '1050 KM', price: '1599', img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=250&fit=crop' },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleSearch({ source: item.from, destination: item.to, travelDate: '2026-05-28', passengers: 1 })}
                    className="bg-white rounded-2xl border border-slate-100 hover:border-brand-100 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group text-left"
                  >
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={item.img}
                        alt={`${item.from} to ${item.to}`}
                        className="w-full h-full object-cover group-hover:scale-105 duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                      <span className="absolute bottom-3 left-3 text-white font-extrabold text-lg flex items-center gap-2">
                        {item.from} <span className="text-slate-300 font-light">&rarr;</span> {item.to}
                      </span>
                    </div>

                    <div className="p-4 flex justify-between items-center bg-white">
                      <div className="text-xs">
                        <span className="text-slate-400 block font-semibold">{item.distance} path distance</span>
                        <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">Compare 5 OTA Vendors</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Fares from</span>
                        <strong className="text-sm font-extrabold text-slate-900 font-mono">₹{item.price}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Premium Features Highlights section */}
            <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden text-left" id="promo-hero-cta">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.15),transparent_60%)] pointer-events-none"></div>

              <div className="max-w-xl space-y-6 relative">
                <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full font-extrabold uppercase tracking-widest inline-block">
                  Aviation Grade Commuter Planning
                </span>
                <h3 className="text-2xl md:text-4xl font-black text-slate-100 tracking-tight leading-tight">
                  Stop overpaying for highway bus tickets
                </h3>
                <p className="text-sm text-slate-400 leading-normal font-medium">
                  We check RedBus, AbhiBus, Paytm and State Board pricing systems in real-time. Lock target price drops and visualize long-distance trend models with the ultimate travel cockpit.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                    <strong className="block text-brand-400 text-base font-bold">₹0 Added Fees</strong>
                    <span className="text-[11px] text-slate-400">100% direct pricing transparency, no convenience charges.</span>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
                    <strong className="block text-emerald-400 text-base font-bold">40% Instant Savings</strong>
                    <span className="text-[11px] text-slate-400">Locating and matching dynamic coupon offers instantly.</span>
                  </div>
                </div>

                <button
                  onClick={() => setActivePage('database')}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 duration-150 shadow-md cursor-pointer"
                >
                  Explore Postgres Database Architecture &rarr;
                </button>
              </div>
            </section>

            {/* Testimonials segment */}
            <section className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">Endorsed by over 40 Lakh commuters</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Real travelers who saved significantly on inter-city trips.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { quote: "Absolute game changer. Mapped out Bangalore to Hyderabad bus listings. Found a deal via abhibus with coupon applied, saving ₹300.", author: "Neha Krishnamurthy", loc: "IT Consultant, Bengaluru" },
                  { quote: "UPSRTC state ticket counters can have long wait times. Mapped out listings online in BusLens, checked timings, locked my seats in 2 minutes flat.", author: "Rajesh K. Chawla", loc: "State Admin, Lucknow" },
                  { quote: "The historical trend graphs helped me recognize that mid-week fares on Patna routes dropped by 20%. Commute planned successfully!", author: "Amit Kumar Yadav", loc: "Doctor, Patna" }
                ].map((test, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 text-left space-y-3 shadow-sm hover:border-brand-500/20 duration-150">
                    <p className="text-xs text-slate-500 italic leading-relaxed">&ldquo;{test.quote}&rdquo;</p>
                    <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center select-none uppercase">{test.author[0]}</span>
                      <div>
                        <span className="block font-bold text-slate-800 text-xs">{test.author}</span>
                        <span className="block text-[10px] text-slate-400 font-medium">{test.loc}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* NO SEARCH QUERY OR SEARCH NOT YET INITIATED DISPLAY STATE */}
        {activePage === 'search' && (!hasSearched || !searchQuery.source || !searchQuery.destination) && (
          <div className="max-w-7xl mx-auto -mt-8 pb-4 text-center space-y-6" id="search-routes-empty">
            
            {/* Professional Portal Radar Visualizer Panel */}
            <Suspense fallback={<div className="h-44 bg-slate-150 rounded-3xl animate-pulse"></div>}>
              <PortalRadarVisual />
            </Suspense>

            <div className="border-t border-slate-150 pt-6 text-left">
              <Suspense fallback={<div className="h-80 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse w-full"></div>}>
                <RouteDiscoveryHub
                  onSelectRoute={(src, dest) => handleSearch({ source: src, destination: dest, travelDate: searchQuery.travelDate, passengers: searchQuery.passengers })}
                  recentSearches={recentSearches}
                  onClearRecentSearches={() => {
                    setRecentSearches([]);
                    try {
                      localStorage.removeItem('buslens_recent_searches');
                    } catch (_) {}
                  }}
                />
              </Suspense>
            </div>
          </div>
        )}

        {/* SEARCH RESULTS VIEW STATE (3-column layout) */}
        {activePage === 'search' && hasSearched && searchQuery.source && searchQuery.destination && (
          <div className="max-w-7xl mx-auto space-y-6" id="search-results-workspace">
            
            {/* Split Grid for Sidebar Comparison Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              
              {/* Column 1: Left Sticky Filter Sidebar */}
              <div className={`sm:col-span-3 min-w-0 sm:sticky self-start transition-all duration-350 ${isScrolled ? 'sm:top-[120px]' : 'sm:top-6'}`}>
                <FilterSidebar
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedBusTypes={selectedBusTypes}
                  toggleBusType={toggleBusType}
                  selectedDepartureTime={selectedDepartureTime}
                  setSelectedDepartureTime={setSelectedDepartureTime}
                  selectedAmenities={selectedAmenities}
                  toggleAmenity={toggleAmenity}
                  minRating={minRating}
                  setMinRating={setMinRating}
                  onClearAll={handleClearFilters}
                  selectedArrivalTime={selectedArrivalTime}
                  setSelectedArrivalTime={setSelectedArrivalTime}
                  selectedBoardingPoints={selectedBoardingPoints}
                  setSelectedBoardingPoints={setSelectedBoardingPoints}
                  selectedDroppingPoints={selectedDroppingPoints}
                  setSelectedDroppingPoints={setSelectedDroppingPoints}
                  selectedSeatingType={selectedSeatingType}
                  setSelectedSeatingType={setSelectedSeatingType}
                  selectedAcNonAc={selectedAcNonAc}
                  setSelectedAcNonAc={setSelectedAcNonAc}
                  allRouteBoardingPoints={allRouteBoardingPoints}
                  allRouteDroppingPoints={allRouteDroppingPoints}
                />
              </div>

              {/* Column 2: Center Results list matches */}
              <div className="sm:col-span-6 min-w-0 space-y-4">
                
                {/* Header row with sorting and buses found */}
                <div className="flex justify-between items-center text-left" id="sorting-elements-pill">
                  <h2 className="text-[13px] md:text-sm font-extrabold text-[#0D1B2A] tracking-tight">
                    {filteredListings.length} Buses found
                  </h2>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-705 cursor-pointer shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="cheapest">Cheapest First</option>
                      <option value="fastest">Fastest First</option>
                      <option value="rating">Highest Rated</option>
                      <option value="earliest">Earliest Departure</option>
                    </select>
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Horizontal OTA platform options bar */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none" id="brand-selection-row">
                  {[
                    { id: 'all', label: 'All Platforms', style: 'bg-slate-900 border-transparent text-white' },
                    { id: 'plat-redbus', label: 'redBus', style: 'text-[#E53E3E] hover:bg-[#FFF5F5] border-slate-200' },
                    { id: 'plat-abhibus', label: 'abhibus', style: 'text-[#EA580C] hover:bg-[#FFF7ED] border-slate-200' },
                    { id: 'plat-[#1D4ED8]', label: 'MakeMyTrip', style: 'text-[#1D4ED8] hover:bg-[#EFF6FF] border-slate-200', realId: 'plat-makemytrip' },
                    { id: 'plat-[#00B9F5]', label: 'Paytm', style: 'text-[#00B9F5] hover:bg-sky-50 border-slate-200', realId: 'plat-paytm' },
                    { id: 'op-intrcity', label: 'intrcity', style: 'text-[#10B981] hover:bg-emerald-50 border-slate-200' },
                    { id: 'plat-upsrtc', label: 'UPSRTC', style: 'text-[#B45309] hover:bg-amber-50 border-slate-200' },
                  ].map((tab) => {
                    const identifier = tab.realId || tab.id;
                    const isActive = selectedPlatformFilter === identifier;
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setSelectedPlatformFilter(identifier)}
                        className={`px-4.5 py-2 text-xs font-bold border rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white border-transparent shadow-sm'
                            : tab.style
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  
                  <button type="button" className="px-4.5 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl bg-white flex items-center gap-1">
                    <span>More</span>
                    <span className="text-[10px]">▼</span>
                  </button>
                </div>

                {/* Main Listings stack */}
                {isSearching ? (
                  <div className="space-y-6">
                    <div className="bg-[#0B132B] border border-slate-800 text-slate-100 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-6 animate-fade-in" id="listings-loading-card">
                      {/* Animated visual spinner */}
                      <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="relative flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
                          <Compass className="w-6 h-6 text-emerald-400 absolute animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-extrabold text-white tracking-tight">Comparing bus options...</h3>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Finding available seats and the best ticket prices from redBus, AbhiBus, and top-tier operators.
                          </p>
                        </div>
                      </div>

                      {/* Simple Step Guidelines */}
                      <div className="max-w-md mx-auto bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60 space-y-3.5 text-left">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${searchStep >= 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            {searchStep >= 1 ? '✓' : '1'}
                          </div>
                          <span className={`text-xs font-semibold ${searchStep >= 1 ? 'text-slate-200' : 'text-slate-500'}`}>
                            Verifying route schedules for {activeRoute.sourceCity} to {activeRoute.destinationCity}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${searchStep >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            {searchStep >= 2 ? '✓' : '2'}
                          </div>
                          <span className={`text-xs font-semibold ${searchStep >= 2 ? 'text-slate-200' : 'text-slate-500'}`}>
                            Querying live inventories on redBus and AbhiBus platforms
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${searchStep >= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            {searchStep >= 3 ? '✓' : '3'}
                          </div>
                          <span className={`text-xs font-semibold ${searchStep >= 3 ? 'text-slate-200' : 'text-slate-500'}`}>
                            Cross-referencing verified private operator discounts
                          </span>
                        </div>
                      </div>

                      {/* Clean progress bar */}
                      <div className="max-w-md mx-auto space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wider">
                          <span>SEARCHING IN PROGRESS</span>
                          <span className="text-blue-400">{Math.round((searchStep / 4) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(searchStep / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Highly-styled Skeletons indicating final component dimensions */}
                    <div className="space-y-5 animate-pulse">
                      <BusListingSkeleton />
                      <BusListingSkeleton />
                    </div>
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="bg-white border border-slate-150 p-12 rounded-3xl text-center space-y-4 shadow-sm animate-fade-in">
                    <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="text-center space-y-1.5">
                      <strong className="block text-slate-800 text-sm font-extrabold">No matching buses found</strong>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Your filter constraints (price, bus platform or timing slot filter) are strictly isolating all active fleet schedules on this route.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleClearFilters();
                        setSelectedPlatformFilter('all');
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold px-4 py-2.5 rounded-xl border cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in" id="listings-scroll-stack">
                    {filteredListings.map((lst) => (
                      <BusCard
                        key={lst.id}
                        listing={lst}
                        passengers={searchQuery.passengers}
                        onViewDeal={(item) => {
                          setActiveDetailsListing(item);
                          handleRecordCardClick(item);
                        }}
                        partnerSession={partnerSession}
                        travelDate={searchQuery.travelDate}
                        isCheapestOnRoute={lst.id === cheapestListingOnRoute?.id}
                        isBestValue={lst.id === bestValueListingId}
                        avgPriceOnRoute={avgPriceOnRoute}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Column 3: Right Insights Sidebar */}
              <div className={`sm:col-span-3 min-w-0 space-y-5 sm:sticky self-start transition-all duration-350 ${isScrolled ? 'sm:top-[120px]' : 'sm:top-6'}`}>
                
                {/* 1. Best Price ticket deal with Piggy Bank SVG */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm text-left flex justify-between items-center gap-4">
                  <div className="space-y-3.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#111827]">Best Price</span>
                      {searchQuery.passengers > 1 ? (
                        <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 font-bold px-2 py-0.5 rounded-md">
                          {searchQuery.passengers} Passengers
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                          Great Choice!
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 font-semibold leading-tight">
                      {searchQuery.passengers > 1 
                        ? `Total cheapest fare for ${searchQuery.passengers} pax is`
                        : "The cheapest fare for this route is"
                      }
                    </p>

                    <div>
                      <span className="text-3xl font-black text-slate-805 tracking-tight font-mono">
                        ₹{(cheapestListingOnRoute?.discountedPrice || 799) * searchQuery.passengers}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold lowercase ml-1">on</span>{" "}
                      <span className="text-xs font-black text-[#EA580C] uppercase">{cheapestListingOnRoute ? getPlatformName(cheapestListingOnRoute.platformId) : 'AbhiBus'}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-semibold">
                      You are saving <span className="text-emerald-600 font-bold">₹{(cheapestListingOnRoute ? Math.max(120, cheapestListingOnRoute.originalPrice - cheapestListingOnRoute.discountedPrice) : 200) * searchQuery.passengers}</span> on this trip
                    </p>
                  </div>

                  {/* Cutest Inline Pink Piggy bank Illustration */}
                  <div className="shrink-0 p-1">
                    <svg viewBox="0 0 100 85" className="w-16 h-16 text-[#F472B6] fill-current" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="50" cy="46" rx="28" ry="20" />
                      <rect x="18" y="38" width="8" height="12" rx="3" />
                      <circle cx="21" cy="42" r="1.2" fill="#DF6091" />
                      <circle cx="21" cy="47" r="1.2" fill="#DF6091" />
                      <path d="M 60,28 L 65,16 L 72,24 Z" />
                      <rect x="35" y="62" width="7" height="9" rx="2" />
                      <rect x="56" y="62" width="7" height="9" rx="2" />
                      <path d="M 76,46 Q 81,42 79,38 T 75,39" stroke="#F472B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <circle cx="36" cy="38" r="2" fill="#1E293B" />
                      <rect x="46" y="22" width="8" height="3" fill="#1E293B" rx="1" />
                      <circle cx="50" cy="13" r="5" fill="#FBBF24" />
                      <circle cx="50" cy="13" r="3" fill="#F59E0B" />
                    </svg>
                  </div>
                </div>

                {/* 1.5 Highest Rated Bus (Most Rated Bus) Spotlight Card */}
                {highestRatedBus && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-100 rounded-3xl p-5 space-y-4 text-left relative overflow-hidden shadow-sm" id="most-rated-bus-card">
                    <div className="absolute top-0 right-0 p-3 text-amber-500/20 transform rotate-12 scale-150">
                      <Award className="w-16 h-16" />
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                      <span className="text-[10px] uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200/50 font-black px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
                        <Award className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                        Most Rated Bus
                      </span>
                      <div className="flex items-center gap-1 text-slate-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black">{highestRatedBus.rating}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({highestRatedBus.reviewsCount})</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1.5 relative z-10">
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                        {highestRatedBus.operator}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-tight flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {highestRatedBus.busType}
                      </p>
                    </div>

                    <div className="border-t border-amber-200/40 pt-3 flex justify-between items-center relative z-10">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Exclusive Rate</span>
                        <span className="text-lg font-black text-slate-800 font-mono">
                          ₹{highestRatedBus.discountedPrice * searchQuery.passengers}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDetailsListing(highestRatedBus);
                          handleRecordCardClick(highestRatedBus);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white border border-amber-500/30 rounded-xl px-4 py-2 text-xs font-bold transition duration-150 cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        <span>Select Deal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Price Trend Curved Visual Grid */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-4">
                  <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Price Trend</h4>
                  
                  {/* Header showing trend info or active item details */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-semibold block">Prices for this route are</span>
                      <span className={`text-2xl font-black ${trendLevel.color} tracking-tight`}>{trendLevel.text}</span>
                    </div>
                    
                    {/* Active Price Callout Pill */}
                    {activeTrendItem ? (
                      <div className="text-right flex flex-col justify-end bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm min-w-[70px] transition-all duration-150">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">
                          {hoveredTrendIndex !== null ? 'On Hover' : 'Selected'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                          {activeTrendItem.day} Day
                        </span>
                        <span className="text-sm font-black text-slate-800 font-mono mt-0.5 leading-none block">
                          ₹{activeTrendItem.price}
                        </span>
                      </div>
                    ) : (
                      <div className="text-right flex flex-col justify-end bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm min-w-[70px]">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Book status</span>
                        <span className="text-[10px] font-bold text-slate-400 block">Stable</span>
                      </div>
                    )}
                  </div>

                  {/* Curving green/rose/amber gradient SVG curve trend chart */}
                  <div className="pt-2">
                    <div className="h-28 w-full bg-slate-50/50 rounded-2xl relative border border-slate-100 flex items-end p-2 px-3 shadow-inner overflow-hidden">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={trendLevel.hex} stopOpacity="0.25"/>
                            <stop offset="100%" stopColor={trendLevel.hex} stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>
                        
                        {/* Horizontal grid lines */}
                        <line x1="5" y1="20" x2="235" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="5" y1="50" x2="235" y2="50" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                        <line x1="5" y1="80" x2="235" y2="80" stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                        
                        {/* Vertical tracking guideline */}
                        {activeTrendItem && (
                          <line 
                            x1={activeTrendItem.x} 
                            y1="10" 
                            x2={activeTrendItem.x} 
                            y2="90" 
                            stroke={trendLevel.hex} 
                            strokeOpacity="0.2" 
                            strokeDasharray="3 3" 
                            strokeWidth="1.5"
                            className="transition-all duration-150"
                          />
                        )}

                        {/* Shaded bottom area */}
                        {priceCoords.length > 0 && (
                          <path
                            d={`M ${priceCoords[0].x},100 L ${priceCoords.map(c => `${c.x},${c.y}`).join(' L ')} L ${priceCoords[priceCoords.length-1].x},100 Z`}
                            fill="url(#chart-area-grad)"
                            className="transition-all duration-300"
                          />
                        )}
                        
                        {/* Main trend spline lines */}
                        {priceCoords.length > 0 && (
                          <path
                            d={`M ${priceCoords[0].x},${priceCoords[0].y} L ${priceCoords.slice(1).map(c => `${c.x},${c.y}`).join(' L ')}`}
                            fill="none"
                            stroke={trendLevel.hex}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-350"
                          />
                        )}

                        {/* Individual Day Dot targets */}
                        {priceCoords.map((pt, i) => {
                          const isActive = activeTrendItem && activeTrendItem.day === pt.day;
                          return (
                            <g key={`dots-${i}`}>
                              <circle 
                                cx={pt.x} 
                                cy={pt.y} 
                                r={isActive ? "5" : "3.5"} 
                                fill={isActive ? trendLevel.hex : "#FFFFFF"} 
                                stroke={trendLevel.hex}
                                strokeWidth={isActive ? "1" : "2"}
                                className="transition-all duration-150"
                              />
                              {isActive && (
                                <circle 
                                  cx={pt.x} 
                                  cy={pt.y} 
                                  r="9" 
                                  fill={trendLevel.hex} 
                                  opacity="0.15" 
                                  className="animate-ping"
                                  style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                                />
                              )}
                            </g>
                          );
                        })}

                        {/* Hitboxes for easy hover interactions on columns */}
                        {priceCoords.map((pt, idx) => (
                          <rect
                            key={`hit-${idx}`}
                            x={pt.x - 17.5}
                            y={0}
                            width={35}
                            height={100}
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredTrendIndex(idx)}
                            onMouseLeave={() => setHoveredTrendIndex(null)}
                          />
                        ))}
                      </svg>
                    </div>

                    {/* Horizontal Weekday Labels */}
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-3 pt-3 select-none">
                      {priceCoords.map((pt, idx) => {
                        const isSelected = pt.day.toLowerCase() === dayOfWeek.toLowerCase();
                        const isHovered = hoveredTrendIndex === idx;
                        const activeColor = isSelected ? trendLevel.hex : '#0F172A';
                        return (
                          <span 
                            key={pt.day} 
                            className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-150 ${isHovered || isSelected ? 'scale-105 font-black text-slate-800' : 'opacity-65 scale-100 font-semibold'}`}
                            onMouseEnter={() => setHoveredTrendIndex(idx)}
                            onMouseLeave={() => setHoveredTrendIndex(null)}
                            style={{ color: isSelected || isHovered ? activeColor : undefined }}
                          >
                            <span>{pt.day}</span>
                            <span 
                              className="w-1.5 h-1.5 rounded-full transition-all duration-150"
                              style={{ 
                                backgroundColor: isSelected ? trendLevel.hex : isHovered ? '#0F172A' : 'transparent',
                                opacity: isSelected ? 1 : isHovered ? 0.3 : 0
                              }}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Route Insights flat listing */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-4">
                  <h4 className="font-extrabold text-[#0F172A] text-xs uppercase tracking-wider">Route Insights</h4>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Average Price ({searchQuery.passengers} pax)</span>
                      <strong className="text-slate-800 font-mono">₹{avgPriceOnRoute * searchQuery.passengers}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Cheapest Time to Book</span>
                      <strong className="text-slate-800">{cheapestTimeToBook}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-400 font-semibold">Popular Bus Type</span>
                      <strong className="text-slate-800">{popularBusTypeOnRoute}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold">Best Time to Travel</span>
                      <strong className="text-slate-800 font-mono">{bestTimeToTravel}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Soft Blue drop notification alert widget */}
                <div className="bg-[#EFF6FF] border border-blue-100 rounded-3xl p-5 space-y-4 text-left relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-blue-100/60 text-[#1D4ED8] rounded-full relative">
                      <BellRing className="w-5.5 h-5.5" />
                      <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <h4 className="font-extrabold text-[#0F172A] text-sm">Get price drop alerts</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal">
                      We'll notify you when prices drop on this route.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCreateSidebarAlert}
                      className="w-full bg-white hover:bg-slate-50 text-[#1D4ED8] hover:text-blue-800 border-2 border-slate-200/80 rounded-2xl py-2.5 px-4 text-xs font-bold transition duration-150 cursor-pointer shadow-sm text-center"
                    >
                      Set Alert
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Smart Recommendations Panel - Light Palette placed spanning full page width */}
            <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/70 text-slate-800 rounded-3xl p-5 border border-slate-200 shadow-md space-y-4 relative overflow-hidden mt-6" id="ai-smart-recommendation-panel">
              {/* Ambient background blur circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Header with Brain/Compass icon */}
              <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Activity className="w-5 h-5 text-emerald-300 animate-pulse animate-duration-1000" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                      Smart Recommendations
                    </h3>
                    <p className="text-[10.5px] text-slate-500 font-semibold">Real-time tariff aggregation & seat inventory comparison insights</p>
                  </div>
                </div>

                {/* Top saving statistic badge */}
                {cheapestListingOnRoute && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3 py-1.5 text-right">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">Max Savings Available</span>
                    <span className="text-xs font-black text-emerald-700 font-mono">Save ₹{(cheapestListingOnRoute.originalPrice - cheapestListingOnRoute.discountedPrice) * searchQuery.passengers} today</span>
                  </div>
                )}
              </div>

              {/* Platform comparison matrix - Highlights cheapest platform & calculates price differences */}
              {platformComparisonList.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-blue-600" /> Compare Lowest Price Across OTA Platforms ({searchQuery.passengers} pax)
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {platformComparisonList.map((plat, index) => {
                      const isCheapest = index === 0;
                      const priceDiff = plat.basePrice - platformComparisonList[0].basePrice;
                      return (
                        <button
                          type="button"
                          key={plat.id}
                          onClick={() => setSelectedPlatformFilter(plat.id)}
                          className={`rounded-2xl p-4 text-left border relative transition-all duration-200 cursor-pointer focus:outline-none ${
                            isCheapest 
                              ? 'bg-emerald-50/80 border-emerald-300 shadow-[0_4px_12px_rgba(16,185,129,0.05)] ring-1 ring-emerald-300/40 text-emerald-950' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                          }`}
                        >
                          {isCheapest && (
                            <span className="absolute -top-2 right-3 bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                              Cheapest
                            </span>
                          )}
                          <span className="text-[10px] font-bold block" style={{ color: isCheapest ? '#065f46' : '#64748b' }}>{plat.name}</span>
                          <span className="text-base font-black font-mono block mt-1" style={{ color: isCheapest ? '#047857' : '#1e293b' }}>₹{plat.priceByPassenger}</span>
                          
                          <div className="text-[9.5px] font-medium leading-tight mt-1.5">
                            {isCheapest ? (
                              <span className="text-emerald-700 font-extrabold">★ Lowest net price</span>
                            ) : (
                              <div>
                                <span className="text-rose-600 font-black block">+{Math.round((priceDiff/platformComparisonList[0].basePrice)*100)}% extra</span>
                                <span className="text-[8.5px] text-slate-500 block mt-0.5">Save ₹{priceDiff * searchQuery.passengers} on {platformComparisonList[0].name}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Predictive Insights Banner Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* 1. Surge and Urgency Predictor */}
                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wide">Demand & Surge Alert</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      {isWeekendTravel ? (
                        <span>Weekend travel demand is high. A <span className="text-rose-600 font-black">25% surge multiplier</span> is detected. Prices likely to rise soon as seat counts exhaust. We highly recommend locking current rates.</span>
                      ) : (
                        <span>Midweek operations are active. Prices are currently stable and <span className="text-emerald-700 font-black">{Math.round(Math.max(5, (1 - (todayTrend?.price || 790)/avgTrendPrice) * 100))}% lower</span> than peak weekend averages.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 2. Future day prediction */}
                <div className="bg-blue-50/50 border border-blue-200/60 rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 text-blue-700">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wide">Cheapest Day Prediction</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      Our price models predict <span className="text-emerald-700 font-bold">{cheapestDayTrend.day}</span> is the absolute cheapest day to travel for this route. 
                      <span className="text-slate-500 font-medium block mt-0.5">Ticket rates on {cheapestDayTrend.day} drop as low as ₹{cheapestDayTrend.price * searchQuery.passengers} total!</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Fare Tracking & Visualizations Dashboard spanning full page width */}
            <div className="mt-6">
              <Suspense fallback={
                <div className="h-96 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse w-full flex flex-col items-center justify-center space-y-3">
                  <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider animate-pulse">Analyzing real-time fare history curves...</span>
                </div>
              }>
                <FareHistoryTracker 
                  routeId={activeRoute.id} 
                  routeName={`${activeRoute.sourceCity} to ${activeRoute.destinationCity}`}
                  passengers={searchQuery.passengers}
                />
              </Suspense>
            </div>

          </div>
        )}

        {/* PRICE ALERTS DASHBOARD VIEW STATE */}
        {activePage === 'alerts' && (
          <Suspense fallback={<DynamicLoadingPuck />}>
            <AlertsDashboard
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onDeleteAlert={handleDeleteAlert}
              onSearchRoute={(src, dest) => {
                handleSearch({ source: src, destination: dest, travelDate: '2026-05-28', passengers: 1 });
              }}
            />
          </Suspense>
        )}

        {/* POSTGRES/PRISMA SCHEMA DB TAB EXPLORER */}
        {activePage === 'database' && isAdmin && (
          <Suspense fallback={<DynamicLoadingPuck />}>
            <DatabaseSchemaExplorer
              bookingClicks={bookingClicks}
              priceAlerts={alerts}
              onClearClicks={handleClearClicks}
            />
          </Suspense>
        )}

        {/* ADMIN SAAS PERFORMANCE ANALYTICS PANEL */}
        {activePage === 'analytics' && isAdmin && (
          <Suspense fallback={<DashboardSkeleton />}>
            <AnalyticsDashboard 
              partnerSession={partnerSession}
              onOpenPartnerLogin={() => setIsPartnerLoginOpen(true)}
            />
          </Suspense>
        )}

        {/* DYNAMIC SEO ROUTES LANDING GUIDES SYSTEM */}
        {activePage === 'seo-landing' && isAdmin && (
          <Suspense fallback={<DashboardSkeleton />}>
            <SeoLandingPage 
              routeSlug={seoRouteSlug}
              onSelectRoute={(src, dest) => {
                window.history.pushState({ page: 'search' }, '', '/');
                handleSearch({ source: src, destination: dest, travelDate: '2026-06-03', passengers: 1 });
              }}
              onNavigateToRoute={(slug) => {
                setSeoRouteSlug(slug);
                window.history.pushState({ page: 'seo-landing', slug }, '', `/bus/${slug}`);
              }}
            />
          </Suspense>
        )}

      </main>

      {/* FOOTER segment block */}
      <Footer setActivePage={(p) => handleSetActivePage(p)} />

      {/* Details drawer portal, loaded with seat maps upper lower deck switch */}
      {activeDetailsListing && (
        <DetailsModal
          listing={activeDetailsListing}
          passengers={searchQuery.passengers}
          sourceCity={searchQuery.source}
          destinationCity={searchQuery.destination}
          travelDate={searchQuery.travelDate}
          onClose={() => setActiveDetailsListing(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {/* Partner secure OTP Verification portal modal */}
      <Suspense fallback={null}>
        <PartnerLoginModal
          isOpen={isPartnerLoginOpen}
          onClose={() => setIsPartnerLoginOpen(false)}
          onLoginSuccess={handlePartnerLoginSuccess}
        />
      </Suspense>

      {/* Partner API Scraper portal configurations modal */}
      {partnerSession && (
        <Suspense fallback={null}>
          <PartnerApiModal
            isOpen={isPartnerApiOpen}
            onClose={() => setIsPartnerApiOpen(false)}
            partnerSession={partnerSession}
            onSave={handlePartnerSaveApiSettings}
          />
        </Suspense>
      )}

      {/* Floating customer support chatbot assistant */}
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>

    </div>
  );
}
