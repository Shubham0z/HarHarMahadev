export const CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai',
    'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad',
    'Surat', 'Jaipur', 'Lucknow', 'Nagpur',
    'Indore', 'Bhopal', 'Chandigarh', 'Kochi',
    'Goa', 'Bhubaneswar', 'Patna', 'Coimbatore',
] as const;

export const PRODUCTS = [
    'Rice', 'Wheat', 'Pharma', 'Electronics',
    'FMCG', 'Automotive', 'Kirana', 'Cloth',
    'Furniture', 'Appliances', 'Chemicals', 'Steel',
    'Plastics', 'Food Products', 'Medical Devices', 'Cosmetics',
] as const;

/* HS Code map — shown in dropdown as "label (code)" */
export const HS_CODES: { label: string; code: string }[] = [
    { label: 'Rice',             code: '1006' },
    { label: 'Wheat',            code: '1001' },
    { label: 'Vegetables',       code: '0700' },
    { label: 'Fruits',           code: '0800' },
    { label: 'Fish / Seafood',   code: '0300' },
    { label: 'Dairy',            code: '0400' },
    { label: 'Sugar / Confec.',  code: '1700' },
    { label: 'Food Products',    code: '2100' },
    { label: 'Beverages',        code: '2200' },
    { label: 'Pharma / Meds',    code: '3000' },
    { label: 'Chemicals',        code: '2800' },
    { label: 'Org. Chemicals',   code: '2900' },
    { label: 'Plastics',         code: '3900' },
    { label: 'Rubber',           code: '4000' },
    { label: 'Paper / Cardboard',code: '4800' },
    { label: 'Textiles / Cloth', code: '6100' },
    { label: 'Garments (Knit)',  code: '6100' },
    { label: 'Garments (Woven)', code: '6200' },
    { label: 'Steel / Iron',     code: '7200' },
    { label: 'Machinery',        code: '8400' },
    { label: 'Electronics',      code: '8500' },
    { label: 'Vehicles / Auto',  code: '8700' },
    { label: 'Optical / Medical',code: '9000' },
    { label: 'Cosmetics',        code: '3300' },
    { label: 'Fuel / Petroleum', code: '2700' },
];

export const SHIPMENT_MODES = ['ROAD', 'RAIL', 'AIR'] as const;

export const LOAD_TYPES = [
    { value: 'AUTO', label: 'Auto (system decides)' },
    { value: 'FTL',  label: 'FTL — Full Truck Load'  },
    { value: 'LTL',  label: 'LTL — Less Than Truck'  },
] as const;

export const CARGO_CATEGORIES = [
    { value: 'GENERAL',     label: 'General'               },
    { value: 'PHARMA',      label: 'Pharma / Medicine'      },
    { value: 'ELECTRONICS', label: 'Electronics'            },
    { value: 'FOOD',        label: 'Food & Beverages'       },
    { value: 'CHEMICALS',   label: 'Chemicals / Hazmat'     },
    { value: 'COLD',        label: 'Cold Storage Required'  },
] as const;

export const PORT_NAMES = [
    'JNPT', 'Mundra', 'Chennai Port', 'Kolkata Port',
    'Vizag', 'Cochin', 'Kandla', 'Ennore',
] as const;

export type City          = typeof CITIES[number];
export type Product       = typeof PRODUCTS[number];
export type ShipmentMode  = typeof SHIPMENT_MODES[number];

export type RiskLevel      = 'LOW' | 'MEDIUM' | 'HIGH';
export type Decision       = 'SHIP NOW' | 'DELAY' | 'CANCEL';
export type AlertType      = 'CRITICAL' | 'WARNING' | 'INFO';
export type ShipmentStatus = 'ON TIME' | 'DELAYED' | 'AT RISK';
export type SupplierStatus = 'ACTIVE' | 'REVIEW' | 'AT RISK';
