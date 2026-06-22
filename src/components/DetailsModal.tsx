import React, { useState } from 'react';
import { X, Check, Star, Shield, ShieldCheck, Info, Battery, Wifi, Coffee, Navigation, RefreshCw, Calendar, Trash2, Sparkles } from 'lucide-react';
import { BusListing } from '../types';
import { mockPlatforms, mockOperators, mockReviews } from '../data/mockData';
import { buildAffiliateUrl } from '../utils';

interface DetailsModalProps {
  listing: BusListing;
  onClose: () => void;
  passengers: number;
  sourceCity?: string;
  destinationCity?: string;
  travelDate?: string;
  onConfirmBooking?: (listingId: string, platformId: string, affiliateUrl: string) => void;
}

export default function DetailsModal({ 
  listing, 
  onClose, 
  passengers, 
  sourceCity, 
  destinationCity, 
  travelDate, 
  onConfirmBooking 
}: DetailsModalProps) {
  const operator = mockOperators.find((o) => o.id === listing.operatorId);
  const platform = mockPlatforms.find((p) => p.id === listing.platformId);

  const affiliateUrl = buildAffiliateUrl(listing, platform, 'Guest', { 
    campaign: 'interactive_seat_lock',
    sourceCity,
    destinationCity,
    travelDate,
    passengers
  });

  // Tabs status mapping
  const [activeTab, setActiveTab] = useState<'seats' | 'amenities' | 'points' | 'reviews' | 'policy' | 'share'>('seats');

  // Redirection overlay states
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectStep, setRedirectStep] = useState(0);

  // Link copy status state
  const [linkCopied, setLinkCopied] = useState(false);

  // Interactive seat mapping states
  // Bus has 32 seats: 8 selected, some occupied
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['L3', 'L4'].slice(0, passengers));
  const occupiedSeats = ['L1', 'L2', 'L10', 'L11', 'L18', 'U2', 'U3', 'U9', 'U10', 'U15'];

  const handleSeatClick = (seatCode: string) => {
    if (occupiedSeats.includes(seatCode)) return;
    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatCode));
    } else {
      // Limit to passengers count or automatically select up to 6 seats
      if (selectedSeats.length < passengers) {
        setSelectedSeats(prev => [...prev, seatCode]);
      } else {
        // Shift oldest
        setSelectedSeats(prev => [...prev.slice(1), seatCode]);
      }
    }
  };

  const finalPaidPrice = listing.discountedPrice * (selectedSeats.length || 1);

  const triggerRedirection = () => {
    setIsRedirecting(true);
    setRedirectStep(1);

    setTimeout(() => {
      setRedirectStep(2);
    }, 600);

    setTimeout(() => {
      setRedirectStep(3);
    }, 1200);

    setTimeout(() => {
      setRedirectStep(4);
    }, 1800);

    setTimeout(() => {
      if (onConfirmBooking) {
        onConfirmBooking(listing.id, listing.platformId, affiliateUrl);
      }
      setIsRedirecting(false);
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100" id="details-modal-wrapper">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="text-left">
            <span className="text-[10px] bg-brand-500 text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Interactive Seat Portal</span>
            <h3 className="text-lg font-bold mt-1 text-slate-100 flex items-center gap-2">
              {listing.busName} <span className="text-xs text-slate-400 font-normal">({listing.busType})</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Boarding: {listing.boardingPoint} ➔ Drop off: {listing.droppingPoint}
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
            aria-label="Close modal partition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isRedirecting ? (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-6 bg-slate-900 text-white min-h-[420px]">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-slate-705 border-t-brand-500 rounded-full animate-spin"></div>
              <Sparkles className="w-6 h-6 text-brand-405 absolute animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <span className="text-[10px] bg-brand-500/25 text-brand-400 px-3 py-1 rounded-full border border-brand-500/20 font-bold uppercase tracking-widest animate-pulse">
                Secure Booking Gateway
              </span>
              <h3 className="text-xl font-bold font-sans tracking-tight">Redirecting to {platform?.platformName || 'Booking Portal'}...</h3>
              <p className="text-xs text-slate-400">Please do not close or reload this window.</p>
            </div>

            <div className="w-full max-w-sm bg-slate-800 rounded-xl p-4 text-left font-sans text-xs space-y-3 border border-slate-700/50">
              <div className="flex items-center gap-3">
                <span className={redirectStep >= 1 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {redirectStep >= 1 ? "✓" : "○"}
                </span>
                <span className={redirectStep >= 1 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  Verifying instant seat availability with operator
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={redirectStep >= 2 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {redirectStep >= 2 ? "✓" : "○"}
                </span>
                <span className={redirectStep >= 2 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  Securing best platform deals and discount codes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={redirectStep >= 3 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {redirectStep >= 3 ? "✓" : "○"}
                </span>
                <span className={redirectStep >= 3 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  Registering secure reservation lock on {platform?.platformName || 'portal'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={redirectStep >= 4 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {redirectStep >= 4 ? "✓" : "○"}
                </span>
                <span className={redirectStep >= 4 ? "text-slate-200 font-medium" : "text-slate-500"}>
                  Redirecting to official secured booking gate...
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Dynamic Navigation Tabs */}
            <div className="bg-slate-50 border-b border-slate-100 p-2 overflow-x-auto flex gap-1 justify-start md:justify-around shrink-0" id="modal-tabs">
          {[
            { id: 'seats', label: 'Seat Matrix & Pricing' },
            { id: 'points', label: 'Boarding/Dropping Points' },
            { id: 'amenities', label: 'Full Amenities List' },
            { id: 'reviews', label: 'Safety & cleanliness reviews' },
            { id: 'policy', label: 'Cancellation refunds' },
            { id: 'share', label: '📢 Viral Share Deal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'seats' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="tab-seats-matrix">
              {/* Left hand interactive seat diagram layout */}
              <div className="md:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Lower Deck Seating Plan</div>
                
                {/* Steering wheel placeholder to indicate front */}
                <div className="w-full max-w-[280px] flex justify-end mb-4 border-b border-slate-200 pb-3">
                  <span className="text-xs font-semibold text-slate-400 bg-slate-200/50 px-2 py-1 rounded flex items-center gap-1">
                    🟢 Driver Cabin
                  </span>
                </div>

                <div className="space-y-4 w-full max-w-[280px]">
                  {/* Rows 1-6 layout representation grid */}
                  {[1, 2, 3, 4, 5, 6].map((row) => {
                    const lSeat = `L${row * 2 - 1}`;
                    const rSeat = `L${row * 2}`;
                    const sideSeat = `W${row}`;
                    return (
                      <div key={row} className="flex justify-between items-center gap-2">
                        {/* Windows Left side */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSeatClick(lSeat)}
                            className={`w-9 h-9 rounded-lg border font-mono text-xs font-bold flex items-center justify-center transition-all ${
                              occupiedSeats.includes(lSeat)
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                                : selectedSeats.includes(lSeat)
                                ? 'bg-brand-600 border-brand-700 text-white shadow-sm'
                                : 'bg-white hover:bg-brand-50 border-slate-200 text-slate-700 hover:text-brand-700'
                            }`}
                          >
                            {lSeat}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSeatClick(rSeat)}
                            className={`w-9 h-9 rounded-lg border font-mono text-xs font-bold flex items-center justify-center transition-all ${
                              occupiedSeats.includes(rSeat)
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                                : selectedSeats.includes(rSeat)
                                ? 'bg-brand-600 border-brand-700 text-white shadow-sm'
                                : 'bg-white hover:bg-brand-50 border-slate-200 text-slate-700 hover:text-brand-700'
                            }`}
                          >
                            {rSeat}
                          </button>
                        </div>

                        {/* Gangway walkway spacer */}
                        <div className="w-8 h-8 rounded border border-dashed border-slate-200 flex items-center justify-center font-bold text-slate-300 select-none text-[10px]">
                          ↕
                        </div>

                        {/* Single window right side */}
                        <button
                          type="button"
                          onClick={() => handleSeatClick(sideSeat)}
                          className={`w-9 h-9 rounded-lg border font-mono text-xs font-bold flex items-center justify-center transition-all ${
                            occupiedSeats.includes(sideSeat)
                              ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                              : selectedSeats.includes(sideSeat)
                              ? 'bg-brand-600 border-brand-700 text-white shadow-sm'
                              : 'bg-white hover:bg-brand-50 border-slate-200 text-slate-700 hover:text-brand-700'
                          }`}
                        >
                          {sideSeat}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Legend indicator blocks */}
                <div className="flex flex-wrap gap-4 mt-8 border-t border-slate-100 pt-5 w-full text-[10px] font-bold text-slate-500 justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded border border-slate-200 bg-white inline-block"></span>
                    Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded border border-brand-700 bg-brand-600 inline-block"></span>
                    Selected
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded border border-slate-300 bg-slate-200 inline-block"></span>
                    Booked
                  </div>
                </div>
              </div>

              {/* Right Side detailed aggregate pricing summary */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm">Booking Fare Calculation</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Listing Operator</span>
                      <span className="font-bold text-slate-800">{listing.busName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Applied Platform</span>
                      <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{platform?.platformName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Departure Time</span>
                      <span className="font-bold text-slate-800">{listing.departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">User Seats Selection</span>
                      <span className="font-bold text-emerald-700 font-mono tracking-wide">{selectedSeats.join(', ') || 'No seats selected'}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 pt-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 block font-bold">Total Payable</span>
                      <p className="text-[10px] text-slate-400 font-semibold">(Inclusive of GST + taxes)</p>
                    </div>
                    <span className="text-2xl font-black text-slate-900 font-mono">₹{finalPaidPrice}</span>
                  </div>
                </div>

                {/* Multipe platform comparisons matrix */}
                <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4.5 h-4.5 text-brand-500" />
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Multi-Platform Fare Beat</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    This active listing is also tracked across other aggregators. Compare alternative portal deals:
                  </p>
                  
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                    {[
                      { site: 'AbhiBus Platform', price: listing.discountedPrice - 20, tag: 'Best price' },
                      { site: 'RedBus Portal', price: listing.discountedPrice, tag: 'Official link' },
                      { site: 'MakeMyTrip Bus', price: listing.discountedPrice + 45, tag: 'Standard' },
                      { site: 'Paytm Transit', price: listing.discountedPrice + 25, tag: 'Zero convenience fee' },
                    ].map((row, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                        <span className="font-semibold text-slate-700">{row.site}</span>
                        <div className="flex items-center gap-2">
                          {row.tag === 'Best price' && (
                            <span className="text-[8px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-1.5 py-0.5 rounded">Beat</span>
                          )}
                          <span className="font-mono font-bold text-slate-800">₹{row.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'points' && (
            <div className="space-y-6" id="tab-points">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Boarding Points timeline */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-rose-100 pb-2 text-rose-600">Boarding Pickups</h4>
                  <div className="space-y-6 relative border-l-2 border-slate-200 mt-2 pl-4">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400"></span>
                      <span className="block text-xs font-bold text-slate-800 font-mono">09:30 PM &bull; Kashmere Gate Metro Exit 4</span>
                      <p className="text-[11px] text-slate-500">Major bus terminal parking, Delhi</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400"></span>
                      <span className="block text-xs font-bold text-slate-800 font-mono">10:15 PM &bull; Anand Vihar ISBT Parking Lot</span>
                      <p className="text-[11px] text-slate-500">Adjacent to metro pillar number 12, Delhi</p>
                    </div>
                  </div>
                </div>

                {/* Dropping points timeline */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl relative space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-emerald-100 pb-2 text-emerald-600">Dropping Terminals</h4>
                  <div className="space-y-6 relative border-l-2 border-slate-200 mt-2 pl-4">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400"></span>
                      <span className="block text-xs font-bold text-slate-800 font-mono">05:50 AM &bull; Alambagh Bus Stand</span>
                      <p className="text-[11px] text-slate-500">UPSRTC Central Depot Platform 5, Lucknow</p>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400"></span>
                      <span className="block text-xs font-bold text-slate-800 font-mono">06:30 AM &bull; Charbagh Railway station road</span>
                      <p className="text-[11px] text-slate-500">Front parking space gate number 2, Lucknow</p>
                    </div>
                  </div>
                </div>

              </div>
              <p className="text-[11px] text-slate-400 font-semibold bg-slate-100 p-3 rounded-lg flex items-start gap-1.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Please report at the boarding boarding points at least 15 minutes before scheduled times. Government ID proof verification may be queried by terminal check-in executives.
              </p>
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="tab-amenities">
              {[
                { label: 'Free Highspeed WiFi', status: true, desc: 'Shared satellite network link' },
                { label: 'Multi-axle suspension', status: true, desc: 'Smooth premium travel ride' },
                { label: 'AC Temperature control', status: true, desc: '22°C standard baseline ambient' },
                { label: 'Complimentary blankets', status: listing.blanket, desc: 'Sterilized and vacuum packed' },
                { label: 'Indivual Reading light', status: true, desc: 'Adjustable light projection dial' },
                { label: 'GPS Live route map', status: listing.liveTracking, desc: 'Real-time telemetry link' },
                { label: 'Type-C USB Charger', status: listing.chargingPort, desc: 'Dual socket charge outlets' },
                { label: 'Bottled Mineral Water', status: listing.waterBottle, desc: 'One 1L chilled bottle per head' },
              ].map((am, i) => (
                <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2 text-left">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-800">{am.label}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${am.status ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">{am.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6" id="tab-reviews">
              {/* Score charts */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { metric: 'Punctuality rate', score: operator?.rating || 4.5, max: '5.0' },
                  { metric: 'Cleanliness standard', score: 4.6, max: '5.0' },
                  { metric: 'Comfort cushion', score: 4.4, max: '5.0' },
                  { metric: 'Safety assessment', score: 4.7, max: '5.0' },
                ].map((spec, i) => (
                  <div key={i} className="space-y-1">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">{spec.metric}</span>
                    <span className="block text-2xl font-black text-slate-800 font-mono">{spec.score}/5</span>
                  </div>
                ))}
              </div>

              {/* Review notes */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Passenger feedback logs</h4>
                <div className="flex flex-col gap-4">
                  {mockReviews.filter(r => r.operatorId === listing.operatorId || r.rating > 3).map((rev) => (
                    <div key={rev.id} className="border-b border-slate-100 pb-4 space-y-2 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <img src={rev.userAvatar} alt={rev.userName} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <span className="font-bold text-slate-800 block">{rev.userName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{rev.createdAt.slice(0, 10)}</span>
                          </div>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded flex items-center gap-0.5 font-mono text-[10px]">
                          ★ {rev.rating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic pl-10">&ldquo;{rev.reviewText}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6" id="tab-policy text-left text-xs text-slate-600">
              <h4 className="font-bold text-slate-900 text-sm text-left">Standard Refund & Cancellation Scale</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="refund-cards">
                {[
                  { buffer: '48 Hrs+ before launch', refund: '100% Refund', speed: 'Within 2 hours', style: 'border-emerald-200 bg-emerald-50/50 text-emerald-800' },
                  { buffer: '24-48 Hrs before launch', refund: '90% Refund', speed: 'Next working cycle', style: 'border-brand-200 bg-brand-50/50 text-brand-800' },
                  { buffer: '2-24 Hrs before launch', refund: '50% Refund', speed: 'Next working cycle', style: 'border-amber-200 bg-amber-50/50 text-amber-800' },
                  { buffer: 'Under 2 Hrs from departure', refund: 'No Refund', speed: 'Void ticket status', style: 'border-rose-200 bg-rose-50/50 text-rose-800' },
                ].map((pol, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between text-left space-y-2 ${pol.style}`}>
                    <span className="font-bold block text-slate-900 text-xs">{pol.buffer}</span>
                    <div>
                      <span className="text-lg font-black block font-mono">{pol.refund}</span>
                      <p className="text-[10px] text-slate-500 font-medium">Payout speed: {pol.speed}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed text-left">
                <strong>Refund Terms:</strong> Transaction process fees charged by banking partners or wallet operators are non-refundable. All cancellations executed inside the BusLens dashboard are synchronized instantly across RedBus and AbhiBus databases using real-time REST gateways.
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-6 text-left" id="tab-share-deal">
              <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800">
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-md border border-emerald-500/20 tracking-wider">
                    Dynamic OpenGraph Card Previews
                  </span>
                  <h3 className="text-lg font-black tracking-tight leading-snug">
                    {sourceCity || 'Delhi'} ➔ {destinationCity || 'Jaipur'} Bus Tickets starting from ₹{listing.discountedPrice}!
                  </h3>
                  <p className="text-xs text-slate-405 font-medium">
                    Verified sleeper schedule and real-time lowest fare compared on BusLens. Save up to {Math.round(((listing.originalPrice - listing.discountedPrice)/listing.originalPrice)*100)}% on in-app checkouts!
                  </p>
                  <div className="pt-2 text-[10px] text-slate-500 font-bold font-mono">
                    URL: https://buslens.org/bus/{(sourceCity || 'delhi').toLowerCase()}-to-{(destinationCity || 'jaipur').toLowerCase()}
                  </div>
                </div>
                
                {/* Visual Preview Box */}
                <div className="w-full md:w-48 h-28 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-4 flex flex-col justify-between shrink-0 border border-slate-800 text-slate-100 select-none shadow-xl">
                  <span className="text-[10px] font-black uppercase text-blue-400">BusLens Live</span>
                  <div>
                    <span className="block font-black text-xs leading-none">{sourceCity || 'Delhi'} ➔ {destinationCity || 'Jaipur'}</span>
                    <span className="block text-[9px] text-slate-400 mt-1 font-mono">Comparing redBus, Paytm, MMT</span>
                  </div>
                  <span className="text-lg font-black font-mono">₹{listing.discountedPrice}</span>
                </div>
              </div>

              {/* Share networks array */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'WhatsApp', color: 'bg-[#25D366] hover:bg-[#20ba56]', label: 'WhatsApp direct', trigger: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${sourceCity || 'Delhi'} to ${destinationCity || 'Jaipur'} bus tickets starting at ₹${listing.discountedPrice} compared on BusLens! Get lowest fares here: https://buslens.org/bus/${(sourceCity || 'Delhi').toLowerCase()}-to-${(destinationCity || 'Jaipur').toLowerCase()}`)}`, '_blank') },
                  { name: 'Twitter / X', color: 'bg-black hover:bg-slate-900', label: 'X (Twitter)', trigger: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${sourceCity || 'Delhi'} to ${destinationCity || 'Jaipur'} tickets from ₹${listing.discountedPrice} on BusLens!`)}`, '_blank') },
                  { name: 'Telegram', color: 'bg-[#0088cc] hover:bg-[#0077b3]', label: 'Telegram channel', trigger: () => window.open(`https://t.me/share/url?url=https://buslens.org&text=${encodeURIComponent(`${sourceCity || 'Delhi'} to ${destinationCity || 'Jaipur'} tickets starting at ₹${listing.discountedPrice} compared!`)}`, '_blank') },
                  { name: 'Copy Link', color: 'bg-slate-700 hover:bg-slate-800', label: linkCopied ? 'Copied Link! ✓' : 'Copy Link', trigger: () => {
                    navigator.clipboard.writeText(`https://buslens.org/bus/${(sourceCity || 'Delhi').toLowerCase()}-to-${(destinationCity || 'Jaipur').toLowerCase()}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2500);
                  }}
                ].map((network, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={network.trigger}
                    className={`${network.color} text-white font-extrabold text-xs py-3.5 rounded-2xl transition shadow-md duration-150 cursor-pointer flex flex-col items-center justify-center gap-1.5`}
                  >
                    <span className="font-black text-[11px]">{network.name}</span>
                    <span className="text-[9px] opacity-80 font-medium">{network.label}</span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal text-left">
                🚀 Pro-tip: Share this comparative view with co-travelers to lock on the matching seat matrix synchronously before operator prices float up.
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="text-center sm:text-left text-xs">
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Active Reservation Selection</span>
            <span className="text-[11px] text-slate-600 font-bold">
              {selectedSeats.length > 0 ? `${selectedSeats.length} Seats of ${passengers} booked successfully.` : `No seats selected. Passenger capacity is ${passengers} Seats`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="text-[10px] text-slate-500 bg-slate-100/80 border border-slate-200/60 px-3 py-2 rounded-xl font-medium flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Verified Direct Routing</span>
            </div>

            <button
              onClick={triggerRedirection}
              className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg border border-brand-700/20 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Confirm Seats & Lock ₹{finalPaidPrice} Deal
            </button>
          </div>
        </div>
      </>
    )}

      </div>
    </div>
  );
}
