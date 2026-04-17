export const CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai',
    'Hyderabad', 'Kolkata', 'Gujarat', 'Goa',
] as const;

export const PRODUCTS = [
    'Pharma', 'Electronics', 'FMCG', 'Automotive',
    'Kirana', 'Cloth', 'Furniture', 'Appliances',
] as const;

export const TRANSPORT_MODES = [
    'Road', 'Rail', 'Air',
] as const;

export const CATEGORIES = [
    'Pharma', 'Electronics', 'Automotive', 'Cloth',
    'FMCG', 'Appliances', 'Furniture', 'Kirana',
] as const;

export type City            = typeof CITIES[number];
export type Product         = typeof PRODUCTS[number];
export type TransportMode   = typeof TRANSPORT_MODES[number];
export type Category        = typeof CATEGORIES[number];

export type RiskLevel       = 'LOW' | 'MEDIUM' | 'HIGH';
export type Decision        = 'SHIP NOW' | 'DELAY' | 'CANCEL';
export type AlertType       = 'CRITICAL' | 'WARNING' | 'INFO';
export type ShipmentStatus  = 'ON TIME' | 'DELAYED' | 'AT RISK';
export type SupplierStatus  = 'ACTIVE' | 'REVIEW' | 'AT RISK';
