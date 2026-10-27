
import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Asset, Category, Employee } from './asset.model';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
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
        'id, employee_no, full_name, unit_section, office_location, email, active'
      )
      .eq('active', true)
      .order('full_name');

    if (error) {
      throw error;
    }

    return (data ?? []) as Employee[];
  }


  async createAsset(
    asset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Asset> {
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
    const { data, error } = await supabase
      .from('assets')
      .select('asset_tag');

    if (error) {
      throw error;
    }

    const highestNumber = (data ?? []).reduce((highest, asset) => {
      const match = asset.asset_tag.match(/^IT-(\d+)$/i);
      return match
        ? Math.max(highest, Number(match[1]))
        : highest;
    }, 0);

    return `IT-${String(highestNumber + 1).padStart(4, '0')}`;
  }




}
