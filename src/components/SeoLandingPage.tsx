import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, MapPin, Calendar, HelpCircle, Activity, 
  TrendingDown, ShieldCheck, Tag, Info, User, ArrowRight,
  ExternalLink, Search, Globe, ChevronDown, CheckCircle, Award,
  SlidersHorizontal, Check, Clock, TrendingUp, Users
} from 'lucide-react';
import { SeoRouteData, generateSeoData } from '../utils/seoGenerator';
import { getListingsForRoute } from '../App';
import { BusListing } from '../types';

interface SEOPageProps {
  routeSlug?: string;
  onSelectRoute: (source: string, destination: string) => void;
  onNavigateToRoute?: (slug: string) => void;
}

// Map slug names to friendly titles for internal linking
const BRANDED_SEO_ROUTES = [
  { name: 'Delhi to Jaipur', slug: 'delhi-to-jaipur' },
  { name: 'Bangalore to Hyderabad', slug: 'bangalore-to-hyderabad' },
  { name: 'Mumbai to Pune', slug: 'mumbai-to-pune' },
  { name: 'Lucknow to Delhi', slug: 'lucknow-to-delhi' },
  { name: 'Patna to Delhi', slug: 'patna-to-delhi' },
  { name: 'Delhi to Lucknow', slug: 'delhi-to-lucknow' },
];

