import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService, NewAsset, BulkAssetReceiving } from '../../../core/asset.service';
import {
  ASSET_TYPES,
  Asset,
  AssetCondition,
  AssetStatus,
  AssetType,
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
  readonly AssetType = ASSET_TYPES;
  assets = signal<Asset[]>([]);
  categories = signal<Category[]>([]);
  employees = signal<Employee[]>([]);
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  pageErrorMessage = signal('');
  successMessage = signal('');
  showForm = signal(false);
  showBulkForm = signal(false);
  showEditForm = signal(false);
  editingId = signal<number | null>(null);
  bulkQuantity = 1;

  bulkForm = {
    name: '',
    category_id: null as number | null,
    brand: '',
    model: '',
    purchase_date: '',
    purchase_cost: 0,
    supplier: '',
    warranty_expiry: '',
    condition: 'good' as AssetCondition,
    status: ASSET_TYPES.AVAILABLE,
    unit_section: '',
    office_location: '',
    notes: '',

    fund_code: '',
    account_code: '',
    article_description: '',
    property_status: '',
    unit: 'unit',
    general_description: '',
    warranty_details: '',
    par_no: '',
    par_date: '',
    receiver: '',
    subpar: '',
  };

  bulkItems: { property_no: string; serial_number: string }[] = [
    { property_no: '', serial_number: '' },
  ];

  readonly conditions: AssetCondition[] = ['excellent', 'good', 'fair', 'poor'];

  readonly statuses: AssetStatus[] = [ {
      name: 'Available',
      value: ASSET_TYPES.AVAILABLE
    }, {
      name: 'Assigned',
      value: ASSET_TYPES.ASSIGNED
    }, {
      name: 'Under Repair',
      value: ASSET_TYPES.UNDER_REPAIR
    }, {
      name: 'Retired',
      value: ASSET_TYPES.RETIRED
    }, {
      name: 'Disposed',
      value: ASSET_TYPES.DISPOSED,
    }
  ];

  form = {
    asset_tag: '',
    property_no: '',
    name: '',
    category_id: null as number | null,
    article_description: '',
    property_status: '',

    brand: '',
    model: '',
    serial_number: '',
    unit: '',
    general_description: '',

    fund_code: '',
    account_code: '',
    purchase_date: '',
    purchase_cost: 0,
    supplier: '',
    warranty_expiry: '',
    warranty_details: '',

    condition: 'good' as AssetCondition,
    status: ASSET_TYPES.AVAILABLE as AssetType,
    employee_id: null as number | null,
    unit_section: '',
    office_location: '',
    receiver: '',

    par_no: '',
    par_date: '',
    subpar: '',
    notes: '',
  };

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    void this.loadInventory();
  }

  async loadInventory(): Promise<void> {
    this.loading.set(true);
    this.pageErrorMessage.set('');

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

      this.pageErrorMessage.set(
        'Unable to load inventory. Check Supabase permissions and your database connection.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async openForm(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.editingId.set(null);
    this.resetForm();

    try {
      this.form.asset_tag = await this.assetService.getNextAssetTag();
      this.showForm.set(true);
    } catch (error) {
      console.error('Failed to generate asset tag:', error);

      this.pageErrorMessage.set(
        'Unable to generate an asset tag. Check your asset table permissions.'
      );
    }
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  openBulkForm(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.bulkQuantity = 1;
    this.bulkItems = [{ property_no: '', serial_number: '' }];
    this.showBulkForm.set(true);
  }

closeBulkForm(): void {
  this.showBulkForm.set(false);
}


openEditForm(asset: Asset): void {
  this.errorMessage.set('');
  this.successMessage.set('');
  this.editingId.set(asset.id);

  this.form = {
    asset_tag: asset.asset_tag ?? '',
    property_no: asset.property_no ?? '',
    name: asset.name ?? '',
    category_id: asset.category_id ?? null,
    article_description: asset.article_description ?? '',
    property_status: asset.property_status ?? '',

    brand: asset.brand ?? '',
    model: asset.model ?? '',
    serial_number: asset.serial_number ?? '',
    unit: asset.unit ?? '',
    general_description: asset.general_description ?? '',

    fund_code: asset.fund_code ?? '',
    account_code: asset.account_code ?? '',
    purchase_date: asset.purchase_date ?? '',
    purchase_cost: Number(asset.purchase_cost ?? 0),
    supplier: asset.supplier ?? '',
    warranty_expiry: asset.warranty_expiry ?? '',
    warranty_details: asset.warranty_details ?? '',

    condition: asset.condition,
    status: asset.status,
    employee_id: asset.employee_id ?? null,
    unit_section: asset.unit_section ?? '',
    office_location: asset.office_location ?? '',
    receiver: asset.receiver ?? '',

    par_no: asset.par_no ?? '',
    par_date: asset.par_date ?? '',
    subpar: asset.subpar ?? '',
    notes: asset.notes ?? '',
  };

  this.showEditForm.set(true);
}

closeEditForm(): void {
  if (this.saving()) return;

  this.showEditForm.set(false);
  this.editingId.set(null);
  this.errorMessage.set('');
  this.resetForm();
}
  
updateBulkQuantity(value: number | string): void {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    this.errorMessage.set('Quantity must be between 1 and 500.');
    return;
  }

  this.errorMessage.set('');
  this.bulkQuantity = quantity;

  const items = [...this.bulkItems];

  while (items.length < quantity) {
    items.push({ property_no: '', serial_number: '' });
  }

  this.bulkItems = items.slice(0, quantity);
}

async saveBulkAssets(): Promise<void> {
  this.errorMessage.set('');
  this.successMessage.set('');

  if (!this.bulkForm.name.trim()) {
    this.errorMessage.set('Equipment name is required.');
    return;
  }

  if (
    this.bulkItems.length !== this.bulkQuantity ||
    this.bulkItems.some(
      item => !item.property_no.trim() || !item.serial_number.trim()
    )
  ) {
    this.errorMessage.set(
      'Enter a Property No. and real serial number for every unit.'
    );
    return;
  }

  if (
    !Number.isFinite(Number(this.bulkForm.purchase_cost)) ||
    Number(this.bulkForm.purchase_cost) < 0
  ) {
    this.errorMessage.set('Acquisition cost must be zero or greater.');
    return;
  }

  const batch: BulkAssetReceiving = {
    ...this.bulkForm,
    category_id: this.bulkForm.category_id,
    purchase_cost: Number(this.bulkForm.purchase_cost),
    purchase_date: this.bulkForm.purchase_date || null,
    warranty_expiry: this.bulkForm.warranty_expiry || null,
    condition: this.bulkForm.condition,
    status: this.bulkForm.status,
    supplier: this.bulkForm.supplier.trim() || null,
    brand: this.bulkForm.brand.trim() || null,
    model: this.bulkForm.model.trim() || null,
    unit_section: this.bulkForm.unit_section.trim() || null,
    office_location: this.bulkForm.office_location.trim() || null,
    notes: this.bulkForm.notes.trim() || null,

    fund_code: this.bulkForm.fund_code.trim() || null,
    account_code: this.bulkForm.account_code.trim() || null,
    article_description: this.bulkForm.article_description.trim() || null,
    property_status: this.bulkForm.property_status.trim() || null,
    unit: this.bulkForm.unit.trim() || null,
    general_description: this.bulkForm.general_description.trim() || null,
    warranty_details: this.bulkForm.warranty_details.trim() || null,
    par_no: this.bulkForm.par_no.trim() || null,
    par_date: this.bulkForm.par_date || null,
    receiver: this.bulkForm.receiver.trim() || null,
    subpar: this.bulkForm.subpar.trim() || null,

    items: this.bulkItems.map(item => ({
      property_no: item.property_no.trim(),
      serial_number: item.serial_number.trim(),
    })),
  };

  this.saving.set(true);

  try {
    const created = await this.assetService.receiveAssetsInBulk(batch);

    await this.loadInventory();

    this.successMessage.set(
      `Successfully received ${created.length} equipment unit(s).`
    );

    this.showBulkForm.set(false);
  } catch (error) {
    console.error('Bulk receiving failed:', error);

    this.errorMessage.set(
      error instanceof Error
        ? error.message
        : 'Bulk receiving failed. No equipment was saved. Check database permissions and duplicate values.'
    );
  } finally {
    this.saving.set(false);
  }
}

  onEmployeeChange(): void {
    const employee = this.employees().find((item) => item.id === this.form.employee_id);

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
      this.errorMessage.set('Asset Tag and Equipment Name are required.');
      return;
    }

    if (!this.form.property_no.trim()) {
      this.errorMessage.set('Property Number is required.');
      return;
    }

    if (this.form.status === 'assigned' && this.form.employee_id === null) {
      this.errorMessage.set(
        'Please select an employee for an assigned asset.'
      );
      return;
    }

    if (
      !Number.isFinite(Number(this.form.purchase_cost)) ||
      Number(this.form.purchase_cost) < 0
    ) {
      this.errorMessage.set('Acquisition cost must be zero or greater.');
      return;
    }

    const payload: NewAsset = {
      asset_tag: this.form.asset_tag.trim(),
      property_no: this.form.property_no.trim(),
      name: this.form.name.trim(),
      category_id: this.form.category_id,
      article_description: this.form.article_description.trim() || null,
      property_status: this.form.property_status.trim() || null,

      brand: this.form.brand.trim() || null,
      model: this.form.model.trim() || null,
      serial_number: this.form.serial_number.trim() || null,
      unit: this.form.unit.trim() || null,
      general_description: this.form.general_description.trim() || null,

      fund_code: this.form.fund_code.trim() || null,
      account_code: this.form.account_code.trim() || null,
      purchase_date: this.form.purchase_date || null,
      purchase_cost: Number(this.form.purchase_cost),
      supplier: this.form.supplier.trim() || null,
      warranty_expiry: this.form.warranty_expiry || null,
      warranty_details: this.form.warranty_details.trim() || null,

      condition: this.form.condition,
      status: this.form.status,
      employee_id: this.form.employee_id,
      unit_section: this.form.unit_section.trim() || null,
      office_location: this.form.office_location.trim() || null,
      receiver: this.form.receiver.trim() || null,

      par_no: this.form.par_no.trim() || null,
      par_date: this.form.par_date || null,
      subpar: this.form.subpar.trim() || null,
      notes: this.form.notes.trim() || null,
    };

    this.saving.set(true);

    try {
      const id = this.editingId();

      if (id !== null) {
        // Update existing equipment
        await this.assetService.updateAsset(id, payload);

        this.successMessage.set('Equipment updated successfully.');
        this.showEditForm.set(false);
      } else {
        // Add new equipment
        await this.assetService.createAsset(payload);

        this.successMessage.set('Equipment added successfully.');
        this.showForm.set(false);
      }

      this.editingId.set(null);
      this.resetForm();

      await this.loadInventory();

    } catch (error) {
      console.error('Failed to save equipment:', error);

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Unable to save equipment. Check required fields, duplicate values, and Supabase permissions.'
      );
    } finally {
      this.saving.set(false);
    }
  }

  resetForm() {
    this.form = {
      asset_tag: '',
      property_no: '',
      name: '',
      category_id: null,
      article_description: '',
      property_status: '',

      brand: '',
      model: '',
      serial_number: '',
      unit: '',
      general_description: '',

      fund_code: '',
      account_code: '',
      purchase_date: '',
      purchase_cost: 0,
      supplier: '',
      warranty_expiry: '',
      warranty_details: '',

      condition: 'good',
      status: ASSET_TYPES.AVAILABLE,
      employee_id: null,
      unit_section: '',
      office_location: '',
      receiver: '',

      par_no: '',
      par_date: '',
      subpar: '',
      notes: '',
    };
  }

  categoryName(categoryId: number | null): string {
    return (
      this.categories().find((category) => category.id === categoryId)?.name ?? 'Uncategorized'
    );
  }

}
