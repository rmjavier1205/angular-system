import { Component, OnInit, signal} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { supabase } from '../../../core/supabase.client';
import { ASSET_TYPES, Asset, Employee, Issuer } from '../../../core/asset.model';
import { AssetService } from '../../../core/asset.service';
import { lucideAlertCircle, lucideCheckCircle } from '@ng-icons/lucide';

interface Assignment {
  id: number;
  asset_id: number;
  employee_id: number;
  assigned_at: string;
  returned_at: string | null;
  issued_by: number | null;
  received_condition: string | null;
  return_condition: string | null;
  notes: string | null;

  assets: Asset | null;

  employees: {
    id: number;
    full_name: string;
    employee_no: string | null;
    position: string | null;
    unit_section: string | null;
    office_location: string | null;
    work_assignment: string | null;
    email: string | null;
  } | null;

  authorized_issuers: {
    employee_id: number;
    employees: {
      full_name: string;
      employee_no: string | null;
    } | null;
  } | null;
}

@Component({
  selector: 'app-assignments',
  imports: [FormsModule, DatePipe, TitleCasePipe, NgIcon],
  templateUrl: './assignments.html',
  styleUrl: './assignments.css',

  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideCheckCircle,
    }),
  ]
})

export class Assignments implements OnInit {
  assignments = signal<Assignment[]>([]);
  availableAssets = signal<Asset[]>([]);
  employees = signal<Employee[]>([]);
  issuers = signal<Issuer[]>([]);
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchText = signal('');
  showForm = signal(false);
  showReturnForm = signal(false);
  showDetails = signal(false);
  selectedAssignment = signal<Assignment | null>(null);
  selectedDetailsAssignment = signal<Assignment | null>(null);

  readonly conditions = ['excellent', 'good', 'fair', 'poor'];

  form = {
    asset_id: null as number | null,
    employee_id: null as number | null,
    assigned_at: new Date().toISOString().slice(0, 10),
    issued_by: null as number | null,
    received_condition: 'good',
    notes: '',
  };

  returnForm = {
    returned_at: new Date().toISOString().slice(0, 10),
    return_condition: 'good',
    notes: '',
  };

  constructor(private assetService: AssetService) {}

  ngOnInit(): void {
    void this.loadData();
  }

