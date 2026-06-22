import React, { useState } from 'react';
import { Database, Table, Key, Link, Shield, Code, Server, Zap, Search, Layers, RefreshCw } from 'lucide-react';
import { mockUsers, mockOperators, mockPlatforms, mockRoutes, mockBusListings, mockCoupons } from '../data/mockData';

interface DBTableDetails {
  name: string;
  purpose: string;
  columns: { name: string; type: string; constraints?: string; desc: string; isIndex?: boolean }[];
  indexes: string[];
  prismaModel: string;
  relations: string[];
}

interface DatabaseSchemaExplorerProps {
  bookingClicks?: any[];
  priceAlerts?: any[];
  onClearClicks?: () => void;
}

export default function DatabaseSchemaExplorer({
  bookingClicks = [],
  priceAlerts = [],
  onClearClicks
}: DatabaseSchemaExplorerProps) {
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [activeTab, setActiveTab] = useState<'tables' | 'prisma' | 'scalability'>('tables');
  const [activeView, setActiveView] = useState<'schema' | 'records'>('schema');

  const tables: Record<string, DBTableDetails> = {
    users: {
      name: 'users',
      purpose: 'Stores registered platform accounts for search histories, coupon personalization, notifications and booking logs.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Secure unique identifier generated on client or DB side' },
        { name: 'full_name', type: 'VARCHAR(120)', desc: 'User full display name' },
        { name: 'email', type: 'VARCHAR(255)', constraints: 'UNIQUE', desc: 'Primary username for auth and notifications', isIndex: true },
        { name: 'phone', type: 'VARCHAR(20)', desc: 'Contact mobile number for booking SMS confirmation', isIndex: true },
        { name: 'password_hash', type: 'TEXT', desc: 'Bcrypt-hashed credentials for direct email verification' },
        { name: 'profile_image', type: 'TEXT', desc: 'S3 or CDN hosted resource hyperlink' },
        { name: 'is_verified', type: 'BOOLEAN', constraints: 'DEFAULT false', desc: 'Indicates SMS or Email OTP verification confirmation' },
        { name: 'role', type: 'VARCHAR(20)', constraints: "DEFAULT 'user'", desc: 'Permission controls: "user" | "admin" | "support"' },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Account initiation date' },
        { name: 'updated_at', type: 'TIMESTAMP', desc: 'Last account modification record' }
      ],
      indexes: ['email (BTREE INDEX for authentication lookup)', 'phone (BTREE INDEX for login routing)'],
      relations: [
        'users.id → search_history.user_id (1:N)',
        'users.id → reviews.user_id (1:N)',
        'users.id → price_alerts.user_id (1:N)',
        'users.id → favorite_routes.user_id (1:N)'
      ],
      prismaModel: `model User {
  id             String           @id @default(uuid()) @db.Uuid
  fullName       String           @map("full_name") @db.VarChar(120)
  email          String           @unique @db.VarChar(255)
  phone          String?          @db.VarChar(20)
  passwordHash   String           @map("password_hash") @db.Text
  profileImage   String?          @map("profile_image") @db.Text
  isVerified     Boolean          @default(false) @map("is_verified")
  role           String           @default("user") @db.VarChar(20)
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  searchHistories SearchHistory[]
  reviews         Review[]
  priceAlerts     PriceAlert[]
  favoriteRoutes  FavoriteRoute[]
}`
    },
    search_history: {
      name: 'search_history',
      purpose: 'Tracks user-initiated route searches to generate recommendation parameters, active route alerts and targeted marketing pushes.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Unique record identifier' },
        { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id)', desc: 'Optional associated user ID (nullable for guests)', isIndex: true },
        { name: 'source_city', type: 'VARCHAR(100)', desc: 'Starting point of route query', isIndex: true },
        { name: 'destination_city', type: 'VARCHAR(100)', desc: 'Target endpoint of route query', isIndex: true },
        { name: 'travel_date', type: 'DATE', desc: 'Target travel departure date' },
        { name: 'passengers', type: 'INTEGER', desc: 'Number of passenger seats selected' },
        { name: 'searched_at', type: 'TIMESTAMP', desc: 'Execution trace timestamp' }
      ],
      indexes: ['user_id (Index speedups for personal history screens)', 'source_city, destination_city (Compound index for hot search graphs)'],
      relations: [
        'search_history.user_id → users.id (N:1, Cascade delete)'
      ],
      prismaModel: `model SearchHistory {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String?  @map("user_id") @db.Uuid
  sourceCity      String   @map("source_city") @db.VarChar(100)
  destinationCity String   @map("destination_city") @db.VarChar(100)
  travelDate      DateTime @map("travel_date") @db.Date
  passengers      Int      @default(1)
  searchedAt      DateTime @default(now()) @map("searched_at")

  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}`
    },
    bus_operators: {
      name: 'bus_operators',
      purpose: 'Database of registered fleet operators, tracking support contacts and reviews.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Unique operator identifier' },
        { name: 'operator_name', type: 'VARCHAR(150)', desc: 'Commercial name, e.g. "Zingbus Plus", "IntrCity SmartBus"', isIndex: true },
        { name: 'operator_logo', type: 'TEXT', desc: 'Web URL pointing to high res operator branding logo' },
        { name: 'rating', type: 'DECIMAL(2,1)', desc: 'Aggregate platform score calculated dynamically from reviews table' },
        { name: 'total_reviews', type: 'INTEGER', desc: 'Sum total reviews left by passengers' },
        { name: 'support_number', type: 'VARCHAR(20)', desc: 'Customer support hotline for passenger queries' },
        { name: 'is_verified', type: 'BOOLEAN', constraints: 'DEFAULT false', desc: 'Verified premium safety verified tag' },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Operator registration timestamp' }
      ],
      indexes: ['operator_name (Index optimized for search queries and directory views)'],
      relations: [
        'bus_operators.id → bus_listings.operator_id (1:N)',
        'bus_operators.id → reviews.operator_id (1:N)'
      ],
      prismaModel: `model BusOperator {
  id            String   @id @default(uuid()) @db.Uuid
  operatorName  String   @map("operator_name") @db.VarChar(150)
  operatorLogo  String?  @map("operator_logo") @db.Text
  rating        Decimal  @default(4.0) @db.Decimal(2, 1)
  totalReviews  Int      @default(0) @map("total_reviews")
  supportNumber String?  @map("support_number") @db.VarChar(20)
  isVerified    Boolean  @default(false) @map("is_verified")
  createdAt     DateTime @default(now()) @map("created_at")

  busListings   BusListing[]
  reviews       Review[]
}`
    },
    platforms: {
      name: 'platforms',
      purpose: 'Stores different online booking aggregators, supporting affiliate redirections and tracking.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Unique aggregator identifier' },
        { name: 'platform_name', type: 'VARCHAR(100)', desc: 'Name of OTA (e.g. "RedBus", "AbhiBus", "MakeMyTrip")' },
        { name: 'website_url', type: 'TEXT', desc: 'Affiliated base web endpoint URL' },
        { name: 'logo_url', type: 'TEXT', desc: 'Brand vector logo url' },
        { name: 'affiliate_code', type: 'TEXT', desc: 'Affiliate tracking tag appended for profit redirection' },
        { name: 'is_active', type: 'BOOLEAN', constraints: 'DEFAULT true', desc: 'Bypasses or acts as gatekeeper for listing updates' },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Vendor setup timestamp' }
      ],
      indexes: ['None (Read-heavy, loaded in Redis cache entirely)'],
      relations: [
        'platforms.id → bus_listings.platform_id (1:N)',
        'platforms.id → coupons.platform_id (1:N)',
        'platforms.id → booking_clicks.platform_id (1:N)',
        'platforms.id → scraper_logs.platform_id (1:N)'
      ],
      prismaModel: `model Platform {
  id            String   @id @default(uuid()) @db.Uuid
  platformName  String   @map("platform_name") @db.VarChar(100)
  websiteUrl    String   @map("website_url") @db.Text
  logoUrl       String?  @map("logo_url") @db.Text
  affiliateCode String?  @map("affiliate_code") @db.Text
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")

  busListings   BusListing[]
  coupons       Coupon[]
  bookingClicks BookingClick[]
  scraperLogs   ScraperLog[]
}`
    },
    routes: {
      name: 'routes',
      purpose: 'Standardized geographic route entries mapping major Indian cities and distances.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Primary route identifier' },
        { name: 'source_city', type: 'VARCHAR(100)', desc: 'Departure terminal city name (e.g. "Delhi")', isIndex: true },
        { name: 'destination_city', type: 'VARCHAR(100)', desc: 'Destination terminal city name (e.g. "Lucknow")', isIndex: true },
        { name: 'distance_km', type: 'INTEGER', desc: 'Total highway distance in kilometers' },
        { name: 'average_duration', type: 'INTEGER', desc: 'Estimated normal speed highway travel duration in minutes' },
        { name: 'popular_route', type: 'BOOLEAN', constraints: 'DEFAULT false', desc: 'Displays route on home suggestions ribbon' },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Creation timestamp' }
      ],
      indexes: ['source_city, destination_city (Hot index for direct query resolution)'],
      relations: [
        'routes.id → bus_listings.route_id (1:N)',
        'routes.id → favorite_routes.route_id (1:N)'
      ],
      prismaModel: `model Route {
  id              String   @id @default(uuid()) @db.Uuid
  sourceCity      String   @map("source_city") @db.VarChar(100)
  destinationCity String   @map("destination_city") @db.VarChar(100)
  distanceKm      Int      @map("distance_km")
  averageDuration Int      @map("average_duration")
  popularRoute    Boolean  @default(false) @map("popular_route")
  createdAt       DateTime @default(now()) @map("created_at")

  busListings    BusListing[]
  favoriteRoutes FavoriteRoute[]
}`
    },
    bus_listings: {
      name: 'bus_listings',
      purpose: 'The central transactional aggregator inventory, tracking bus availability, timing, original/final prices, and services.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Listing internal identifier' },
        { name: 'route_id', type: 'UUID', constraints: 'REFERENCES routes(id)', desc: 'Linked standard route route details', isIndex: true },
        { name: 'operator_id', type: 'UUID', constraints: 'REFERENCES bus_operators(id)', desc: 'Linked commercial operator', isIndex: true },
        { name: 'platform_id', type: 'UUID', constraints: 'REFERENCES platforms(id)', desc: 'The partner web portal offering the ticket', isIndex: true },
        { name: 'bus_name', type: 'VARCHAR(150)', desc: 'Display name of the fleet service' },
        { name: 'bus_type', type: 'VARCHAR(100)', desc: 'AC Sleeper / AC Seater / Sleeper Non-AC etc' },
        { name: 'departure_time', type: 'TIMESTAMP', desc: 'Departure clock date & time', isIndex: true },
        { name: 'arrival_time', type: 'TIMESTAMP', desc: 'Arrival clock date & time' },
        { name: 'duration_minutes', type: 'INTEGER', desc: 'Calculated journey span' },
        { name: 'boarding_point', type: 'VARCHAR(255)', desc: 'Terminal area board description' },
        { name: 'dropping_point', type: 'VARCHAR(255)', desc: 'Terminal area drop description' },
        { name: 'original_price', type: 'DECIMAL(10,2)', desc: 'Baseline fair before affiliate coupons' },
        { name: 'discounted_price', type: 'DECIMAL(10,2)', desc: 'Reduced baseline fair price structure' },
        { name: 'final_price', type: 'DECIMAL(10,2)', desc: 'Final passenger payable fare', isIndex: true },
        { name: 'available_seats', type: 'INTEGER', desc: 'Number of remaining seats unbooked' }
      ],
      indexes: [
        'route_id (Index for immediate search lookup)',
        'departure_time (Index for quick timing filters)',
        'final_price (Index for price filter sorting)'
      ],
      relations: [
        'bus_listings.route_id → routes.id (N:1)',
        'bus_listings.operator_id → bus_operators.id (N:1)',
        'bus_listings.platform_id → platforms.id (N:1)',
        'bus_listings.id → price_history.bus_listing_id (1:N)',
        'bus_listings.id → booking_clicks.bus_listing_id (1:N)'
      ],
      prismaModel: `model BusListing {
  id                  String       @id @default(uuid()) @db.Uuid
  routeId             String       @map("route_id") @db.Uuid
  operatorId          String       @map("operator_id") @db.Uuid
  platformId          String       @map("platform_id") @db.Uuid
  busName             String       @map("bus_name") @db.VarChar(150)
  busType             String       @map("bus_type") @db.VarChar(100)
  departureTime       DateTime     @map("departure_time")
  arrivalTime         DateTime     @map("arrival_time")
  durationMinutes     Int          @map("duration_minutes")
  originalPrice       Decimal      @map("original_price") @db.Decimal(10, 2)
  discountedPrice     Decimal      @map("discounted_price") @db.Decimal(10, 2)
  taxes               Decimal      @map("taxes") @db.Decimal(10, 2)
  finalPrice          Decimal      @map("final_price") @db.Decimal(10, 2)
  availableSeats      Int          @default(0) @map("available_seats")
  liveTracking        Boolean      @default(false) @map("live_tracking")
  chargingPort        Boolean      @default(false) @map("charging_port")

  route               Route        @relation(fields: [routeId], references: [id], onDelete: Cascade)
  operator            BusOperator  @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  platform            Platform     @relation(fields: [platformId], references: [id], onDelete: Cascade)
  priceHistories      PriceHistory[]
}`
    },
    coupons: {
      name: 'coupons',
      purpose: 'Coupons details dynamically queried on card structures, calculating precise discounts.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Primary identifier' },
        { name: 'platform_id', type: 'UUID', constraints: 'REFERENCES platforms(id)', desc: 'The booking portal owning the promotion', isIndex: true },
        { name: 'coupon_code', type: 'VARCHAR(50)', desc: 'Alphanumeric promotion, e.g. "ABHILENS150"', isIndex: true },
        { name: 'discount_type', type: 'VARCHAR(20)', desc: 'Percentage / Fixed type identifier' },
        { name: 'discount_value', type: 'DECIMAL(10,2)', desc: 'Flat currency or percentage multiplier value' },
        { name: 'minimum_booking', type: 'DECIMAL(10,2)', desc: 'Minimum cart value required to unlock coupon' }
      ],
      indexes: ['coupon_code (Index for immediate validation check)', 'platform_id (Indexed for associated platform queries)'],
      relations: [
        'coupons.platform_id → platforms.id (N:1, Cascade delete)'
      ],
      prismaModel: `model Coupon {
  id             String   @id @default(uuid()) @db.Uuid
  platformId     String   @map("platform_id") @db.Uuid
  couponCode     String   @map("coupon_code") @db.VarChar(50)
  description    String   @db.Text
  discountType   String   @map("discount_type") @db.VarChar(20)
  discountValue  Decimal  @map("discount_value") @db.Decimal(10, 2)
  minimumBooking Decimal  @map("minimum_booking") @db.Decimal(10, 2)

  platform       Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)
}`
    },
    price_alerts: {
      name: 'price_alerts',
      purpose: 'Enables users to hook into routes and trigger emails or pushes when ticket price falls below pre-configured limits.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Primary key' },
        { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id)', desc: 'Linked account setting the alert', isIndex: true },
        { name: 'source_city', type: 'VARCHAR(100)', desc: 'Geographic source city' },
        { name: 'destination_city', type: 'VARCHAR(100)', desc: 'Geographic destination city' },
        { name: 'target_price', type: 'DECIMAL(10,2)', desc: 'Trigger value threshold set by the user' },
        { name: 'travel_date', type: 'DATE', desc: 'Specific target traveling date' },
        { name: 'notification_sent', type: 'BOOLEAN', constraints: 'DEFAULT false', desc: 'Controls notification dispatch states' }
      ],
      indexes: ['user_id (User alert listing queries)', 'source_city, destination_city (Compound routing scanner for scraper logs)'],
      relations: [
        'price_alerts.user_id → users.id (N:1, Cascade delete)'
      ],
      prismaModel: `model PriceAlert {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String?  @map("user_id") @db.Uuid
  sourceCity       String   @map("source_city") @db.VarChar(100)
  destinationCity  String   @map("destination_city") @db.VarChar(100)
  targetPrice      Decimal  @map("target_price") @db.Decimal(10, 2)
  travelDate       DateTime @map("travel_date") @db.Date
  notificationSent Boolean  @default(false) @map("notification_sent")

  user             User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}`
    },
    booking_clicks: {
      name: 'booking_clicks',
      purpose: 'Logs click telemetry and unique generated affiliate links when users choose to View Deal, enabling tracking and payouts.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Unique tracking transaction ID' },
        { name: 'user_id', type: 'UUID', constraints: 'REFERENCES users(id)', desc: 'Optional customer identifier (or NULL for guest users)', isIndex: true },
        { name: 'bus_listing_id', type: 'UUID', constraints: 'REFERENCES bus_listings(id)', desc: 'Associated bus listing ID', isIndex: true },
        { name: 'platform_id', type: 'UUID', constraints: 'REFERENCES platforms(id)', desc: 'OTA Partner website clicked', isIndex: true },
        { name: 'clicked_at', type: 'TIMESTAMP', desc: 'DateTime of user click' },
        { name: 'ip_address', type: 'VARCHAR(45)', desc: 'Client IPv4 or IPv6 address for anti-fraud analysis' },
        { name: 'device_type', type: 'VARCHAR(30)', desc: 'Form factor detected: Mobile | Desktop | Tablet' },
        { name: 'affiliate_url', type: 'TEXT', desc: 'Synthesized tracking link with platform utm tags & affiliate code' }
      ],
      indexes: ['platform_id (For vendor reporting counts)', 'clicked_at (For real-time dashboard tracking)'],
      relations: [
        'booking_clicks.platform_id → platforms.id (N:1)',
        'booking_clicks.bus_listing_id → bus_listings.id (N:1)'
      ],
      prismaModel: `model BookingClick {
  id           String      @id @default(uuid()) @db.Uuid
  userId       String?     @map("user_id") @db.Uuid
  busListingId String      @map("bus_listing_id") @db.Uuid
  platformId   String      @map("platform_id") @db.Uuid
  clickedAt    DateTime    @default(now()) @map("clicked_at")
  ipAddress    String      @map("ip_address") @db.VarChar(45)
  deviceType   String      @map("device_type") @db.VarChar(30)
  affiliateUrl String      @map("affiliate_url") @db.Text

  user         User?       @relation(fields: [userId], references: [id])
  busListing   BusListing  @relation(fields: [busListingId], references: [id])
  platform     Platform    @relation(fields: [platformId], references: [id])

  @@index([platformId])
  @@index([clickedAt])
  @@map("booking_clicks")
}`
    },
    route_price_history: {
      name: 'route_price_history',
      purpose: 'Stores aggregated daily price snapshots (lowest, highest, and average fares) for each standard route to power price insights and predictive graphs.',
      columns: [
        { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', desc: 'Secure unique identifier generated on snapshot creation' },
        { name: 'route_id', type: 'UUID', constraints: 'REFERENCES routes(id)', desc: 'The reference identifier to the geometric route', isIndex: true },
        { name: 'min_price', type: 'DECIMAL(10,2)', desc: 'Lowest ticket purchase price recorded during the day' },
        { name: 'max_price', type: 'DECIMAL(10,2)', desc: 'Highest ticket purchase price recorded during the day' },
        { name: 'avg_price', type: 'DECIMAL(10,2)', desc: 'Arithmetic average price across active platform listings' },
        { name: 'recorded_date', type: 'DATE', desc: 'The calendar date of snapshot records', isIndex: true },
        { name: 'created_at', type: 'TIMESTAMP', desc: 'Snapshot initiation date' }
      ],
      indexes: ['route_id, recorded_date (Unique composite index to prevent duplicate entries for any single day)', 'recorded_date (For timeseries indexing speeds)'],
      relations: [
        'route_price_history.route_id → routes.id (N:1, Cascade delete)'
      ],
      prismaModel: `model RoutePriceHistory {
  id              String   @id @default(uuid()) @db.Uuid
  routeId         String   @map("route_id") @db.Uuid
  minPrice        Decimal  @map("min_price") @db.Decimal(10, 2)
  maxPrice        Decimal  @map("max_price") @db.Decimal(10, 2)
  avgPrice        Decimal  @map("avg_price") @db.Decimal(10, 2)
  recordedDate    DateTime @map("recorded_date") @db.Date
  createdAt       DateTime @default(now()) @map("created_at")

  route           Route    @relation(fields: [routeId], references: [id], onDelete: Cascade)

  @@unique([routeId, recordedDate])
  @@index([routeId])
  @@index([recordedDate])
  @@map("route_price_history")
}`
    }
  };

  const selectedData = tables[selectedTable] || tables.users;

  return (
    <div id="db-explorer-root" className="w-full max-w-7xl mx-auto space-y-6">
      {/* DB Explorer Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <Database className="w-5 h-5" id="db-icon" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">PostgreSQL Schema & Prisma Architecture</h2>
          </div>
          <p className="text-sm text-slate-500">
            Highly normalized relational layout optimized for speed, scalability, multi-platform trackers, and affiliate routing.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto" id="db-tabs">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tables' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Tables ({Object.keys(tables).length})
          </button>
          <button
            onClick={() => setActiveTab('prisma')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'prisma' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            schema.prisma
          </button>
          <button
            onClick={() => setActiveTab('scalability')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'scalability' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Enterprise Scalability
          </button>
        </div>
      </div>

      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="db-tables-layout">
          {/* Sidebar table selection list */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-[550px] overflow-y-auto flex flex-col gap-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Normalized Core Models (PostgreSQL)
            </div>
            {Object.keys(tables).map((tId) => (
              <button
                key={tId}
                id={`table-selector-${tId}`}
                onClick={() => setSelectedTable(tId)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                  selectedTable === tId
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded ${selectedTable === tId ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    <Table className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-mono tracking-tight">{tId}</span>
                </div>
                {tables[tId].columns.some(c => c.constraints?.includes('PRIMARY KEY')) && (
                  <Key className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400" />
                )}
              </button>
            ))}

            <div className="border-t border-slate-100 my-3 pt-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                Auxiliary Backend Tables
              </div>
              <div className="space-y-1">
                {['favorite_routes', 'reviews', 'admin_users', 'scraper_logs'].map((aux) => (
                  <div
                    key={aux}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-500 hover:bg-slate-50 rounded-xl flex items-center justify-between"
                  >
                    <span className="font-mono tracking-tight">{aux}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">Auxiliary</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table Data Columns details view */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Row Meta */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-brand-600 font-mono text-sm uppercase tracking-wider">Table:</span>
                    <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-sm font-semibold">{selectedData.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-md">{selectedData.purpose}</p>
                </div>
                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit" id="view-mode-selector">
                    <button
                      onClick={() => setActiveView('schema')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeView === 'schema'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Schema Schema
                    </button>
                    <button
                      onClick={() => setActiveView('records')}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        activeView === 'records'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Live Row Records
                    </button>
                  </div>
                </div>
              </div>

              {activeView === 'schema' ? (
                <div className="space-y-6">
                  {/* Columns Grid list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Columns Schema Definitions
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                            <th className="p-3">Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Constraints</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                          {selectedData.columns.map((col, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-900 font-bold flex items-center gap-1.5">
                                {col.constraints?.includes('PRIMARY') ? (
                                  <Key className="w-3 h-3 text-amber-500 shrink-0" />
                                ) : col.constraints?.includes('REFERENCES') ? (
                                  <Link className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : null}
                                {col.name}
                                {col.isIndex && (
                                  <span className="text-[9px] bg-brand-50 text-brand-600 px-1 rounded uppercase">Index</span>
                                )}
                              </td>
                              <td className="p-3 text-brand-700 font-semibold">{col.type}</td>
                              <td className="p-3">
                                {col.constraints ? (
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                                    {col.constraints}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-500 font-sans">{col.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Indexes and Indexing Strategy */}
                  {selectedData.indexes.length > 0 && (
                    <div className="bg-slate-50/70 p-4 rounded-xl space-y-2 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        Query Performance Optimization (Indexes)
                      </h4>
                      <ul className="list-disc pl-5 text-xs text-slate-500 font-mono space-y-1">
                        {selectedData.indexes.map((idx, i) => (
                          <li key={i}>{idx}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* PostgreSQL Relations Maps */}
                  {selectedData.relations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-slate-400" />
                        Referential Integrity Constraints (Foreign Key Relationships)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedData.relations.map((rel, i) => (
                          <span key={i} className="text-[10px] font-mono bg-brand-50 border border-brand-100 text-brand-700 px-2.5 py-1 rounded-lg">
                            {rel}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Live Database Sandbox State (Table Rows)
                      </h4>
                      <p className="text-[10px] text-slate-550 mt-0.5">
                        Active records loaded dynamically from local browser state storage.
                      </p>
                    </div>
                    {selectedTable === 'booking_clicks' && bookingClicks.length > 0 && onClearClicks && (
                      <button
                        onClick={onClearClicks}
                        className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1 rounded-lg transition-all border border-rose-100 cursor-pointer"
                      >
                        Clear Telemetry logs
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                    {selectedTable === 'booking_clicks' ? (
                      bookingClicks.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No booking clicks recorded today! Go click "View Deal" on any bus card to trigger tracking redirect and log clicks.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-sans">
                              <th className="p-3">id</th>
                              <th className="p-3">user_id</th>
                              <th className="p-3">bus_service</th>
                              <th className="p-3">platform</th>
                              <th className="p-3">affiliate_url (tracking)</th>
                              <th className="p-3">ip_address</th>
                              <th className="p-3">device_type</th>
                              <th className="p-3">clicked_at</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[10px] text-slate-600">
                            {bookingClicks.map((clk) => {
                              const busStr = mockBusListings.find(b => b.id === clk.busListingId)?.busName || clk.busListingId;
                              const platName = mockPlatforms.find(p => p.id === clk.platformId)?.platformName || clk.platformId;
                              return (
                                <tr key={clk.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-brand-600 truncate max-w-[80px]" title={clk.id}>{clk.id}</td>
                                  <td className="p-3 text-slate-400">{clk.userId || 'Guest'}</td>
                                  <td className="p-3 text-slate-700 font-semibold font-sans">{busStr}</td>
                                  <td className="p-3 font-sans"><span className="bg-slate-150 px-1.5 py-0.5 rounded font-bold text-slate-800">{platName}</span></td>
                                  <td className="p-3 max-w-[150px]" title={clk.affiliateUrl}>
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate flex-1 text-slate-400 font-mono">{clk.affiliateUrl || 'N/A'}</span>
                                      {clk.affiliateUrl && (
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(clk.affiliateUrl);
                                            alert('Affiliate link copied!');
                                          }}
                                          className="text-[9px] bg-brand-50 hover:bg-brand-100 text-brand-650 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                        >
                                          Copy
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-500">{clk.ipAddress}</td>
                                  <td className="p-3 font-semibold font-sans text-slate-650">{clk.deviceType}</td>
                                  <td className="p-3 text-slate-500">{new Date(clk.clickedAt).toLocaleTimeString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )
                    ) : selectedTable === 'price_alerts' ? (
                      priceAlerts.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">No active price alerts set by the user.</div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-sans">
                              <th className="p-3 font-sans">id</th>
                              <th className="p-3 font-sans">route</th>
                              <th className="p-3 font-sans">target_price</th>
                              <th className="p-3 font-sans">travel_date</th>
                              <th className="p-3 font-sans">status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[10px] text-slate-600">
                            {priceAlerts.map((al) => (
                              <tr key={al.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-700">{al.id}</td>
                                <td className="p-3 font-sans font-extrabold text-slate-850">{al.sourceCity} ➔ {al.destinationCity}</td>
                                <td className="p-3 font-bold text-brand-600">₹{al.targetPrice}</td>
                                <td className="p-3 font-sans">{al.travelDate}</td>
                                <td className="p-3 font-sans">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${al.notificationSent ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {al.notificationSent ? 'TRIGGERED' : 'MONITORING'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    ) : selectedTable === 'users' ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                            <th className="p-3">id</th>
                            <th className="p-3 font-sans">full_name</th>
                            <th className="p-3">email</th>
                            <th className="p-3">phone</th>
                            <th className="p-3">status</th>
                            <th className="p-3">role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[10px]">
                          {mockUsers.map((usr) => (
                            <tr key={usr.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400">{usr.id}</td>
                              <td className="p-3 font-semibold font-sans text-slate-800">{usr.fullName}</td>
                              <td className="p-3 text-brand-700 font-sans">{usr.email}</td>
                              <td className="p-3">{usr.phone}</td>
                              <td className="p-3 font-sans">
                                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">VERIFIED</span>
                              </td>
                              <td className="p-3 font-sans text-slate-550 capitalize font-semibold">{usr.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : selectedTable === 'bus_operators' ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-sans">
                            <th className="p-3">id</th>
                            <th className="p-3 font-sans">operator_name</th>
                            <th className="p-3">rating</th>
                            <th className="p-3">total_reviews</th>
                            <th className="p-3">support_contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[10px]">
                          {mockOperators.map((op) => (
                            <tr key={op.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400">{op.id}</td>
                              <td className="p-3 font-sans font-black text-slate-800 flex items-center gap-1.5">
                                <span>{op.operatorLogo}</span> {op.operatorName}
                              </td>
                              <td className="p-3 text-emerald-700 font-sans font-bold">★ {op.rating}</td>
                              <td className="p-3 text-slate-500 font-sans">{op.totalReviews}</td>
                              <td className="p-3 text-slate-550">{op.supportNumber}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : selectedTable === 'platforms' ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                            <th className="p-3">id</th>
                            <th className="p-3 font-sans">platform_name</th>
                            <th className="p-3 font-sans">website_url</th>
                            <th className="p-3">affiliate_code</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[10px]">
                          {mockPlatforms.map((plat) => (
                            <tr key={plat.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400">{plat.id}</td>
                              <td className="p-3 font-sans font-extrabold text-slate-800">{plat.platformName}</td>
                              <td className="p-3 text-brand-600 text-[10px]">{plat.websiteUrl}</td>
                              <td className="p-3 text-emerald-700 font-bold">{plat.affiliateCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : selectedTable === 'routes' ? (
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-sans">
                            <th className="p-3">id</th>
                            <th className="p-3 font-sans">route_details</th>
                            <th className="p-3">distance_km</th>
                            <th className="p-3">average_duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[10px]">
                          {mockRoutes.map((rt) => (
                            <tr key={rt.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-400">{rt.id}</td>
                              <td className="p-3 font-sans font-black text-slate-800">{rt.sourceCity} ➔ {rt.destinationCity}</td>
                              <td className="p-3 text-slate-700 font-bold">{rt.distanceKm} KM</td>
                              <td className="p-3 text-slate-500">{rt.averageDurationMinutes} mins</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : selectedTable === 'coupons' ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                            <th className="p-3">id</th>
                            <th className="p-3">coupon_code</th>
                            <th className="p-3 font-sans font-semibold">discount_details</th>
                            <th className="p-3">minimum_booking</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[10px]">
                          {mockCoupons.map((cp) => (
                            <tr key={cp.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-300">{cp.id}</td>
                              <td className="p-3 font-extrabold text-slate-800">{cp.couponCode}</td>
                              <td className="p-3 font-sans text-slate-500 font-medium">{cp.description}</td>
                              <td className="p-3 text-brand-700 font-bold">₹{cp.minimumBooking}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold font-sans">
                            <th className="p-3">id</th>
                            <th className="p-3 font-sans">bus_name</th>
                            <th className="p-3 font-sans">bus_type</th>
                            <th className="p-3 font-sans">price_payable</th>
                            <th className="p-3 font-sans">seats_left</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[10px] text-slate-650">
                          {mockBusListings.slice(0, 8).map((lst) => (
                            <tr key={lst.id} className="hover:bg-slate-50/50">
                              <td className="p-3 text-slate-350">{lst.id}</td>
                              <td className="p-3 font-sans font-bold text-slate-800">{lst.busName}</td>
                              <td className="p-3 text-[9px] text-slate-500 font-semibold">{lst.busType}</td>
                              <td className="p-3 text-brand-700 font-bold">₹{lst.discountedPrice}</td>
                              <td className="p-3 text-rose-600 font-extrabold">{lst.availableSeats} Seats</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Prisma representation preview */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-md text-slate-100 space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2 font-semibold">
                  <Code className="w-4 h-4 text-brand-500" />
                  PRISMA ORM DEFINITION MODEL
                </span>
                <span className="text-[10px] bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50">Active Model Sync</span>
              </div>
              <pre className="text-xs overflow-x-auto text-brand-100/90 leading-relaxed max-h-48 overflow-y-auto pt-2 pl-1 bg-slate-950/40 rounded-lg p-3">
                {selectedData.prismaModel}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prisma' && (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4" id="db-raw-prisma">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-brand-500/10 text-brand-400 rounded-lg">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-slate-100 font-semibold text-base font-mono">/prisma/schema.prisma</h3>
                <p className="text-xs text-slate-400">Complete multi-vendor relations file setup.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700 font-mono">PRISMA CLIENT 5.0+</span>
            </div>
          </div>

          <pre className="text-xs text-emerald-400 font-mono bg-slate-950 p-5 rounded-xl border border-slate-800 overflow-x-auto h-[550px] overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
{`// ---------------------------------------------
// BUSLENS CORE POSTGRESQL SCHEMATICS 
// ---------------------------------------------
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id             String           @id @default(uuid()) @db.Uuid
  fullName       String           @map("full_name") @db.VarChar(120)
  email          String           @unique @db.VarChar(255)
  phone          String?          @db.VarChar(20)
  passwordHash   String           @map("password_hash") @db.Text
  profileImage   String?          @map("profile_image") @db.Text
  isVerified     Boolean          @default(false) @map("is_verified")
  role           String           @default("user") @db.VarChar(20)
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")

  searchHistories SearchHistory[]
  reviews         Review[]
  priceAlerts     PriceAlert[]
  favoriteRoutes  FavoriteRoute[]
  bookingClicks   BookingClick[]

  @@index([email])
  @@index([phone])
  @@map("users")
}

model SearchHistory {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String?  @map("user_id") @db.Uuid
  sourceCity      String   @map("source_city") @db.VarChar(100)
  destinationCity String   @map("destination_city") @db.VarChar(100)
  travelDate      DateTime @map("travel_date") @db.Date
  passengers      Int      @default(1)
  searchedAt      DateTime @default(now()) @map("searched_at")

  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sourceCity, destinationCity])
  @@map("search_history")
}

model BusOperator {
  id            String   @id @default(uuid()) @db.Uuid
  operatorName  String   @map("operator_name") @db.VarChar(150)
  operatorLogo  String?  @map("operator_logo") @db.Text
  rating        Decimal  @default(4.0) @db.Decimal(2, 1)
  totalReviews  Int      @default(0) @map("total_reviews")
  supportNumber String?  @map("support_number") @db.VarChar(20)
  isVerified    Boolean  @default(false) @map("is_verified")
  createdAt     DateTime @default(now()) @map("created_at")

  busListings   BusListing[]
  reviews       Review[]

  @@index([operatorName])
  @@map("bus_operators")
}

model Platform {
  id            String   @id @default(uuid()) @db.Uuid
  platformName  String   @map("platform_name") @db.VarChar(100)
  websiteUrl    String   @map("website_url") @db.Text
  logoUrl       String?  @map("logo_url") @db.Text
  affiliateCode String?  @map("affiliate_code") @db.Text
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")

  busListings   BusListing[]
  coupons       Coupon[]
  bookingClicks BookingClick[]
  scraperLogs   ScraperLog[]

  @@map("platforms")
}

model Route {
  id              String   @id @default(uuid()) @db.Uuid
  sourceCity      String   @map("source_city") @db.VarChar(100)
  destinationCity String   @map("destination_city") @db.VarChar(100)
  distanceKm      Int      @map("distance_km")
  averageDuration Int      @map("average_duration")
  popularRoute    Boolean  @default(false) @map("popular_route")
  createdAt       DateTime @default(now()) @map("created_at")

  busListings    BusListing[]
  favoriteRoutes FavoriteRoute[]

  @@index([sourceCity, destinationCity])
  @@map("routes")
}

model BusListing {
  id                  String       @id @default(uuid()) @db.Uuid
  routeId             String       @map("route_id") @db.Uuid
  operatorId          String       @map("operator_id") @db.Uuid
  platformId          String       @map("platform_id") @db.Uuid
  
  busName             String       @map("bus_name") @db.VarChar(150)
  busType             String       @map("bus_type") @db.VarChar(100)
  departureTime       DateTime     @map("departure_time")
  arrivalTime         DateTime     @map("arrival_time")
  durationMinutes     Int          @map("duration_minutes")
  originalPrice       Decimal      @map("original_price") @db.Decimal(10, 2)
  discountedPrice     Decimal      @map("discounted_price") @db.Decimal(10, 2)
  taxes               Decimal      @map("taxes") @db.Decimal(10, 2)
  finalPrice          Decimal      @map("final_price") @db.Decimal(10, 2)
  availableSeats      Int          @default(0) @map("available_seats")

  route               Route        @relation(fields: [routeId], references: [id], onDelete: Cascade)
  operator            BusOperator  @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  platform            Platform     @relation(fields: [platformId], references: [id], onDelete: Cascade)

  priceHistories      PriceHistory[]
  bookingClicks       BookingClick[]

  @@index([routeId])
  @@index([operatorId])
  @@index([platformId])
  @@index([departureTime])
  @@index([finalPrice])
  @@map("bus_listings")
}`}
          </pre>
        </div>
      )}

      {activeTab === 'scalability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="db-scalability">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl w-fit">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Redis Result Caching</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              We leverage an in-memory Redis layer with a TTL of 15 minutes mapped to the compound key <code>search:source:dest:date</code>.
              This reduces PostgreSQL compute bottlenecks by up to 94% on repetitive queries for popular routes on identical travel dates.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Distributed Scraping Sync</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              OTAs (RedBus, Paytm, MMT) API prices are fetched asynchronously by containerized Celery / BullMQ micro-scrapers. Logs are stored directly in the database <code>scraper_logs</code> table to track operational speeds and verify target failure alerts.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#f0f9ff] shadow-sm space-y-3 border-l-4 border-l-brand-500">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Enterprise Price History Charts</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every 2 hours, price variations for active routes are saved into the <code>price_history</code> table. This helps BusLens display a dynamic line graph of highway fare fluctuations over past cycles, driving premium airline-style UX.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
