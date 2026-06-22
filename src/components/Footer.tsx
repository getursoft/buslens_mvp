import React from 'react';
import { Bus, ShieldCheck, Heart, Github, Globe } from 'lucide-react';

interface FooterProps {
  setActivePage: (p: 'home' | 'search' | 'alerts' | 'database') => void;
}

export default function Footer({ setActivePage }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Consolidated Partner logos row above links */}
        <div className="border border-slate-800 bg-slate-950/40 rounded-2xl p-3 px-5 flex flex-col md:flex-row items-center justify-between gap-4 mb-4 text-xs" id="platform-trust-ribbon">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">🛡️ Consolidated Partner API Integrations</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold">
            {/* redBus */}
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#D81A25]/5 border border-[#D81A25]/15 rounded-xl text-slate-300">
              <span className="w-1.5 h-1.5 bg-[#D81A25] rounded-full"></span>
              redBus
              <span className="text-[8px] opacity-75 font-mono uppercase tracking-wider bg-rose-950 px-1 rounded text-red-400 border border-red-900/40">Active</span>
            </span>
            {/* AbhiBus */}
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#EA580C]/5 border border-[#EA580C]/15 rounded-xl text-slate-300">
              <span className="w-1.5 h-1.5 bg-[#EA580C] rounded-full"></span>
              AbhiBus
              <span className="text-[8px] opacity-75 font-mono uppercase tracking-wider bg-amber-950 px-1 rounded text-orange-400 border border-orange-950">Active</span>
            </span>
            {/* MakeMyTrip */}
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#3B82F6]/5 border border-[#3B82F6]/15 rounded-xl text-slate-300">
              <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full"></span>
              MakeMyTrip
              <span className="text-[8px] opacity-75 font-mono uppercase tracking-wider bg-blue-950 px-1 rounded text-blue-400 border border-blue-950">Active</span>
            </span>
            {/* Paytm */}
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#00B9F5]/5 border border-[#00B9F5]/15 rounded-xl text-slate-300">
              <span className="w-1.5 h-1.5 bg-[#00B9F5] rounded-full"></span>
              Paytm
              <span className="text-[8px] opacity-75 font-mono uppercase tracking-wider bg-cyan-950 px-1 rounded text-cyan-400 border border-cyan-950">Active</span>
            </span>
          </div>
        </div>

        {/* Core Info Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="bg-brand-600 p-2 rounded-lg text-white">
                <Bus className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">BusLens</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              India's premium bus ticket price comparison platform. Aggregating offers across RedBus, AbhiBus, Paytm, and state fleets to save you up to 40% on every ride.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-950 p-2 rounded-lg w-max border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Secure SSL Certificates
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Top Routes</h4>
            <div className="flex flex-col gap-2 text-xs">
              <button onClick={() => setActivePage('home')} className="hover:text-white text-left transition-colors">Delhi ➔ Lucknow</button>
              <button onClick={() => setActivePage('home')} className="hover:text-white text-left transition-colors">Delhi ➔ Jaipur</button>
              <button onClick={() => setActivePage('home')} className="hover:text-white text-left transition-colors">Bangalore ➔ Hyderabad</button>
              <button onClick={() => setActivePage('home')} className="hover:text-white text-left transition-colors">Patna ➔ Delhi</button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Aggregators Verified</h4>
            <div className="flex flex-col gap-2 text-xs">
              <span className="text-slate-400">AbhiBus Direct</span>
              <span className="text-slate-400">RedBus Premium</span>
              <span className="text-slate-400">MakeMyTrip Highways</span>
              <span className="text-slate-400">Paytm Bus Transit</span>
              <span className="text-slate-400">UPSRTC State Board Portal</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Commuter Tools</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Set real-time drop notifications, configure active route price comparisons, or request dynamic notifications.
            </p>
            <button
              onClick={() => setActivePage('alerts')}
              className="text-xs bg-brand-600/10 text-brand-400 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:bg-brand-600/20 transition-all font-semibold"
            >
              Manage Price Alerts &rarr;
            </button>
          </div>
        </div>

        {/* Bottom Rights Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p className="flex items-center gap-1.5 justify-center md:justify-start">
            &copy; 2026 BusLens Inc. All rights reserved. Made with <Heart className="w-3.5 h-3.5 text-rose-500" /> for the modern commuter.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> India English
            </span>
            <span className="cursor-not-allowed">Terms matchers</span>
            <span className="cursor-not-allowed">Privacy cookies policies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
