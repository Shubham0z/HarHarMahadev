// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL         = import.meta.env.VITE_SUPABASE_URL         ?? '';
const SUPABASE_ANON_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY    ?? '';
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing env vars — live data disabled');
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase;

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface SupabaseAnalysis {
  id:         string;
  created_at: string;
  result: {
    decision:                 string;
    confidence_score:         number;
    product:                  string;
    origin:                   string;
    destination:              string;
    best_route:               string | {
      mode:                  string;
      distance_km:           number;
      estimated_time_hours:  number;
      route_cost_inr:        number;
    };
    best_supplier:            string | {
      name:           string;
      supplier_city:  string;
      quality_score:  number;
      supplier_risk:  string;
    };
    total_cost_inr:           number;
    estimated_delivery_hours: number;
    overall_risk:             string;
    demand_trend:             string;
    peak_month:               string;
    risk_factors:             string[];
    final_recommendation:     string;
  };
}

export interface AllowedUser {
  email:            string;
  page_permissions: {
    home:      boolean;
    dashboard: boolean;
    analyze:   boolean;
    routes:    boolean;
    suppliers: boolean;
    risk:      boolean;
    scenarios: boolean;
    cost:      boolean;
    reports:   boolean;
  };
}

export interface Warehouse {
  id:            string;
  name:          string;
  region:        string;
  capacity:      number;
  current_stock: number;
  status:        string;
}

export interface StockTransfer {
  id:              string;
  from_warehouse:  string;
  to_warehouse:    string;
  quantity:        number;
  initiated_by:    string;
  status:          string;
  created_at:      string;
}

export interface SupplierContact {
  supplier_name: string;
  email:         string;
  phone:         string;
  city:          string;
}

export interface LiveAlert {
  id:          string;
  analysis_id: string | null;
  type:        'CRITICAL' | 'WARNING' | 'INFO';
  icon:        string;
  title:       string;
  description: string;
  risk:        'HIGH' | 'MEDIUM' | 'LOW';
  source:      string;
  is_active:   boolean;
  created_at:  string;
}

// ══════════════════════════════════════
// UTIL
// ══════════════════════════════════════

function parseResult(result: any) {
  try {
    if (typeof result === 'object' && result !== null) return result;
    if (typeof result === 'string') {
      const first = JSON.parse(result);
      if (typeof first === 'string') return JSON.parse(first);
      return first;
    }
    return null;
  } catch { return null; }
}

// ══════════════════════════════════════
// TOMTOM ALERTS
// ══════════════════════════════════════

const CITY_COORDS_MAP: Record<string, { lat: number; lng: number }> = {
  Mumbai:    { lat: 19.076,  lng: 72.8777 },
  Delhi:     { lat: 28.6139, lng: 77.209  },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.385,  lng: 78.4867 },
  Kolkata:   { lat: 22.5726, lng: 88.3639 },
  Gujarat:   { lat: 23.0225, lng: 72.5714 },
  Goa:       { lat: 15.2993, lng: 74.124  },
  Pune:      { lat: 18.5204, lng: 73.8567 },
};

