-- =========================================================================
-- DATABASE INTEGRATION MIGRATION: BUSLENS HIGH-PERFORMANCE SCHEMA
-- FILE: /prisma/migrations/0001_initial_schema.sql
-- Target: PostgreSQL v13+ Relational Engine
-- Features: Composite columns, explicit indexing, GIN/B-Tree optimization
-- =========================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "profile_image" TEXT,
    "is_verified" BOOLEAN DEFAULT FALSE NOT NULL,
    "role" VARCHAR(20) DEFAULT 'user' NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for lightning-fast user lookup during login
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");


-- 2. BUS_OPERATORS TABLE
CREATE TABLE IF NOT EXISTS "bus_operators" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "operator_name" VARCHAR(150) NOT NULL,
    "operator_logo" TEXT,
    "rating" DECIMAL(2, 1) DEFAULT 4.0 NOT NULL,
    "total_reviews" INTEGER DEFAULT 0 NOT NULL,
    "support_number" VARCHAR(20),
    "is_verified" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index to optimize autocomplete / alphabetical listings of bus operators
CREATE INDEX IF NOT EXISTS "bus_operators_name_idx" ON "bus_operators"("operator_name");


-- 3. PLATFORMS TABLE (Online travel aggregators redBus, AbhiBus, Paytm)
CREATE TABLE IF NOT EXISTS "platforms" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "platform_name" VARCHAR(100) NOT NULL,
    "website_url" TEXT NOT NULL,
    "logo_url" TEXT,
    "affiliate_code" TEXT,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- 4. ROUTES TABLE (City-pair geographic hubs)
CREATE TABLE IF NOT EXISTS "routes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "source_city" VARCHAR(100) NOT NULL,
    "destination_city" VARCHAR(100) NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "average_duration" INTEGER NOT NULL, -- duration in minutes
    "popular_route" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index to speed up city combination routing lookups
CREATE INDEX IF NOT EXISTS "routes_source_dest_idx" ON "routes"("source_city", "destination_city");


-- 5. BUS_LISTINGS TABLE (Central live aggregator tickets core)
CREATE TABLE IF NOT EXISTS "bus_listings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "route_id" UUID NOT NULL REFERENCES "routes"("id") ON DELETE CASCADE,
    "operator_id" UUID NOT NULL REFERENCES "bus_operators"("id") ON DELETE CASCADE,
    "platform_id" UUID NOT NULL REFERENCES "platforms"("id") ON DELETE CASCADE,
    "bus_name" VARCHAR(150) NOT NULL,
    "bus_type" VARCHAR(100) NOT NULL,
    "departure_time" TIMESTAMP WITH TIME ZONE NOT NULL,
    "arrival_time" TIMESTAMP WITH TIME ZONE NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "boarding_point" VARCHAR(255) NOT NULL,
    "dropping_point" VARCHAR(255) NOT NULL,
    "original_price" DECIMAL(10, 2) NOT NULL,
    "discounted_price" DECIMAL(10, 2) NOT NULL,
    "taxes" DECIMAL(10, 2) NOT NULL,
    "final_price" DECIMAL(10, 2) NOT NULL,
    "available_seats" INTEGER DEFAULT 0 NOT NULL,
    "window_seats" INTEGER DEFAULT 0 NOT NULL,
    "rating" DECIMAL(2, 1) DEFAULT 4.0 NOT NULL,
    "reviews_count" INTEGER DEFAULT 0 NOT NULL,
    "live_tracking" BOOLEAN DEFAULT FALSE NOT NULL,
    "charging_port" BOOLEAN DEFAULT FALSE NOT NULL,
    "blanket" BOOLEAN DEFAULT FALSE NOT NULL,
    "water_bottle" BOOLEAN DEFAULT FALSE NOT NULL,
    "wifi" BOOLEAN DEFAULT FALSE NOT NULL,
    "platform_redirect_url" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Core Composite Index to resolve Skyscanner search result queries
