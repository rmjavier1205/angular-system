import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Asset, Category, Employee, Issuer } from './asset.model';

export interface BulkAssetReceiving {
  name: string;
  category_id: number | null;
  brand: string | null;
  model: string | null;
  purchase_date: string | null;
  purchase_cost: number;
  supplier: string | null;
  warranty_expiry: string | null;
  condition: Asset['condition'];
  status: Asset['status'];
  unit_section: string | null;
  office_location: string | null;
  notes: string | null;

  fund_code: string | null;
  account_code: string | null;
  article_description: string | null;
  property_status: string | null;
  unit: string | null;
  general_description: string | null;
  processor: string | null;
  ram: string | null;
  storage: string | null;
  display: string | null;
  operating_system: string | null;
  graphics: string | null;
  connectivity: string | null;
  ports: string | null;
  accessories: string | null;
  other_specifications: string | null;
  warranty_period: string | null;
  warranty_details: string | null;
  par_no: string | null;
  par_date: string | null;
  receiver: string | null;
  subpar: string | null;

  items: {
    property_no: string;
    serial_number: string;
  }[];
}


type OfficialRegisterFields =
  | 'property_no'
  | 'fund_code'
  | 'account_code'
  | 'article_description'
  | 'property_status'
  | 'unit'
  | 'general_description'
  | 'warranty_details'
  | 'par_no'
  | 'par_date'
  | 'receiver'
  | 'subpar';

export type NewAsset = Omit<
  Asset,
  'id' | 'created_at' | 'updated_at' | OfficialRegisterFields
> &
  Partial<Pick<Asset, OfficialRegisterFields>>;

export interface DashboardSummary {
  totalAssets: number;
  available: number;
  assigned: number;
  underRepair: number;
  retired: number;
  disposed: number;
  totalValue: number;
}

export interface RecentActivity {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  changed_by: string;
  changed_at: string;
  actor_name: string;
  asset_tag: string | null;
  asset_name: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}
export interface MyAssignedEquipment {
  assignment_id: number;
  asset_id: number;
  asset_tag: string | null;
  asset_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  property_no: string | null;
  assigned_at: string;
  received_condition: string | null;
  current_condition: string | null;
  notes: string | null;
}

@Injectable({
  providedIn: 'root',
})

export class AssetService {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const statuses = [
      'available',
      'assigned',
      'under_repair',
      'retired',
      'disposed',
    ] as const;

    const results = await Promise.all(
      statuses.map(async (status) => {
        const { count, error } = await supabase
          .from('assets')
          .select('id', { count: 'exact', head: true })
          .eq('status', status);

        if (error) {
          throw error;
        }

        return { status, count: count ?? 0 };
      })
    );

    const counts = Object.fromEntries(
      results.map(item => [item.status, item.count])
    );

    // Retrieve purchase costs for the inventory value.
    const { data, error } = await supabase
      .from('assets')
      .select('purchase_cost');

    if (error) {
      throw error;
    }

    const totalValue = (data ?? []).reduce(
      (sum, asset) => sum + Number(asset.purchase_cost ?? 0),
      0
    );

