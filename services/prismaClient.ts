import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'prisma', 'fallback_db.json');

// Ensure parent dir and fallback file exists
function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    // Generate lovely initial seed data
    const initialData = {
      route: [
        { id: "route-del-lko", sourceCity: "Delhi", destinationCity: "Lucknow", distanceKm: 554 },
        { id: "route-del-jai", sourceCity: "Delhi", destinationCity: "Jaipur", distanceKm: 270 },
        { id: "route-blr-hyd", sourceCity: "Bangalore", destinationCity: "Hyderabad", distanceKm: 575 },
        { id: "route-pat-del", sourceCity: "Patna", destinationCity: "Delhi", distanceKm: 1050 }
      ],
      busListing: [],
      routePriceHistory: [],
      seoPage: [],
      saaSAnalytics: [],
      user: [
        { id: "usr-dummy-1", fullName: "Demo User", email: "demo@example.com", phone: "9876543210", isVerified: true, role: "user" }
      ],
      routeStats: [
        { sourceCity: "Delhi", destinationCity: "Lucknow", searchCount: 120, lastSearched: new Date().toISOString() },
        { sourceCity: "Delhi", destinationCity: "Jaipur", searchCount: 95, lastSearched: new Date().toISOString() },
        { sourceCity: "Bangalore", destinationCity: "Hyderabad", searchCount: 88, lastSearched: new Date().toISOString() },
        { sourceCity: "Patna", destinationCity: "Delhi", searchCount: 65, lastSearched: new Date().toISOString() }
      ],
      searchCache: [],
      fareHistory: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function loadDb() {
  ensureDbFile();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn("Failed to write fallback DB:", e);
  }
}

// Check database URL validity
const hasDbUrl = !!process.env.DATABASE_URL;

let realPrisma: PrismaClient | null = null;
if (hasDbUrl) {
  try {
    realPrisma = new PrismaClient();
  } catch (err) {
    console.warn("[Database] Failed to instantiate real Prisma client:", err);
  }
} else {
  console.log("[Database] No DATABASE_URL found. Utilizing fully resilient auto-seeded JSON database framework.");
}

// Simulated Client Engine
class SimulatedModel {
  constructor(private modelName: string) {}

  private getTable(): any[] {
    const db = loadDb();
    if (!db[this.modelName]) {
      db[this.modelName] = [];
      saveDb(db);
    }
    return db[this.modelName];
  }

  private saveTable(table: any[]) {
    const db = loadDb();
    db[this.modelName] = table;
    saveDb(db);
  }

  async findFirst(args: any = {}) {
    const table = this.getTable();
    const matches = this.filterTable(table, args.where);
    return matches[0] || null;
  }

