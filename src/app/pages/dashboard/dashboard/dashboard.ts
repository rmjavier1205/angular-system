
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseTestService } from '../../../core/supabase-test.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  connectionStatus = signal('Not tested');
  testing = signal(false);

  constructor(private supabaseTest: SupabaseTestService) {}

  async testConnection(): Promise<void> {
    this.testing.set(true);
    this.connectionStatus.set('Connecting...');

    try {
      const result = await this.supabaseTest.testConnection();
      this.connectionStatus.set(result);
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      this.connectionStatus.set(
        'Connection failed. Check the browser console and Supabase configuration.'
      );
    } finally {
      this.testing.set(false);
    }
  }
}
