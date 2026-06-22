import React, { useState } from 'react';
import { Bell, Trash2, CheckCircle, ShieldAlert, Heart, RefreshCw, Sparkles, MapPin, Calendar, PlusCircle, ArrowUpRight, TrendingDown } from 'lucide-react';
import { PriceAlert, TravelRoute } from '../types';
import { mockPriceAlerts, mockRoutes, getPriceTrendForRoute } from '../data/mockData';

interface AlertsDashboardProps {
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'notificationSent'>) => void;
  onDeleteAlert: (id: string) => void;
  onSearchRoute: (source: string, destination: string) => void;
}

const CITIES = ['Delhi', 'Lucknow', 'Jaipur', 'Bangalore', 'Hyderabad', 'Patna'];

export default function AlertsDashboard({
  alerts,
  onAddAlert,
  onDeleteAlert,
  onSearchRoute,
}: AlertsDashboardProps) {
  // Add Alert form state
  const [fromCity, setFromCity] = useState('Delhi');
  const [toCity, setToCity] = useState('Lucknow');
  const [targetVal, setTargetVal] = useState(800);
  const [travelDt, setTravelDt] = useState('2026-05-28');

  const [favorites, setFavorites] = useState<Omit<TravelRoute, 'averageDurationMinutes'>[]>([
    { id: '1', sourceCity: 'Delhi', destinationCity: 'Jaipur', distanceKm: 270, popularRoute: true },
    { id: '2', sourceCity: 'Bangalore', destinationCity: 'Hyderabad', distanceKm: 575, popularRoute: true }
  ]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromCity === toCity) {
      alert('Source and destination cities cannot be identical.');
      return;
    }
    onAddAlert({
      sourceCity: fromCity,
      destinationCity: toCity,
      targetPrice: targetVal,
      travelDate: travelDt,
    });
    setNotificationMsg('Success! Your price alert tracker has been activated.');
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Get active pricing historical points to draw a dynamic mock line
  const activeRouteMap = mockRoutes.find(r => r.sourceCity === fromCity && r.destinationCity === toCity) || mockRoutes[0];
  const trendsData = getPriceTrendForRoute(activeRouteMap.id);

  const maxPrice = Math.max(...trendsData.map((d) => d.price));
  const minPrice = Math.min(...trendsData.map((d) => d.price));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6" id="alerts-workspace">
      
      {/* Dynamic Success Toast */}
      {notificationMsg && (
        <div className="bg-slate-900 border border-brand-500/20 text-slate-100 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-xl animate-fade-in fixed bottom-6 right-6 z-50 max-w-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{notificationMsg}</p>
        </div>
      )}

      {/* Intro Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Price Watchlist & Alerts</h2>
          </div>
          <p className="text-sm text-slate-500">
            Configure price drop notifications and save your high-density commute routes.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-xl">
          <span className="flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-emerald-500" /> Save up to 40%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Create and Trend visualizer */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Create Alert Segment */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5 text-left">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-800 text-sm">Configure New Price Alert</h3>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">From</label>
                <select
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">To</label>
                <select
                  value={toCity}
                  onChange={(e) => setToCity(e.target.value)}
                  className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Travel Date</label>
                <input
                  type="date"
                  value={travelDt}
                  onChange={(e) => setTravelDt(e.target.value)}
                  className="w-full bg-slate-50 p-[11px] rounded-xl border border-slate-100 font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Target Price (₹)</label>
                <input
                  type="number"
                  min="200"
                  max="10000"
                  value={targetVal}
                  onChange={(e) => setTargetVal(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 p-[11px] rounded-xl border border-slate-100 font-semibold text-xs text-slate-705 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="sm:col-span-12 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" /> Set Alert Target
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Trend graph for selected alert route */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Historical Price Trends &bull; <span className="font-mono text-xs text-slate-500">{fromCity} ➔ {toCity}</span>
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                Low Fare Signal
              </span>
            </div>

            {/* Custom SVG line graph charting */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <p>Calculated mean fare: <strong className="text-slate-800 font-bold">&#8377;{Math.round((maxPrice + minPrice) / 2)}</strong></p>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400"></span> Max: ₹{maxPrice}</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand-500"></span> Min: ₹{minPrice}</span>
                </div>
              </div>

              {/* The SVG Line chart representation */}
              <div className="h-44 bg-slate-50/70 border border-slate-100 rounded-xl relative p-4 flex flex-col justify-end">
                <svg className="w-full h-24 overflow-visible" viewBox="0 0 700 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="pricing-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid guidelines */}
                  <line x1="0" y1="20" x2="700" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="50" x2="700" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                  {/* Shaded Area */}
                  <path
                    d={`M 0,${100 - ((trendsData[0].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 116,${100 - ((trendsData[1].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 233,${100 - ((trendsData[2].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 350,${100 - ((trendsData[3].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 466,${100 - ((trendsData[4].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 583,${100 - ((trendsData[5].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 700,${100 - ((trendsData[6].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 700,100 L 0,100 Z`}
                    fill="url(#pricing-grad)"
                  />

                  {/* Gradient Path Line */}
                  <path
                    d={`M 0,${100 - ((trendsData[0].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 116,${100 - ((trendsData[1].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 233,${100 - ((trendsData[2].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 350,${100 - ((trendsData[3].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 466,${100 - ((trendsData[4].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 583,${100 - ((trendsData[5].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20} 
                        L 700,${100 - ((trendsData[6].price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20}`}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Highlight core points circles */}
                  {trendsData.map((d, i) => {
                    const x = i * 116;
                    const y = 100 - ((d.price - minPrice) / (maxPrice - minPrice || 1)) * 60 - 20;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill="#0ea5e9" stroke="#fff" strokeWidth="1.5" />
                        <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155" fontFamily="monospace">
                          ₹{d.price}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X labels grid */}
                <div className="flex justify-between px-0.5 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2 font-mono mt-1">
                  <span>Mon (21 May)</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun (27 May)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side list of alerts & favorites */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Price Alerts list */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Active Watchlists ({alerts.length})</h3>
            
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active price drop watchlists. Set one up to get notified instantly.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {alerts.map((al) => (
                  <div key={al.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 relative group hover:border-brand-200 transition-all">
                    
                    {/* Delete action */}
                    <button
                      onClick={() => onDeleteAlert(al.id)}
                      className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                      aria-label="Delete alert"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">{al.travelDate}</span>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        {al.sourceCity}
                        <span className="text-slate-400">&rarr;</span>
                        {al.destinationCity}
                      </h4>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Target Budget</span>
                        <span className="font-mono text-xs font-bold text-slate-700">₹{al.targetPrice}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        al.notificationSent 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse'
                      }`}>
                        {al.notificationSent ? '🚀 Fired & Sent' : '📡 Scanning...'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Favorite Bookmarks cards */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 text-left">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Bookmarked Routes
            </h3>

            <div className="flex flex-col gap-2.5">
              {favorites.map((fav) => (
                <div key={fav.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 p-3 rounded-xl flex items-center justify-between group transition-all">
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {fav.sourceCity} ➔ {fav.destinationCity}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">{fav.distanceKm} kilometers travel</p>
                  </div>

                  <button
                    onClick={() => onSearchRoute(fav.sourceCity, fav.destinationCity)}
                    className="p-1.5 bg-white group-hover:bg-brand-600 text-slate-400 group-hover:text-white rounded-lg border border-slate-100 group-hover:border-brand-600 transition-all cursor-pointer"
                    aria-label={`Search buses for ${fav.sourceCity} to ${fav.destinationCity}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
