import { NormalizedBusListing } from './types';

// Deterministic seed helper
function getSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Indian city specific transit hubs
const STATION_HUBS: { [city: string]: string[] } = {
  bangalore: ['Majestic (KSRTC)', 'Kalasipalyam', 'Anand Rao Circle', 'Electronic City Tollgate', 'Marathahalli', 'Silk Board', 'Hebbal'],
  bengaluru: ['Majestic (KSRTC)', 'Kalasipalyam', 'Anand Rao Circle', 'Electronic City Tollgate', 'Marathahalli', 'Silk Board', 'Hebbal'],
  hyderabad: ['Ameerpet', 'Gachibowli', 'Miyapur', 'MGBS Terminal', 'Kukatpally', 'Lakdikapul', 'Dilsukhnagar'],
  chennai: ['Koyambedu CMBT', 'Guindy', 'Tambaram', 'Perungalathur', 'Ashok Pillar', 'Central Station'],
  pune: ['Swargate', 'Wakad Petrol Pump', 'Hinjewadi Phase 1', 'Katraj', 'Shivajinagar', 'Sangamwadi'],
  mumbai: ['Borivali West', 'Andheri East (Weh)', 'Sion Circle', 'Dadar East', 'Vashi Toll Plaza', 'Thane Teen Hath Naka'],
  delhi: ['Kashmiri Gate ISBT', 'Anand Vihar ISBT', 'Majnu ka Tilla', 'Dhaula Kuan', 'Sarai Kale Khan', 'Karol Bagh'],
  jaipur: ['Sindhi Camp ISBT', 'Narayan Singh Circle', 'Transport Nagar', '200 Feet Bypass', 'Durgapura'],
  goa: ['Panaji Main Stand', 'Madgaon KTC Bus Stand', 'Mapusa', 'Calangute Bus Stop'],
  mandalay: ['Kywe Ser Kan Stand'],
  lucknow: ['Alambagh Bus Stand', 'Charbagh', 'Kamta Chauraha', 'Polytechnic Chauraha', 'Hazratganj'],
  patna: ['Mithapur Bus Stand', 'Gandhi Maidan', 'Patliputra Bus Stand', 'Zero Mile'],
};

// Default generic hubs
const DEFAULT_HUBS = ['Main City Bypass', 'Central Bus Stand', 'RTC Cross Roads', 'Highway Toll Plaza', 'Railway Station Crossing'];

function getStationForCity(city: string, index: number, isBoarding: boolean): string {
  const cleanCity = city.toLowerCase().trim();
  const list = STATION_HUBS[cleanCity] || DEFAULT_HUBS;
  const offset = isBoarding ? 0 : 3;
  return list[(getSeed(city) + index + offset) % list.length];
}

const PREMIUM_OPERATORS = [
  'Zingbus Premium',
  'IntrCity SmartBus',
  'SRS Travels',
  'VRL Travels',
  'Kaveri Travels',
  'Orange Tours & Travels',
  'Morning Star Travels',
  'National Travels',
  'Bharathi Travels',
  'Greenline Travels',
  'Royal Travels',
  'Raj Ratan Tours',
  'Jabbar Travels',
  'Neeta Tours & Travels'
];

