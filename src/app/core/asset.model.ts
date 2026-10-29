
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface AssetStatus {
  name: string;
  value: AssetType;
}
export enum AssetType {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  UNDER_REPAIR = 'UNDER_REPAIR',
  RETIRED = 'RETIRED',
  DISPOSED = 'DISPOSED',
}

export interface Asset {
  id: number;

  // Existing AssetDesk fields
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

  // Official Inventory of Staff and Assigned Equipment fields
  property_no: string | null;
  fund_code: string | null;
  account_code: string | null;
  article_description: string | null;
  property_status: string | null;
  unit: string | null;
  general_description: string | null;
  warranty_details: string | null;
  par_no: string | null;
  par_date: string | null;
  receiver: string | null;
  subpar: string | null;

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
  work_assignment: string | null;
  email: string | null;
  active: boolean;
}

export interface AuthorizedIssuer {
  id: string;
  full_name: string;
  employee_no: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Issuer {
  id: number;
  employee_id: number;
  is_active: boolean;
  employee: {
    id: number;
    full_name: string;
    employee_no: string | null;
    active: boolean;
  };
}
