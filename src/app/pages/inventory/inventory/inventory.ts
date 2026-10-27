
import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../../core/asset.service';
import {
  Asset,
  AssetCondition,
  AssetStatus,
  Category,
  Employee,
} from '../../../core/asset.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class Inventory implements OnInit {
  assets = signal<Asset[]>([]);
  categories = signal<Category[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showForm = signal(false);

  readonly conditions: AssetCondition[] = [
    'excellent',
    'good',
    'fair',
    'poor',
  ];

  readonly statuses: AssetStatus[] = [
    'available',
    'assigned',
    'under_repair',
    'retired',
    'disposed',
  ];

  form = {
    asset_tag: '',
    name: '',
    category_id: null as number | null,
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_cost: 0,
    supplier: '',
    warranty_expiry: '',
    condition: 'good' as AssetCondition,
    status: 'available' as AssetStatus,
    employee_id: null as number | null,
    unit_section: '',
    office_location: '',
    notes: '',
  };

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    void this.loadInventory();
  }

  async loadInventory(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const [assets, categories, employees] = await Promise.all([
        this.assetService.getAssets(),
        this.assetService.getCategories(),
        this.assetService.getEmployees(),
      ]);

      this.assets.set(assets);
      this.categories.set(categories);
      this.employees.set(employees);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      this.errorMessage.set(
        'Unable to load inventory. Check Supabase permissions and your database connection.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async openForm(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      this.form.asset_tag = await this.assetService.getNextAssetTag();
      this.showForm.set(true);
    } catch (error) {
      console.error('Failed to generate asset tag:', error);
      this.errorMessage.set(
        'Unable to generate an asset tag. Check your asset table permissions.',
      );
    }
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  onEmployeeChange(): void {
    const employee = this.employees().find(
      (item) => item.id === this.form.employee_id,
    );

    if (employee) {
      this.form.unit_section = employee.unit_section ?? '';
      this.form.office_location = employee.office_location ?? '';
      this.form.status = 'assigned';
    } else {
      this.form.status = 'available';
      this.form.unit_section = '';
      this.form.office_location = '';
    }
  }

  async saveAsset(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.form.asset_tag.trim() || !this.form.name.trim()) {
      this.errorMessage.set('Asset tag and equipment name are required.');
      return;
    }

    if (
      this.form.status === 'assigned' &&
      this.form.employee_id === null
    ) {
      this.errorMessage.set(
        'Please select an employee for an assigned asset.',
      );
      return;
    }

    this.saving.set(true);

    try {
      const payload: Omit<Asset, 'id' | 'created_at' | 'updated_at'> = {
        asset_tag: this.form.asset_tag.trim(),
        name: this.form.name.trim(),
        category_id: this.form.category_id,
        brand: this.form.brand.trim() || null,
        model: this.form.model.trim() || null,
        serial_number: this.form.serial_number.trim() || null,
        purchase_date: this.form.purchase_date || null,
        purchase_cost: Number(this.form.purchase_cost) || 0,
        supplier: this.form.supplier.trim() || null,
        warranty_expiry: this.form.warranty_expiry || null,
        condition: this.form.condition,
        status: this.form.status,
        employee_id:
          this.form.status === 'assigned' ? this.form.employee_id : null,
        unit_section: this.form.unit_section.trim() || null,
        office_location: this.form.office_location.trim() || null,
        notes: this.form.notes.trim() || null,
      };

      await this.assetService.createAsset(payload);
      await this.loadInventory();

      this.successMessage.set('Equipment added successfully.');
      this.showForm.set(false);
      this.resetForm();
    } catch (error) {
      console.error('Failed to save equipment:', error);
      this.errorMessage.set(
        'Unable to save equipment. Check required fields, unique values, and Supabase permissions.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  resetForm(): void {
    this.form = {
      asset_tag: '',
      name: '',
      category_id: null,
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      purchase_cost: 0,
      supplier: '',
      warranty_expiry: '',
      condition: 'good',
      status: 'available',
      employee_id: null,
      unit_section: '',
      office_location: '',
      notes: '',
    };
  }

  categoryName(categoryId: number | null): string {
    return (
      this.categories().find((category) => category.id === categoryId)?.name ??
      'Uncategorized'
    );
  }
}
