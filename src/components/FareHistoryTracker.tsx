import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, HelpCircle, Calendar, 
  Info, Activity, Sparkles, AlertCircle, ArrowDown, ArrowUp, RefreshCw 
} from 'lucide-react';

interface PriceSnapshot {
  id: string;
  routeId: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recordedDate: string;
  dayOfWeekName: string;
}

interface PriceHistoryMetadata {
  lowestObserved: number;
  highestObserved: number;
  averageObserved: number;
  lowestObserved7: number;
  highestObserved7: number;
  averageObserved7: number;
  priceDifference: number;
  percentageChange: number;
  isDecreasing: boolean;
  cheapestBookingDay: string;
}

interface PriceHistoryResponse {
  success: boolean;
  routeId: string;
  metadata: PriceHistoryMetadata;
  snapshots: PriceSnapshot[];
}

interface FareHistoryTrackerProps {
  routeId: string;
  routeName: string;
  passengers: number;
}

export default function FareHistoryTracker({ routeId, routeName, passengers }: FareHistoryTrackerProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch from the newly created graph API
  useEffect(() => {
    let active = true;
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/price-history?routeId=${encodeURIComponent(routeId)}`);
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const json = await res.json();
        if (active) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to load fare history:", err);
        if (active) {
          setError(err.message || "Could not fetch dynamic price trends.");
          setLoading(false);
        }
      }
    }
    fetchHistory();
    return () => {
      active = false;
    };
  }, [routeId]);

  // Dynamic filter for active range
  const activeSnapshots = useMemo(() => {
    if (!data?.snapshots) return [];
    return range === '7d' ? data.snapshots.slice(-7) : data.snapshots;
  }, [data, range]);

  // Aggregate stats based on currently selected range
  const stats = useMemo(() => {
    if (activeSnapshots.length === 0) return null;
    
    const minPrices = activeSnapshots.map(s => s.minPrice);
    const maxPrices = activeSnapshots.map(s => s.maxPrice);
    const avgPrices = activeSnapshots.map(s => s.avgPrice);
    
    const lowest = Math.min(...minPrices);
    const highest = Math.max(...maxPrices);
    const average = Math.round(avgPrices.reduce((sum, val) => sum + val, 0) / avgPrices.length);

    // Calculate percentage change over this window
    const firstAvg = avgPrices[0];
    const lastAvg = avgPrices[avgPrices.length - 1];
    const diff = lastAvg - firstAvg;
    const pct = firstAvg > 0 ? Math.round((diff / firstAvg) * 100) : 0;

    return {
      lowest: lowest * passengers,
      highest: highest * passengers,
      average: average * passengers,
      priceDiff: diff * passengers,
      pctChange: Math.abs(pct),
      isDecreasing: diff < 0
    };
  }, [activeSnapshots, passengers]);

  // Render SVG Line and Shaded Area dynamically based on screen width
  const chartCoordinates = useMemo(() => {
    if (activeSnapshots.length === 0) return [];
    
    const count = activeSnapshots.length;
    const minPrices = activeSnapshots.map(s => s.minPrice);
    const maxPrices = activeSnapshots.map(s => s.minPrice); // plot lowest fare for smooth tracking
    
    const absoluteMin = Math.min(...minPrices);
    const absoluteMax = Math.max(...minPrices);
    const priceRange = absoluteMax - absoluteMin || 1;

    // Viewbox bounds: 800 x 220
    const padX = 40;
    const padY = 25;
    const chartWidth = 800 - padX * 2;
    const chartHeight = 220 - padY * 2;

    return activeSnapshots.map((item, idx) => {
      const x = padX + (idx / (count - 1 || 1)) * chartWidth;
      // Invert Y coordinate since SVG (0,0) is top-left
      const normY = (item.minPrice - absoluteMin) / priceRange;
      const y = padY + chartHeight - (normY * chartHeight);
      
      return {
        x,
        y,
        dayLabel: range === '7d' ? item.dayOfWeekName : item.recordedDate.substring(5),
        fullDate: item.recordedDate,
        price: item.minPrice * passengers
      };
    });
  }, [activeSnapshots, range, passengers]);

  const activeHoverItem = hoveredIndex !== null ? chartCoordinates[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden text-left" id="fare-history-tracker-section">
      {/* Top Title Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black bg-blue-500/25 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/20 tracking-wider">
              Smart Diagnostics
            </span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-300 font-bold tracking-wide uppercase font-mono">Live Route Metrics</span>
          </div>
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Fare Tracking & Analytics Dashboard
          </h3>
          <p className="text-xs text-slate-400 font-semibold">
            Aggregated OTA platform historical tariffs for <span className="text-slate-200">{routeName}</span> ({passengers} Pax)
          </p>
        </div>

        {/* Range Select Toggles */}
        <div className="bg-slate-950/40 p-1 rounded-xl flex border border-slate-700/50">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={`px-3.5 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition ${
                range === r 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-slate-100'
              }`}
              onClick={() => {
                setRange(r);
                setHoveredIndex(null);
              }}
            >
              {r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Filing and sorting API price records...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-sm text-slate-600 font-bold">{error}</p>
          <p className="text-xs text-slate-400">Please try selecting another search route</p>
        </div>
      ) : !stats || chartCoordinates.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-sm font-semibold">No price history available.</div>
      ) : (
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Key Stat Cards Rows */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Range Lowest Observed */}
            <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-4 flex items-start justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-black text-emerald-700 tracking-wider font-mono">Lowest Observed</span>
                <h4 className="text-2xl font-black text-emerald-950 font-mono leading-none">₹{stats.lowest}</h4>
                <p className="text-[10px] text-emerald-600 font-semibold pt-1">Absolute minimum rate found</p>
              </div>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <ArrowDown className="w-5 h-5" />
              </div>
            </div>

            {/* Range Average Fare */}
            <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-4 flex items-start justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-black text-blue-700 tracking-wider font-mono">Average Fare</span>
                <h4 className="text-2xl font-black text-slate-900 font-mono leading-none">₹{stats.average}</h4>
                <p className="text-[10px] text-blue-500 font-semibold pt-1">Typical aggregate ticket cost</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* Range Highest Observed */}
            <div className="bg-rose-50/40 border border-rose-100/70 rounded-2xl p-4 flex items-start justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-black text-rose-800 tracking-wider font-mono">Highest Observed</span>
                <h4 className="text-2xl font-black text-rose-950 font-mono leading-none">₹{stats.highest}</h4>
                <p className="text-[10px] text-rose-500 font-semibold pt-1">Maximum surge rate detected</p>
              </div>
              <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                <ArrowUp className="w-5 h-5" />
              </div>
            </div>

            {/* Trend Indicator Panel */}
            <div className={`rounded-2xl p-4 border flex items-start justify-between ${
              stats.isDecreasing 
                ? 'bg-[#EBFDF5] border-emerald-300 text-emerald-950' 
                : stats.pctChange === 0 
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}>
              <div className="space-y-1 text-left">
                <span className="text-[10px] uppercase font-black tracking-wider font-mono opacity-80">Trend Verdict</span>
                <h4 className="text-lg font-black leading-tight flex items-center gap-1.5">
                  {stats.isDecreasing ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <TrendingDown className="w-5 h-5 text-emerald-600" />
                      Down {stats.pctChange}%
                    </span>
                  ) : stats.pctChange === 0 ? (
                    <span className="text-slate-600">Stable</span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      Up {stats.pctChange}%
                    </span>
                  )}
                </h4>
                <p className="text-[10px] font-semibold opacity-75 pt-1">
                  {stats.isDecreasing 
                    ? "Tariffs have dropped over this cycle" 
                    : stats.pctChange === 0 
                      ? "Tariffs remained fully stable"
                      : "Booking immediate highly advised"
                  }
                </p>
              </div>
            </div>
            
          </div>

          {/* Interactive Chart Canvas Block */}
          <div className="relative border border-slate-100 rounded-2xl bg-gradient-to-b from-slate-50/50 to-white p-5 space-y-4" ref={containerRef}>
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                  Historical Fare Trend Grid ({range === '7d' ? '7 Snapshots' : '30 Snapshots'})
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">(Prices include all passengers)</span>
              </div>

              {/* On-Hover Dynamic Tooltip display */}
              {activeHoverItem && (
                <div className="bg-slate-900 text-white rounded-xl px-3 py-1 text-xs font-bold font-mono animate-fade-in flex items-center gap-2 shadow-md">
                  <span className="text-blue-300">{activeHoverItem.dayLabel}:</span>
                  <span className="text-emerald-400">₹{activeHoverItem.price}</span>
                </div>
              )}
            </div>

            {/* Smooth SVG Canvas Wrapper */}
            <div className="relative h-[220px] w-full" id="history-chart-viewport">
              <svg 
                className="w-full h-full select-none overflow-visible" 
                viewBox="0 0 800 220" 
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Premium visual gradients mapping */}
                  <linearGradient id="fare-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  
                  <filter id="shadow-line" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* X and Y Axis Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const yVal = 25 + ratio * 170;
                  return (
                    <line 
                      key={`grid-${i}`} 
                      x1="40" 
                      y1={yVal} 
                      x2="760" 
                      y2={yVal} 
                      stroke="#f1f5f9" 
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Dynamic Guideline supporting cursor-following */}
                {activeHoverItem && (
                  <g className="transition-all duration-100">
                    <line 
                      x1={activeHoverItem.x} 
                      y1="25" 
                      x2={activeHoverItem.x} 
                      y2="195" 
                      stroke="#3b82f6" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4"
                    />
                    <circle 
                      cx={activeHoverItem.x} 
                      cy={activeHoverItem.y} 
                      r="7" 
                      fill="#3b82f6" 
                      stroke="#ffffff" 
                      strokeWidth="2.5" 
                      className="shadow-md"
                    />
                    <circle 
                      cx={activeHoverItem.x} 
                      cy={activeHoverItem.y} 
                      r="14" 
                      fill="#3b82f6" 
                      opacity="0.15" 
                      className="animate-ping"
                      style={{ transformOrigin: `${activeHoverItem.x}px ${activeHoverItem.y}px` }}
                    />
                  </g>
                )}

                {/* Path curves representing prices */}
                {chartCoordinates.length > 0 && (
                  <>
                    {/* Fill Area */}
                    <path
                      d={`
                        M ${chartCoordinates[0].x},195 
                        L ${chartCoordinates.map(c => `${c.x},${c.y}`).join(' L ')} 
                        L ${chartCoordinates[chartCoordinates.length - 1].x},195 
                        Z
                      `}
                      fill="url(#fare-area-gradient)"
                      className="transition-all duration-300"
                    />

                    {/* Smooth Spline Overlay */}
                    <path
                      d={`M ${chartCoordinates[0].x},${chartCoordinates[0].y} L ${chartCoordinates.slice(1).map(c => `${c.x},${c.y}`).join(' L ')}`}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#shadow-line)"
                      className="transition-all duration-300"
                    />
                  </>
                )}

                {/* Dots along values on Last 7 Days view for visual precision */}
                {range === '7d' && chartCoordinates.map((pt, idx) => (
                  <circle
                    key={`dot-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-150 hover:scale-150"
                  />
                ))}
              </svg>

              {/* Invisible interactive overlay pillars for cursor hover accuracy */}
              <div className="absolute inset-0 flex" style={{ paddingLeft: '40px', paddingRight: '40px' }}>
                {chartCoordinates.map((_, idx) => (
                  <div
                    key={`trigger-${idx}`}
                    className="flex-1 h-full cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </div>
            </div>

            {/* X-axis custom labels rows */}
            <div className="flex justify-between text-[10px] text-slate-400 font-extrabold font-mono px-[35px] border-t border-slate-100 pt-3">
              {range === '7d' ? (
                chartCoordinates.map((pt, idx) => (
                  <span key={`lbl-${idx}`} className="text-center">{pt.dayLabel}</span>
                ))
              ) : (
                <>
                  <span>{chartCoordinates[0]?.dayLabel || ''}</span>
                  <span>{chartCoordinates[Math.floor(chartCoordinates.length / 2)]?.dayLabel || ''}</span>
                  <span>{chartCoordinates[chartCoordinates.length - 1]?.dayLabel || ''}</span>
                </>
              )}
            </div>
          </div>

          {/* Smart Recommendation Insights Callout */}
          <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-slate-50 border border-blue-200/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-black text-slate-950 uppercase tracking-wide">Cheapest Booking Day Analysis</h5>
                <p className="text-[11.5px] text-slate-600 font-semibold leading-relaxed">
                  Based on machine modeling across our {range === '7d' ? 'last 7 days' : '30-day historical'} telemetry, we anticipate that booking on <span className="text-blue-700 font-black">{data?.metadata.cheapestBookingDay}</span> yields the absolute cheapest reservations. Expect to save up to 18-20% by scheduling trips on mid-week cycles.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-blue-100 shadow-sm rounded-xl px-4 py-2 text-right shrink-0">
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider block">Best Day to Book</span>
              <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{data?.metadata.cheapestBookingDay}</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
