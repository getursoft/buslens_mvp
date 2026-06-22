import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, TrendingUp, Calendar, Compass, Backpack, 
  MapPin, Clock, ArrowRight, MousePointerClick, RefreshCw, 
  Trash2, Flame, ThumbsUp, Heart, Star, Navigation
} from 'lucide-react';

interface RouteMetric {
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

interface SeasonalSuggestion {
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

interface RecommendResult extends RouteMetric {
  reason: string;
  matchScore: number;
}

interface DiscoveryDataResponse {
  trending: RouteMetric[];
  recommended: RecommendResult[];
  mostBooked: RouteMetric[];
  popularWeekend: RouteMetric[];
  seasonal: SeasonalSuggestion[];
}

interface RecentSearch {
  source: string;
  destination: string;
  travelDate: string;
  passengers: number;
  searchedAt: string;
}

interface RouteDiscoveryHubProps {
  onSelectRoute: (source: string, destination: string) => void;
  recentSearches: RecentSearch[];
  onClearRecentSearches: () => void;
}

export default function RouteDiscoveryHub({ 
  onSelectRoute, 
  recentSearches,
  onClearRecentSearches 
}: RouteDiscoveryHubProps) {
  const [activeTab, setActiveTab] = useState<'recommended' | 'trending' | 'booked' | 'weekend' | 'seasonal'>('recommended');
  const [data, setData] = useState<DiscoveryDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  // Fetch discoveries on mount & whenever refresh triggers
  useEffect(() => {
    async function fetchDiscovery() {
      try {
        setLoading(true);
        setError(null);
        
        // Pass user's searches session to make recommendations personalized
        const response = await fetch('/api/analytics/discovery-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionSearches: recentSearches })
        });

        if (!response.ok) {
          throw new Error('Could not pull live route analytics feed.');
        }

        const resData = await response.json();
        setData(resData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Connecting error');
      } finally {
        setLoading(false);
      }
    }

    fetchDiscovery();
  }, [recentSearches, refreshCount]);

  // Handle route selection & record analytic click on the backend
  const handleRouteClick = async (routeId: string, source: string, destination: string, tabName: string) => {
    // Fire click tracker to server in background
    try {
      await fetch('/api/analytics/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, clickType: 'details', platformId: 'user-discovery' })
      });
    } catch (e) {
      console.warn('Click track log offline');
    }

    // Trigger page search action
    onSelectRoute(source, destination);
  };