    return {
      totalAssets: results.reduce((sum, item) => sum + item.count, 0),
      available: counts['available'] ?? 0,
      assigned: counts['assigned'] ?? 0,
      underRepair: counts['under_repair'] ?? 0,
      retired: counts['retired'] ?? 0,
      disposed: counts['disposed'] ?? 0,
      totalValue,
    };
  }

  async getAssets(): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Asset[];
  }

  async updateAsset(id: number, payload: NewAsset): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update asset:', error);
      throw new Error(error.message);
    }

    return data as Asset;
  }

  async getRecentActivities(
    limit: number = 10
  ): Promise<RecentActivity[]> {
    const { data, error } = await supabase.rpc(
      'get_recent_audit_activities',
      { p_limit: limit }
    );

    if (error) {
      console.error('Failed to load recent activities:', error);
      throw error;
    }

    return (data ?? []) as RecentActivity[];
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description')
      .order('name');

    if (error) {
      throw error;
    }

    return (data ?? []) as Category[];
  }

  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(
        'id, employee_no, full_name, position, unit_section, office_location, work_assignment, email, active, can_register',
      )
      .eq('active', true)
      .order('full_name');

    if (error) {
      throw error;
    }

    return (data ?? []) as Employee[];
  }

  async getIssuers(): Promise<Issuer[]> {
    // 1. Load active issuer records.
    const { data: issuerRows, error: issuerError } = await supabase
      .from('authorized_issuers')
      .select('id, employee_id, is_active')
      .eq('is_active', true);

    if (issuerError) {
      console.error('Failed to load issuer records:', issuerError);
      throw issuerError;
    }

    console.log('Active issuer records:', issuerRows);

    if (!issuerRows?.length) {
      return [];
    }

    // 2. Load the corresponding active employees.
    const employeeIds = issuerRows.map((row) => row.employee_id);

    const { data: employeeRows, error: employeeError } = await supabase
      .from('employees')
      .select('id, full_name, employee_no, active')
      .in('id', employeeIds)
      .eq('active', true)
      .order('full_name');

    if (employeeError) {
      console.error('Failed to load issuer employees:', employeeError);
      throw employeeError;
    }

    console.log('Active issuer employees:', employeeRows);

    // 3. Match each issuer record to its employee.
    return issuerRows
      .map((row) => {
        const employee = employeeRows?.find((item) => item.id === row.employee_id);

        if (!employee) {
          return null;
        }

        return {
          id: row.id,
          employee_id: row.employee_id,
          is_active: row.is_active,
          employee: {
            id: employee.id,
            full_name: employee.full_name,
            employee_no: employee.employee_no,
            active: employee.active,
          },
        };
      })
      .filter((issuer): issuer is Issuer => issuer !== null);
  }

  async createAsset(asset: NewAsset): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Asset;
  }

  async getNextAssetTag(): Promise<string> {
    const { data, error } = await supabase.from('assets').select('asset_tag');

    if (error) {
      throw error;
    }

    const highestNumber = (data ?? []).reduce((highest, asset) => {
      const match = asset.asset_tag.match(/^IT-(\d+)$/i);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);

    return `IT-${String(highestNumber + 1).padStart(4, '0')}`;
  }

  async receiveAssetsInBulk(batch: BulkAssetReceiving): Promise<Asset[]> {
    if (!batch.items.length) {
      throw new Error('Enter at least one equipment unit.');
    }

    const seenPropertyNumbers = new Set<string>();
    const seenSerialNumbers = new Set<string>();

    for (const [index, item] of batch.items.entries()) {
      const propertyNo = item.property_no.trim();
      const serialNumber = item.serial_number.trim();

      if (!propertyNo) {
        throw new Error(`Property No. is required for unit ${index + 1}.`);
      }

      if (!serialNumber) {
        throw new Error(`Real manufacturer serial number is required for unit ${index + 1}.`);
      }

      const normalizedPropertyNo = propertyNo.toUpperCase();
      const normalizedSerialNo = serialNumber.toUpperCase();

      if (seenPropertyNumbers.has(normalizedPropertyNo)) {
        throw new Error(`Duplicate Property No. in this batch: ${propertyNo}`);
      }

      if (seenSerialNumbers.has(normalizedSerialNo)) {
        throw new Error(`Duplicate serial number in this batch: ${serialNumber}`);
      }

      seenPropertyNumbers.add(normalizedPropertyNo);
      seenSerialNumbers.add(normalizedSerialNo);
    }

    // The database RPC will generate tags and insert every unit
    // within one transaction.
    const { data, error } = await supabase.rpc('receive_assets_in_bulk', {
      p_batch: {
        ...batch,
        items: batch.items.map((item) => ({
          property_no: item.property_no.trim(),
          serial_number: item.serial_number.trim(),
        })),
      },
    });

    if (error) {
      throw error;
    }

    return (data ?? []) as Asset[];
  }

  async getMyAssignedEquipment(): Promise<MyAssignedEquipment[]> {
    const { data, error } = await supabase.rpc(
      'get_my_assigned_equipment'
    );

    if (error) {
      console.error('Failed to load my assigned equipment:', error);
      throw error;
    }

    return (data ?? []) as MyAssignedEquipment[];
  }
}
