import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AssetService, DashboardSummary } from '../../../core/asset.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  summary = signal<DashboardSummary>({
    totalAssets: 0,
    available: 0,
    assigned: 0,
    underRepair: 0,
    retired: 0,
    disposed: 0,
    totalValue: 0,
  });

  loading = signal(false);
  errorMessage = signal('');

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.assetService.getDashboardSummary();
      this.summary.set(result);
    } catch (error) {
      console.error('Dashboard loading failed:', error);
      this.errorMessage.set(
        'Unable to load dashboard information. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-PH').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(value);
  }

  get attentionCount(): number {
    return this.summary().underRepair;
  }

  get statusTotal(): number {
    return this.summary().totalAssets;
  }

  getPercentage(value: number): number {
    const total = this.statusTotal;
    if (!total) return 0;
    return (value / total) * 100;
  }
}