export function generateSimulatedListings(
  provider: string,
  source: string,
  destination: string,
  journeyDate: string
): NormalizedBusListing[] {
  const seedKey = `${provider}-${source}-${destination}-${journeyDate}`.toLowerCase();
  const seed = getSeed(seedKey);

  // Approximate distance & base rate
  const distanceKm = 150 + (seed % 850);
  const baseRate = 1.6 + ((seed % 17) / 10); // 1.6 to 3.2 per km
  const basePrice = Math.max(350, Math.round(distanceKm * baseRate));

  // Determine state carrier name depending on origin
  let stateCarrier = 'State Transport RTC';
  const srcLower = source.toLowerCase();
  if (srcLower.includes('bangalore') || srcLower.includes('bengaluru')) {
    stateCarrier = 'KSRTC Awatar Seater';
  } else if (srcLower.includes('hyderabad')) {
    stateCarrier = 'TSRTC Deluxe';
  } else if (srcLower.includes('lucknow')) {
    stateCarrier = 'UPSRTC Intercity Janrath';
  } else if (srcLower.includes('jaipur')) {
    stateCarrier = 'RSRTC Gold Line';
  } else if (srcLower.includes('patna')) {
    stateCarrier = 'BSRTC Express Seater';
  }

  // Generate 4 to 6 listings for this provider
  const count = 4 + (seed % 3);
  const listings: NormalizedBusListing[] = [];

  const busTypes = [
    { type: 'AC Sleeper 2+1', multiplier: 1.25, durationReduction: 30 },
    { type: 'AC Sleeper 2+2', multiplier: 1.15, durationReduction: 15 },
    { type: 'AC Seater 2+2', multiplier: 0.95, durationReduction: 0 },
    { type: 'Non-AC Sleeper 2+1', multiplier: 0.90, durationReduction: -15 },
    { type: 'Non-AC Seater 2+2', multiplier: 0.70, durationReduction: -30 }
  ];

  for (let i = 0; i < count; i++) {
    const isStateOp = i === count - 1; // Last one is state RTC
    const opName = isStateOp 
      ? stateCarrier 
      : PREMIUM_OPERATORS[(seed + i * 7) % PREMIUM_OPERATORS.length];

    const busTypeRef = busTypes[(seed + i) % busTypes.length];
    const finalPrice = Math.round(basePrice * busTypeRef.multiplier * (0.9 + (i % 5) * 0.05));

    // Derive deterministic hours & minutes
    const rawMinutes = Math.round((distanceKm / 55) * 60 + 30 - busTypeRef.durationReduction);
    const hrs = Math.floor(rawMinutes / 60);
    const mins = rawMinutes % 60;
    const durationStr = `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;

    // Timings
    const startHour = (6 + (seed + i * 3) % 17) % 24;
    const startMinStr = ((seed + i * 11) % 4 * 15).toString().padStart(2, '0');
    const ampm = startHour >= 12 ? 'PM' : 'AM';
    const displayHour = startHour % 12 === 0 ? 12 : startHour % 12;
    const departureTime = `${displayHour}:${startMinStr} ${ampm}`;

    // Compute arrival time
    const endMinutesSinceMidnight = startHour * 60 + parseInt(startMinStr) + rawMinutes;
    const endHour = Math.floor(endMinutesSinceMidnight / 60) % 24;
    const endMinsStr = (endMinutesSinceMidnight % 60).toString().padStart(2, '0');
    const endAmpm = endHour >= 12 ? 'PM' : 'AM';
    const endDisplayHour = endHour % 12 === 0 ? 12 : endHour % 12;
    const arrivalTime = `${endDisplayHour}:${endMinsStr} ${endAmpm}`;

    // Reviews % ratings
    const rating = Math.min(5.0, Math.max(3.3, Math.round((3.8 + ((seed + i * 13) % 13) * 0.1) * 10) / 10));
    const seatsAvailable = 2 + ((seed + i * 8) % 28);

    // Boarding / Dropping
    const boardingPoint = getStationForCity(source, i, true);
    const droppingPoint = getStationForCity(destination, i, false);

    // Redirect Links
    let redirectUrl = 'https://www.redbus.in';
    const sUrl = encodeURIComponent(source.toLowerCase());
    const dUrl = encodeURIComponent(destination.toLowerCase());
    
    if (provider === 'redBus') {
      redirectUrl = `https://www.redbus.in/bus-tickets/${sUrl}-to-${dUrl}?onDate=${journeyDate}`;
    } else if (provider === 'AbhiBus') {
      redirectUrl = `https://www.abhibus.com/bus_search/${sUrl}/${dUrl}/${journeyDate}/O`;
    } else if (provider === 'ConfirmTkt') {
      redirectUrl = `https://www.confirmtkt.com/bus/${sUrl}-to-${dUrl}?date=${journeyDate}`;
    } else {
      // Paytm, MakeMyTrip, Goibibo
      redirectUrl = `https://www.makemytrip.com/bus/search/${source}/${destination}/${journeyDate}`;
    }

    listings.push({
      provider,
      operatorName: opName,
      departureTime,
      arrivalTime,
      duration: durationStr,
      busType: busTypeRef.type,
      rating,
      price: finalPrice,
      seatsAvailable,
      boardingPoint,
      droppingPoint,
      redirectUrl,
      fetchedAt: new Date().toISOString()
    });
  }

  return listings.sort((a, b) => a.price - b.price);
}
