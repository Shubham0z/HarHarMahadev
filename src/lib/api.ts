const N8N_WEBHOOK_URL = 'https://mayan8n.app.n8n.cloud/webhook/supplychain/analyze';

/* ── Warehouse breakdown ── */
export interface WarehouseBreakdown {
    warehouse_days:              number;
    rate_per_kg_per_day:         number;
    cold_storage_applied:        boolean;
    warehouse_total_inr:         number;
    safety_stock_holding_cost:   number;
    origin_warehouse: {
        storage:      number;
        handling_in:  number;
        handling_out: number;
    };
    destination_warehouse: {
        storage:      number;
        handling_in:  number;
        handling_out: number;
    };
    source?: string;
}

/* ── Packaging breakdown ── */
export interface PackagingBreakdown {
    packaging_type:          string;
    packaging_material_cost?: number;
    material_cost?:           number;
    packing_labour_cost?:     number;
    labour_cost?:             number;
    cold_chain_insulation?:   number;
    hazmat_special_fee?:      number;
    packaging_total_inr:      number;
    rate_per_kg?:             number;
    source?:                  string;
}

/* ── Cold chain breakdown ── */
export interface ColdChainBreakdown {
    cold_chain_applicable:    boolean;
    cold_chain_total_inr:     number;
    reefer_vehicle_surcharge?: number;
    reefer_transport_extra?:   number;
    pre_cooling_cost?:         number;
    cold_storage_destination?: number;
    transit_cold_storage?:     number;
    temp_monitoring?:          number;
    temperature_monitoring?:   number;
    insurance_uplift?:         number;
    compliance_certification?: number;
    message?:                  string;
    source?:                   string;
}

/* ── GST breakdown ── */
export interface GSTBreakdown {
    gst_rate_percent?:  number;
    rate_percent?:      number;
    igst_on_goods:      number;
    freight_gst?:       number;
    freight_gst_5pct?:  number;
    total_gst:          number;
    source?:            string;
}

/* ── Insurance breakdown ── */
export interface InsuranceBreakdown {
    premium:         number;
    gst_on_premium:  number;
    insurance_total?: number;
    total?:          number;
    source?:         string;
}

/* ── Port/Customs breakdown ── */
export interface PortCustomsBreakdown {
    port_applicable?: boolean;
    applicable?:      boolean;
    port_name?:       string;
    thc_terminal_handling?: number;
    thc?:             number;
    documentation_fee?: number;
    docs?:            number;
    customs_examination?: number;
    cha_agent_fee?:   number;
    cha_fee?:         number;
    bcd_amount?:      number;
    bcd_duty?:        number;
    social_welfare_surcharge?: number;
    sws?:             number;
    igst_on_import?:  number;
    igst_import?:     number;
    customs_total?:   number;
    port_total_inr?:  number;
    total?:           number;
    message?:         string;
    source?:          string;
}

/* ── Per-mode breakdown ── */
export interface ModeBreakdown {
    base_freight?:      number;
    base_rail_freight?: number;
    base_air_freight?:  number;
    fuel_surcharge?:    number;
    toll_charges?:      number;
    loading_unloading?: number;
    load_type?:         string;
    rate_per_km?:       number;
    terminal_charges?:  number;
    terminal?:          number;
    documentation?:     number;
    first_last_mile?:   number;
    security_charge?:   number;
    airport_handling?:  number;
    road_to_airport?:   number;
    rate_per_kg?:       number;
    gst:                number;
    port_customs:       number;
    insurance:          number;
    warehouse:          number;
    packaging:          number;
    cold_chain:         number;
    grand_total:        number;
    time_hrs:           number;
    source?:            string;
}

/* ── Real cost breakdown (root) ── */
export interface RealCostBreakdown {
    distance_km:    number;
    cheapest_mode:  string;
    cheapest_total: number;
    fastest_mode:   string;
    fastest_time_hrs?: number;
    all_modes: {
        road: number;
        rail: number;
        air:  number;
    };
    road:         ModeBreakdown;
    rail:         ModeBreakdown;
    air:          ModeBreakdown;
    gst:          GSTBreakdown;
    insurance:    InsuranceBreakdown;
    warehouse:    WarehouseBreakdown;
    packaging:    PackagingBreakdown;
    cold_chain:   ColdChainBreakdown;
    port_customs: PortCustomsBreakdown;
}