-- Filters usually query standard (route_id) and then sort by (final_price) or filter by (departure_time)
CREATE INDEX IF NOT EXISTS "bus_listings_route_id_idx" ON "bus_listings"("route_id");
CREATE INDEX IF NOT EXISTS "bus_listings_operator_id_idx" ON "bus_listings"("operator_id");
CREATE INDEX IF NOT EXISTS "bus_listings_platform_id_idx" ON "bus_listings"("platform_id");
CREATE INDEX IF NOT EXISTS "bus_listings_transit_perf_idx" ON "bus_listings"("route_id", "departure_time", "final_price");


-- 6. SEARCH_HISTORY TABLE (Travel search metrics tracking)
CREATE TABLE IF NOT EXISTS "search_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
    "source_city" VARCHAR(100) NOT NULL,
    "destination_city" VARCHAR(100) NOT NULL,
    "travel_date" DATE NOT NULL,
    "passengers" INTEGER DEFAULT 1 NOT NULL,
    "searched_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Composite indices to query trending routes & user histories in analytics panels
CREATE INDEX IF NOT EXISTS "search_history_user_id_idx" ON "search_history"("user_id");
CREATE INDEX IF NOT EXISTS "search_history_route_idx" ON "search_history"("source_city", "destination_city");
CREATE INDEX IF NOT EXISTS "search_history_searched_at_idx" ON "search_history"("searched_at");


-- 7. COUPONS TABLE (OTA promotional codes)
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "platform_id" UUID NOT NULL REFERENCES "platforms"("id") ON DELETE CASCADE,
    "coupon_code" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" DECIMAL(10, 2) NOT NULL,
    "minimum_booking" DECIMAL(10, 2) NOT NULL,
    "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL,
    "valid_till" TIMESTAMP WITH TIME ZONE NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("coupon_code");
CREATE INDEX IF NOT EXISTS "coupons_platform_id_idx" ON "coupons"("platform_id");


-- 8. PRICE_HISTORY TABLE (Ticket fare monitoring snapshot log)
CREATE TABLE IF NOT EXISTS "price_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "bus_listing_id" UUID NOT NULL REFERENCES "bus_listings"("id") ON DELETE CASCADE,
    "price" DECIMAL(10, 2) NOT NULL,
    "tracked_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "price_history_listing_idx" ON "price_history"("bus_listing_id");
CREATE INDEX IF NOT EXISTS "price_history_tracked_at_idx" ON "price_history"("tracked_at");


-- 9. ROUTE_PRICE_HISTORY TABLE (Aggregated ticket price index snapshots)
CREATE TABLE IF NOT EXISTS "route_price_history" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "route_id" UUID NOT NULL REFERENCES "routes"("id") ON DELETE CASCADE,
    "min_price" DECIMAL(10, 2) NOT NULL,
    "max_price" DECIMAL(10, 2) NOT NULL,
    "avg_price" DECIMAL(10, 2) NOT NULL,
    "recorded_date" DATE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE ("route_id", "recorded_date")
);

-- Index for plotting historical line charts
CREATE INDEX IF NOT EXISTS "route_price_hist_route_idx" ON "route_price_history"("route_id");
CREATE INDEX IF NOT EXISTS "route_price_hist_date_idx" ON "route_price_history"("recorded_date");


-- 10. PRICE_ALERTS TABLE (User customized price trackers)
CREATE TABLE IF NOT EXISTS "price_alerts" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
    "source_city" VARCHAR(100) NOT NULL,
    "destination_city" VARCHAR(100) NOT NULL,
    "target_price" DECIMAL(10, 2) NOT NULL,
    "travel_date" DATE NOT NULL,
    "notification_sent" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "price_alerts_user_idx" ON "price_alerts"("user_id");
CREATE INDEX IF NOT EXISTS "price_alerts_cities_idx" ON "price_alerts"("source_city", "destination_city");


-- 11. FAVORITE_ROUTES TABLE (Bookmarks index)
CREATE TABLE IF NOT EXISTS "favorite_routes" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "route_id" UUID NOT NULL REFERENCES "routes"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE ("user_id", "route_id")
);

CREATE INDEX IF NOT EXISTS "favorite_routes_user_idx" ON "favorite_routes"("user_id");


