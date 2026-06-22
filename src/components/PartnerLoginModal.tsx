import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Key, CheckCircle, Mail, RotateCw, RefreshCw } from 'lucide-react';

interface PartnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, platformId: string, platformName: string) => void;
}

export default function PartnerLoginModal({ isOpen, onClose, onLoginSuccess }: PartnerLoginModalProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpMode, setOtpMode] = useState<'email' | 'fallback'>('fallback');
  const [apiMessage, setApiMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminPlatformId, setAdminPlatformId] = useState('plat-redbus');

  // Helper to resolve email domain to supported operators
  const getPlatformDetails = (emailStr: string) => {
    const cleanEmail = emailStr.trim().toLowerCase();
    if (cleanEmail === 'krpandey25646@gmail.com') {
      const names: Record<string, string> = {
        'plat-redbus': 'redBus',
        'plat-abhibus': 'AbhiBus',
        'plat-makemytrip': 'MakeMyTrip',
        'plat-paytm': 'Paytm',
      };
      return { id: adminPlatformId, name: `${names[adminPlatformId]} (Admin)` };
    }

    const parts = cleanEmail.split('@');
    if (parts.length < 2) return null;
    const domain = parts[1];

    if (domain.includes('redbus.com')) {
      return { id: 'plat-redbus', name: 'redBus' };
    }
    if (domain.includes('abhibus.com')) {
      return { id: 'plat-abhibus', name: 'AbhiBus' };
    }
    if (domain.includes('makemytrip.com')) {
      return { id: 'plat-makemytrip', name: 'MakeMyTrip' };
    }
    if (domain.includes('paytm.com')) {
      return { id: 'plat-paytm', name: 'Paytm' };
    }
    return null;
  };

  const detectedPlatform = getPlatformDetails(email);

  // Clear states when toggled
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setOtp('');
      setStep(1);
      setError('');
      setGeneratedOtp('');
      setOtpMode('fallback');
      setApiMessage('');
      setIsLoading(false);
      setAdminPlatformId('plat-redbus');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    const details = getPlatformDetails(email);
    if (!details) {
      setError(
        'Unauthorized domain extension. Please log in with partner domain email (e.g. name@redbus.com, name@abhibus.com, name@makemytrip.com, name@paytm.com) or use the authorized admin email krpandey25646@gmail.com.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          platformId: details.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger verification OTP.');
      }

      setGeneratedOtp(data.otp || '');
      setOtpMode(data.mode);
      setApiMessage(data.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error occurred communicating with the email dispatch server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (!detectedPlatform) {
      setError('Something went wrong matching your partner portal details.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          platformId: detectedPlatform.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP code.');
      }

      onLoginSuccess(email, data.platformId, data.platformName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Content wrapper */}
      <div 
        className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        id="partner-login-modal"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-xl transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-600/15 border border-blue-500/25 rounded-2xl text-blue-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white tracking-tight">Partner Portal Authentication</h3>
            <p className="text-[10px] text-slate-400 font-medium">Verify your agency credential to integrate live APIs</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <span className="font-bold shrink-0 text-rose-400">⚠️</span>
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/40 text-xs text-slate-300 space-y-2">
              <span className="text-blue-400 font-extrabold block text-[10px] uppercase tracking-wider">
                System Administrator Sandbox Bypass
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                You can enter <strong className="text-slate-100 font-bold">krpandey25646@gmail.com</strong> as email which is the exclusive administrator email allowed to log in across operators.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail('krpandey25646@gmail.com');
                  setError('');
                }}
                className="w-full text-left bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 font-semibold px-3 py-2 rounded-xl border border-blue-500/20 text-xs flex items-center justify-between transition"
              >
                <span>Use Admin: krpandey25646@gmail.com</span>
                <span className="text-[10px] text-blue-400 underline">Select &rarr;</span>
              </button>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Partner Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g. support@redbus.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-slate-600 pl-10"
                />
                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                Enter your authorized employee email. Allowed extensions are redbus.com, abhibus.com, makemytrip.com, paytm.com, or the administrator email krpandey25646@gmail.com.
              </p>
            </div>

            {email.trim().toLowerCase() === 'krpandey25646@gmail.com' && (
              <div className="space-y-1.5 bg-blue-950/20 p-3 rounded-2xl border border-blue-900/30 animate-fade-in">
                <label className="block text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none mb-1">
                  1. Choose Emulated Operator
                </label>
                <select
                  value={adminPlatformId}
                  onChange={(e) => {
                    setAdminPlatformId(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  <option value="plat-redbus">redBus (Admin Bypass)</option>
                  <option value="plat-abhibus">AbhiBus (Admin Bypass)</option>
                  <option value="plat-makemytrip">MakeMyTrip (Admin Bypass)</option>
                  <option value="plat-paytm">Paytm (Admin Bypass)</option>
                </select>
              </div>
            )}

            {detectedPlatform && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300 animate-fade-in">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Detected Portal:
                </span>
                <span className="font-black tracking-wider uppercase bg-emerald-500/20 px-2 py-0.5 rounded-md">
                  {detectedPlatform.name}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Requesting secure token...</span>
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            
            {/* Real SMTP Mail status */}
            {otpMode === 'email' ? (
              <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4 text-xs">
                <span className="block font-bold text-emerald-400 uppercase tracking-widest text-[9px] mb-1">
                  ✉️ Real Email OTP Sent
                </span>
                <p className="text-slate-200 leading-relaxed font-semibold">
                  We have triggered a secure verification email to <span className="text-white font-black underline">{email}</span>.
                </p>
                <p className="text-slate-400 mt-2 text-[10px]">
                  Please check your inbox or spam folder. Enter the 6-digit pin code sent to verify.
                </p>
              </div>
            ) : (
              /* Fallback alert block when SMTP details are not configured yet */
              <div className="bg-amber-900/25 border border-amber-800/45 rounded-2xl p-4 text-xs">
                <span className="block font-bold text-amber-500 uppercase tracking-widest text-[9px] mb-1">
                  ⚠️ SMTP Configuration Pending
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px] mb-2.5">
                  SMTP variables (SMTP_HOST, SMTP_USER, etc) are not configured. Go to Secrets Settings to insert real email credentials. Below is the generated code:
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-400 text-[10px] block font-mono">CODE:</span>
                    <span className="font-mono text-sm font-black text-emerald-400 tracking-wider">
                      {generatedOtp || '123456'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(generatedOtp || '123456')}
                    className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                  >
                    Autofill
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="------"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl font-mono font-black tracking-[1em] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Verifying credential...</span>
                </>
              ) : (
                'Verify & Log In'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setError('');
              }}
              className="w-full bg-transparent hover:bg-slate-850 text-slate-400 text-[10px] font-bold py-2 rounded-xl transition"
            >
              Change Email Address
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
