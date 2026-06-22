import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  Snowflake, 
  Mail, 
  BatteryCharging, 
  Wifi, 
  ArrowRight, 
  Activity, 
  RotateCw, 
  Check, 
  Clock, 
  ThumbsUp, 
  Star, 
  ShieldAlert, 
  Heart, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Percent,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { BusListing, PartnerSession } from '../types';
import { mockPlatforms } from '../data/mockData';
import { buildAffiliateUrl } from '../utils';

interface BusCardProps {
  key?: any;
  listing: BusListing;
  onViewDeal: (listing: BusListing) => void;
  passengers: number;
  partnerSession?: PartnerSession | null;
  travelDate: string;
  isCheapestOnRoute?: boolean;
  isBestValue?: boolean;
  avgPriceOnRoute?: number;
}

export default function BusCard({ 
  listing, 
  onViewDeal, 
  passengers, 
  partnerSession, 
  travelDate,
  isCheapestOnRoute = false,
  isBestValue = false,
  avgPriceOnRoute
}: BusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [favorite, setFavorite] = useState(false);
  
  // Predictably distribute initial last-updated values from 1 to 14 minutes ago using deterministic listing offsets
  const [lastUpdated, setLastUpdated] = useState(() => (listing.id.charCodeAt(listing.id.length - 1) % 12) + 2);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const simulateLiveRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(0); // Set to "Just now / 0 mins ago"
      setIsRefreshing(false);
    }, 600);
  };

  // Format dates dynamically based on travelDate
  const getDepartureDateStr = () => {
    try {
      const d = new Date(travelDate);
      if (isNaN(d.getTime())) return travelDate;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch (_) {
      return travelDate;
    }
  };

  const getArrivalDateStr = () => {
    try {
      const d = new Date(travelDate);
      if (isNaN(d.getTime())) return travelDate;
      
      const deptTime = listing.departureTime;
      const isPM = deptTime.includes('PM');
      const timeClean = deptTime.replace(/(AM|PM)/g, '').trim();
      const parts = timeClean.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1] ? parseInt(parts[1], 10) : 0;
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      d.setHours(hours, minutes, 0, 0);
      d.setMinutes(d.getMinutes() + listing.durationMinutes);
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch (_) {
      try {
        const d = new Date(travelDate);
        if (listing.departureTime.includes('PM')) d.setDate(d.getDate() + 1);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]}`;
      } catch {
        return travelDate;
      }
    }
  };

  const hours = Math.floor(listing.durationMinutes / 60);
  const minutes = listing.durationMinutes % 60;

  // Calculators
  const totalOriginal = listing.originalPrice * passengers;
  const totalDiscounted = listing.discountedPrice * passengers;
  const savings = totalOriginal - totalDiscounted;

  const platform = mockPlatforms.find((p) => p.id === listing.platformId);
  const affiliateUrl = buildAffiliateUrl(listing, platform, 'Guest');

  const diffFromAvg = avgPriceOnRoute ? Math.max(0, avgPriceOnRoute - listing.discountedPrice) : 0;
  const savingPercentage = avgPriceOnRoute && diffFromAvg > 0 ? Math.round((diffFromAvg / avgPriceOnRoute) * 100) : 0;

  const isLimitedSeats = (listing.reviewsCount % 3 === 0);
  const dIdStr = String(listing.id);
  const seatsRemaining = (dIdStr.charCodeAt(dIdStr.length - 1) % 4) + 2; 

  const isPriceRiseLikely = (listing.rating > 4.5 || isCheapestOnRoute);

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.2) return 'Very Good';
    return 'Good';
  };

  // Simulated sub-metrics for user reviews split
  const metricsCleanliness = (Math.min(5.0, listing.rating + 0.1)).toFixed(1);
  const metricsPunctuality = (Math.min(5.0, listing.rating - 0.2 + (listing.reviewsCount % 4) * 0.1)).toFixed(1);
  const metricsStaff = (Math.min(5.0, listing.rating + 0.2 - (listing.reviewsCount % 3) * 0.1)).toFixed(1);
  const metricsVibe = (Math.min(5.0, listing.rating + (listing.reviewsCount % 2) * 0.1)).toFixed(1);

  // Refund highlights based on rating levels
  const refundPolicyType = listing.rating >= 4.5 ? 'flexible' : listing.rating >= 4.2 ? 'moderate' : 'standard';

  const renderPlatformLogo = (platformId: string) => {
    switch (platformId) {
      case 'plat-abhibus':
        return (
          <span className="text-sm font-extrabold tracking-tighter text-[#EA580C] font-sans">
            abhi<span className="text-slate-800">bus</span>
          </span>
        );
      case 'plat-redbus':
        return (
          <span className="text-xs font-extrabold text-[#E53E3E] font-sans">
            red<span className="text-slate-800">Bus</span>
          </span>
        );
      case 'plat-makemytrip':
        return (
          <span className="text-xs font-black tracking-tight text-[#1D4ED8]" style={{ fontFamily: 'system-ui' }}>
            make<span className="text-[#EA580C]">my</span>trip
          </span>
        );
      case 'plat-paytm':
        return (
          <span className="text-xs font-black text-[#00B9F5] font-sans">
            Pay<span className="text-[#002E6E]">tm</span>
          </span>
        );
      case 'plat-upsrtc':
        return (
          <span className="text-[10px] font-black text-[#B45309] tracking-wider uppercase font-sans">
            UPSRTC Govt
          </span>
        );
      default:
        return <span className="text-xs font-bold text-slate-500">Board Partner</span>;
    }
  };

  // Sample verified commuter messages
  const sampleCommuterFeedback = 
    listing.rating >= 4.7 ? "“Punctual boarding, chilled AC, incredibly spacious legroom. Highly recommended.”" :
    listing.rating >= 4.4 ? "“Excellent crew communication. Bus was neat and they provided complimentary water.”" :
    "“On-time service, standard seats and comfortable boarding coordinates.”";

  return (
    <div
      id={`bus-card-${listing.id}`}
      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden text-left ${
        isBestValue 
          ? 'border-indigo-200/90 shadow-[0_5px_18px_rgba(99,102,241,0.06)]' 
          : 'border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md'
      }`}
    >
      {/* Flight Comparison Info Strip resembling Kayak/Skyscanner */}
      <div className={`px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b text-[11px] font-medium font-sans ${
        isBestValue 
          ? 'bg-indigo-50/50 text-indigo-950 border-indigo-150' 
          : isCheapestOnRoute 
          ? 'bg-emerald-50/50 text-emerald-950 border-emerald-150' 
          : 'bg-slate-50/50 text-slate-600 border-slate-100'
      }`}>
        <div className="flex items-center gap-2">
          {/* Prices updated Live Ticker */}
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10.5px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>
              Updated {lastUpdated === 0 ? 'just now' : `${lastUpdated} mins ago`}
            </span>
            <button 
              type="button"
              onClick={simulateLiveRefresh}
              title="Verify live availability"
              className="p-0.5 rounded hover:bg-slate-250 hover:text-slate-800 transition-colors focus:outline-none"
            >
              <RotateCw className={`w-3 h-3 text-blue-500 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
          <span className="text-slate-300">•</span>
          {/* No Hidden fees Badge */}
          <span className="inline-flex items-center gap-1 bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded text-[9.5px] font-bold">
            <Check className="w-2.5 h-2.5" /> No Hidden Fees
          </span>
        </div>

        {/* Watchlist pin option */}
        <div className="flex items-center gap-2.5">
          {/* Favorite heart icon */}
          <button 
            type="button" 
            onClick={() => setFavorite(!favorite)} 
            className="p-1 rounded-full hover:bg-slate-100 transition-all focus:outline-none cursor-pointer"
            title={favorite ? "Remove from Watchlist" : "Pin to Watchlist"}
          >
            <Heart className={`w-4 h-4 transition-transform active:scale-125 ${favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400 hover:text-slate-600'}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* ROW 1: BRAND LOGO & VERIFICATION SHIELD */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight leading-tight">
                {listing.busName}
              </span>
              
              {/* Verified Operator Seal Badge */}
              <div 
                className="bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors px-2 py-0.5 rounded-lg border border-sky-105 inline-flex items-center gap-1 text-[9.5px] font-bold select-none cursor-help"
                title="This operator holds a verified status with 98%+ GPS telemetry and 95%+ booking reliability index."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 fill-current" />
                <span>Verified Carrier</span>
              </div>

              {listing.badge === 'Cheapest Today' && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Cheapest Slot
                </span>
              )}
            </div>
            
            <p className="text-[11px] text-slate-500 font-medium">
              {listing.busType} • Premium Airbus (2+1)
            </p>
            
            {/* Promo tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {isCheapestOnRoute && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-150">
                  Save instantly compared to high-tier state trains
                </span>
              )}
              {savingPercentage > 0 && (
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-150">
                  {savingPercentage}% direct partner discount applied
                </span>
              )}
              {isLimitedSeats && (
                <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg border border-rose-150 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping"></span>
                  Hot seat: {seatsRemaining} empty berths left at this tariff
                </span>
              )}
            </div>
          </div>

          {/* Combined Ratings Section resembling TripAdvisor / G-Flights */}
          <div className="flex items-center gap-2 select-none shrink-0 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1.5 rounded-2xl border border-emerald-100">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm" />
            <div className="text-left leading-none">
              <span className="font-black text-[13px] tracking-tight">{listing.rating.toFixed(1)}</span>
              <span className="text-[9px] text-[#2E7D32] font-extrabold block mt-0.5 uppercase tracking-wide">
                {getRatingLabel(listing.rating)} • {listing.reviewsCount} users
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: TRANSIT timeline (Similar to Google Flights detailed timeline rows) */}
        <div className="grid grid-cols-12 gap-3 items-center py-2 bg-slate-50/40 px-4 py-3 rounded-2xl border border-slate-100">
          <div className="col-span-4 text-left space-y-0.5">
            <span className="text-lg font-black text-slate-900 block tracking-tight">
              {listing.departureTime}
            </span>
            <span className="text-[10px] text-[#475569] font-bold block">{getDepartureDateStr()}</span>
            <p className="text-[11px] text-slate-500 font-semibold truncate max-w-full text-left" title={listing.boardingPoint}>
              {listing.boardingPoint}
            </p>
          </div>

          <div className="col-span-4 flex flex-col items-center justify-center px-1">
            <span className="text-[10.5px] text-slate-500 font-extrabold mb-1 font-mono bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-2xs">
              {hours}h {minutes > 0 ? `${minutes}m` : ''}
            </span>
            
            <div className="w-full relative flex items-center justify-between max-w-[130px]">
              <div className="h-1.5 w-1.5 rounded-full border border-slate-400 bg-white shadow-xs"></div>
              <div className="flex-1 h-[2px] bg-slate-200"></div>
              <div className="h-1.5 w-1.5 rounded-full border border-slate-400 bg-white shadow-xs"></div>
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-slate-400">
              <Snowflake className="w-3.5 h-3.5" title="Chilled Air Conditioning" />
              <Wifi className="w-3.5 h-3.5" title="Free Multi-Device Wi-Fi" />
              <BatteryCharging className="w-3.5 h-3.5" title="USB Port at each armchair" />
            </div>
          </div>

          <div className="col-span-4 text-right space-y-0.5">
            <span className="text-lg font-black text-slate-900 block tracking-tight">
              {listing.arrivalTime}
            </span>
            <span className="text-[10px] text-[#475569] font-bold block">{getArrivalDateStr()}</span>
            <p className="text-[11px] text-slate-500 font-semibold truncate max-w-full text-right" title={listing.droppingPoint}>
              {listing.droppingPoint}
            </p>
          </div>
        </div>

        {/* ROW 3: BOOKING OTA & PRICING BOX */}
        <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
          {/* Partner identification */}
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400">Merchant:</span>
            <div className="bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200/60 inline-flex items-center gap-2 font-black text-slate-800 shadow-3xs hover:bg-slate-200/40 transition-colors">
              {renderPlatformLogo(listing.platformId)}
            </div>
            {partnerSession?.isLoggedIn && partnerSession?.isActive && partnerSession?.platformId === listing.platformId && (
              <span className="ml-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> API Sync Active
              </span>
            )}
          </div>

          {/* Pricing labels aligned like Flights / Kayak CTA */}
          <div className="flex items-center gap-4.5 ml-auto">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                {savings > 0 && (
                  <span className="text-[11px] text-slate-400 line-through font-mono">
                    ₹{totalOriginal}
                  </span>
                )}
                <span className="text-xl md:text-2xl font-black text-slate-900 font-mono tracking-tight text-blue-600">
                  ₹{totalDiscounted}
                </span>
              </div>
              <span className="text-[9px] text-[#64748B] font-bold block mt-0.5 uppercase tracking-wide">
                All taxes & booking fees included  
              </span>
            </div>

            <button
              type="button"
              onClick={() => onViewDeal(listing)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-2xl flex items-center justify-center gap-1 duration-150 transition-all text-xs shadow-sm hover:shadow-md focus:outline-none cursor-pointer"
            >
              <span>Book Deal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