-- 12. REVIEWS TABLE (Passenger ratings & cleanliness scores)
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "operator_id" UUID NOT NULL REFERENCES "bus_operators"("id") ON DELETE CASCADE,
    "rating" DECIMAL(2, 1) NOT NULL,
    "review_text" TEXT NOT NULL,
    "cleanliness_score" INTEGER NOT NULL CHECK ("cleanliness_score" BETWEEN 1 AND 5),
    "punctuality_score" INTEGER NOT NULL CHECK ("punctuality_score" BETWEEN 1 AND 5),
    "comfort_score" INTEGER NOT NULL CHECK ("comfort_score" BETWEEN 1 AND 5),
    "safety_score" INTEGER NOT NULL CHECK ("safety_score" BETWEEN 1 AND 5),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "reviews_operator_idx" ON "reviews"("operator_id");
CREATE INDEX IF NOT EXISTS "reviews_user_idx" ON "reviews"("user_id");


-- 13. BOOKING_CLICKS TABLE (Affiliate outbound funnel clicks monitor)
CREATE TABLE IF NOT EXISTS "booking_clicks" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "bus_listing_id" UUID NOT NULL REFERENCES "bus_listings"("id") ON DELETE CASCADE,
    "platform_id" UUID NOT NULL REFERENCES "platforms"("id") ON DELETE CASCADE,
    "clicked_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ip_address" VARCHAR(100),
    "device_type" VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS "booking_clicks_listing_idx" ON "booking_clicks"("bus_listing_id");
CREATE INDEX IF NOT EXISTS "booking_clicks_platform_idx" ON "booking_clicks"("platform_id");
CREATE INDEX IF NOT EXISTS "booking_clicks_time_idx" ON "booking_clicks"("clicked_at");


-- 14. ADMIN_USERS TABLE
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- 15. SCRAPER_LOGS TABLE (Sync auditing index)
CREATE TABLE IF NOT EXISTS "scraper_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "platform_id" UUID NOT NULL REFERENCES "platforms"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL,
    "records_fetched" INTEGER DEFAULT 0 NOT NULL,
    "error_message" TEXT,
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "completed_at" TIMESTAMP WITH TIME ZONE NOT NULL
);


-- 16. SEO_PAGES TABLE (Static pre-rendered pages & travel instructions index)
CREATE TABLE IF NOT EXISTS "seo_pages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "source_city" VARCHAR(100) NOT NULL,
    "destination_city" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "meta_description" TEXT NOT NULL,
    "distance_km" INTEGER NOT NULL,
    "average_duration" VARCHAR(50) NOT NULL,
    "lowest_price" DECIMAL(10, 2) NOT NULL,
    "average_price" DECIMAL(10, 2) NOT NULL,
    "total_operators" INTEGER NOT NULL,
    "bus_types" TEXT NOT NULL,
    "boarding_points" TEXT[] NOT NULL,
    "dropping_points" TEXT[] NOT NULL,
    "faqs_json" JSONB NOT NULL, -- structured FAQ list
    "reviews_json" JSONB NOT NULL, -- structured reviews list
    "insights" TEXT NOT NULL,
    "similar_routes" JSONB NOT NULL,
    "price_trends" JSONB NOT NULL,
    "top_operators" JSONB NOT NULL,
    "page_views" INTEGER DEFAULT 0 NOT NULL,
    "last_generated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "seo_pages_slug_idx" ON "seo_pages"("slug");
CREATE INDEX IF NOT EXISTS "seo_pages_route_names_idx" ON "seo_pages"("source_city", "destination_city");


-- 17. SAAS_ANALYTICS TABLE (Business intelligence snapshot indicators)
CREATE TABLE IF NOT EXISTS "saas_analytics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "recorded_date" DATE UNIQUE NOT NULL,
    "total_searches" INTEGER DEFAULT 0 NOT NULL,
    "total_clicks" INTEGER DEFAULT 0 NOT NULL,
    "revenue_generated" DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    "active_users" INTEGER DEFAULT 0 NOT NULL,
    "conversion_rate" DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
    "cache_hit_ratio" DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "saas_analytics_date_idx" ON "saas_analytics"("recorded_date");
