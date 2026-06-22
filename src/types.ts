/**
 * BusLens Shared TypeScript Interfaces
 * Aligned with the database design and mock data specifications.
 */

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string;
  isVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface SearchHistory {
  id: string;
  userId?: string;
  sourceCity: string;
  destinationCity: string;
  travelDate: string;
  passengers: number;
  searchedAt: string;
}

export interface BusOperator {
  id: string;
  operatorName: string;
  operatorLogo: string;
  rating: number;
  totalReviews: number;
  supportNumber: string;
  isVerified: boolean;
}

export interface BookingPlatform {
  id: string;
  platformName: string;
  websiteUrl: string;
  logoUrl: string;
  affiliateCode: string;
  isActive: boolean;
}

export interface TravelRoute {
  id: string;
  sourceCity: string;
  destinationCity: string;
  distanceKm: number;
  averageDurationMinutes: number;
  popularRoute: boolean;
}

export interface BusListing {
  id: string;
  routeId: string;
  operatorId: string;
  platformId: string;
  busName: string; // operator name + service e.g. "Zingbus Plus"
  busType: 'AC Sleeper' | 'Non-AC Sleeper' | 'AC Seater' | 'Non-AC Seater';
  departureTime: string; // ISO String or ISO-like HH:MM format
  arrivalTime: string;
  durationMinutes: number; // e.g. 495 (8h 15m)
  boardingPoint: string;
  droppingPoint: string;
  originalPrice: number;
  discountedPrice: number;
  taxes: number;
  finalPrice: number;
  availableSeats: number;
  windowSeats: number;
  rating: number;
  reviewsCount: number;
  liveTracking: boolean;
  chargingPort: boolean;
  blanket: boolean;
  waterBottle: boolean;
  wifi: boolean;
  platformRedirectUrl: string;
  badge?: 'Cheapest Today' | 'Best Value' | 'Most Reliable' | null;
}

export interface Coupon {
  id: string;
  platformId: string;
  couponCode: string;
  description: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minimumBooking: number;
  validFrom: string;
  validTill: string;
  isActive: boolean;
}

export interface PriceHistory {
  id: string;
  busListingId: string;
  price: number;
  trackedAt: string;
}

export interface PriceAlert {
  id: string;
  userId?: string;
  sourceCity: string;
  destinationCity: string;
  targetPrice: number;
  travelDate: string;
  notificationSent: boolean;
  createdAt: string;
}

export interface FavoriteRoute {
  id: string;
  userId: string;
  routeId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  operatorId: string;
  rating: number;
  reviewText: string;
  cleanlinessScore: number; // 1-5
  punctualityScore: number; // 1-5
  comfortScore: number; // 1-5
  safetyScore: number; // 1-5
  createdAt: string;
}

export interface BookingClick {
  id: string;
  userId?: string;
  busListingId: string;
  platformId: string;
  clickedAt: string;
  ipAddress: string;
  deviceType: string;
  affiliateUrl?: string;
}

export interface ScraperLog {
  id: string;
  platformId: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  recordsFetched: number;
  errorMessage?: string;
  startedAt: string;
  completedAt: string;
}

export interface PartnerSession {
  email: string;
  isLoggedIn: boolean;
  platformId: string; // 'plat-redbus', 'plat-abhibus', etc.
  platformName: string; // 'redBus', 'AbhiBus', etc.
  apiKey?: string;
  apiUrl?: string;
  isActive: boolean;
}