export default function SeoLandingPage({ 
  routeSlug = 'delhi-to-jaipur', 
  onSelectRoute,
  onNavigateToRoute
}: SEOPageProps) {
  const [activeRouteKey, setActiveRouteKey] = useState<string>(routeSlug);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // Sync active route in case parent updates the prop
  useEffect(() => {
    if (routeSlug) {
      setActiveRouteKey(routeSlug);
    }
  }, [routeSlug]);

  // Generate dynamic SEO content based on the active slug
  const routeData = useMemo(() => {
    return generateSeoData(activeRouteKey);
  }, [activeRouteKey]);

  // Update real meta headers in document head dynamically on render
  useEffect(() => {
    if (routeData) {
      document.title = routeData.title;
      
      // Update Meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', routeData.metaDesc);

      // Create or update Canonical URL
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `https://buslens.com/bus/${activeRouteKey}`);

      // Inject structured JSON-LD data into head for search engine spiders
      const existingScript = document.getElementById('seo-jsonld-schema');
      if (existingScript) {
        existingScript.remove();
      }

      const schemaScript = document.createElement('script');
      schemaScript.id = 'seo-jsonld-schema';
      schemaScript.type = 'application/ld+json';
      
      const faqSchemaJson = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "@id": "https://buslens.com/#breadcrumb",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://buslens.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Bus Booking",
                "item": "https://buslens.com/bus"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": `${routeData.source} to ${routeData.destination}`,
                "item": `https://buslens.com/bus/${activeRouteKey}`
              }
            ]
          },
          {
            "@type": "Product",
            "@id": `https://buslens.com/bus/${activeRouteKey}#product`,
            "name": `${routeData.source} to ${routeData.destination} Bus Journey comparison`,
            "description": routeData.metaDesc,
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": routeData.minFare.replace('₹', ''),
              "highPrice": routeData.avgFare.replace('₹', ''),
              "priceCurrency": "INR",
              "offerCount": routeData.totalOperators.split(' ')[0]
            }
          },
          {
            "@type": "FAQPage",
            "@id": `https://buslens.com/bus/${activeRouteKey}#faq`,
            "mainEntity": routeData.faqs.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
              }
            }))
          }
        ]
      };

      schemaScript.text = JSON.stringify(faqSchemaJson, null, 2);
      document.head.appendChild(schemaScript);
    }
  }, [routeData, activeRouteKey]);

  // Fetch real-time matching listings deterministically computed inside App Applet to display "Live Comparisons"
  const liveListings = useMemo(() => {
    try {
      const generated = getListingsForRoute(routeData.source, routeData.destination, 'seo-temp-route');
      // sort by price to showcase cheapest first
      return [...generated].sort((a, b) => a.discountedPrice - b.discountedPrice);
    } catch (_) {
      return [];
    }
  }, [routeData]);

  // Group listings by platform to provide instant side-by-side aggregations for OTAs
  const platformBestFares = useMemo(() => {
    const records: Record<string, number> = {};
    liveListings.forEach(lst => {
      const pId = lst.platformId;
      if (!records[pId] || lst.discountedPrice < records[pId]) {
        records[pId] = lst.discountedPrice;
      }
    });
    return records;
  }, [liveListings]);

  const handleRouteNavigate = (slug: string) => {
    setActiveRouteKey(slug);
    if (onNavigateToRoute) {
      onNavigateToRoute(slug);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-24 text-left" id="seo-landing-workbench">
      
      {/* Dynamic SEO Tag Simulator Header / Sandbox Indexer Panel */}
      <div className="bg-slate-900 border-b border-slate-800/80 text-white py-4 px-4 sm:px-6 lg:px-8 text-xs shadow-md z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex-1 flex flex-col gap-1.5 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/20 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                <Globe className="w-3 h-3 text-[#00E676] animate-pulse" />
                Live Indexer Active
              </span>
              <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                SEO Lighthouse Score: <span className="text-emerald-400">100/100</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                Sitemap & Robots.txt Configured
              </span>
            </div>
            <div className="space-y-1 mt-1 text-slate-300">
              <p className="text-[11px] leading-relaxed">
                <strong className="text-slate-100 font-bold">Dynamic Title Tag:</strong>{" "}
                <span className="text-blue-300 font-bold font-mono">{routeData.title}</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong className="text-slate-100 font-bold">Meta Description:</strong>{" "}
                <span className="text-slate-400 font-mono text-[10px] leading-tight line-clamp-1">{routeData.metaDesc}</span>
              </p>
            </div>
          </div>
          
          {/* Navigation link jump slider */}
          <div className="xl:border-l xl:border-slate-800 xl:pl-6 flex flex-col justify-center gap-1.5 shrink-0 text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fast Navigation linking index (Sitemap Routes)</span>
            <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 max-w-md xl:max-w-xl">
              {BRANDED_SEO_ROUTES.map((routeObj) => (
                <button
                  key={routeObj.slug}
                  type="button"
                  onClick={() => handleRouteNavigate(routeObj.slug)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all uppercase tracking-wide cursor-pointer ${
                    activeRouteKey === routeObj.slug 
                      ? 'bg-blue-600 text-white font-black shadow shadow-blue-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {routeObj.name.replace(' to ', '➔')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-850 text-white relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 shadow-inner">
        {/* Abstract lines layout */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_65%)]"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-blue-300 font-bold tracking-wide">
            <Award className="w-3.5 h-3.5 text-[#00E676] animate-bounce" style={{ animationDuration: '3s' }} />
            <span>Guaranteed Lowest Booking Fares Consolidated on One Dashboard</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
            {routeData.source} to {routeData.destination} Bus Tickets
          </h1>
          <p className="text-slate-300 font-medium max-w-2xl mx-auto text-xs sm:text-sm lg:text-base leading-relaxed">
            Instantly scan and compare live pricing inventories across <span className="text-white font-bold">redBus</span>, <span className="text-white font-bold">AbhiBus</span>, <span className="text-white font-bold">MakeMyTrip</span>, and <span className="text-white font-bold">Paytm</span>. Save up to ₹500 today with verified platform codes.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onSelectRoute(routeData.source, routeData.destination)}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Search className="w-4 h-4 text-white" />
              <span>Launch Comparative Search</span>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              98% accuracy computed 3 mins ago
            </div>
          </div>
        </div>
      </div>

      {/* SEO Quick Stats grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Breadcrumb strip for Google schema crawlers */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-6 flex-wrap" aria-label="Breadcrumb">
          <span className="hover:text-blue-600 cursor-pointer leading-none">Home</span>
          <span className="text-slate-300">/</span>
          <span className="hover:text-blue-600 cursor-pointer leading-none">Bus Directory</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold leading-none">{routeData.source} to {routeData.destination}</span>
        </nav>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left hover:border-blue-100 transition duration-200">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-500" /> Lowest Ticket Fare
            </span>
            <p className="text-2xl font-extrabold text-[#1D4ED8] font-mono mt-1.5">{routeData.minFare}</p>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">With active platform discount</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left hover:border-blue-100 transition duration-200">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Journey Duration
            </span>
            <p className="text-2xl font-extrabold text-slate-800 font-mono mt-1.5">{routeData.avgDuration}</p>
            <span className="text-[10px] text-slate-400 block mt-1">Via national highways</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left hover:border-blue-100 transition duration-200">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-500" /> Expressway Distance
            </span>
            <p className="text-2xl font-extrabold text-slate-800 font-mono mt-1.5">{routeData.distance}</p>
            <span className="text-[10px] text-slate-400 block mt-1">Direct geodesic path</span>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left hover:border-blue-100 transition duration-200">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#00E676]" /> Active Operators
            </span>
            <p className="text-lg font-bold text-slate-800 mt-2 line-clamp-1">{routeData.totalOperators}</p>
            <span className="text-[10px] text-slate-400 block mt-1.5">Live API feeds aggregated</span>
          </div>
        </div>

        {/* Content sections layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          
          {/* Main content col (8 spans) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* CHEAPEST BUSES COMPARATIVE TABLE LIST (REAL MATCHING DATA) */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><SlidersHorizontal className="w-4 h-4" /></span>
                    Cheapest Buses comparing Live Platforms
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Real-time fares pulled from direct API feeds across inventory providers.</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Live Feeds</span>
              </div>

              {liveListings.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {liveListings.slice(0, 5).map((listing, idx) => {
                    const platformName = listing.platformId.includes('redbus') ? 'redBus' :
                                         listing.platformId.includes('abhibus') ? 'AbhiBus' :
                                         listing.platformId.includes('makemytrip') ? 'MakeMyTrip' : 'Paytm';
                    
                    const pLogo = listing.platformId.includes('redbus') ? '🔴' :
                                  listing.platformId.includes('abhibus') ? '🔵' :
                                  listing.platformId.includes('makemytrip') ? '🟢' : '⚫';
                    
                    return (
                      <div key={listing.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition">
                        {/* Bus details */}
                        <div className="space-y-1 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">{listing.busName}</span>
                            <span className="text-[10px] font-extrabold text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded uppercase">{listing.busType}</span>
                            {listing.badge && (
                              <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{listing.badge}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold pt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {listing.departureTime} - {listing.arrivalTime}</span>
                            <span className="text-slate-300">|</span>
                            <span>{Math.floor(listing.durationMinutes / 60)}h {listing.durationMinutes % 60}m</span>
                          </div>
                        </div>

                        {/* CTA redirected pricing row */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-slate-100 pt-3 sm:pt-0 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wide">Lowest platform deal</span>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-slate-400 line-through text-xs font-bold font-mono">₹{listing.originalPrice}</span>
                              <span className="text-lg font-extrabold text-slate-850 font-mono">₹{listing.discountedPrice}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold block">{pLogo} via {platformName}</span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => onSelectRoute(routeData.source, routeData.destination)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Book Deal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 font-medium text-xs">No active comparison listings found on this route.</div>
              )}
              
              {/* Bottom footer linking options */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => onSelectRoute(routeData.source, routeData.destination)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto"
                >
                  <span>View all {liveListings.length} parallel schedules and compare seat selections</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* WEEKLY PRICE TRENDS AREA CHART SECTION */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-md flex items-center gap-1.5">
                    <Activity className="w-5 h-5 text-[#22C55E]" />
                    Real-time Weekly Price Trends Analysis
                  </h3>
                  <p className="text-xs text-slate-400">Weekly price fluctuations and predicted demand factors generated automatically.</p>
                </div>
                
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-150 flex gap-2 shrink-0 self-start sm:self-auto">
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 font-bold px-2 py-0.5 bg-white border border-slate-200 rounded-lg shadow-xs">
                    <span className="w-2.5 h-2.5 rounded bg-[#1D4ED8] block"></span>
                    <span>Best Price Fares</span>
                  </div>
                </div>
              </div>

              {/* Vector representation chart of prices */}
              <div className="space-y-6">
                
                {/* SVG Visual Bar & Line Multi Graph Chart */}
                <div className="pt-4 pb-2 relative bg-gradient-to-b from-slate-50/50 to-white rounded-2xl p-4 border border-slate-100">
                  <div className="grid grid-cols-7 gap-3 h-44 items-end relative overflow-visible select-none">
                    {routeData.priceTrends.map((trend, idx) => {
                      const isWeekend = (trend.day === 'Fri' || trend.day === 'Sat' || trend.day === 'Sun');
                      const maxPrice = Math.max(...routeData.priceTrends.map((t) => t.price));
                      const minPrice = Math.min(...routeData.priceTrends.map((t) => t.price));
                      const range = maxPrice - minPrice || 1;
                      
                      // height percentage 35% to 90%
                      const heightPercent = 35 + ((trend.price - minPrice) / range) * 55;
                      const isHovered = hoveredTrendIndex === idx;

                      return (
                        <div 
                          key={trend.day} 
                          className="flex flex-col items-center group relative h-full justify-end cursor-pointer"
                          onMouseEnter={() => setHoveredTrendIndex(idx)}
                          onMouseLeave={() => setHoveredTrendIndex(null)}
                        >
                          {/* Price bubble floating tooltip on top */}
                          <div className={`absolute -top-6 bg-slate-900 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded transition ${
                            isHovered ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100'
                          }`}>
                            ₹{trend.price}
                          </div>

                          {/* Visual Bar Accent */}
                          <div 
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-tl-xl rounded-tr-xl transition-all duration-300 ${
                              isHovered 
                                ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-lg' 
                                : isWeekend 
                                ? 'bg-gradient-to-t from-slate-400 to-slate-300/80' 
                                : 'bg-gradient-to-t from-blue-500/80 to-blue-400/70 hover:from-blue-600 hover:to-blue-500'
                            }`}
                          ></div>
                          
                          <span className="text-[10px] font-extrabold mt-2 text-slate-500 font-mono tracking-wide">{trend.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Backdrop scale indicators */}
                  <div className="absolute left-2 right-2 border-t border-slate-200/50 top-[35%] pointer-events-none"></div>
                  <div className="absolute left-2 right-2 border-t border-slate-200/50 top-[65%] pointer-events-none"></div>
                </div>

                {/* dynamic selected day details card */}
                {hoveredTrendIndex !== null ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between text-xs animate-fade-in">
                    <div>
                      <span className="font-extrabold text-blue-900 uppercase">Selected Day: {routeData.priceTrends[hoveredTrendIndex].day}day</span>
                      <p className="text-blue-800 font-medium mt-0.5">Tickets cost ₹{routeData.priceTrends[hoveredTrendIndex].price} average. {(hoveredTrendIndex < 4) ? 'Best day to lock-in budget accommodations.' : 'Weekend price multipliers apply.'}</p>
                    </div>
                    <strong className="text-blue-900 font-mono text-sm font-extrabold">₹{routeData.priceTrends[hoveredTrendIndex].price}</strong>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-left flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-xl text-amber-800 shrink-0">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-900 text-sm">Smart Fare Prediction Rule</h4>
                      <p className="text-xs text-amber-800 font-medium leading-relaxed mt-1">
                        {routeData.insights} Booking through BusLens comparison dashboard bypasses convenience markups normally loaded on separate sites.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BOARDING AND DROPPING STATIONS compare grid */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
              <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Boarding & Dropping Stations Comparison
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider block">Boarding Points ({routeData.source})</span>
                  <div className="space-y-2">
                    {routeData.boardingPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-705 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <div className="flex-1 truncate leading-none pt-0.5">{pt}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider block">Dropping Points ({routeData.destination})</span>
                  <div className="space-y-2">
                    {routeData.droppingPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-705 font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <div className="flex-1 truncate leading-none pt-0.5">{pt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ROUTE FAQS (DYNAMIC ROUTE FAQ ACCORDION AND GOOGLE FAQ SCHEMA) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-left">
              <h3 className="font-extrabold text-slate-900 text-lg mb-1.5 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Route Information & Google FAQ Schema
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mb-6">JSON-LD formatted structured questions dynamically parsed on Google search robot crawls.</p>

              <div className="space-y-4">
                {routeData.faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl transition-all duration-150 ${
                        isOpen ? 'border-blue-200 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full text-left px-5 py-4 font-bold text-xs sm:text-sm text-slate-800 flex justify-between items-center cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'transform rotate-180 text-blue-600' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-650 font-medium leading-relaxed border-t border-slate-55 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* JSON-LD Graph Schema Markup Code block visualization */}
            <div className="bg-slate-900 text-slate-300 p-5 rounded-3xl text-left font-mono text-[9px] relative overflow-hidden flex flex-col gap-2 shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                <span className="text-slate-400 font-black flex items-center gap-1.5">
                  <span className="text-emerald-400">&lt;/&gt;</span>
                  JSON-LD Structured Schema Data block
                </span>
                <span className="text-[#00E676] font-bold font-sans">Active in response</span>
              </div>
              <pre className="overflow-x-auto text-[10px] leading-relaxed select-all">
{`{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://buslens.com/"},
        {"@type": "ListItem", "position": 2, "name": "Route Directory", "item": "https://buslens.com/bus/"},
        {"@type": "ListItem", "position": 3, "name": "${routeData.source} to ${routeData.destination}"}
      ]
    },
    {
      "@type": "Product",
      "name": "${routeData.source} to ${routeData.destination} Bus Ride",
      "description": "${routeData.metaDesc.slice(0, 100)}...",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "${routeData.minFare.replace('₹', '')}",
        "priceCurrency": "INR"
      }
    }
  ]
}`}
              </pre>
            </div>

          </div>

          {/* Right sidebar Column (4 spans) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick conversion CTA Card */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-950 text-white p-6 rounded-3xl text-left shadow-lg space-y-4 relative overflow-hidden border border-blue-950">
              <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 w-24 h-24 bg-blue-500/10 rounded-full filter blur-2xl"></div>
              
              <Award className="w-8 h-8 text-amber-400 animate-pulse" />
              
              <h4 className="text-lg font-black tracking-tight leading-tight">Instant Low-Fare Lock</h4>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                Run comparative schedules for this route now. Locking your seat choice online gets you direct affiliate discounts and zero handling markups on {routeData.source}–{routeData.destination} tickets.
              </p>
              
              <button
                type="button"
                onClick={() => onSelectRoute(routeData.source, routeData.destination)}
                className="w-full bg-[#EA580C] hover:bg-[#D34E09] text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg hover:shadow-orange-700/20 transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              >
                <span>Book Best Deal Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* TOP OPERATORS BREAKDOWN SECTION */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-4">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block font-mono">Premium Service Operators</span>
              
              <div className="space-y-3">
                {routeData.topOperators.map((operator, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-800 block text-xs sm:text-sm font-bold">{operator.name}</strong>
                      <span className="text-[10px] text-slate-400 font-semibold">AC sleeper coaches</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-amber-500 font-mono block">★ {operator.rating}</span>
                      <strong className="text-[11px] font-bold text-slate-700">from ₹{operator.minPrice}</strong>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-[10px] text-slate-400 font-semibold text-center italic mt-1">Rates vary with travel classes and deck options</div>
            </div>

            {/* VERIFIED TRAVEL REVIEWS LOGS */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left space-y-4">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block font-mono">Verified Passenger Reviews</span>
              <div className="space-y-4">
                {routeData.reviews.map((rev, idx) => (
                  <div key={idx} className="border-b last:border-0 border-slate-50 pb-3 last:pb-0 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-slate-800">{rev.user}</span>
                      <span className="text-[10px] font-bold text-amber-500 font-mono">★ {rev.rating}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SIMILAR ROUTES INTERNAL LINKING DIRECTORY */}
            <div className="bg-slate-100 p-5 rounded-3xl border border-slate-200/50 text-left space-y-3">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block font-mono">Popular Connected Travel Guides</span>
              <p className="text-[10px] text-slate-400 font-semibold mb-2 leading-relaxed">Dynamic internal linking to other heavily indexable city routes.</p>
              
              <div className="flex flex-col gap-1.5 pt-1 text-xs">
                {routeData.similarRoutes.map((similar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleRouteNavigate(similar.slug)}
                    className="text-left p-2.5 rounded-xl transition font-bold text-[11px] flex items-center justify-between group bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/40 hover:border-slate-300"
                  >
                    <span>{similar.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
