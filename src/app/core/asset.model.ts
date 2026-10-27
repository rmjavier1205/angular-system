
export type AssetStatus =
  | 'available'
  | 'assigned'
  | 'under_repair'
  | 'retired'
  | 'disposed';

export type AssetCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor';

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  category_id: number | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number;
  supplier: string | null;
  warranty_expiry: string | null;
  condition: AssetCondition;
  status: AssetStatus;
  employee_id: number | null;
  unit_section: string | null;
  office_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Employee {
  id: number;
  employee_no: string | null;
  full_name: string;
  unit_section: string | null;
  office_location: string | null;
  email: string | null;
  active: boolean;
}