  async findMany(args: any = {}) {
    let table = this.getTable();
    let matches = this.filterTable(table, args.where);
    
    // Sort implementation (if order by defined)
    if (args.orderBy) {
      const keys = Object.keys(args.orderBy);
      if (keys.length > 0) {
        const key = keys[0];
        const dir = args.orderBy[key];
        matches.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (valA < valB) return dir === 'asc' ? -1 : 1;
          if (valA > valB) return dir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    if (args.skip) {
      matches = matches.slice(args.skip);
    }
    if (args.take) {
      matches = matches.slice(0, args.take);
    }
    return matches;
  }

  async findUnique(args: any = {}) {
    const table = this.getTable();
    const matches = this.filterTable(table, args.where);
    return matches[0] || null;
  }

  async count(args: any = {}) {
    const table = this.getTable();
    const matches = this.filterTable(table, args.where);
    return matches.length;
  }

  async create(args: any = {}) {
    const table = this.getTable();
    const item = { id: `id-${Math.random().toString(36).substr(2, 9)}`, ...args.data };
    table.push(item);
    this.saveTable(table);
    return item;
  }

  async update(args: any = {}) {
    const table = this.getTable();
    const matches = this.filterTable(table, args.where);
    if (matches.length > 0) {
      const match = matches[0];
      Object.assign(match, args.data);
      this.saveTable(table);
      return match;
    }
    // Gracing update error: return a freshly created object if not found (lazy insert)
    const item = { id: `id-${Math.random().toString(36).substr(2, 9)}`, ...args.where, ...args.data };
    table.push(item);
    this.saveTable(table);
    return item;
  }

  async upsert(args: any = {}) {
    const table = this.getTable();
    const matches = this.filterTable(table, args.where);
    if (matches.length > 0) {
      const match = matches[0];
      const updateData = typeof args.update === 'function' ? args.update(match) : args.update;
      
      // Handle prisma increments, e.g., searchCount: { increment: 1 }
      for (const [k, v] of Object.entries(updateData)) {
        if (v && typeof v === 'object' && 'increment' in v) {
          match[k] = (match[k] || 0) + (v as any).increment;
        } else {
          match[k] = v;
        }
      }
      this.saveTable(table);
      return match;
    } else {
      const item = { id: `id-${Math.random().toString(36).substr(2, 9)}`, ...args.create };
      table.push(item);
      this.saveTable(table);
      return item;
    }
  }

  private filterTable(table: any[], where: any): any[] {
    if (!where) return table;
    
    return table.filter(item => {
      for (const [key, filterVal] of Object.entries(where)) {
        // Handle composite key unpackings
        if (key === 'sourceCity_destinationCity' && typeof filterVal === 'object' && filterVal !== null) {
          for (const [subK, subV] of Object.entries(filterVal)) {
            if (String(item[subK]).toLowerCase() !== String(subV).toLowerCase()) return false;
          }
          continue;
        }

        if (key === 'routeKey_journeyDate' && typeof filterVal === 'object' && filterVal !== null) {
          for (const [subK, subV] of Object.entries(filterVal)) {
            let itemVal = item[subK];
            let checkVal = subV;
            if (itemVal instanceof Date) itemVal = itemVal.toISOString().split('T')[0];
            if (checkVal instanceof Date) checkVal = checkVal.toISOString().split('T')[0];
            if (typeof itemVal === 'string' && itemVal.includes('T')) itemVal = itemVal.split('T')[0];
            if (typeof checkVal === 'string' && checkVal.includes('T')) checkVal = checkVal.split('T')[0];
            if (String(itemVal) !== String(checkVal)) return false;
          }
          continue;
        }

        if (filterVal && typeof filterVal === 'object') {
          // Check for insensitive equals
          if ('equals' in filterVal) {
            const isInsensitive = (filterVal as any).mode === 'insensitive';
            const itemValStr = String(item[key]);
            const filterValStr = String((filterVal as any).equals);
            if (isInsensitive) {
              if (itemValStr.toLowerCase() !== filterValStr.toLowerCase()) return false;
            } else {
              if (itemValStr !== filterValStr) return false;
            }
          } else if ('gte' in filterVal || 'lte' in filterVal) {
            // boundary checks
            const val = item[key];
            if ('gte' in filterVal) {
              const boundary = (filterVal as any).gte;
              if (val < boundary) return false;
            }
            if ('lte' in filterVal) {
              const boundary = (filterVal as any).lte;
              if (val > boundary) return false;
            }
          }
        } else {
          // exact check
          if (item[key] !== filterVal) {
            return false;
          }
        }
      }
      return true;
    });
  }
}

const simulatedModels: Record<string, SimulatedModel> = {};

export const prisma = new Proxy({} as any as PrismaClient, {
  get(target, prop: string) {
    if (prop === '$connect' || prop === '$disconnect') {
      return async () => {};
    }

    if (realPrisma) {
      try {
        const val = (realPrisma as any)[prop];
        if (typeof val === 'function') {
          return val.bind(realPrisma);
        }
        return val;
      } catch (err) {
        console.warn("[Prisma Proxy] Real prisma read failed, falling back to simulation:", err);
      }
    }

    if (!simulatedModels[prop]) {
      simulatedModels[prop] = new SimulatedModel(prop);
    }
    return simulatedModels[prop];
  }
});
