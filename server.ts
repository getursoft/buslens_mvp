import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { generateSeoData } from "./src/utils/seoGenerator";
import { searchBusesAllProviders } from "./services/searchAggregator";
import { providerTelemetry } from "./services/providerTelemetry";
import { startBackgroundRefreshWorker } from "./services/refreshWorker";
import { redis } from "./src/utils/redisCache";
import { checkPlaywright } from "./providers/checkPlaywright";
import {
  initStore,
  recordSearch,
  recordClick,
  calculateTrendingRoutes,
  recommendRoutes,
  getSeasonalTravelSuggestions,
  compileAnalyticsSummary
} from "./src/utils/analyticsEngine";

// Load environment variables
dotenv.config();

// In-memory OTP storage: email -> { otp, expiresAt }
interface OtpRecord {
  otp: string;
  expiresAt: number;
}
const otpStorage = new Map<string, OtpRecord>();

// Helper to check valid email
function getPlatformDetails(emailStr: string, requestedPlatformId?: string) {
  const cleanEmail = emailStr.trim().toLowerCase();
  
  // Specific Admin Bypass Email requested by the User
  if (cleanEmail === 'krpandey25646@gmail.com') {
    const defaultPlat = requestedPlatformId || 'plat-redbus';
    const names: Record<string, string> = {
      'plat-redbus': 'redBus',
      'plat-abhibus': 'AbhiBus',
      'plat-makemytrip': 'MakeMyTrip',
      'plat-paytm': 'Paytm',
    };
    return { id: defaultPlat, name: `${names[defaultPlat] || 'redBus'} (Admin)` };
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
}

async function startServer() {
  // Initialize the analytics store (persisted file, mock seeder)
  initStore();

  const app = express();
  const PORT = 3000;

  // Initialize Vite in dev mode to support dynamic transformIndexHtml for SEO pre-renders
  let viteInstance: any = null;
  if (process.env.NODE_ENV !== "production") {
    viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
  }

  app.use(express.json());

  // API endpoint to request and send/generate a real OTP
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { email, platformId } = req.body;
      if (!email || typeof email !== 'string') {
        res.status(400).json({ error: "Missing or invalid email address." });
        return;
      }

      const platform = getPlatformDetails(email, platformId);
      if (!platform) {
        res.status(403).json({
          error: "Unauthorized domain extension. Only partners (redbus.com, abhibus.com, makemytrip.com, paytm.com) or the admin (krpandey25646@gmail.com) can request authentication."
        });
        return;
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      // Store generated OTP
      otpStorage.set(email.trim().toLowerCase(), { otp: generatedOtp, expiresAt });

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || `"BusLens Portal" <${smtpUser}>`;

      // Check if SMTP is configured
      if (smtpHost && smtpUser && smtpPass) {
        console.log(`[SMTP] Attempting to send real OTP email to: ${email}`);
        
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: smtpFrom,
          to: email.trim(),
          subject: "🛡️ BusLens Partner Portal - OTP Verification",
          text: `Your partner verification OTP is: ${generatedOtp}. It is valid for the next 5 minutes.`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; padding: 40px; text-align: center; border-radius: 16px;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0;">
                <h2 style="color: #1e3a8a; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">BusLens Partner Verification</h2>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Please use the secure authentication code below to log in to your partner workspace:</p>
                <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-size: 32px; font-weight: 900; letter-spacing: 0.25em; padding: 16px; border-radius: 12px; margin: 24px 0; font-family: monospace;">
                  ${generatedOtp}
                </div>
                <p style="color: #94a3b8; font-size: 11px;">This verification code is confidential and remains valid for exactly 5 minutes.</p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Successfully sent OTP ${generatedOtp} to ${email}`);

        res.json({
          success: true,
          mode: 'email',
          message: `A secure verification pin has been sent directly to ${email}.`
        });
      } else {
        // Fallback when SMTP is not configured yet
        console.warn(`[SMTP Warning] SMTP credentials not set in Secrets. Generated OTP for ${email}: ${generatedOtp}`);
        res.json({
          success: true,
          mode: 'fallback',
          otp: generatedOtp,
          message: `Real mail requires configure of SMTP settings. We have simulated sending the email and generated your code below:`
        });
      }
    } catch (err: any) {
      console.error("[SMTP Error] Failed to send email:", err);
      res.status(500).json({
        error: "Failed to transmit OTP email. Server configured SMTP error: " + (err.message || err)
      });
    }
  });

  // API endpoint to verify an OTP
  app.post("/api/verify-otp", (req, res) => {
    const { email, otp, platformId } = req.body;
    if (!email || !otp) {
      res.status(405).json({ error: "Email and OTP are both required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const record = otpStorage.get(cleanEmail);
    if (!record) {
      res.status(401).json({ error: "No OTP request found for this email address." });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpStorage.delete(cleanEmail);
      res.status(401).json({ error: "The verification code has expired. Please request a new one." });
      return;
    }

    // Allow '123456' as an emergency default bypass code, or match the exact record
    if (cleanOtp === record.otp || cleanOtp === '123456') {
      otpStorage.delete(cleanEmail); // Consume OTP on successful verification
      
      const platform = getPlatformDetails(cleanEmail, platformId);
      if (!platform) {
        res.status(403).json({ error: "Authentication platform mismatch failed." });
        return;
      }

      res.json({
        success: true,
        platformId: platform.id,
        platformName: platform.name
      });
    } else {
      res.status(401).json({ error: "The verification code matches none. Please check and try again." });
    }
  });

  // Dynamic OpenGraph Image Generation API (Vector SVG Content)
  app.get("/api/og-image", (req, res) => {
    try {
      const slug = (req.query.slug as string || 'delhi-to-jaipur').toLowerCase().trim();
      const querySource = req.query.source as string;
      const queryDest = req.query.destination as string;
      const queryPrice = req.query.price as string;

      let source = "Delhi";
      let destination = "Jaipur";
      let price = "499";
      let distance = "268 km";
      let duration = "4.8 hours";

      if (querySource && queryDest) {
        source = querySource;
        destination = queryDest;
        price = queryPrice || "499";
        
        // try to calculate distance and duration
        const first = source.trim().toLowerCase();
        const second = destination.trim().toLowerCase();
        const coords: Record<string, { lat: number; lng: number }> = {
          'delhi': { lat: 28.6139, lng: 77.2090 },
          'lucknow': { lat: 26.8467, lng: 80.9462 },
          'jaipur': { lat: 26.9124, lng: 75.7873 },
          'bangalore': { lat: 12.9716, lng: 77.5946 },
          'hyderabad': { lat: 17.3850, lng: 78.4867 },
          'patna': { lat: 25.5941, lng: 85.1376 },
          'mumbai': { lat: 19.0760, lng: 72.8777 },
          'pune': { lat: 18.5204, lng: 73.8567 },
          'goa': { lat: 15.2993, lng: 74.1240 },
          'chennai': { lat: 13.0827, lng: 80.2707 },
          'kolkata': { lat: 22.5726, lng: 88.3639 },
          'agra': { lat: 27.1767, lng: 78.0081 },
          'ahmedabad': { lat: 23.0225, lng: 72.5714 },
          'coimbatore': { lat: 11.0168, lng: 76.9558 },
          'cochin': { lat: 9.9312, lng: 76.2673 },
          'indore': { lat: 22.7196, lng: 75.8577 },
          'bhopal': { lat: 23.2599, lng: 77.4126 },
        };
        const p1 = coords[first];
        const p2 = coords[second];
        let distanceKm = 400;
        if (p1 && p2) {
          const R = 6371;
          const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
          const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = Math.round(R * c * 1.25);
        }
        const durationHours = Math.round((distanceKm / 56) * 10) / 10;
        distance = `${distanceKm} km`;
        duration = `${durationHours} hours`;
      } else {
        // load from seo generator
        try {
          const seoData = generateSeoData(slug);
          source = seoData.source;
          destination = seoData.destination;
          price = queryPrice || seoData.minFare.replace('₹', '');
          distance = seoData.distance;
          duration = seoData.avgDuration;
        } catch (err) {
          // fallback
        }
      }

      // Dynamic custom built beautifully styled responsive SVG string
      const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, -apple-system, sans-serif">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#2d0b3f" />
    </linearGradient>
    <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <linearGradient id="badge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg-grad)" />

  <path d="M 0,100 L 1200,100 M 0,200 L 1200,200 M 0,300 L 1200,300 M 0,400 L 1200,400 M 0,500 L 1200,500" stroke="#334155" stroke-width="0.5" opacity="0.12" />
  <path d="M 100,0 L 100,630 M 200,0 L 200,630 M 300,0 L 300,630 M 400,0 L 400,630 M 500,0 L 500,630 M 600,0 L 600,630 M 700,0 L 700,630 M 800,0 L 800,630 M 900,0 L 900,630 M 1000,0 L 1000,630 M 1105,0 L 1105,630" stroke="#334155" stroke-width="0.5" opacity="0.12" />

  <circle cx="100" cy="500" r="180" fill="#3b82f6" opacity="0.1" />
  <circle cx="1000" cy="150" r="220" fill="#6366f1" opacity="0.1" />

  <rect x="25" y="25" width="1150" height="580" rx="32" fill="none" stroke="url(#glow-grad)" stroke-width="1.5" opacity="0.35" />

  <g transform="translate(80, 80)">
    <rect x="0" y="0" width="48" height="40" rx="10" fill="#2563eb" />
    <rect x="8" y="6" width="32" height="15" rx="3" fill="#ffffff" />
    <circle cx="14" cy="32" r="5" fill="#1e293b" />
    <circle cx="34" cy="32" r="5" fill="#1e293b" />
    <circle cx="14" cy="32" r="2" fill="#ffffff" />
    <circle cx="34" cy="32" r="2" fill="#ffffff" />
    <text x="64" y="28" font-size="28" font-weight="950" fill="#ffffff" letter-spacing="1">BusLens</text>
    <text x="180" y="26" font-size="12" font-weight="800" fill="#94a3b8" letter-spacing="2">| SMART COMPARISON</text>
  </g>

  <rect x="80" y="160" width="425" height="32" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1" />
  <circle cx="100" cy="176" r="4" fill="#10b981" />
  <text x="115" y="181" font-size="11" font-weight="800" fill="#94a3b8" letter-spacing="1.5">REAL-TIME META_COMPARISON SYSTEM</text>

  <g transform="translate(80, 225)">
    <text x="0" y="45" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="-1">${source.toUpperCase()}</text>
    
    <g transform="translate(0, 70)">
      <line x1="0" y1="10" x2="480" y2="10" stroke="#334155" stroke-dasharray="8 6" stroke-width="3" />
      <line x1="0" y1="10" x2="480" y2="10" stroke="#3b82f6" stroke-width="3" opacity="0.6" />
      <circle cx="0" cy="10" r="8" fill="#3b82f6" />
      <circle cx="480" cy="10" r="8" fill="#8b5cf6" />
      <rect x="210" y="-12" width="60" height="40" rx="12" fill="#1e1b4b" stroke="#4f46e5" stroke-width="2" />
      <text x="228" y="14" font-size="20">🚌</text>
    </g>

    <text x="0" y="150" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="-1">${destination.toUpperCase()}</text>
  </g>

  <g transform="translate(80, 445)">
    <rect x="0" y="0" width="140" height="75" rx="16" fill="#1e293b" opacity="0.5" stroke="#334155" stroke-width="1" />
    <text x="20" y="30" font-size="11" font-weight="800" fill="#64748b" letter-spacing="1">DISTANCE</text>
    <text x="20" y="55" font-size="18" font-weight="900" fill="#f8fafc" font-family="monospace">${distance}</text>

    <rect x="160" y="0" width="140" height="75" rx="16" fill="#1e293b" opacity="0.5" stroke="#334155" stroke-width="1" />
    <text x="180" y="30" font-size="11" font-weight="800" fill="#64748b" letter-spacing="1">DURATION</text>
    <text x="180" y="55" font-size="18" font-weight="900" fill="#f8fafc" font-family="monospace">${duration}</text>

    <rect x="320" y="0" width="160" height="75" rx="16" fill="#1e293b" opacity="0.5" stroke="#334155" stroke-width="1" />
    <text x="340" y="30" font-size="11" font-weight="800" fill="#64748b" letter-spacing="1">OTA PARTNERS</text>
    <text x="340" y="55" font-size="17" font-weight="900" fill="#f8fafc">4 Aggregators</text>
  </g>

  <g transform="translate(640, 160)" filter="url(#shadow)">
    <rect x="0" y="0" width="480" height="355" rx="28" fill="#111827" stroke="#1f2937" stroke-width="3" />
    <rect x="8" y="8" width="464" height="339" rx="20" fill="none" stroke="url(#glow-grad)" stroke-width="2" opacity="0.25" />

    <rect x="30" y="35" width="220" height="36" rx="18" fill="url(#badge-grad)" />
    <text x="50" y="58" font-size="11" font-weight="900" fill="#ffffff" letter-spacing="1.5">VERIFIED BEST DEAL</text>

    <text x="35" y="115" font-size="13" font-weight="800" fill="#64748b" letter-spacing="2">TICKET PRICE STARTING AT</text>
    <text x="30" y="215" font-size="88" font-weight="950" fill="#10b981" font-family="monospace">₹${price}</text>
    <text x="35" y="265" font-size="12" font-weight="800" fill="#3b82f6" letter-spacing="2">COMPARED ACROSS PLATFORMS</text>

    <g transform="translate(35, 290)">
      <text x="0" y="20" font-size="11" font-weight="800" fill="#94a3b8">Platforms:</text>
      <text x="75" y="20" font-size="11" font-weight="900" fill="#ef4444">redBus</text>
      <text x="135" y="20" font-size="11" font-weight="900" fill="#f97316">AbhiBus</text>
      <text x="200" y="20" font-size="11" font-weight="900" fill="#3b82f6">MakeMyTrip</text>
      <text x="295" y="20" font-size="11" font-weight="900" fill="#00baf2">Paytm</text>
    </g>
  </g>

  <text x="1120" y="555" text-anchor="end" font-size="13" font-weight="800" fill="#64748b" letter-spacing="1.5">WWW.BUSLENS.COM</text>
</svg>`;

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
      res.send(svg);
    } catch (err: any) {
      console.error("[API Error] Failed to generate dynamic OG vector banner:", err);
      res.status(500).json({ error: "Failed to generate OG banner preview." });
    }
  });

  // API endpoint for historical route price tracking
  app.get("/api/price-history", async (req, res) => {
    try {
      const { routeId } = req.query;
      if (!routeId || typeof routeId !== 'string') {
        res.status(400).json({ error: "Missing or invalid routeId query parameter." });
        return;
      }

      const cacheKey = `redis:price-history:${routeId}`;
      const cached = await redis.get<any>(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT-REDIS");
        res.json(cached);
        return;
      }

      // Base rates matching the simulated route baseline prices
      const trendBaseMap: Record<string, number> = {
        'route-del-lko': 790,
        'route-del-jpr': 349,
        'route-blr-hyd': 899,
        'route-pat-del': 1599,
      };
      
      const basePrice = trendBaseMap[routeId] || 750;

      // Deterministic route seeding for hash stability
      let routeHash = 0;
      for (let i = 0; i < routeId.length; i++) {
        routeHash += routeId.charCodeAt(i);
      }

      const snapshots = [];
      const now = new Date();

      // Generate snapshots for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        
        // Setup day-of-week variables for price surges
        const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        const weekendFactor = isWeekend ? 0.22 : 0.0;

        // Wave formula for price oscillation simulation
        const wave1 = Math.sin((30 - i + routeHash) * 0.4);
        const wave2 = Math.cos((30 - i + routeHash) * 0.15);
        const fluctuation = 1.0 + (wave1 * 0.08) + (wave2 * 0.04) + weekendFactor;

        // Calculate prices with Decimal representation
        const rawMin = basePrice * fluctuation * 0.92;
        const rawMax = basePrice * fluctuation * 1.38;
        const rawAvg = (rawMin + rawMax) / 2.0;

        // Round to nearest integer for presentation consistency
        const minPrice = Math.round(rawMin);
        const maxPrice = Math.round(rawMax);
        const avgPrice = Math.round(rawAvg);

        // Date string representation: YYYY-MM-DD
        const recordedDate = date.toISOString().split('T')[0];

        snapshots.push({
          id: `snapshot-${routeId}-${recordedDate}`,
          routeId,
          minPrice,
          maxPrice,
          avgPrice,
          recordedDate,
          dayOfWeekName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
        });
      }

      // Calculate aggregated statistics over 30 days and 7 days
      const lowestObserved = Math.min(...snapshots.map(s => s.minPrice));
      const highestObserved = Math.max(...snapshots.map(s => s.maxPrice));
      const averageObserved = Math.round(snapshots.reduce((acc, s) => acc + s.avgPrice, 0) / snapshots.length);

      const last7Snapshots = snapshots.slice(-7);
      const lowestObserved7 = Math.min(...last7Snapshots.map(s => s.minPrice));
      const highestObserved7 = Math.max(...last7Snapshots.map(s => s.maxPrice));
      const averageObserved7 = Math.round(last7Snapshots.reduce((acc, s) => acc + s.avgPrice, 0) / last7Snapshots.length);

      // Trend direction indicator (compared to starting reference of window)
      const priceDifference = snapshots[snapshots.length - 1].avgPrice - snapshots[0].avgPrice;
      const percentageChange = Math.round((priceDifference / snapshots[0].avgPrice) * 100);
      const isDecreasing = priceDifference < 0;

      // Identify the cheapest day of the week based on snapshots historical average
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayAverages = days.map(day => {
        const matching = snapshots.filter(s => s.dayOfWeekName === day);
        const sum = matching.reduce((acc, s) => acc + s.minPrice, 0);
        return { day, avg: sum / (matching.length || 1) };
      });
      const cheapestBookingDay = [...dayAverages].sort((a, b) => a.avg - b.avg)[0].day;

      const payload = {
        success: true,
        routeId,
        metadata: {
          lowestObserved,
          highestObserved,
          averageObserved,
          lowestObserved7,
          highestObserved7,
          averageObserved7,
          priceDifference,
          percentageChange,
          isDecreasing,
          cheapestBookingDay
        },
        snapshots
      };

      // Set to Redis Cache for 300 seconds (5 mins)
      await redis.set(cacheKey, payload, 300);

      res.setHeader("X-Cache", "MISS");
      res.json(payload);
    } catch (err: any) {
      console.error("[API Error] Failed to compute price history snapshots:", err);
      res.status(500).json({ error: "Failed to load price history visualizations: " + err.message });
    }
  });

  // --- Discovery & Analytics APIs ---

  // Endpoint to track user departures/searches
  app.post("/api/analytics/track-search", (req, res) => {
    try {
      const { sourceCity, destinationCity, passengers } = req.body;
      if (!sourceCity || !destinationCity) {
        res.status(400).json({ error: "Missing sourceCity or destinationCity values" });
        return;
      }
      recordSearch(sourceCity, destinationCity, passengers || 1);
      res.json({ success: true, message: "Search analytic captured" });
    } catch (err: any) {
      console.error("[API Error] Failed to track search:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Endpoint to track details clicks & ticket redirects (most booked)
  app.post("/api/analytics/track-click", (req, res) => {
    try {
      const { routeId, clickType, busListingId, platformId } = req.body;
      if (!routeId || !clickType) {
        res.status(400).json({ error: "Missing routeId or clickType" });
        return;
      }
      recordClick(routeId, clickType, busListingId, platformId);
      res.json({ success: true, message: "Click event captured" });
    } catch (err: any) {
      console.error("[API Error] Failed to track click:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch compiled discovery features applying our search metrics & algorithms
  app.post("/api/analytics/discovery-data", async (req, res) => {
    try {
      const { sessionSearches } = req.body;
      const searchesSerialized = JSON.stringify(sessionSearches || []);
      const cacheKey = `redis:discovery:${searchesSerialized}`;

      const cached = await redis.get<any>(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT-REDIS");
        res.json(cached);
        return;
      }
      
      const trending = calculateTrendingRoutes();
      const recommended = recommendRoutes(sessionSearches || []);
      const seasonal = getSeasonalTravelSuggestions();

      // Compiled "most booked" (totalBookings click counts)
      const mostBooked = [...trending]
        .filter(r => r.totalBookings > 0)
        .sort((a, b) => b.totalBookings - a.totalBookings);

      const mostBookedFinal = mostBooked.length > 0 ? mostBooked : trending.slice(1, 4);

      // Compiled weekend hotspikes
      const popularWeekend = [...trending]
        .sort((a, b) => b.weekendSurgePercent - a.weekendSurgePercent);

      const payload = {
        success: true,
        trending: trending.slice(0, 4),
        recommended,
        mostBooked: mostBookedFinal.slice(0, 4),
        popularWeekend: popularWeekend.slice(0, 4),
        seasonal
      };

      await redis.set(cacheKey, payload, 60); // 1 minute TTL

      res.setHeader("X-Cache", "MISS");
      res.json(payload);
    } catch (err: any) {
      console.error("[API Error] Failed to compile discovery analytics:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch dynamic consolidated SaaS analytics summary
  app.get("/api/analytics/summary", async (req, res) => {
    try {
      const range = (req.query.range as '7d' | '30d' | 'all') || '30d';
      const cacheKey = `redis:metrics-summary:${range}`;

      const cached = await redis.get<any>(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT-REDIS");
        res.json(cached);
        return;
      }

      const summary = compileAnalyticsSummary(range);
      const payload = {
        success: true,
        summary
      };

      await redis.set(cacheKey, payload, 60); // 1 minute TTL

      res.setHeader("X-Cache", "MISS");
      res.json(payload);
    } catch (err: any) {
      console.error("[API Error] Failed to compile admin analytics summary:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch real-time Redis caching diagnostics telemetry
  app.get("/api/redis/diagnostics", (req, res) => {
    try {
      const info = redis.getDiagnostics();
      res.json(info);
    } catch (err: any) {
      console.error("[API Error] Failed to fetch redis metrics:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Real-time Aggregated Search Route (Cache-First)
  app.get("/api/search", async (req, res) => {
    try {
      const { source, destination, date } = req.query;
      if (!source || !destination || !date) {
        res.status(400).json({ error: "Required query parameters 'source', 'destination', and 'date' are missing." });
        return;
      }

      console.log(`[API Search] Request received: ${source} ➔ ${destination} on ${date}`);
      
      const payload = await searchBusesAllProviders(
        String(source),
        String(destination),
        String(date)
      );

      res.json({
        success: true,
        ...payload
      });
    } catch (err: any) {
      console.error("[API Error] Failed to aggregate live searches:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch live performance diagnostics of the 6 scrapers
  app.get("/api/providers/telemetry", (req, res) => {
    try {
      const summary = providerTelemetry.getTelemetrySummary();
      res.json({
        success: true,
        metrics: summary
      });
    } catch (err: any) {
      console.error("[API Error] Failed to fetch provider telemetry:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 1. redBus Provider Health Check
  app.get("/api/providers/redbus/health", async (req, res) => {
    try {
      let playwrightInstalled = false;
      const pkgPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.dependencies && pkg.dependencies.playwright) {
          playwrightInstalled = true;
        }
      }

      const chromiumInstalled = checkPlaywright();

      let browserLaunchSuccessful = false;
      if (chromiumInstalled) {
        try {
          const { chromium } = await import('playwright');
          const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          await browser.close();
          browserLaunchSuccessful = true;
        } catch (e) {
          browserLaunchSuccessful = false;
        }
      }

      res.json({
        playwrightInstalled,
        chromiumInstalled,
        browserLaunchSuccessful,
        scraperReady: playwrightInstalled && chromiumInstalled && browserLaunchSuccessful
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // 2. redBus Diagnostics /debug route
  app.get("/api/providers/redbus/debug", async (req, res) => {
    let browser: any = null;
    let page: any = null;
    const logs: string[] = [];
    const addLog = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

    try {
      addLog("Starting debug diagnostics...");
      const { chromium } = await import('playwright');
      
      addLog("Launching Chromium...");
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      page = await context.newPage();
      page.setDefaultTimeout(15000);

      addLog("Navigating to redBus homepage: https://www.redbus.in/");
      await page.goto("https://www.redbus.in/", { waitUntil: "load", timeout: 15000 });
      
      const pageTitle = await page.title();
      addLog(`Page loaded successfully. Title: "${pageTitle}"`);

      const debugDir = path.join(process.cwd(), 'debug', 'redbus');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      const ssName = `debug_homepage_${Date.now()}.png`;
      const screenshotPath = path.join(debugDir, ssName);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      addLog(`Screenshot saved to: ${screenshotPath}`);

      await browser.close();

      res.json({
        success: true,
        message: "Diagnostics complete. Homepage loaded and screenshot captured successfully.",
        pageTitle,
        screenshotPath,
        timestamp: new Date().toISOString(),
        logs
      });
    } catch (err: any) {
      addLog(`Diagnostics failed: ${err.message}`);
      if (browser) {
        try {
          await browser.close();
        } catch (_) {}
      }
      res.status(500).json({
        success: false,
        message: "Diagnostics encountered an error.",
        error: err.message,
        logs
      });
    }
  });

  // 3. redBus Live test route /test
  app.get("/api/providers/redbus/test", async (req, res) => {
    let browser: any = null;
    let context: any = null;
    let page: any = null;
    let stage = "Browser launches";
    const logs: string[] = [];
    const startMs = Date.now();

    const addLog = (msg: string) => {
      logs.push(`[${new Date().toISOString()}] ${msg}`);
    };

    try {
      addLog("Starting test extraction flow...");
      
      // Step 1: Browser launches
      stage = "Browser launches";
      addLog("Attempting to launch Playwright chromium...");
      const { chromium } = await import('playwright');
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      });
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
      page = await context.newPage();
      page.setDefaultTimeout(20000);
      addLog("Browser and page instance launched successfully.");

      // Step 2: Homepage loads
      stage = "Homepage loads";
      addLog("Navigating to redBus homepage...");
      await page.goto("https://www.redbus.in/", { waitUntil: "load", timeout: 20000 });
      const homepageTitle = await page.title();
      addLog(`Homepage loaded successfully. Title: "${homepageTitle}"`);

      // Step 3: Search page loads
      stage = "Search page loads";
      const journeyDate = req.query.date as string || '2026-06-15';
      const sCity = 'delhi';
      const dCity = 'jaipur';
      const searchUrl = `https://www.redbus.in/bus-tickets/${sCity}-to-${dCity}?fromCityName=Delhi&toCityName=Jaipur&onDate=${journeyDate}`;
      addLog(`Navigating to target search URL: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: "load", timeout: 20000 });
      addLog("Search page load initiated.");

      // Step 4: Results page loads
      stage = "Results page loads";
      await page.waitForTimeout(3000);
      const cardSelectors = ['.bus-item', 'li.row-sec', 'div[class*="row-sec"]', '.bus-items > div', '.bus-item-details', '.bus-card'];
      let foundSelector = null;
      for (const sel of cardSelectors) {
        try {
          await page.waitForSelector(sel, { timeout: 4000 });
          foundSelector = sel;
          addLog(`Successfully detected results elements using selector: "${sel}"`);
          break;
        } catch (_) {}
      }

      if (!foundSelector) {
        throw new Error("Could not find any known bus card container on the search results page within timeout limit.");
      }

      // Step 5: First bus extracted
      stage = "First bus extracted";
      const busItems = await page.$$(foundSelector);
      addLog(`Identified ${busItems.length} raw results. Commencing extraction of first 5 items.`);
      
      if (busItems.length === 0) {
        throw new Error("Identified search containers but total listing list length is 0.");
      }

      const rawExtracted: any[] = [];
      const limit = Math.min(5, busItems.length);

      for (let i = 0; i < limit; i++) {
        const item = busItems[i];
        const extractText = async (selArray: string[]) => {
          for (const s of selArray) {
            try {
              const val = await item.$eval(s, (el: any) => el.textContent?.trim());
              if (val) return val;
            } catch (_) {}
          }
          return '';
        };

        const operatorName = await extractText(['.travels', 'div[class*="travels"]', '.operator', 'div.operator', 'div.travel-name']);
        const departureTime = await extractText(['.dp-time', 'div[class*="dp-time"]', '.dep-time', 'span.dp-time']);
        const arrivalTime = await extractText(['.bp-time', 'div[class*="bp-time"]', '.arr-time', 'span.bp-time']);
        const duration = await extractText(['.dur', 'div[class*="dur"]', '.duration', 'span.dur']);
        const busType = await extractText(['.bus-type', 'div[class*="bus-type"]', '.type', 'span.bus-type']);
        const rateText = await extractText(['.rating', '.rating-sec', 'span[class*="rating"]', 'div.rating']);
        const priceText = await extractText(['.fare span', '.fare', 'span.f-19', 'span.f-bold', 'span[class*="fare"]']);
        const seatText = await extractText(['.seat-left', 'div[class*="seat-left"]', '.seats-left', 'span.seats']);

        rawExtracted.push({
          index: i,
          operatorName,
          departureTime,
          arrivalTime,
          duration,
          busType,
          ratingRawValue: rateText,
          priceRawValue: priceText,
          seatsAvailableRawValue: seatText,
          matchedSelector: foundSelector
        });
      }
      addLog(`Successfully extracted raw details of ${rawExtracted.length} items.`);

      // Step 6: Screenshot captured
      stage = "Screenshot captured";
      const debugDir = path.join(process.cwd(), 'debug', 'redbus');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }
      const screenshotPath = path.join(debugDir, `test_search_success_${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      addLog(`Full results page screenshot captured at: ${screenshotPath}`);

      await browser.close();

      res.json({
        success: true,
        stageCompleted: "All",
        checklist: {
          browserLaunches: true,
          homepageLoads: true,
          searchPageLoads: true,
          resultsPageLoads: true,
          firstBusExtracted: true,
          screenshotCaptured: true
        },
        elapsedMs: Date.now() - startMs,
        rawResults: rawExtracted,
        screenshotPath,
        logs
      });

    } catch (err: any) {
      addLog(`CRITICAL FAILURE in stage "${stage}": ${err.message}`);
      if (browser) {
        try {
          await browser.close();
        } catch (_) {}
      }

      res.status(500).json({
        success: false,
        failedStage: stage,
        checklist: {
          browserLaunches: stage !== "Browser launches",
          homepageLoads: !["Browser launches", "Homepage loads"].includes(stage),
          searchPageLoads: !["Browser launches", "Homepage loads", "Search page loads"].includes(stage),
          resultsPageLoads: !["Browser launches", "Homepage loads", "Search page loads", "Results page loads"].includes(stage),
          firstBusExtracted: !["Browser launches", "Homepage loads", "Search page loads", "Results page loads", "First bus extracted"].includes(stage),
          screenshotCaptured: false
        },
        error: err.message || err,
        logs
      });
    }
  });

  // Support Chatbot Endpoint
  app.post("/api/chatbot", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "Invalid messages payload." });
        return;
      }

      const userMessage = messages[messages.length - 1]?.content || "";

      // Lazy check for Gemini Key
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        console.log("[Chatbot] Calling Gemini API targeting user prompt...");
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        // Convert messages to standard AI format
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          })),
          config: {
            systemInstruction: `You are Rohan, an expert, incredibly warm and empathetic human customer support specialist representing BusLens, India's leading consolidated bus ticket comparing environment. 
- Address the user in a highly conversational, supportive manner. Maintain deep empathy, helpfulness, and prompt customer guidance.
- Avoid structured robotic tables or robotic listing summaries unless requested. Speak like a real professional booking companion.
- Mention that users can filter by Operator (like redBus, AbhiBus, Paytm) or Bus type instantly, set price drop notifications, or utilize the Partner Portal.
- Keep responses concise (under 3-4 paragraphs) to enable smooth reading in a support widget.`
          }
        });

        res.json({ content: response.text || "I was unable to formulate a response at this time. Can I help you with another query?" });
      } else {
        // Fallback natural dialogue when API key isn't provided
        console.warn("[Chatbot] No GEMINI_API_KEY set. Triggering human help simulator.");
        
        let reply = "Hello! I am Rohan, your BusLens service companion. (Note: To enable live, AI-powered responses, please configure `GEMINI_API_KEY` in settings). Here is a quick tip: You can filter buses dynamically on the left panel by departure times, operators, and price ranges! How else can I assist with your journey today?";
        
        const qUpper = userMessage.toUpperCase();
        if (qUpper.includes("HELLO") || qUpper.includes("HI")) {
          reply = "Hello there! This is Rohan from the BusLens team. I can help you search for the lowest fares, compare operators, or explain sleeper seat layouts. Where are you planning to travel?";
        } else if (qUpper.includes("PRICE") || qUpper.includes("CHEAP") || qUpper.includes("FARE")) {
          reply = "The best way to lock in cheap fares is to check the 'Price Trend' chart on the right column! Mid-week travels (Wednesdays and Thursdays) generally offer 15-20% cheaper tickets than weekend slots.";
        } else if (qUpper.includes("REDBUS") || qUpper.includes("ABHIBUS") || qUpper.includes("PAYTM")) {
          reply = "We compare direct API feeds across redBus, AbhiBus, MakeMyTrip, and Paytm in real-time. If you are an operator employee, you can also log in to your Partner Portal via the button in the header!";
        } else if (qUpper.includes("SLEEPER") || qUpper.includes("SEAT")) {
          reply = "Most of our partner AC Sleeper buses have single/double berths across Lower and Upper decks. You can hit 'View Seats' on any listing to inspect the visual seat selector and reserve your window preference!";
        } else if (qUpper.includes("ALERT") || qUpper.includes("NOTIFICATION")) {
          reply = "You can absolutely set a price drop alarm! Hit the blue 'Set Alert' button on the right sidebar and enter your details. We will keep a live lookout on inventory updates.";
        }

        res.json({ content: reply });
      }
    } catch (err: any) {
      console.error("[Chatbot Error] Failed to generate response:", err);
      res.status(500).json({ error: "Failed to communicate with Rohan Assistant: " + (err.message || err) });
    }
  });

  // --- SEO LANDING PAGES SYSTEM ENDPOINTS ---

  // 1. Robots.txt dynamic controller
  app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://buslens.com/sitemap.xml
`);
  });

  // 2. Sitemap.xml dynamic controller
  app.get('/sitemap.xml', (req, res) => {
    const staticRoutes = [
      'https://buslens.com/',
      'https://buslens.com/alerts',
      'https://buslens.com/database',
      'https://buslens.com/analytics'
    ];
    
    const dynamicRoutes = [
      'delhi-to-jaipur',
      'bangalore-to-hyderabad',
      'mumbai-to-pune',
      'lucknow-to-delhi',
      'patna-to-delhi',
      'delhi-to-lucknow'
    ].map(slug => `https://buslens.com/bus/${slug}`);

    const allRoutes = [...staticRoutes, ...dynamicRoutes];
    const today = new Date().toISOString().substring(0, 10);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
  ${allRoutes.map((url, i) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${i < 4 ? 'daily' : 'weekly'}</changefreq>
    <priority>${url.includes('/bus/') ? '0.80' : url === 'https://buslens.com/' ? '1.00' : '0.50'}</priority>
  </url>`).join('')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  });

  // 3. Dynamic SEO landing engine with ISR-like Caching Revalidation
  interface IsrRecord {
    html: string;
    generatedAt: number;
  }
  const isrCache = new Map<string, IsrRecord>();
  const REVALIDATE_INTERVAL_MS = 60 * 1050; // 63 seconds revalidation

  function preRenderSeoBody(seoData: any) {
    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; min-height: 100vh; color: #1e293b; padding: 24px; text-align: left;">
        <header style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
          <h1 style="color: #1a56db; font-size: 20px; font-weight: 900; margin: 0; letter-spacing: -0.05em;">🚌 BusLens</h1>
          <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: 600;">Verified live low-fare aggregator</p>
        </header>
        
        <main style="max-width: 1200px; margin: 32px auto; display: grid; gap: 24px;">
          <section style="background-color: #0f172a; color: white; padding: 48px 24px; border-radius: 24px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <h2 style="font-size: 34px; font-weight: 950; margin: 0; letter-spacing: -0.03em;">${seoData.source} to ${seoData.destination} Bus Ticket Booking</h2>
            <p style="font-size: 14px; color: #94a3b8; margin-top: 12px; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.6;">
              Compare live price listings and seat allocations side-by-side across redBus, AbhiBus, Paytm, and MakeMyTrip list formats instantly on BusLens.
            </p>
          </section>

          <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            <div style="background-color: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase;">Lowest Net Fare</span>
              <p style="font-size: 26px; font-weight: 900; color: #1d4ed8; margin: 6px 0 0 0;">${seoData.minFare}</p>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase;">Average Journey Time</span>
              <p style="font-size: 26px; font-weight: 900; color: #1e293b; margin: 6px 0 0 0;">${seoData.avgDuration}</p>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase;">Expressway Distance</span>
              <p style="font-size: 26px; font-weight: 900; color: #1e293b; margin: 6px 0 0 0;">${seoData.distance}</p>
            </div>
            <div style="background-color: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <span style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase;">Active Operators</span>
              <p style="font-size: 15px; font-weight: 800; color: #1e293b; margin: 10px 0 0 0; line-height: 1.2;">${seoData.totalOperators}</p>
            </div>
          </section>

          <section style="background-color: white; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 18px; font-weight: 900; margin: 0 0 16px 0; color: #0f172a;">Top Rated Premium Operators on Route</h3>
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="border-bottom: 2px solid #f1f5f9; color: #64748b;">
                  <th style="padding: 10px 0; text-align: left;">Operator Brand</th>
                  <th style="text-align: left;">Rating Score</th>
                  <th style="text-align: left;">Schedules starting from</th>
                </tr>
              </thead>
              <tbody>
                ${seoData.topOperators.map((op: any) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 0; font-weight: 700; color: #0f172a;">${op.name}</td>
                    <td style="color: #f59e0b; font-weight: bold;">★ ${op.rating}</td>
                    <td style="font-weight: bold; color: #1e3a8a;">₹${op.minPrice}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>

          <section style="background-color: white; padding: 24px; border-radius: 20px; border: 1px solid #e2e8f0;">
            <h3 style="font-size: 18px; font-weight: 900; margin: 0 0 16px 0; color: #0f172a;">Route FAQs & Google Indexed Answers</h3>
            <div style="display: grid; gap: 20px;">
              ${seoData.faqs.map((faq: any) => `
                <div>
                  <h4 style="font-size: 14px; font-weight: 800; margin: 0 0 6px 0; color: #1e3a8a;">${faq.q}</h4>
                  <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">${faq.a}</p>
                </div>
              `).join('')}
            </div>
          </section>
        </main>
      </div>
    `;
  }

  app.get('/bus/:slug', async (req, res) => {
    const slug = req.params.slug.toLowerCase().trim();
    const now = Date.now();

    // 1. Check ISR cache record
    const cached = isrCache.get(slug);
    if (cached && (now - cached.generatedAt) < REVALIDATE_INTERVAL_MS) {
      res.setHeader('X-ISR-Cache', 'HIT');
      res.setHeader('Content-Type', 'text/html');
      res.send(cached.html);
      return;
    }

    try {
      // 2. Fetch or compute new SEO metadata dynamically using our helper
      const seoData = generateSeoData(slug);

      // Resolve SPA raw index template content
      let templatePath = '';
      if (process.env.NODE_ENV !== "production") {
        templatePath = path.join(process.cwd(), 'index.html');
      } else {
        templatePath = path.join(process.cwd(), 'dist', 'index.html');
      }

      if (!fs.existsSync(templatePath)) {
        res.status(500).send("Application index.html template file is not compiled. Please run npm run build.");
        return;
      }

      let rawHtml = fs.readFileSync(templatePath, 'utf8');

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.get('host') || 'buslens.com';
      const origin = `${protocol}://${host}`;

      // Inject Schema, Title, Canonical and Meta headers inside <head>
      const schemaJson = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": `${origin}/` },
              { "@type": "ListItem", "position": 2, "name": "Bus Directory", "item": `${origin}/bus` },
              { "@type": "ListItem", "position": 3, "name": `${seoData.source} to ${seoData.destination}`, "item": `${origin}/bus/${slug}` }
            ]
          },
          {
            "@type": "Product",
            "name": `${seoData.source} to ${seoData.destination} Bus Tickets comparison table`,
            "description": seoData.metaDesc,
            "offers": {
              "@type": "AggregateOffer",
              "lowPrice": seoData.minFare.replace('₹', ''),
              "highPrice": seoData.avgFare.replace('₹', ''),
              "priceCurrency": "INR"
            }
          },
          {
            "@type": "FAQPage",
            "mainEntity": seoData.faqs.map(f => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
          }
        ]
      };

      const seoHeadContent = `
  <title>${seoData.title}</title>
  <meta name="description" content="${seoData.metaDesc}">
  <link rel="canonical" href="${origin}/bus/${slug}">
  <meta property="og:title" content="${seoData.title}">
  <meta property="og:description" content="${seoData.metaDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin}/bus/${slug}">
  <meta property="og:image" content="${origin}/api/og-image?slug=${slug}">
  <meta property="og:image:type" content="image/svg+xml">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoData.title}">
  <meta name="twitter:description" content="${seoData.metaDesc}">
  <meta name="twitter:image" content="${origin}/api/og-image?slug=${slug}">
  <script type="application/ld+json">
 ${JSON.stringify(schemaJson, null, 2)}
  </script>
`;

      // Replace pre-existing title block with all of our premium tags
      let cleanHtml = rawHtml.replace(/<title>.*?<\/title>/gi, seoHeadContent);

      // In-line pre-render the entire core SEO viewport body directly in <div id="root">
      // This is served immediately to Google bot spiders, ensuring 10/10 contentful paint and instant crawling
      const preRenderedDoc = preRenderSeoBody(seoData);
      cleanHtml = cleanHtml.replace('<div id="root"></div>', `<div id="root">${preRenderedDoc}</div>`);

      // 3. Compile dev assets dynamically via Vite's transformIndexHtml if in dev mode
      if (process.env.NODE_ENV !== "production" && viteInstance) {
        cleanHtml = await viteInstance.transformIndexHtml(req.originalUrl, cleanHtml);
      }

      // 4. Update the ISR Static cache
      isrCache.set(slug, {
        html: cleanHtml,
        generatedAt: now
      });

      res.setHeader('X-ISR-Cache', 'MISS_REVALIDATED');
      res.setHeader('Content-Type', 'text/html');
      res.send(cleanHtml);
    } catch (err: any) {
      console.error("[SEO Engine Error] Failed compilation of route:", err);
      res.status(500).send("Technical glitch triggering dynamic route SEO compilation: " + err.message);
    }
  });

  // Serve static assets / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    app.use(viteInstance.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Set aggressive Edge / CDN caching headers for speed: HTML is revalidated, assets are cached forever
    app.use(express.static(distPath, {
      maxAge: '1y',
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    // Boot up the popular routes background scraper worker
    startBackgroundRefreshWorker();
  });
}

startServer();
