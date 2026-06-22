import React, { useState } from 'react';
import { Bell, Bus, Ticket, LifeBuoy, ChevronDown, Database, User, LogOut, Check, HelpCircle, Shield, Key, BarChart3, Globe } from 'lucide-react';
import { mockUsers } from '../data/mockData';
import { PartnerSession } from '../types';

interface HeaderProps {
  activePage: 'home' | 'search' | 'alerts' | 'database' | 'analytics' | 'seo-landing';
  setActivePage: (page: 'home' | 'search' | 'alerts' | 'database' | 'analytics' | 'seo-landing') => void;
  alertsCount: number;
  isScrolled?: boolean;
  partnerSession?: PartnerSession | null;
  onOpenPartnerLogin?: () => void;
  onOpenPartnerApiSettings?: () => void;
  onPartnerLogout?: () => void;
}

export default function Header({ 
  activePage, 
  setActivePage, 
  alertsCount, 
  isScrolled = false,
  partnerSession,
  onOpenPartnerLogin,
  onOpenPartnerApiSettings,
  onPartnerLogout
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isAdmin = !!(partnerSession?.isLoggedIn && partnerSession?.email === 'krpandey25646@gmail.com');

  return (
    <header className="sticky top-0 z-50 bg-[#0B1528]/95 backdrop-blur-md border-b border-slate-800/60 text-slate-100 shadow-sm py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-13">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => {
            setActivePage('search'); // Match searched results state like image
            setShowDropdown(false);
          }}
          className="flex items-center gap-2 px-1 focus:outline-none focus:ring-1 focus:ring-slate-800 rounded-lg group text-left"
        >
          <div className="bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-all duration-200 p-1.5">
            <Bus className="w-4 h-4" id="logo-icon" />
          </div>
          <div className="leading-tight text-left">
            <span className="font-extrabold tracking-tight block text-white text-base">
              BusLens
            </span>
          </div>
        </button>

        {/* Right Menus exactly matching screen */}
        <div className="flex items-center gap-7">
          <nav className="hidden md:flex items-center gap-6 text-slate-300 font-medium text-xs">
            {/* Price Alerts tab */}
            <button
              type="button"
              onClick={() => {
                setActivePage('alerts');
                setShowDropdown(false);
              }}
              id="nav-alerts"
              className={`flex items-center gap-1.5 transition-colors relative hover:text-white ${
                activePage === 'alerts' ? 'text-white font-bold' : ''
              }`}
            >
              <Bell className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Price Alerts</span>
              {alertsCount > 0 && (
                <span className="absolute bg-red-500 text-white font-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ring-1 ring-[#0B1528] -top-1 -right-2">
                  {alertsCount}
                </span>
              )}
            </button>

            {/* Trips tab */}
            <button
              type="button"
              onClick={() => {
                setActivePage('search');
                setShowDropdown(false);
              }}
              id="nav-trips"
              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                activePage === 'search' ? 'text-white font-bold' : ''
              }`}
            >
              <Ticket className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Trips</span>
            </button>

            {/* Support, SEO, and Analytics tabs are ADMIN-ONLY */}
            {isAdmin && (
              <>
                {/* Support Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('database'); // Leads to schema logs & scrapers help
                    setShowDropdown(false);
                  }}
                  id="nav-support"
                  className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                    activePage === 'database' ? 'text-white font-bold' : ''
                  }`}
                >
                  <LifeBuoy className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Support</span>
                </button>

                {/* SEO Landing Guides Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('seo-landing');
                    setShowDropdown(false);
                  }}
                  id="nav-seo"
                  className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                    activePage === 'seo-landing' ? 'text-white font-bold' : ''
                  }`}
                >
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>SEO Guides</span>
                </button>

                {/* Admin Analytics Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('analytics');
                    setShowDropdown(false);
                  }}
                  id="nav-analytics"
                  className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                    activePage === 'analytics' ? 'text-white font-bold' : ''
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Analytics</span>
                </button>
              </>
            )}
          </nav>

          {/* User profile dropdown exact UI */}
          <div 
            className="relative"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              type="button"
              className="flex items-center gap-2 hover:bg-slate-800/40 px-2.5 py-1.5 rounded-xl transition duration-150 focus:outline-none border border-transparent hover:border-slate-800"
            >
              {partnerSession?.isLoggedIn ? (
                <div className="w-7 h-7 rounded-xl bg-blue-600 font-black text-white flex items-center justify-center text-xs shrink-0 select-none border border-blue-400/30">
                  {partnerSession.platformName[0]}
                </div>
              ) : (
                <div className="rounded-full bg-slate-800 border border-slate-700/60 text-blue-400 flex items-center justify-center transition-all duration-200 w-7 h-7">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="text-xs font-semibold text-slate-300 hidden sm:inline whitespace-nowrap">
                {partnerSession?.isLoggedIn 
                  ? `Partner (${partnerSession.platformName})` 
                  : 'Partner Portal'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full pt-2 w-56 z-50 text-left text-xs text-slate-300 animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5">
                  <div className="px-3.5 py-2 border-b border-slate-800 mb-1">
                    {partnerSession?.isLoggedIn ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 text-[9px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded-full border border-blue-500/20">
                            <Shield className="w-2.5 h-2.5" /> Partner Account
                          </span>
                        </div>
                        <span className="block font-bold text-white text-xs truncate animate-pulse" title={partnerSession.email}>
                          {partnerSession.email}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize font-semibold">
                          {partnerSession.platformName} API Console
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block font-bold text-slate-400 text-xs text-blue-400">Operator Portal</span>
                        <span className="text-[10px] text-slate-500">Log in to manage API schedules & details.</span>
                      </>
                    )}
                  </div>

                  {partnerSession?.isLoggedIn ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenPartnerApiSettings) onOpenPartnerApiSettings();
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-850 hover:text-white flex items-center gap-2 font-semibold text-emerald-400"
                      >
                        <Key className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Manage Portal & APIs</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePage('database');
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-slate-850 hover:text-white flex items-center gap-2"
                        >
                          <Database className="w-3.5 h-3.5 text-blue-400/70" />
                          <span>Database Schema Explorer</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActivePage('alerts');
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-850 hover:text-white flex items-center gap-2"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400/70" />
                        <span>Manage Alerts ({alertsCount})</span>
                      </button>

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onPartnerLogout) onPartnerLogout();
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-850 text-rose-400 hover:text-rose-350 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Disconnect Partner</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenPartnerLogin) onOpenPartnerLogin();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-slate-850 hover:text-white flex items-center gap-2 font-semibold text-blue-400"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>Login as Partner</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