async function fetchTomTomIncidents(
  origin: string,
  destination: string,
): Promise<{ title: string; description: string; severity: number }[]> {
  const KEY = import.meta.env.VITE_TOMTOM_API_KEY ?? '';
  if (!KEY) { console.warn('[TomTom] No API key — using fallback'); return []; }

  const from = CITY_COORDS_MAP[origin]      ?? { lat: 20.5937, lng: 78.9629 };
  const to   = CITY_COORDS_MAP[destination] ?? { lat: 20.5937, lng: 78.9629 };

  const bbox = `${Math.min(from.lng,to.lng)-1},${Math.min(from.lat,to.lat)-1},${Math.max(from.lng,to.lng)+1},${Math.max(from.lat,to.lat)+1}`;

  try {
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${KEY}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11&timeValidityFilter=present`;
    const res = await fetch(url);
    if (!res.ok) { console.warn('[TomTom] API error:', res.status); return []; }
    const data      = await res.json();
    const incidents = data?.incidents ?? [];
    if (!incidents.length) { console.log('[TomTom] No incidents found'); return []; }
    return incidents.slice(0, 2).map((inc: any) => {
      const props = inc.properties ?? {};
      const event = props.events?.[0] ?? {};
      return {
        title:       event.description ?? `Traffic Incident: ${props.from ?? origin} → ${props.to ?? destination}`,
        description: `TomTom Live: ${event.description ?? 'Road incident detected'}. From: ${props.from ?? origin} To: ${props.to ?? destination}.${props.delay ? ` Delay: ${Math.round(props.delay/60)} mins.` : ''}`,
        severity:    props.magnitudeOfDelay ?? 0,
      };
    });
  } catch (err) {
    console.error('[TomTom] Fetch error:', err);
    return [];
  }
}

function toRisk(s: number): 'HIGH' | 'MEDIUM' | 'LOW' { return s >= 3 ? 'HIGH' : s >= 2 ? 'MEDIUM' : 'LOW'; }
function toType(s: number): 'CRITICAL' | 'WARNING' | 'INFO' { return s >= 3 ? 'CRITICAL' : s >= 2 ? 'WARNING' : 'INFO'; }
function toIcon(s: number): string { return s >= 3 ? '🚨' : s >= 2 ? '⚠️' : '🛣️'; }

function buildFallbackAlerts(
  analysisId: string, origin: string, destination: string, product: string, risk: string,
): Omit<LiveAlert, 'id' | 'created_at'>[] {
  const hi = risk === 'HIGH';
  const md = risk === 'MEDIUM';
  return [
    {
      analysis_id: analysisId,
      type:        hi ? 'CRITICAL' : md ? 'WARNING' : 'INFO',
      icon:        hi ? '🚨' : md ? '⚠️' : '🛣️',
      title:       hi ? `Critical Route Congestion — ${origin} to ${destination}`
                 : md ? `Route Delay Warning — ${origin} Corridor`
                 :      `Route Clear — ${origin} to ${destination}`,
      description: hi ? `TomTom Fallback: Major congestion on ${origin}–${destination}. Est. delay 3–5 hrs. Alternate route recommended.`
                 : md ? `TomTom Fallback: Heavy traffic near ${origin}. Est. delay 1–2 hrs. Consider late departure.`
                 :      `TomTom Fallback: Route ${origin}–${destination} is clear. No major delays detected.`,
      risk:      hi ? 'HIGH' : md ? 'MEDIUM' : 'LOW',
      source:    'TomTom Fallback',
      is_active: true,
    },
    {
      analysis_id: analysisId,
      type:        hi ? 'CRITICAL' : md ? 'WARNING' : 'INFO',
      icon:        hi ? '🏭' : md ? '📦' : '✅',
      title:       hi ? `${product} Supply Risk — ${destination} Warehouse`
                 : md ? `${product} Stock Alert — ${destination}`
                 :      `${product} Stock Healthy — ${destination}`,
      description: hi ? `AI Risk Agent: ${product} critically low at ${destination}. Immediate dispatch required.`
                 : md ? `AI Risk Agent: ${product} approaching reorder level at ${destination}. Dispatch within 48 hrs.`
                 :      `AI Risk Agent: ${product} inventory at ${destination} is adequate.`,
      risk:      hi ? 'HIGH' : md ? 'MEDIUM' : 'LOW',
      source:    'AI Risk Agent',
      is_active: true,
    },
  ];
}

// ✅ ONLY called when supplier presses "Start Delivery" — live location aane ke baad
export async function generateAlertsOnDeliveryStart(params: {
  analysisId: string; origin: string; destination: string; product: string; risk: string;
}): Promise<void> {
  if (!supabase) return;
  const { analysisId, origin, destination, product, risk } = params;

  // Purane alerts band karo
  await supabase.from('live_alerts').update({ is_active: false }).eq('is_active', true);

  // TomTom se real data try karo
  const incidents = await fetchTomTomIncidents(origin, destination);

  const alerts: Omit<LiveAlert, 'id' | 'created_at'>[] = incidents.length > 0
    ? incidents.map(inc => ({
        analysis_id: analysisId,
        type:        toType(inc.severity),
        icon:        toIcon(inc.severity),
        title:       inc.title,
        description: inc.description,
        risk:        toRisk(inc.severity),
        source:      'TomTom Live',
        is_active:   true,
      }))
    : buildFallbackAlerts(analysisId, origin, destination, product, risk);

  const { error } = await supabase.from('live_alerts').insert(alerts);
  if (error) console.error('[generateAlertsOnDeliveryStart]', error.message);
  else console.log(`[generateAlertsOnDeliveryStart] ${alerts.length} alerts inserted ✅`);
}

// ✅ Called when new analysis runs — dashboard khali ho jata hai
export async function clearAllAlerts(): Promise<void> {
  if (!supabase) return;
  await supabase.from('live_alerts').update({ is_active: false }).eq('is_active', true);
}

export async function getActiveAlerts(): Promise<LiveAlert[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('live_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as LiveAlert[];
}

// ══════════════════════════════════════
// ANALYSIS
// ══════════════════════════════════════

export async function getLatestAnalysis(): Promise<SupabaseAnalysis | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('analyses').select('*').order('created_at', { ascending: false }).limit(1);
  if (error || !data || !data.length) return null;
  const result = parseResult(data[0].result);
  if (!result) return null;
  return { ...data[0], result };
}

export async function getAllAnalyses(): Promise<SupabaseAnalysis[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('analyses').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data
    .map((row: any) => ({ ...row, result: parseResult(row.result) }))
    .filter((row: any) => row.result !== null);
}

export async function getAnalysesCount(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase.from('analyses').select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

// ══════════════════════════════════════
// AUTH
// ══════════════════════════════════════

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not initialized' };
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return { error: 'Invalid email or password' };
  const { data: allowed } = await supabase.from('allowed_users').select('email').eq('email', email).maybeSingle();
  if (!allowed) { await supabase.auth.signOut(); return { error: 'Access denied.' }; }
  return { error: null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ══════════════════════════════════════
// USER PERMISSIONS
// ══════════════════════════════════════

export async function getAllUsers(): Promise<AllowedUser[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('allowed_users').select('email, page_permissions').order('email', { ascending: true });
  if (error || !data) return [];
  return data as AllowedUser[];
}

export async function getUserPermissions(email: string): Promise<AllowedUser['page_permissions'] | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from('allowed_users').select('page_permissions').eq('email', email).maybeSingle();
  if (error || !data) return null;
  return data.page_permissions;
}

export async function updateUserPermissions(
  email: string, permissions: AllowedUser['page_permissions'],
): Promise<{ error: string | null }> {
  if (!supabaseAdmin) return { error: 'Supabase not initialized' };
  const { error } = await supabaseAdmin
    .from('allowed_users').update({ page_permissions: permissions }).eq('email', email);
  if (error) return { error: error.message };
  return { error: null };
}

// ══════════════════════════════════════
// WAREHOUSE
// ══════════════════════════════════════

export async function getWarehousesByRegion(region: string): Promise<Warehouse[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('warehouses').select('*').eq('region', region).order('name', { ascending: true });
  if (error || !data) return [];
  return data as Warehouse[];
}

export async function getAllRegions(): Promise<string[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.from('warehouses').select('region');
  if (error || !data) return [];
  return [...new Set(data.map((d: any) => d.region))].sort() as string[];
}

export async function transferStock(
  fromWarehouse: string, toWarehouse: string, quantity: number,
  fromId: string, toId: string, fromStock: number, toStock: number, toCapacity: number,
): Promise<{ error: string | null }> {
  if (!supabaseAdmin) return { error: 'Supabase not initialized' };
  if (toStock + quantity > toCapacity)
    return { error: `${toWarehouse} capacity exceed hogi! Max: ${toCapacity - toStock} units` };
  const { error: e1 } = await supabaseAdmin.from('warehouses').update({ current_stock: fromStock - quantity }).eq('id', fromId);
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabaseAdmin.from('warehouses').update({ current_stock: toStock + quantity }).eq('id', toId);
  if (e2) return { error: e2.message };
  const { error: e3 } = await supabaseAdmin.from('stock_transfers').insert({
    from_warehouse: fromWarehouse, to_warehouse: toWarehouse,
    quantity, initiated_by: 'Manager', status: 'completed',
  });
  if (e3) return { error: e3.message };
  return { error: null };
}

export async function getRecentTransfers(): Promise<StockTransfer[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from('stock_transfers').select('*').order('created_at', { ascending: false }).limit(10);
  if (error || !data) return [];
  return data as StockTransfer[];
}

// ══════════════════════════════════════
// SUPPLIER CONTACT
// ══════════════════════════════════════

export async function getSupplierContact(
  supplierName: string, city?: string,
): Promise<SupplierContact | null> {
  if (!supabase) return null;
  const { data: n } = await supabase.from('suppliers')
    .select('supplier_name, email, phone, city')
    .ilike('supplier_name', `%${supplierName}%`).not('phone', 'is', null).limit(1).maybeSingle();
  if (n) return n as SupplierContact;
  if (city) {
    const { data: c } = await supabase.from('suppliers')
      .select('supplier_name, email, phone, city')
      .ilike('city', `%${city}%`).not('phone', 'is', null).limit(1).maybeSingle();
    if (c) return c as SupplierContact;
  }
  const { data: a } = await supabase.from('suppliers')
    .select('supplier_name, email, phone, city').not('phone', 'is', null).limit(1).maybeSingle();
  return a ? a as SupplierContact : null;
}

// ══════════════════════════════════════
// MANAGER APPROVAL
// ══════════════════════════════════════

export async function saveManagerApproval(payload: {
  analysis_id: string; supplier_name: string;
  supplier_email: string; supplier_phone: string; manager_note: string;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase not initialized' };
  const { error } = await supabase.from('manager_approvals').insert([{
    analysis_id:    payload.analysis_id,
    supplier_name:  payload.supplier_name,
    supplier_email: payload.supplier_email,
    supplier_phone: payload.supplier_phone,
    status:         'contacted',
    manager_note:   payload.manager_note,
  }]);
  if (error) return { error: error.message };
  return { error: null };
}