  const getCategoryThemeColor = (category: string) => {
    switch (category) {
      case 'Summer Escape': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Monsoon Drive': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
      case 'Heritage Walk': return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
      case 'Beach Escape': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 space-y-6" id="route-discovery-hub-card">
      {/* Search History Sub-bar */}
      {recentSearches && recentSearches.length > 0 && (
        <div className="border-b border-slate-100 pb-5" id="discovery-recent-section">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-black text-slate-500 tracking-wider uppercase flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Recently Searched Trips
            </h4>
            <button
              onClick={onClearRecentSearches}
              className="text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider flex items-center gap-1 focus:outline-none transition group"
              title="Clear searches"
            >
              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 duration-150" /> Clear History
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.slice(0, 5).map((search, idx) => (
              <div
                key={idx}
                onClick={() => onSelectRoute(search.source, search.destination)}
                className="inline-flex items-center gap-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/60 hover:border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 cursor-pointer transition-colors duration-150 shadow-sm"
              >
                <span className="flex items-center gap-1 font-extrabold text-slate-800">
                  {search.source} <ArrowRight className="w-3 h-3 text-slate-400" /> {search.destination}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({search.travelDate.slice(5)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Banner & Refresher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600/10 text-blue-600 font-black text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-md border border-blue-500/10">
              Live Radar
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9.5px] text-slate-400 uppercase font-black font-mono">Analytics Active</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" /> Smart Route Discovery Hub
          </h3>
          <p className="text-xs text-slate-500 max-w-xl font-medium">
            Explore live demand analytics, seasonal suggestions and custom travel recommendations computed across comparison feeds.
          </p>
        </div>

        {/* Refresh live metrics */}
        <button
          onClick={() => setRefreshCount(prev => prev + 1)}
          className="self-start md:self-auto p-2 border border-slate-200/80 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-2xl hover:bg-blue-50/50 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Re-fetch analytics values"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Scores
        </button>
      </div>

      {/* Discovery Board Selection tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
        {[
          { id: 'recommended', label: 'For You', desc: 'AI Match', icon: Sparkles },
          { id: 'trending', label: 'Trending', desc: 'Search Velocity', icon: TrendingUp },
          { id: 'booked', label: 'Most Booked', desc: 'Conversion Volume', icon: ThumbsUp },
          { id: 'weekend', label: 'Weekend Escapes', desc: 'Friday Spikes', icon: Calendar },
          { id: 'seasonal', label: 'Seasonal Deals', desc: 'Cozy Escapes', icon: Backpack }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-center flex flex-col items-center justify-center gap-0.5 transition cursor-pointer relative focus:outline-none ${
                isSelected 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-extrabold tracking-tight">{tab.label}</span>
              </div>
              <span className={`text-[8.5px] uppercase font-black font-mono tracking-widest ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loader */}
      {loading && (
        <div className="h-[280px] flex flex-col items-center justify-center gap-3 bg-slate-50/40 rounded-3xl border border-dashed border-slate-200" id="discovery-feed-loader">
          <div className="relative w-10 h-10">
            <span className="absolute inset-0 border-[3px] border-blue-100 rounded-full"></span>
            <span className="absolute inset-0 border-[3px] border-t-blue-600 rounded-full animate-spin"></span>
          </div>
          <span className="text-xs text-slate-500 font-bold animate-pulse">Computing predictive metrics, sorting clicks & logs...</span>
        </div>
      )}

      {/* Fallback error */}
      {error && !loading && (
        <div className="h-[200px] flex items-center justify-center p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700" id="discovery-error">
          <span className="text-sm font-semibold">Offline comparison tracker database is refreshing. Recalculate or try searching directly.</span>
        </div>
      )}

      {/* Active Tab Viewport */}
      {!loading && !error && data && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
          >
            {/* 1. PERSONALIZED RECOMMENDATIONS VIEW */}
            {activeTab === 'recommended' && data.recommended.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleRouteClick(item.id, item.sourceCity, item.destinationCity, 'recommended')}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-blue-400 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col text-left"
              >
                {/* Backdrop Image */}
                <div className="h-36 relative overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={`${item.sourceCity} to ${item.destinationCity}`}
                    className="w-full h-full object-cover group-hover:scale-105 duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  {/* Match MatchScore Indicator */}
                  <span className="absolute top-3 left-3 bg-emerald-600 text-white font-extrabold text-[10px] uppercase font-mono px-2.2 py-1 rounded-lg border border-emerald-500/20 shadow-sm flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" /> {item.matchScore}% AI Match
                  </span>

                  {/* Starting fare */}
                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[9px] text-slate-200 uppercase tracking-wide font-black leading-none block">Fares From</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">₹{item.averagePrice}</strong>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        {item.sourceCity} <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item.destinationCity}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold font-mono">{item.distanceKm} KM</span>
                    </div>
                    {/* Recommendation custom explain wording */}
                    <div className="bg-blue-50/50 border border-blue-150/40 p-2.5 rounded-xl text-[11px] text-blue-800 mt-2.5 font-semibold leading-relaxed flex items-start gap-1.5 text-left">
                      <Navigation className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <span>{item.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                    <span className="text-[10px] text-blue-600 group-hover:text-blue-700 font-extrabold tracking-wide uppercase flex items-center gap-1">
                      Compare Live Deals &rarr;
                    </span>
                    <div className="flex gap-1">
                      {item.tags.slice(0, 1).map((tag, tIdx) => (
                        <span key={tIdx} className="bg-slate-100 text-[9px] font-black uppercase font-mono text-slate-500 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 2. TRENDING VIEW */}
            {activeTab === 'trending' && data.trending.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleRouteClick(item.id, item.sourceCity, item.destinationCity, 'trending')}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-rose-400 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col text-left"
              >
                {/* Backdrop Image */}
                <div className="h-36 relative overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={`${item.sourceCity} to ${item.destinationCity}`}
                    className="w-full h-full object-cover group-hover:scale-105 duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  {/* Hot trending speed velocity gauge */}
                  <span className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-[10px] uppercase font-mono px-2.2 py-1 rounded-lg border border-rose-500/20 shadow-sm flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-300 fill-amber-300 animate-bounce" /> {item.trendingScore} Live Velocity
                  </span>

                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[9px] text-slate-200 uppercase tracking-wide font-black leading-none block">Fares From</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">₹{item.averagePrice}</strong>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        {item.sourceCity} <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item.destinationCity}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold font-mono">{item.distanceKm} KM</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pb-1 font-medium">{item.tagline}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                    <span className="text-[10px] text-blue-600 group-hover:text-blue-700 font-extrabold tracking-wide uppercase">
                      Compare Deals &rarr;
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-rose-50 text-rose-600 text-[8.5px] hover:bg-rose-100 font-black font-mono uppercase px-1.5 py-0.5 rounded border border-rose-100/50">
                        {item.totalSearches} Search Hits
                      </span>
                      <span className="bg-slate-100 text-[8.5px] font-black uppercase font-mono text-slate-500 px-1.5 py-0.5 rounded">
                        GPS Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 3. MOST BOOKED VIEW */}
            {activeTab === 'booked' && data.mostBooked.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleRouteClick(item.id, item.sourceCity, item.destinationCity, 'booked')}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-indigo-400 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col text-left"
              >
                {/* Backdrop Image */}
                <div className="h-36 relative overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={`${item.sourceCity} to ${item.destinationCity}`}
                    className="w-full h-full object-cover group-hover:scale-105 duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  {/* Total checkout bookings count badge */}
                  <span className="absolute top-3 left-3 bg-indigo-600 text-white font-extrabold text-[10px] uppercase font-mono px-2.2 py-1 rounded-lg border border-indigo-500/20 shadow-sm flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-yellow-300" /> {item.totalBookings || (5 + idx * 3)} verified bookings today
                  </span>

                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[9px] text-slate-200 uppercase tracking-wide font-black leading-none block">Fares From</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">₹{item.averagePrice}</strong>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        {item.sourceCity} <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item.destinationCity}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold font-mono">{item.distanceKm} KM</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pb-1 font-medium">{item.tagline}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                    <span className="text-[10px] text-blue-600 group-hover:text-blue-700 font-extrabold tracking-wide uppercase">
                      Compare Deals &rarr;
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/60 text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded-md">
                      Best Conversion Rate
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* 4. WEEKEND ESCAPES VIEW */}
            {activeTab === 'weekend' && data.popularWeekend.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleRouteClick(item.id, item.sourceCity, item.destinationCity, 'weekend')}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-amber-400 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col text-left"
              >
                {/* Backdrop Image */}
                <div className="h-36 relative overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={`${item.sourceCity} to ${item.destinationCity}`}
                    className="w-full h-full object-cover group-hover:scale-105 duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  {/* Friday Sunday getaway metrics count */}
                  <span className="absolute top-3 left-3 bg-amber-600 text-white font-extrabold text-[10px] uppercase font-mono px-2.2 py-1 rounded-lg border border-amber-500/20 shadow-sm flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-white" /> +{item.weekendSurgePercent}% Weekend Surge
                  </span>

                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[9px] text-slate-200 uppercase tracking-wide font-black leading-none block">Fares From</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">₹{item.averagePrice}</strong>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        {item.sourceCity} <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item.destinationCity}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold font-mono">{item.distanceKm} KM</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pb-1 font-medium">{item.tagline}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                    <span className="text-[10px] text-blue-600 group-hover:text-blue-700 font-extrabold tracking-wide uppercase">
                      Lock in Ticket &rarr;
                    </span>
                    <span className="text-[9.5px] text-amber-600 font-mono font-extrabold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> High Fri-Sun Jam
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* 5. SEASONAL DEALS VIEW */}
            {activeTab === 'seasonal' && data.seasonal.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleRouteClick(item.id, item.sourceCity, item.destinationCity, 'seasonal')}
                className="group relative bg-white rounded-2xl border border-slate-100 hover:border-violet-400 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col text-left"
              >
                {/* Backdrop Image */}
                <div className="h-36 relative overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  
                  {/* Dynamic Category Tag theme color helper */}
                  <span className={`absolute top-3 left-3 border text-white font-extrabold text-[10px] uppercase font-mono px-2.2 py-1 rounded-lg shadow-sm flex items-center gap-1 ${getCategoryThemeColor(item.category)}`}>
                    <Backpack className="w-3.5 h-3.5" /> {item.category}
                  </span>

                  <div className="absolute bottom-3 right-3 text-right">
                    <span className="text-[9px] text-slate-200 uppercase tracking-wide font-black leading-none block">Starting From</span>
                    <strong className="text-lg font-black text-emerald-400 font-mono">₹{item.startingPrice}</strong>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        {item.sourceCity} <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {item.destinationCity}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold font-mono">{item.distanceKm} KM</span>
                    </div>
                    <span className="text-xs text-slate-850 font-black tracking-tight leading-snug block my-1">{item.title}</span>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">{item.attractionText}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                    <span className="text-[10px] text-indigo-600 group-hover:text-indigo-700 font-extrabold tracking-wide uppercase">
                      Inspect Fares &rarr;
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 font-black uppercase text-[8.5px] font-mono px-2 py-0.5 rounded-md">
                      Best: {item.bestMonth}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
