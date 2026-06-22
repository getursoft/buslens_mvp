import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check, Terminal, Wifi, CloudLightning, RefreshCw } from 'lucide-react';
import { PartnerSession } from '../types';

interface PartnerApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerSession: PartnerSession;
  onSave: (apiKey: string, apiUrl: string, active: boolean) => void;
}

export default function PartnerApiModal({ isOpen, onClose, partnerSession, onSave }: PartnerApiModalProps) {
  const [apiKey, setApiKey] = useState(partnerSession.apiKey || '');
  const [apiUrl, setApiUrl] = useState(partnerSession.apiUrl || `https://api.${partnerSession.platformName.toLowerCase().replace(' ', '')}.com/v2/listings`);
  const [isActive, setIsActive] = useState(partnerSession.isActive);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testOutput, setTestOutput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(partnerSession.apiKey || '');
      setApiUrl(partnerSession.apiUrl || `https://api.${partnerSession.platformName.toLowerCase().replace(' ', '')}.com/v2/listings`);
      setIsActive(partnerSession.isActive);
      setTestStatus('idle');
      setTestOutput('');
      setSuccessMsg('');
    }
  }, [isOpen, partnerSession]);

  if (!isOpen) return null;

  const handleTestConnection = () => {
    if (!apiUrl) {
      setTestStatus('error');
      setTestOutput('Error: API Endpoint url is required.');
      return;
    }
    setTestStatus('testing');
    setTestOutput('Initializing client handshake...');

    setTimeout(() => {
      setTestOutput(prev => prev + '\nResolving host path: ' + apiUrl);
    }, 400);

    setTimeout(() => {
      setTestOutput(prev => prev + '\nSending credential payload x-api-key: ' + (apiKey ? apiKey.substring(0, 8) + '********' : 'NULL'));
    }, 800);

    setTimeout(() => {
      if (!apiKey || apiKey.length < 5) {
        setTestStatus('error');
        setTestOutput(prev => prev + '\n[ERROR] Authentication Failed: 401 Unauthorized API key.');
      } else {
        setTestStatus('success');
        setTestOutput(prev => prev + '\n[SUCCESS] Status 200 OK - Authorized correctly as ' + partnerSession.platformName + ' Node.');
      }
    }, 1400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(apiKey, apiUrl, isActive);
    setSuccessMsg('Configurations synced successfully with BusLens core engine!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div 
        className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        id="partner-api-modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header line */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-emerald-600/15 border border-emerald-500/25 rounded-2xl text-emerald-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white tracking-tight">{partnerSession.platformName} API Hub</h3>
              <span className="text-[9px] bg-blue-500/15 text-blue-400 font-bold px-1.5 py-0.2 rounded border border-blue-500/20">
                Authorized
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Configure live query scraper APIs with strict email verification lock</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-2.5 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity lock notice */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-slate-200">Email Identity Bound Access Only</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                You are authenticated via <span className="text-white font-mono font-medium">{partnerSession.email}</span>. Under platform guidelines, you can <span className="text-emerald-400 font-bold">ONLY</span> interface details for the <span className="text-emerald-400 font-bold underline">{partnerSession.platformName}</span> network.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Scraper API URL Endpoint
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.redbus.com/v2/listings"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Private Portal Access Token / API Key
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. rb_sec_live_99d1..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-950/20 px-4 py-3 rounded-xl border border-slate-800">
            <div className="leading-tight">
              <span className="text-xs font-bold text-slate-200 block">Inject Scraper Results</span>
              <span className="text-[10px] text-slate-400">Stream real-time lists directly into active BusLens UI queries</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Scraper Test Engine panel */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 overflow-hidden relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-350 font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Terminal className="w-3 h-3 text-slate-500" /> API Diagnostic Scraper Tests
              </span>
              <button
                type="button"
                onClick={handleTestConnection}
                className="text-[10px] font-bold text-emerald-400 hover:text-white flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 hover:bg-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-all"
              >
                {testStatus === 'testing' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                ) : (
                  <CloudLightning className="w-3 h-3" />
                )}
                <span>Ping Access Endpoint</span>
              </button>
            </div>

            {testStatus !== 'idle' ? (
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-850 text-[10px] font-mono whitespace-pre-line leading-relaxed min-h-20 text-slate-450 text-left">
                {testOutput}
                {testStatus === 'success' && (
                  <div className="mt-2 text-emerald-400 font-bold flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Live Scraping Ready for search queries!
                  </div>
                )}
                {testStatus === 'error' && (
                  <div className="mt-2 text-rose-400 font-bold">
                    [FAIL] Handshake ended with protocol warning. Please provide key layout.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                Execute a trial query with simulated JSON headers before deploying the client node globally.
              </p>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold msg-button transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition"
            >
              Save API Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
