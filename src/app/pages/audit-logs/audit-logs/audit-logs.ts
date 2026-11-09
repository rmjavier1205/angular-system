import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService, RecentActivity } from '../../../core/asset.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
})
export class AuditLogsComponent implements OnInit {
  activities = signal<RecentActivity[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  searchTerm = signal('');
  selectedAction = signal('all');
  selectedModule = signal('all');

  selectedActivity = signal<RecentActivity | null>(null);

  currentPage = signal(1);
  pageSize = signal(10);
  pageSizeOptions = [10, 25, 50];

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.assetService.getRecentActivities(50);
      this.activities.set(result);
      this.currentPage.set(1);
    } catch (error) {
      console.error('Audit logs loading failed:', error);
      this.errorMessage.set('Unable to load audit logs. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  get filteredActivities(): RecentActivity[] {
    const search = this.searchTerm().trim().toLowerCase();
    const action = this.selectedAction();
    const module = this.selectedModule();

    return this.activities().filter(activity => {
      const matchesSearch =
        !search ||
        [
          activity.actor_name,
          activity.table_name,
          activity.record_id,
          activity.asset_tag,
          activity.asset_name,
          activity.action,
        ].some(value => value?.toLowerCase().includes(search));

      const matchesAction =
        action === 'all' || activity.action.toUpperCase() === action;

      const matchesModule =
        module === 'all' || activity.table_name === module;

      return matchesSearch && matchesAction && matchesModule;
    });
  }

  get modules(): string[] {
    return [...new Set(this.activities().map(item => item.table_name))].sort();
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredActivities.length / this.pageSize())
    );
  }

  get paginatedActivities(): RecentActivity[] {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredActivities.slice(start, start + this.pageSize());
  }

  get firstRecord(): number {
    return this.filteredActivities.length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize() + 1;
  }

  get lastRecord(): number {
    return Math.min(
      this.currentPage() * this.pageSize(),
      this.filteredActivities.length
    );
  }

  onFilterChange(): void {
    this.currentPage.set(1);
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(page => page + 1);
    }
  }

  viewDetails(activity: RecentActivity): void {
    this.selectedActivity.set(activity);
  }

  closeDetails(): void {
    this.selectedActivity.set(null);
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  formatAction(action: string): string {
    return action.toUpperCase();
  }

  getActivityTitle(activity: RecentActivity): string {
    const action = activity.action.toUpperCase();

    if (activity.table_name === 'assets') {
      switch (action) {
        case 'INSERT':
          return 'Equipment added';
        case 'UPDATE':
          return 'Equipment updated';
        case 'DELETE':
          return 'Equipment deleted';
      }
    }

    return `${this.formatModule(activity.table_name)} ${action.toLowerCase()}`;
  }

  getActivityDescription(activity: RecentActivity): string {
    if (activity.asset_tag && activity.asset_name) {
      return `${activity.asset_tag} - ${activity.asset_name}`;
    }

    if (activity.asset_tag) {
      return activity.asset_tag;
    }

    return `${this.formatModule(activity.table_name)} record #${activity.record_id}`;
  }

  formatModule(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  formatJson(data: Record<string, unknown> | null): string {
    if (!data) {
      return 'No data available';
    }

    return JSON.stringify(data, null, 2);
  }
}