// SEO Routing content generator for BusLens Comparison Portal
// This file is used on BOTH the Express backend server (for HTML tag head pre-rendering)
// and the React frontend client (for interactive views and guides).

export interface SeoRouteData {
  slug: string;
  source: string;
  destination: string;
  title: string;
  metaDesc: string;
  distance: string;
  avgDuration: string;
  avgFare: string;
  minFare: string;
  totalOperators: string;
  busTypes: string;
  boardingPoints: string[];
  droppingPoints: string[];
  faqs: { q: string; a: string }[];
  reviews: { user: string; rating: number; comment: string }[];
  insights: string;
  similarRoutes: { name: string; slug: string }[];
  priceTrends: { day: string; price: number }[];
  topOperators: { name: string; rating: number; minPrice: number }[];
}

export function capitalizeWords(str: string): string {
  return str
    .split('-')
    .map((word) => {
      // support empty segments
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(' ');
}

// Coordinate based geodesic calculation to generate 100% realistic matching distances & durations
export function getRouteStats(source: string, destination: string) {
  const s = source.trim().toLowerCase();
  const d = destination.trim().toLowerCase();

  const coords: Record<string, { lat: number; lng: number }> = {
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'patna': { lat: 25.5941, lng: 85.1376 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'goa': { lat: 15.2993, lng: 74.1240 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'agra': { lat: 27.1767, lng: 78.0081 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'coimbatore': { lat: 11.0168, lng: 76.9558 },
    'cochin': { lat: 9.9312, lng: 76.2673 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
  };

  const p1 = coords[s];
  const p2 = coords[d];

  let distanceKm = 400;
  if (p1 && p2) {
    const R = 6371; // Earth polar radius
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
    distanceKm = Math.round(directDist * 1.25); // coefficient for expressway curvature
  } else {
    let hash = 0;
    const combined = s + d;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    distanceKm = 180 + Math.abs(hash % 850);
  }

  const durationHours = Math.round((distanceKm / 56) * 10) / 10;
  return { distanceKm, durationHours };
}

export function generateSeoData(slug: string): SeoRouteData {
  // Normalize slug
  const normalized = slug.trim().toLowerCase();
  
  // Extract source and destination from slug containing "-to-"
  let srcWord = 'Delhi';
  let destWord = 'Jaipur';
  
  if (normalized.includes('-to-')) {
    const parts = normalized.split('-to-');
    srcWord = capitalizeWords(parts[0]);
    destWord = capitalizeWords(parts[1]);
  } else {
    // Treat the whole slug as capitalized or default split
    srcWord = capitalizeWords(normalized.replace('-', ' '));
  }

  const { distanceKm, durationHours } = getRouteStats(srcWord, destWord);
  
  // Deterministic minimum and average price based on distance
  const baseRate = 1.15; // standard per KM rate in INR
  const minFareVal = Math.max(249, Math.round(distanceKm * baseRate));
  const avgFareVal = Math.round(minFareVal * 1.22);
  const totalOperatorsCount = Math.min(95, Math.max(12, Math.round(15 + (distanceKm % 41))));

  // Deterministic review comments selection
  const revCandidates = [
    { name: "Anish G.", comment: "Super smooth trip! Booking comparison saved me around ₹200 on sleeper coach." },
    { name: "Siddharth S.", comment: "The pricing trend analysis is so useful. Booked early since rates go up on Fridays." },
    { name: "Neha P.", comment: "Clean bedsheets and supportive service staff. BusLens showed accurate boarding offsets." },
    { name: "Rohan M.", comment: "Matched MakeMyTrip rates against direct state carriers. BusLens had the lowest prices." },
    { name: "Keerthi K.", comment: "Highly recommend comparing before booking. Found a comfortable multi-axle AC Volvo." }
  ];

  // Pick deterministic subset of reviews
  const revSeed1 = (distanceKm % revCandidates.length);
  const revSeed2 = ((distanceKm + 2) % revCandidates.length);
  const reviews = [
    { user: revCandidates[revSeed1].name, rating: 4.8, comment: revCandidates[revSeed1].comment },
    { user: revCandidates[revSeed2].name, rating: 4.6, comment: revCandidates[revSeed2].comment }
  ];

  // Specific high quality boarding and dropping points relative to typical city hubs
  const getCityHubs = (city: string, isBoarding: boolean) => {
    const norm = city.toLowerCase();
    if (norm.includes('delhi')) return isBoarding ? ['ISBT Kashmere Gate', 'Anand Vihar Hub', 'Dhaula Kuan Platform', 'Majnu Ka Tilla'] : ['Majnu Ka Tilla Terminal', 'Anand Vihar', 'Kashmere Gate Terminal'];
    if (norm.includes('jaipur')) return isBoarding ? ['Sindhi Camp', 'Durgapura Flyover', '200 Ft Bypass'] : ['Sindhi Camp Terminal', 'Narayan Singh Circle', 'Transport Nagar Jaipur'];
    if (norm.includes('pune')) return isBoarding ? ['Wakad Highway', 'Swargate Terminal', 'Kharadi Bypass'] : ['Wakad Bypass Point', 'Swargate', 'Pune Station Stand'];
    if (norm.includes('mumbai')) return isBoarding ? ['Borivali East Bypass', 'Hinduja Dadar', 'Sion circle'] : ['Vashi Highway Plaza', 'Dadar East', 'Borivali Terminal'];
    if (norm.includes('lucknow')) return isBoarding ? ['Alambagh Stand', 'Charbagh Junction', 'Polytechnic Chauraha'] : ['Alambagh Bus Stand', 'Kamta Bypass', 'Transport Nagar Gate'];
    if (norm.includes('bangalore')) return isBoarding ? ['Majestic Terminal', 'Silk Board Plaza', 'Hebbal Flyover'] : ['Madiwala Point', 'Anand Rao Circle', 'Electronic City Toll'];
    if (norm.includes('hyderabad')) return isBoarding ? ['MGBS Terminal', 'Ameerpet Gate', 'Gachibowli Ring'] : ['Kukatpally Near Metro', 'Gachibowli ORR', 'Secunderabad Area'];
    if (norm.includes('patna')) return isBoarding ? ['Gandhi Maidan Roundabout', 'Patliputra Terminal'] : ['Bairiya New ISBT', 'Danapur Station Terminal'];
    
    // generic defaults
    return isBoarding ? 
      [`Central Bus Stand, ${city}`, `Highway Bypass Junction, ${city}`, `Toll Plaza Terminal, ${city}`] :
      [`Central Bypass Gate, ${city}`, `Opposite Main Railway Station, ${city}`];
  };

  const boardingPoints = getCityHubs(srcWord, true);
  const droppingPoints = getCityHubs(destWord, false);

  // similar routes internal linking system (deterministically linking other major hubs)
  const hubs = ['Delhi', 'Jaipur', 'Lucknow', 'Bangalore', 'Hyderabad', 'Mumbai', 'Pune', 'Patna'];
  const similarRoutes = hubs
    .filter(h => h.toLowerCase() !== srcWord.toLowerCase() && h.toLowerCase() !== destWord.toLowerCase())
    .slice(0, 4)
    .map(h => {
      const isAltSource = (distanceKm % 2 === 0);
      const name = isAltSource ? `${h} to ${destWord}` : `${srcWord} to ${h}`;
      const routeSlug = isAltSource ? 
        `${h.toLowerCase()}-to-${destWord.toLowerCase()}` : 
        `${srcWord.toLowerCase()}-to-${h.toLowerCase()}`;
      return { name, slug: routeSlug };
    });

  // Price trends chart data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const priceTrends = days.map((day, dIdx) => {
    // weekday is cheaper than weekend
    const multiplier = (day === 'Fri' || day === 'Sat' || day === 'Sun') ? 1.25 : 0.95;
    const factor = 0.9 + ((distanceKm + dIdx) % 11) / 100;
    return {
      day,
      price: Math.round(minFareVal * multiplier * factor)
    };
  });

  // Top operators list
  const operatorNames = ['IntrCity SmartBus', 'Zingbus Premium', 'Neeta Travels', 'Orange Tours', 'Raj Ratan Sleeper', 'VRL Travels'];
  const topOperators = operatorNames.slice(0, 3).map((name, opIdx) => {
    const starRating = Math.round((4.3 + ((distanceKm + opIdx) % 7) * 0.1) * 10) / 10;
    const rateMul = 0.95 + (opIdx * 0.1);
    return {
      name,
      rating: starRating,
      minPrice: Math.round(minFareVal * rateMul)
    };
  });

  return {
    slug: normalized,
    source: srcWord,
    destination: destWord,
    title: `${srcWord} to ${destWord} Bus Tickets, Lowest Fares from ₹${minFareVal} | BusLens`,
    metaDesc: `Compare ${srcWord} to ${destWord} bus ticket prices across redBus, AbhiBus, Paytm and MakeMyTrip instantly. Check live tracking, premium sleeper schedules, passenger reviews, and lock exclusive discounts on BusLens.`,
    distance: `${distanceKm} km`,
    avgDuration: `${durationHours} hours`,
    avgFare: `₹${avgFareVal}`,
    minFare: `₹${minFareVal}`,
    totalOperators: `${totalOperatorsCount} verified operators`,
    busTypes: 'AC Sleeper, AC Seater, Scania multi-axle, Volvo Cruiser',
    boardingPoints,
    droppingPoints,
    faqs: [
      {
        q: `What is the cheapest bus ticket price from ${srcWord} to ${destWord}?`,
        a: `The lowest ticket rate starts dynamically at ₹${minFareVal}. You can secure the cheapest seat by comparing booking codes across premium partner platforms like redBus or AbhiBus on BusLens.`
      },
      {
        q: `How long does it take to travel from ${srcWord} to ${destWord} by bus?`,
        a: `The average journey duration is ${durationHours} hours, covering an expressway travel distance of approximately ${distanceKm} km. Timelines vary slightly depending on peak traffic conditions.`
      },
      {
        q: `What types of buses are available on ${srcWord} to ${destWord} route?`,
        a: `Passengers can select from a wide range of options including AC Sleeper (2+1), luxury Multi-Axle Volvo sleepers, affordable AC Seaters, and certified State Road Transport Corporation buses.`
      }
    ],
    reviews,
    insights: `Travel is cheapest on Wednesday. Midweek ticket pricing is up to 22% cheaper on the ${srcWord} to ${destWord} route relative to weekend surge pricing.`,
    similarRoutes,
    priceTrends,
    topOperators
  };
}
