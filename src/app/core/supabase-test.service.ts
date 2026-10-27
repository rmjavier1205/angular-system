
import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

@Injectable({
  providedIn: 'root',
})
export class SupabaseTestService {
  async testConnection(): Promise<string> {
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return 'Supabase client connected successfully.';
  }
}
