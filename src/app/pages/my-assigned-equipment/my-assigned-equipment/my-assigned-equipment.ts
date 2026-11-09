import { Component, OnInit, signal } from '@angular/core';
import {
  AssetService,
  MyAssignedEquipment,
} from '../../../core/asset.service';

@Component({
  selector: 'app-my-assigned-equipment',
  standalone: true,
  imports: [],
  templateUrl: './my-assigned-equipment.html',
  styleUrl: './my-assigned-equipment.css',
})
export class MyAssignedEquipmentComponent implements OnInit {

  equipment = signal<MyAssignedEquipment[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  searchTerm = signal('');

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    this.loadEquipment();
  }

  async loadEquipment(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const result = await this.assetService.getMyAssignedEquipment();
      this.equipment.set(result);
    } catch (error) {
      console.error('Unable to load assigned equipment:', error);

      this.errorMessage.set(
        'Unable to load your assigned equipment. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  get filteredEquipment(): MyAssignedEquipment[] {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.equipment();
    }

    return this.equipment().filter(item =>
      [
        item.asset_tag,
        item.asset_name,
        item.brand,
        item.model,
        item.serial_number,
        item.property_no,
      ]
        .some(value => value?.toLowerCase().includes(search))
    );
  }

  get totalEquipment(): number {
    return this.equipment().length;
  }

  get equipmentInGoodCondition(): number {
    return this.equipment().filter(item =>
      ['excellent', 'good'].includes(
        (item.current_condition ?? '').toLowerCase()
      )
    ).length;
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }

  formatCondition(condition: string | null): string {
    if (!condition) return 'Not specified';

    return condition
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }
}