/* ── Main AnalysisResult ── */
export interface AnalysisResult {
    decision:                  string;
    confidence_score:          number;
    product?:                  string;
    origin?:                   string;
    destination?:              string;
    best_route:                string;
    best_supplier:             string;
    recommended_mode?:         string;
    total_cost_inr:            number;
    estimated_delivery_hours:  number;
    overall_risk:              string;
    demand_trend:              string;
    peak_month:                string;
    risk_factors:              string[];
    final_recommendation:      string;

    /* Budget */
    budget_status?:    string;
    budget_verdict?:   string;
    budget_shortfall?: number;
    budget_surplus?:   number;
    cost_saving_tip?:  string;

    /* Scores */
    demand_score?:   number;
    route_score?:    number;
    supplier_score?: number;
    risk_score?:     number;
    cost_score?:     number;

    /* Full cost breakdown from n8n */
    real_cost_breakdown?: RealCostBreakdown;
}

/* ── Input — ALL fields n8n workflow expects ── */
export interface AnalysisInput {
    /* Required */
    product:          string;
    origin_city:      string;
    destination_city: string;
    weight_kg:        number;
    hs_code:          string;

    /* Optional with defaults */
    shipment_type?:              'ROAD' | 'RAIL' | 'AIR';
    load_type?:                  'AUTO' | 'FTL' | 'LTL';
    cargo_category?:             'GENERAL' | 'PHARMA' | 'ELECTRONICS' | 'FOOD' | 'CHEMICALS' | 'COLD';
    cargo_value_inr?:            number;
    user_budget_inr?:            number;
    is_import_export?:           boolean;
    port_name?:                  string;
    is_cold_chain?:              boolean;
    warehouse_days_origin?:      number;
    warehouse_days_destination?: number;
    scenario?:                   string;
}

/* ─────────────────────────────────────────────
   Recursive parser — handles every n8n shape:
   1. "\"{ \\\"decision\\\"... }\"" — double-encoded string
   2. "{ \"decision\"... }"         — single-encoded string
   3. { output: "..." }             — object with output string
   4. { output: { ... } }           — object with output object
   5. { decision: "..." }           — direct result
   6. [ ... ]                       — array wrapper
───────────────────────────────────────────── */
function deepParse(raw: unknown): AnalysisResult {
    if (typeof raw === 'string') {
        let cleaned = raw.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            try { cleaned = JSON.parse(cleaned); } catch { /* ignore */ }
        }
        try {
            const parsed = JSON.parse(cleaned);
            return deepParse(parsed);
        } catch {
            throw new Error('String is not valid JSON: ' + cleaned.slice(0, 80));
        }
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

    console.error('[n8n parser] Unrecognized shape:', raw);
    throw new Error('Unrecognized n8n response shape');
}

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
    const payload = {
        product:                     input.product,
        origin_city:                 input.origin_city,
        destination_city:            input.destination_city,
        weight_kg:                   input.weight_kg,
        hs_code:                     input.hs_code,
        shipment_type:               input.shipment_type               ?? 'ROAD',
        load_type:                   input.load_type                   ?? 'AUTO',
        cargo_category:              input.cargo_category              ?? 'GENERAL',
        cargo_value_inr:             input.cargo_value_inr             ?? 0,
        user_budget_inr:             input.user_budget_inr             ?? 0,
        is_import_export:            input.is_import_export            ?? false,
        port_name:                   input.port_name                   ?? 'JNPT',
        is_cold_chain:               input.is_cold_chain               ?? false,
        warehouse_days_origin:       input.warehouse_days_origin       ?? 0,
        warehouse_days_destination:  input.warehouse_days_destination  ?? 0,
        scenario:                    input.scenario                    ?? '',
    };

    console.log('[n8n] Sending payload:', payload);

    const res = await fetch(N8N_WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

    const raw = await res.json();
    console.log('[n8n RAW response]', JSON.stringify(raw, null, 2));

    const result = deepParse(raw);
    console.log('[n8n PARSED result]', result);

    return result;
}
