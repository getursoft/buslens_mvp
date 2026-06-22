/**
 * RedisCache - A high-performance server-side in-memory Redis emulator.
 * Implements standard key-value storage, expiration TTL timers, atomic operations,
 * and compiles comprehensive query latency and cache telemetry logs.
 */

interface RedisValueRecord {
  value: any;
  expiresAt: number; // UTC timestamp in ms
}

class RedisClient {
  private store = new Map<string, RedisValueRecord>();
  private hits = 0;
  private misses = 0;
  private totalOps = 0;
  private latencyTrackList: number[] = [];

  constructor() {
    this.startGhostCollection();
  }

  /**
   * Periodically purges expired keys to maintain a clean memory footprint (similar to Redis' background active expire cycle).
   */
  private startGhostCollection() {
    setInterval(() => {
      const now = Date.now();
      let passiveEvicted = 0;
      for (const [key, record] of this.store.entries()) {
        if (now > record.expiresAt) {
          this.store.delete(key);
          passiveEvicted++;
        }
      }
      if (passiveEvicted > 0) {
        this.logMessage(`Active Expire Cycle: Evicted ${passiveEvicted} expired keys.`);
      }
    }, 15000).unref?.();
  }

  private logMessage(msg: string) {
    console.log(`[Redis Cluster Emulator] ${new Date().toISOString()} | ${msg}`);
  }

  /**
   * Tracks latency to simulate Redis runtime diagnostics.
   */
  private trackLatency(startTime: number) {
    const elapsedUs = Math.round((performance.now() - startTime) * 1000); // in microseconds
    this.latencyTrackList.push(elapsedUs);
    if (this.latencyTrackList.length > 100) {
      this.latencyTrackList.shift();
    }
  }

  /**
   * GET key
   */
  public async get<T>(key: string): Promise<T | null> {
    const start = performance.now();
    this.totalOps++;
    
    const record = this.store.get(key);
    if (!record) {
      this.misses++;
      this.trackLatency(start);
      return null;
    }

    if (Date.now() > record.expiresAt) {
      // Evict on read if expired
      this.store.delete(key);
      this.misses++;
      this.trackLatency(start);
      return null;
    }

    this.hits++;
    this.trackLatency(start);
    return record.value as T;
  }

  /**
   * SET key value with optional TTL (Seconds)
   */
  public async set(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
    const start = performance.now();
    this.totalOps++;

    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
    
    this.trackLatency(start);
    return true;
  }

  /**
   * DEL key
   */
  public async del(key: string): Promise<number> {
    const start = performance.now();
    this.totalOps++;

    const deleted = this.store.delete(key) ? 1 : 0;
    
    this.trackLatency(start);
    return deleted;
  }

  /**
   * EXPIRE key seconds
   */
  public async expire(key: string, seconds: number): Promise<number> {
    const start = performance.now();
    this.totalOps++;

    const record = this.store.get(key);
    if (!record || Date.now() > record.expiresAt) {
      this.trackLatency(start);
      return 0;
    }

    record.expiresAt = Date.now() + (seconds * 1000);
    this.store.set(key, record);
    this.trackLatency(start);
    return 1;
  }

  /**
   * TTL key (returns remaining lifetime seconds, or -2 if key doesn't exist, -1 if no TTL)
   */
  public async ttl(key: string): Promise<number> {
    const start = performance.now();
    this.totalOps++;

    const record = this.store.get(key);
    if (!record || Date.now() > record.expiresAt) {
      this.trackLatency(start);
      return -2;
    }

    const remainingMs = record.expiresAt - Date.now();
    this.trackLatency(start);
    return Math.max(0, Math.round(remainingMs / 1000));
  }

  /**
   * Diagnostics compilation stats for the developer/admin dashboard.
   */
  public getDiagnostics() {
    const activeKeys = Array.from(this.store.keys());
    const totalHits = this.hits;
    const totalMisses = this.misses;
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 100;
    const avgLatencyUs = this.latencyTrackList.length > 0
      ? this.latencyTrackList.reduce((a, b) => a + b, 0) / this.latencyTrackList.length
      : 0.15; // fallback base

    return {
      status: "CONNECTED",
      port: 6379,
      uptimeSeconds: Math.floor(process.uptime()),
      totalKeys: this.store.size,
      totalOps: this.totalOps,
      hits: totalHits,
      misses: totalMisses,
      hitRatePercentage: Math.round(hitRate * 10) / 10,
      avgLatencyMicroseconds: Math.round(avgLatencyUs * 10) / 10,
      activeKeys: activeKeys.map(k => ({
        key: k,
        length: JSON.stringify(this.store.get(k)?.value || '').length,
        expiresInSeconds: Math.max(0, Math.round(((this.store.get(k)?.expiresAt || 0) - Date.now()) / 1000))
      })).slice(0, 50)
    };
  }
}

export const redis = new RedisClient();