  get filteredAssignments(): Assignment[] {
    const search = this.searchText().trim().toLowerCase();

    if (!search) return this.assignments();

    return this.assignments().filter((item) =>
      [
        item.assets?.asset_tag,
        item.assets?.name,
        item.employees?.full_name,
        item.employees?.employee_no,
        item.employees?.unit_section,
      ].some((value) => value?.toLowerCase().includes(search)),
    );
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const [assignmentResult, assetResult, employeeResult, issuerResult] = await Promise.all([
        supabase
          .from('assignments')
          .select(
            `*,
              assets (*),
              employees (*),
              authorized_issuers!assignments_issued_by_fkey (
                employee_id,
                employees (
                  full_name,
                  employee_no
                )
              )
            `,
          )
          .order('assigned_at', { ascending: false }),

        supabase.from('assets').select('*').eq('status', 'available').order('asset_tag'),

        supabase
          .from('employees')
          .select('id, employee_no, full_name, unit_section, office_location, email, active')
          .eq('active', true)
          .order('full_name'),

        this.assetService.getIssuers(),
      ]);

      if (assignmentResult.error) throw assignmentResult.error;
      if (assetResult.error) throw assetResult.error;
      if (employeeResult.error) throw employeeResult.error;

      this.assignments.set((assignmentResult.data ?? []) as unknown as Assignment[]);

      this.availableAssets.set((assetResult.data ?? []) as Asset[]);
      this.employees.set((employeeResult.data ?? []) as Employee[]);
      this.issuers.set(issuerResult);

      console.log('Issuers assigned to component:', this.issuers());
    } catch (error: any) {
      console.error('Unable to load assignments or issuers:', error);

      this.errorMessage.set(
        error?.message ??
          'Unable to load assignments or issuers. Check Supabase permissions and table relationships.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  openAssignForm(): void {
    this.form = {
      asset_id: null,
      employee_id: null,
      assigned_at: new Date().toISOString().slice(0, 10),
      issued_by: null,
      received_condition: 'good',
      notes: '',
    };

    this.errorMessage.set('');
    this.successMessage.set('');
    this.showForm.set(true);
  }

  closeAssignForm(): void {
    this.showForm.set(false);
  }

  async assignAsset(): Promise<void> {
    if (!this.form.asset_id) {
      this.errorMessage.set('Select an asset.');
      return;
    }

        if (!this.form.employee_id) {
      this.errorMessage.set('Select an employee.');
      return;
    }

    if (!this.form.assigned_at) {
      this.errorMessage.set('Enter the assignment date.');
      return;
    }

    if (this.form.issued_by == null) {
      this.errorMessage.set('Select an authorized issuer.');
      return;
    }

    // Validate the selected issuer before saving.
    const selectedIssuer = this.issuers().find(
      (issuer) =>
        issuer.id === Number(this.form.issued_by) && issuer.is_active && issuer.employee.active,
    );

    if (!selectedIssuer) {
      this.errorMessage.set('The selected issuer is no longer authorized. Refresh and try again.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const asset = this.availableAssets().find((item) => item.id === this.form.asset_id);

      if (!asset || asset.status !== ASSET_TYPES.AVAILABLE) {
        throw new Error('This asset is no longer available for assignment.');
      }

      // Save the numeric authorized_issuers.id, NOT the Auth UUID.
      const { data: inserted, error: insertError } = await supabase
        .from('assignments')
        .insert({
          asset_id: this.form.asset_id,
          employee_id: this.form.employee_id,
          assigned_at: this.form.assigned_at,
          issued_by: selectedIssuer.id,
          received_condition: this.form.received_condition,
          notes: this.form.notes.trim() || null,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      const { data: updatedAssets, error: updateError } = await supabase
        .from('assets')
        .update({
          status: 'assigned',
          employee_id: this.form.employee_id,
        })
        .eq('id', this.form.asset_id)
        .eq('status', 'available')
        .select('id');

      if (updateError || !updatedAssets?.length) {
        // Best-effort rollback of the assignment record.
        const { error: rollbackError } = await supabase
          .from('assignments')
          .delete()
          .eq('id', inserted.id);

        if (rollbackError) {
          console.error('Assignment rollback failed:', rollbackError);
        }

        throw updateError ?? new Error('The asset is no longer available. Refresh and try again.');
      }

      this.showForm.set(false);
      this.successMessage.set('Equipment assigned successfully.');

      await this.loadData();
    } catch (error: any) {
      console.error('Unable to assign asset:', error);

      this.errorMessage.set(error?.message ?? 'Unable to assign equipment.');
    } finally {
      this.saving.set(false);
    }
  }

  openReturnForm(assignment: Assignment): void {
    this.selectedAssignment.set(assignment);
    this.returnForm = {
      returned_at: new Date().toISOString().slice(0, 10),
      return_condition: 'good',
      notes: '',
    };

    this.errorMessage.set('');
    this.successMessage.set('');
    this.showReturnForm.set(true);
  }

  closeReturnForm(): void {
    this.showReturnForm.set(false);
    this.selectedAssignment.set(null);
  }

  async returnAsset(): Promise<void> {
    const assignment = this.selectedAssignment();

    if (!assignment) return;

    if (!this.returnForm.returned_at) {
      this.errorMessage.set('Enter the return date.');
      return;
    }

    if (this.returnForm.returned_at < assignment.assigned_at) {
      this.errorMessage.set('The return date cannot be earlier than the assignment date.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const { data: updatedAssignments, error: assignmentError } = await supabase
        .from('assignments')
        .update({
          returned_at: this.returnForm.returned_at,
          return_condition: this.returnForm.return_condition,
          notes: this.returnForm.notes.trim() || assignment.notes,
        })
        .eq('id', assignment.id)
        .is('returned_at', null)
        .select('id, asset_id, employee_id');

      if (assignmentError) throw assignmentError;

      if (!updatedAssignments?.length) {
        throw new Error('This assignment has already been returned. Refresh the list.');
      }

      const returned = updatedAssignments[0];

      const newStatus = this.returnForm.return_condition === 'poor' ? 'under_repair' : 'available';

      const { error: assetError } = await supabase
        .from('assets')
        .update({
          status: newStatus,
          employee_id: null,
          condition: this.returnForm.return_condition,
        })
        .eq('id', returned.asset_id)
        .eq('employee_id', returned.employee_id)
        .eq('status', 'assigned');

      if (assetError) {
        this.errorMessage.set(
          'The return was recorded, but the asset status could not be updated. Please check the asset record.',
        );
        console.error('Asset status update failed:', assetError);
        await this.loadData();
        return;
      }

      this.showReturnForm.set(false);
      this.selectedAssignment.set(null);
      this.successMessage.set(
        newStatus === 'under_repair'
          ? 'Equipment returned. Its status is Under Repair because its condition is Poor.'
          : 'Equipment returned successfully and marked Available.',
      );

      await this.loadData();
    } catch (error: any) {
      console.error('Unable to return asset:', error);
      this.errorMessage.set(error?.message ?? 'Unable to record the equipment return.');
    } finally {
      this.saving.set(false);
    }
  }

  openDetails(assignment: Assignment): void {
    this.selectedDetailsAssignment.set(assignment);
    this.showDetails.set(true);
  }

  closeDetails(): void {
    this.showDetails.set(false);
    this.selectedDetailsAssignment.set(null);
  }
}
