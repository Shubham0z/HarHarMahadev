// src/lib/api.ts
// ✅ Apna n8n webhook URL yahan daalo
const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE';

export interface AnalysisResult {
  decision: string;                   // 'SHIP NOW' | 'DELAY' | 'CANCEL'
  confidence_score: number;           // 0-100
  product?: string;
  origin?: string;
  destination?: string;
  best_route: string;
  best_supplier: string;
  recommended_mode?: string;          // 'ROAD' | 'RAIL' | 'AIR'
  total_cost_inr: number;
  estimated_delivery_hours: number;
  overall_risk: string;               // 'LOW' | 'MEDIUM' | 'HIGH'
  demand_trend: string;
  peak_month?: string;
  risk_factors: string[];
  final_recommendation: string;

  // Agent scores
  demand_score?: number;
  route_score?: number;
  supplier_score?: number;
  risk_score?: number;
  cost_score?: number;

  // Budget
  budget_status?: string;
  budget_verdict?: string;
  budget_shortfall?: number;
  budget_surplus?: number;
  cost_saving_tip?: string;

  // Cost breakdown
  real_cost_breakdown?: {
    distance_km?: number;
    cheapest_mode?: string;
    cheapest_total?: number;
    all_modes?: { road?: number; rail?: number; air?: number };
    road?: { base_freight?: number; fuel_surcharge?: number; toll_charges?: number; loading_unloading?: number; grand_total?: number };
    rail?: { base_freight?: number; fuel_surcharge?: number; toll_charges?: number; loading_unloading?: number; grand_total?: number };
    air?: { base_freight?: number; fuel_surcharge?: number; airport_handling?: number; road_to_airport?: number; grand_total?: number };
    gst?: { total_gst?: number };
    insurance?: { total?: number };
    port_customs?: { total?: number };
  };
}

export interface AnalysisInput {
  product: string;
  origin_city: string;
  destination_city: string;
  scenario: string;
  weight_kg?: number;
  user_budget_inr?: number;
  cargo_value_inr?: number;
}

// Recursive parser — handles all n8n response shapes
function deepParse(raw: unknown): AnalysisResult {
  if (typeof raw === 'string') {
    let cleaned = raw.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      try { cleaned = JSON.parse(cleaned); } catch { /* ignore */ }
    }
    try { return deepParse(JSON.parse(cleaned)); }
    catch { throw new Error('String is not valid JSON: ' + cleaned.slice(0, 80)); }
  }
  if (Array.isArray(raw)) {
    if (raw.length === 0) throw new Error('Empty array from n8n');
    return deepParse(raw[0]);
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if ('output' in obj && obj.output !== undefined) return deepParse(obj.output);
    if ('decision' in obj) return obj as unknown as AnalysisResult;
    if ('json' in obj && obj.json !== undefined) return deepParse(obj.json);
  }
  throw new Error('Unrecognized n8n response shape');
}

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const payload = {
    product:          input.product,
    origin_city:      input.origin_city,
    destination_city: input.destination_city,
    scenario:         input.scenario || '',
    weight_kg:        input.weight_kg       ?? 500,
    user_budget_inr:  input.user_budget_inr ?? 0,
    cargo_value_inr:  input.cargo_value_inr ?? 50000,
    shipment_type:    'ROAD',
    hs_code:          '85000000',
    is_import_export: false,
    port_name:        'JNPT',
  };

  console.log('[n8n REQUEST]', payload);

  const res = await fetch(N8N_WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status} — ${errText}`);
  }

  const raw = await res.json();
  console.log('[n8n RAW]', raw);

  const result = deepParse(raw);
  console.log('[n8n PARSED]', result);
  return result;
}

export const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Nagpur', 'Indore', 'Bhopal', 'Coimbatore',
];

export const PRODUCTS = [
  'Pharma', 'Electronics', 'FMCG', 'Automotive Parts',
  'Textile', 'Chemical', 'Food & Beverages', 'Kirana',
  'Steel & Metal', 'Plastic & Rubber',
];
