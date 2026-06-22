import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Users, ArrowRightLeft, Search, Check, X } from 'lucide-react';

interface SearchSectionProps {
  onSearch: (searchData: {
    source: string;
    destination: string;
    travelDate: string;
    passengers: number;
  }) => void;
  initialData?: {
    source: string;
    destination: string;
    travelDate: string;
    passengers: number;
  };
  isScrolled?: boolean;
  activePage?: 'home' | 'search' | 'alerts' | 'database';
  isSearching?: boolean;
}

const CITIES = [
  'Delhi', 'Lucknow', 'Jaipur', 'Bangalore', 'Hyderabad', 'Patna',
  'Mumbai', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Gurgaon',
  'Noida', 'Dehradun', 'Chandigarh', 'Agra', 'Kanpur', 'Varanasi',
  'Indore', 'Bhopal', 'Kochi', 'Goa', 'Coimbatore', 'Mysore',
  'Visakhapatnam', 'Vijayawada', 'Nagpur', 'Ranchi', 'Bhubaneswar'
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SearchSection({ onSearch, initialData, isScrolled = false, activePage = 'search', isSearching = false }: SearchSectionProps) {
  const [source, setSource] = useState(initialData?.source || '');
  const [debouncedSource, setDebouncedSource] = useState(initialData?.source || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [debouncedDestination, setDebouncedDestination] = useState(initialData?.destination || '');
  const [travelDate, setTravelDate] = useState(initialData?.travelDate || getTodayDateString());
  const [passengers, setPassengers] = useState(initialData?.passengers || 1);

  const mainDateInputRef = useRef<HTMLInputElement>(null);
  const stickyDateInputRef = useRef<HTMLInputElement>(null);

  // Debouncing handlers (150ms delay) to keep keyboard typing butter-smooth on mobile devices
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSource(source);
    }, 150);
    return () => clearTimeout(handler);
  }, [source]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDestination(destination);
    }, 150);
    return () => clearTimeout(handler);
  }, [destination]);

  // Suggested filtered lists based on active typed input (debounced)
  const filteredSourceCities = CITIES.filter(c =>
    c.toLowerCase().includes(debouncedSource.toLowerCase())
  );

  const filteredDestCities = CITIES.filter(c =>
    c.toLowerCase().includes(debouncedDestination.toLowerCase())
  );

  // Synchronize internal local search field states with external initialData changes (e.g., from clicking hot routes)
  useEffect(() => {
    if (initialData) {
      if (initialData.source !== source) {
        setSource(initialData.source);
        setDebouncedSource(initialData.source);
      }
      if (initialData.destination !== destination) {
        setDestination(initialData.destination);
        setDebouncedDestination(initialData.destination);
      }
      if (initialData.travelDate !== travelDate) setTravelDate(initialData.travelDate);
      if (initialData.passengers !== passengers) setPassengers(initialData.passengers);
    }
  }, [initialData]);



  // Dropdown visibility states
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showPassDropdown, setShowPassDropdown] = useState(false);
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // Sticky version dropdown visibility states
  const [showStickySourceDropdown, setShowStickySourceDropdown] = useState(false);
  const [showStickyDestDropdown, setShowStickyDestDropdown] = useState(false);
  const [showStickyPassDropdown, setShowStickyPassDropdown] = useState(false);
  const [showStickyCalendarDropdown, setShowStickyCalendarDropdown] = useState(false);

  // Calendar month rendering view cursor state
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(travelDate);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const BUS_IMAGES = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=50',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=50',
    'https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&w=800&q=50',
    'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=50',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=50',
    'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=800&q=50',
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=50'
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % BUS_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // References for handling clicks outside
  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const stickySourceRef = useRef<HTMLDivElement>(null);
  const stickyDestRef = useRef<HTMLDivElement>(null);
  const stickyPassRef = useRef<HTMLDivElement>(null);
  const stickyDateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Close source dropdown if clicked outside normal source ref
      if (sourceRef.current && !sourceRef.current.contains(target)) {
        setShowSourceDropdown(false);
      }
      // Close sticky source dropdown if clicked outside sticky source ref
      if (stickySourceRef.current && !stickySourceRef.current.contains(target)) {
        setShowStickySourceDropdown(false);
      }

      // Close destination dropdown if clicked outside normal dest ref
      if (destRef.current && !destRef.current.contains(target)) {
        setShowDestDropdown(false);
      }
      // Close sticky destination dropdown if clicked outside sticky dest ref
      if (stickyDestRef.current && !stickyDestRef.current.contains(target)) {
        setShowStickyDestDropdown(false);
      }

      // Close passengers dropdown if clicked outside normal passenger ref
      if (passRef.current && !passRef.current.contains(target)) {
        setShowPassDropdown(false);
      }
      // Close sticky passengers dropdown if clicked outside sticky passenger ref
      if (stickyPassRef.current && !stickyPassRef.current.contains(target)) {
        setShowStickyPassDropdown(false);
      }

      // Close calendar dropdown if clicked outside normal date ref
      if (dateRef.current && !dateRef.current.contains(target)) {
        setShowCalendarDropdown(false);
      }
      // Close sticky calendar dropdown if clicked outside sticky date ref
      if (stickyDateRef.current && !stickyDateRef.current.contains(target)) {
        setShowStickyCalendarDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setShowSourceDropdown(false);
      setShowDestDropdown(false);
      setShowPassDropdown(false);
      setShowCalendarDropdown(false);
      setShowStickySourceDropdown(false);
      setShowStickyDestDropdown(false);
      setShowStickyPassDropdown(false);
      setShowStickyCalendarDropdown(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      source,
      destination,
      travelDate,
      passengers
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getWeekdayName = (dateStr: string) => {
    if (!dateStr) return 'Saturday';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Saturday';
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[date.getDay()];
  };

  const renderCalendar = () => {
    // Math to compute current viewed month's dates
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    
    // First day of viewing month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Days in viewing month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Days array
    const days = [];
    // Previous Month padding
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Current Month days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    
    const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewMonth(new Date(year, month - 1, 1));
    };
    
    const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewMonth(new Date(year, month + 1, 1));
    };

    const handleSelectDay = (date: Date, e: React.MouseEvent) => {
      e.stopPropagation();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const selectedStr = `${y}-${m}-${d}`;
      setTravelDate(selectedStr);
      setShowCalendarDropdown(false);
      setShowStickyCalendarDropdown(false);
    };

    const todayStr = getTodayDateString();

    return (
      <div className="absolute right-0 md:left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 select-none">
          <button 
            type="button"
            onClick={handlePrevMonth}
            className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-slate-700 font-extrabold text-sm transition duration-150 cursor-pointer"
          >
            &larr;
          </button>
          <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
            {monthNames[month]} {year}
          </span>
          <button 
            type="button"
            onClick={handleNextMonth}
            className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-slate-700 font-extrabold text-sm transition duration-150 cursor-pointer"
          >
            &rarr;
          </button>
        </div>
        
        {/* Week headings */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        
        {/* Grid cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-8"></div>;
            
            const y = day.getFullYear();
            const m = String(day.getMonth() + 1).padStart(2, '0');
            const d = String(day.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            
            const isSelected = travelDate === dateStr;
            const isToday = todayStr === dateStr;
            const isPast = dateStr < todayStr;
            
            return (
              <button
                type="button"
                key={dateStr}
                disabled={isPast}
                onClick={(e) => handleSelectDay(day, e)}
                className={`h-8 w-8 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  isSelected 
                    ? 'bg-[#1D4ED8] text-white font-black shadow-md shadow-blue-500/20' 
                    : isToday 
                      ? 'border border-blue-600 text-blue-600 hover:bg-blue-50 font-black' 
                      : isPast 
                        ? 'text-slate-300 cursor-not-allowed pointer-events-none' 
                        : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const isStickyLayout = isScrolled && activePage === 'search';

  return (
    <>
      {/* Primary Hero Search Form Area (Static in Flow) */}
      <div className="w-full relative bg-slate-950 pb-6 pt-8 overflow-visible z-30" id="search-section-main">
        
        {/* Background Rotating Bus Slideshow Banner with High Contrast Overlay */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none select-none">
          {BUS_IMAGES.map((img, idx) => (
            <img
              key={img}
              src={img}
              alt="Bus slideshow backdrop"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-in-out transform ${
                idx === currentImageIndex 
                  ? 'opacity-40 scale-100 z-10' 
                  : 'opacity-0 scale-105 z-0'
              }`}
            />
          ))}
          {/* Rich modern gradient overlays to ensure extreme text readability & accessibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070D1F]/90 via-[#040814]/80 to-[#050A19]/90 z-20 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950 z-20"></div>
          {/* Subtle digital dot web background pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.12),transparent_75%)] z-20"></div>
        </div>

        {/* Modern abstract dotted grids sidebars */}
        <div className="absolute left-6 top-10 w-24 h-24 grid grid-cols-6 gap-2 opacity-15 text-white pointer-events-none select-none z-20">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
          {/* Pitch line header title */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Compare <span className="text-[#00E676] bg-clip-text">bus prices</span> across all platforms
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium">
              Find the best prices and save more on your bus tickets
            </p>
          </div>

          {/* Dynamic form widget container */}
          <div className="max-w-6xl mx-auto relative font-sans">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white rounded-3xl overflow-visible shadow-2xl shadow-black/40 grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-100 border border-slate-100"
            >
              {/* FROM Input */}
              <div 
                className="md:col-span-3 p-5 text-left relative cursor-text hover:bg-slate-50/50 transition-all rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none" 
                ref={sourceRef} 
                onClick={() => {
                  const input = sourceRef.current?.querySelector('input');
                  input?.focus();
                  setShowSourceDropdown(true);
                }}
                onMouseLeave={() => setShowSourceDropdown(false)}
              >
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">From</span>
                
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-5 h-5 rounded-full border-4 border-emerald-500/20 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="leading-none flex-1 relative group">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        className="block w-full font-bold text-slate-800 text-base bg-transparent p-0 border-none outline-none focus:ring-0 focus:outline-none placeholder-slate-400"
                        value={source}
                        onChange={(e) => {
                          setSource(e.target.value);
                          setShowSourceDropdown(true);
                        }}
                        onFocus={() => setShowSourceDropdown(true)}
                        placeholder="Enter departure city"
                      />
                      {source && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSource('');
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                          title="Clear Source"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 block">
                      {source ? (source === 'Delhi' ? 'Delhi, India' : source === 'Lucknow' ? 'Uttar Pradesh, India' : 'India') : 'Where are you traveling from?'}
                    </span>
                  </div>
                </div>

                {showSourceDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 max-h-60 overflow-y-auto">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                      {filteredSourceCities.length > 0 ? 'Matching Hubs' : 'No matches found (Custom City)'}
                    </div>
                    {filteredSourceCities.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSource(c);
                          setShowSourceDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c}</span>
                        {source.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Absolute Swapper button overlapping */}
              <div className="hidden md:flex absolute left-[25%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-20">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  title="Swap Locations"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* TO Input */}
              <div 
                className="md:col-span-3 p-5 text-left relative cursor-text hover:bg-slate-50/50 transition-all font-sans" 
                ref={destRef} 
                onClick={() => {
                  const input = destRef.current?.querySelector('input');
                  input?.focus();
                  setShowDestDropdown(true);
                }}
                onMouseLeave={() => setShowDestDropdown(false)}
              >
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">To</span>
                
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-5 h-5 rounded-full border-4 border-red-500/20 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  </div>
                  <div className="leading-none flex-1 relative group">
                    <div className="flex items-center justify-between gap-1">
                      <input
                        type="text"
                        className="block w-full font-bold text-slate-800 text-base bg-transparent p-0 border-none outline-none focus:ring-0 focus:outline-none placeholder-slate-400"
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          setShowDestDropdown(true);
                        }}
                        onFocus={() => setShowDestDropdown(true)}
                        placeholder="Enter destination city"
                      />
                      {destination && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDestination('');
                          }}
                          className="p-1 rounded-full text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                          title="Clear Destination"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 block">
                      {destination ? (destination === 'Lucknow' ? 'Uttar Pradesh, India' : destination === 'Delhi' ? 'Delhi, India' : 'India') : 'Where are you heading to?'}
                    </span>
                  </div>
                </div>

                {showDestDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 max-h-60 overflow-y-auto">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                      {filteredDestCities.length > 0 ? 'Matching Hubs' : 'No matches found (Custom City)'}
                    </div>
                    {filteredDestCities.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDestination(c);
                          setShowDestDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c}</span>
                        {destination.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DATE Input block */}
              <div 
                ref={dateRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendarDropdown(!showCalendarDropdown);
                  setShowSourceDropdown(false);
                  setShowDestDropdown(false);
                  setShowPassDropdown(false);
                }}
                onMouseLeave={() => setShowCalendarDropdown(false)}
                className="md:col-span-2 p-5 text-left relative cursor-pointer hover:bg-slate-50/50 transition-all flex flex-col justify-between"
              >
                <input
                  ref={mainDateInputRef}
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min="2024-01-01"
                  className="absolute inset-x-0 bottom-0 opacity-0 pointer-events-none select-none w-0 h-0 z-0"
                />

                <div className="relative z-10">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</span>
                  
                  <div className="flex items-center gap-2.5 mt-2">
                    <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0 bg-transparent" />
                    <div className="leading-none text-left">
                      <span className="block font-bold text-slate-800 text-sm whitespace-nowrap">{formatDisplayDate(travelDate)}</span>
                      <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 block">{getWeekdayName(travelDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Today & Tomorrow Quick Selectors */}
                <div className="flex items-center gap-1.5 mt-2.5 relative z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTravelDate(getTodayDateString());
                      setShowCalendarDropdown(false);
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all border cursor-pointer ${
                      travelDate === getTodayDateString() 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 font-black shadow-sm' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTravelDate(getTomorrowDateString());
                      setShowCalendarDropdown(false);
                    }}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all border cursor-pointer ${
                      travelDate === getTomorrowDateString() 
                        ? 'bg-blue-50 text-blue-600 border-blue-200 font-black shadow-sm' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>

                {showCalendarDropdown && renderCalendar()}
              </div>

              {/* PASSENGERS Input block */}
              <div 
                className="md:col-span-2 p-5 text-left relative cursor-pointer hover:bg-slate-50/50 transition-all font-sans" 
                ref={passRef} 
                onClick={() => setShowPassDropdown(!showPassDropdown)}
                onMouseLeave={() => setShowPassDropdown(false)}
              >
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Passengers</span>
                
                <div className="flex items-center gap-2.5 mt-2 font-sans">
                  <Users className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                  <div className="leading-none select-none text-left font-sans">
                    <span className="block font-bold text-slate-800 text-sm">{passengers} Passenger{passengers > 1 ? 's' : ''}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block tracking-wide">{passengers === 1 ? 'Solo Travel' : 'Group Travel'}</span>
                  </div>
                </div>

                {showPassDropdown && (
                  <div className="absolute right-0 top-full pt-2 w-56 z-50 text-left font-sans" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-150 p-4">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Seats</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-705">Count</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={passengers <= 1}
                            onClick={() => setPassengers(prev => Math.max(1, prev - 1))}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-bold disabled:opacity-50 font-sans"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800">{passengers}</span>
                          <button
                            type="button"
                            disabled={passengers >= 6}
                            onClick={() => setPassengers(prev => Math.min(6, prev + 1))}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-bold disabled:opacity-50 font-sans"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2.5 font-medium">Maximum booking of 6 seats inside our comparator routing.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* BUTTON block inside same row */}
              <div className="md:col-span-2 p-3.5 flex items-center justify-center bg-white rounded-b-3xl md:rounded-r-3xl md:rounded-bl-none">
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-full bg-[#1D4ED8] hover:bg-blue-800 active:bg-blue-900 disabled:opacity-85 disabled:cursor-not-allowed text-white font-extrabold text-sm px-4 py-3.5 md:py-0 rounded-2xl transition-all shadow-md shadow-blue-600/15 flex items-center justify-center gap-1.5 cursor-pointer leading-tight h-[48px] md:h-full"
                >
                  {isSearching ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-white" />
                      <span>Search Buses</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Benefits underneath */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-[11px] text-slate-300 font-medium pt-2">
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-blue-500/25 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0 shadow-sm">✓</span>
              Best Price Guarantee
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-blue-500/25 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0 shadow-sm">✓</span>
              100% Secure
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-blue-500/25 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0 shadow-sm">✓</span>
              Save up to ₹500
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4.5 w-4.5 rounded-full bg-blue-500/25 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold shrink-0 shadow-sm">✓</span>
              24/7 Customer Support
            </div>
          </div>
        </div>
      </div>

      {/* 
        Sleek Collapsed Narrow Fixed Ribbon on Scroll 
        Clamps underneath the stickied header (Header height scroll-collapsed is 52px).
        Provides identical state mutation for real-time comparison listings.
      */}
      {isStickyLayout && (
        <div className="fixed top-[52px] left-0 right-0 z-40 bg-gradient-to-r from-[#152541] via-[#1A2E50] to-[#122038] border-b border-blue-900/60 shadow-2xl py-2 px-4 transition-all duration-350 overflow-visible animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex flex-col items-center gap-2 overflow-visible">
            
            {/* Unified Centered Squeezed Banner Style Holding Entire Banner Texts */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2.5 text-center leading-normal select-none px-2 py-0.5 bg-blue-950/40 rounded-xl border border-blue-800/10 w-full sm:w-auto">
              <span className="text-xs md:text-sm font-extrabold text-white tracking-tight">
                Compare <span className="text-[#00E676] bg-clip-text">bus prices</span> across all platforms
              </span>
              <span className="hidden xs:inline text-slate-400 text-xs font-semibold">|</span>
              <span className="text-[10px] md:text-xs text-slate-300 font-semibold tracking-wide">
                Find the best prices and save more on your bus tickets
              </span>
            </div>

            {/* Squeezed Interactive Search summary controls row */}
            <div className="w-full flex items-center justify-between gap-3 border-t border-slate-750/50 pt-1.5 overflow-visible">
              
              {/* Interactive controls scrollable content */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4 py-1 flex-1 overflow-visible">
                {/* FROM Picker trigger */}
                <div 
                  className="relative shrink-0 flex items-center gap-1.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/30 text-xs font-bold text-slate-100 transition duration-150 cursor-text" 
                  ref={stickySourceRef}
                  onClick={() => {
                    const input = stickySourceRef.current?.querySelector('input');
                    input?.focus();
                    setShowStickySourceDropdown(true);
                  }}
                  onMouseLeave={() => setShowStickySourceDropdown(false)}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                  <input
                    type="text"
                    className="bg-transparent font-bold text-slate-100 text-xs focus:outline-none p-0 border-0 placeholder-slate-400 max-w-[80px] sm:max-w-none"
                    value={source}
                    onChange={(e) => {
                      setSource(e.target.value);
                      setShowStickySourceDropdown(true);
                      setShowStickyDestDropdown(false);
                      setShowStickyPassDropdown(false);
                    }}
                    onFocus={() => {
                      setShowStickySourceDropdown(true);
                      setShowStickyDestDropdown(false);
                      setShowStickyPassDropdown(false);
                    }}
                    placeholder="From"
                  />
                  {source && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSource('');
                      }}
                      className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1 cursor-pointer"
                      title="Clear From"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {showStickySourceDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-150 py-2 z-50 text-left max-h-60 overflow-y-auto">
                      <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        {filteredSourceCities.length > 0 ? 'Matching Hubs' : 'No matches found (Custom Route)'}
                      </div>
                      {filteredSourceCities.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSource(c);
                            setShowStickySourceDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c}</span>
                          {source.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swapper icon */}
                <button
                  type="button"
                  onClick={handleSwap}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800/40 shrink-0"
                  title="Swap Direction"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                {/* TO Picker trigger */}
                <div 
                  className="relative shrink-0 flex items-center gap-1.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/30 text-xs font-bold text-slate-100 transition duration-150 cursor-text" 
                  ref={stickyDestRef}
                  onClick={() => {
                    const input = stickyDestRef.current?.querySelector('input');
                    input?.focus();
                    setShowStickyDestDropdown(true);
                  }}
                  onMouseLeave={() => setShowStickyDestDropdown(false)}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  <input
                    type="text"
                    className="bg-transparent font-bold text-slate-100 text-xs focus:outline-none p-0 border-0 placeholder-slate-400 max-w-[80px] sm:max-w-none"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setShowStickyDestDropdown(true);
                      setShowStickySourceDropdown(false);
                      setShowStickyPassDropdown(false);
                    }}
                    onFocus={() => {
                      setShowStickyDestDropdown(true);
                      setShowStickySourceDropdown(false);
                      setShowStickyPassDropdown(false);
                    }}
                    placeholder="To"
                  />
                  {destination && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDestination('');
                      }}
                      className="p-0.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1 cursor-pointer"
                      title="Clear To"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {showStickyDestDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-150 py-2 z-50 text-left max-h-60 overflow-y-auto">
                      <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        {filteredDestCities.length > 0 ? 'Matching Hubs' : 'No matches found (Custom Route)'}
                      </div>
                      {filteredDestCities.map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDestination(c);
                            setShowStickyDestDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c}</span>
                          {destination.toLowerCase() === c.toLowerCase() && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              <div className="h-4 w-[1px] bg-slate-800 shrink-0 hidden xs:block"></div>

              {/* DATE inline dropdown selection */}
              <div 
                ref={stickyDateRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStickyCalendarDropdown(!showStickyCalendarDropdown);
                  setShowStickySourceDropdown(false);
                  setShowStickyDestDropdown(false);
                  setShowStickyPassDropdown(false);
                }}
                onMouseLeave={() => setShowStickyCalendarDropdown(false)}
                className="relative flex items-center gap-1.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/30 cursor-pointer text-xs font-bold text-slate-100 transition duration-150 shrink-0"
              >
                <input
                  ref={stickyDateInputRef}
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min="2024-01-01"
                  className="absolute inset-x-0 bottom-0 opacity-0 pointer-events-none select-none w-0 h-0 z-0"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 relative z-10" />
                <span className="shrink-0 relative z-10">{formatDisplayDate(travelDate).replace(' 2024', '').replace(' 2026', '')}</span>
                {showStickyCalendarDropdown && renderCalendar()}
              </div>

              {/* PASSENGERS inline count dropdown selection */}
              <div 
                className="relative shrink-0" 
                ref={stickyPassRef}
                onMouseLeave={() => setShowStickyPassDropdown(false)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStickyPassDropdown(!showStickyPassDropdown);
                    setShowStickySourceDropdown(false);
                    setShowStickyDestDropdown(false);
                  }}
                  className="flex items-center gap-1.5 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl px-2.5 py-1.5 border border-slate-700/30 text-xs font-bold text-slate-100 transition duration-150 shrink-0"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="shrink-0">{passengers} Pax</span>
                </button>

                {showStickyPassDropdown && (
                  <div className="absolute right-0 top-full pt-2 w-56 z-50 text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-150 p-4">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Seats</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-705">Count</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={passengers <= 1}
                            onClick={() => setPassengers(prev => Math.max(1, prev - 1))}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-bold disabled:opacity-50 font-sans"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-slate-800">{passengers}</span>
                          <button
                            type="button"
                            disabled={passengers >= 6}
                            onClick={() => setPassengers(prev => Math.min(6, prev + 1))}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center font-bold disabled:opacity-50 font-sans"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2.5 font-medium">Maximum booking of 6 seats inside our comparator routing.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Compare Trigger Submit Button */}
            <form onSubmit={handleSearchSubmit} className="shrink-0 flex items-center">
              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-85 disabled:cursor-not-allowed text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition duration-150 shadow-md shadow-blue-600/10 flex items-center gap-1.5 shrink-0"
                title="Search and compare latest bus tickets"
              >
                {isSearching ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span className="hidden sm:inline">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compare</span>
                  </>
                )}
              </button>
            </form>

          </div>
          </div>
        </div>
      )}
    </>
  );
}
