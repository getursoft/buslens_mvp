import { BusListing, BookingPlatform } from './types';

/**
 * Builds a robust affiliate tracking URL containing high-fidelity telemetry
 * parameters, linking the user session, platform, listing details, and device information.
 */
export function buildAffiliateUrl(
  listing: BusListing,
  platform?: BookingPlatform | null,
  userId: string = 'Guest',
  options?: {
    deviceType?: string;
    sourceCity?: string;
    destinationCity?: string;
    travelDate?: string;
    campaign?: string;
    passengers?: number;
  }
): string {
  const platformId = platform?.id || '';
  const affCode = platform?.affiliateCode || 'BL_GENERIC_99';
  const device = options?.deviceType || (typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop');
  
  const sourceCity = options?.sourceCity || 'Delhi';
  const destinationCity = options?.destinationCity || 'Lucknow';
  const travelDate = options?.travelDate || '2026-05-28';
  const passengers = options?.passengers || 1;

  // Format date variations
  const dateParts = travelDate.split('-');
  let y = '2026';
  let m = '05';
  let d = '28';
  if (dateParts.length === 3) {
    y = dateParts[0];
    m = dateParts[1];
    d = dateParts[2];
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthInt = parseInt(m, 10);
  const monthName = months[Math.max(0, Math.min(11, monthInt - 1))];
  
  const mmtDateFormat = `${d}-${m}-${y}`; // DD-MM-YYYY
  const redbusDateFormat = `${d}-${monthName}-${y}`; // DD-MMM-YYYY
  const standardDate = `${y}-${m}-${d}`;

  let targetUrl = '';

  if (platformId.includes('redbus')) {
    // RedBus URL structure
    // RedBus handles deep-linking by visiting: https://www.redbus.in/bus-tickets/<from>-to-<to>
    const cleanFrom = sourceCity.toLowerCase().replace(/\s+/g, '-');
    const cleanTo = destinationCity.toLowerCase().replace(/\s+/g, '-');
    targetUrl = `https://www.redbus.in/bus-tickets/${cleanFrom}-to-${cleanTo}`;
  } else if (platformId.includes('abhibus')) {
    // AbhiBus URL structure
    // https://www.abhibus.com/bus_search/<from>/<to>/<YYYY-MM-DD>/f
    targetUrl = `https://www.abhibus.com/bus_search/${encodeURIComponent(sourceCity)}/${encodeURIComponent(destinationCity)}/${standardDate}/f`;
  } else if (platformId.includes('makemytrip')) {
    // MakeMyTrip URL structure
    // https://www.makemytrip.com/bus-tickets/search/<from>/<to>/<DD-MM-YYYY>
    targetUrl = `https://www.makemytrip.com/bus-tickets/search/${encodeURIComponent(sourceCity)}/${encodeURIComponent(destinationCity)}/${mmtDateFormat}`;
  } else if (platformId.includes('paytm')) {
    // Paytm URL structure
    // https://paytm.com/bus-tickets/search/<from>/<to>/<YYYY-MM-DD>
    targetUrl = `https://paytm.com/bus-tickets/search/${encodeURIComponent(sourceCity)}/${encodeURIComponent(destinationCity)}/${standardDate}`;
  } else if (platformId.includes('upsrtc')) {
    targetUrl = `https://www.upsrtc.up.gov.in`;
  } else {
    targetUrl = platform?.websiteUrl || 'https://www.redbus.in';
  }

  // To be absolutely robust and cover auto-selection if the SPA reads query parameters,
  // we append all possible query-param fallbacks (e.g., origin, destination, onwardDate, pax, seats)
  const params = new URLSearchParams();
  params.set('aff_code', affCode);
  params.set('listing_id', listing.id);
  params.set('utm_source', 'buslens');
  params.set('utm_medium', 'aff_partner');
  params.set('utm_campaign', options?.campaign || 'view_deal_cta');
  params.set('user_id', userId);
  params.set('operator_id', listing.operatorId);
  params.set('device', device);
  
  // Standalone fields
  params.set('origin', sourceCity);
  params.set('source', sourceCity);
  params.set('from', sourceCity);
  params.set('fromCityName', sourceCity);

  params.set('destination', destinationCity);
  params.set('dest', destinationCity);
  params.set('to', destinationCity);
  params.set('toCityName', destinationCity);

  params.set('travel_date', standardDate);
  params.set('onwardDate', redbusDateFormat);
  params.set('date', standardDate);
  params.set('jdate', standardDate);
  params.set('journeyDate', mmtDateFormat);

  const paxVal = String(passengers);
  params.set('passengers', paxVal);
  params.set('pax', paxVal);
  params.set('pax_count', paxVal);
  params.set('paxCount', paxVal);
  params.set('seats', paxVal);
  params.set('no_of_passenger', paxVal);

  params.set('timestamp', new Date().toISOString());

  const separator = targetUrl.includes('?') ? '&' : '?';
  return `${targetUrl}${separator}${params.toString()}`;
}
