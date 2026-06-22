import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Pause, Play, Sparkles, 
  Compass, Ticket, Tag
} from 'lucide-react';

interface SlideItem {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  tagline: string;
  metricValue: string;
}

export default function PortalRadarVisual() {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: SlideItem[] = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&h=500&fit=crop",
      title: "Premium Volvo Sleeper Coaches",
      subtitle: "Scans ticket fares from ₹299 across 4 major portals with real-time seat tracking.",
      badge: "Luxury Travel",
      tagline: "Scans Delhi, Bangalore, Mumbai route schedules instantly.",
      metricValue: "450+ Operators"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=700&h=500&fit=crop",
      title: "Volvo Multi-Axle 9600 Luxury Liner",
      subtitle: "Pristine sleeper configurations, integrated USB charging points, and individually controlled AC vents.",
      badge: "Premium Elite",
      tagline: "Ultra silent cabins with active anti-vibration suspension technology.",
      metricValue: "Volvo 9600 Fleet"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=700&h=500&fit=crop",
      title: "VIP Seater & Sleeper Configurations",
      subtitle: "Filter bookings smoothly by ladies special seats, sleeper berths, and multi-axle VIP cabins.",
      badge: "VIP Cabin",
      tagline: "Interactive seat layouts and carrier logs configured in real-time.",
      metricValue: "4.8/5 Rating"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=700&h=500&fit=crop",
      title: "Explore Scenic Expressway Fares",
      subtitle: "Unified live deal scan queries redBus, AbhiBus, Paytm Travel & MakeMyTrip simultaneously.",
      badge: "Scenic Escape",
      tagline: "Uncover seasonal travel ideas and current weekend demand scores.",
      metricValue: "280+ Lanes"
    }
  ];

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const currentSlide = slides[currentIndex];

  return (
    <div 
      className="w-full bg-white rounded-3xl border border-slate-150 shadow-md p-4 md:p-5 flex flex-col md:flex-row gap-6 items-center relative" 
      id="portal-image-slider"
    >
      {/* LEFT SIDE: Clean, Lighter Theme Card Content (Takes up 55%) */}
      <div className="flex-1 text-left flex flex-col justify-between h-[210px] w-full py-1.5 pl-1" id="slider-content-left">
        
        {/* Top Indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-105 text-blue-700 text-[9px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg">
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {currentSlide.badge}
            </span>
            <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
              {currentSlide.metricValue}
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 leading-snug">
            {currentSlide.title}
          </h2>

          {/* Subtitle */}
          <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Bottom Tagline & Slider controls */}
        <div className="space-y-2.5">
          {/* Action indicator tag */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-xl px-2.5 py-1.5 w-fit">
            <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{currentSlide.tagline}</span>
          </div>

          {/* Slider Progress Indicator (Tiny bar tracks) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1">
              {slides.map((slide, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                      isActive ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`Go to slide ${index + 1}`}
                  />
                );
              })}
            </div>

            {/* Play Pause Button */}
            <button
              onClick={togglePlay}
              className="p-1 px-2 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition text-[9px] font-extrabold uppercase tracking-wide font-mono flex items-center gap-1 border border-slate-200"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-2.5 h-2.5 text-slate-400" /> Pause Auto
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 text-emerald-500" /> Play Auto
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Fully Visible, Clear, High-Quality Bus Image Panel (Takes up 45%) */}
      <div className="w-full md:w-[42%] h-[210px] rounded-2xl overflow-hidden bg-slate-50 relative shrink-0 shadow-sm border border-slate-100 group/image" id="slider-image-right">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={currentSlide.image}
            alt={currentSlide.title}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full object-cover select-none brightness-100 filter contrast-[1.02] saturate-[1.05]"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Minimal subtle gradient edge for overlay contrast */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/45 to-transparent pointer-events-none"></div>

        {/* Manual Manual Navigation Arrows overlay on the image container */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl bg-white/95 hover:bg-white text-slate-750 hover:text-blue-600 border border-slate-200 shadow-md transition cursor-pointer focus:outline-none"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl bg-white/95 hover:bg-white text-slate-750 hover:text-blue-600 border border-slate-200 shadow-md transition cursor-pointer focus:outline-none"
            aria-label="Next slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick status label */}
        <span className="absolute top-2.5 right-2.5 bg-slate-900/75 backdrop-blur-sm shadow text-white font-mono font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 select-none pointer-events-none">
          <Sparkles className="w-2.5 h-2.5 text-yellow-300" /> Active Scan
        </span>
      </div>

    </div>
  );
}
