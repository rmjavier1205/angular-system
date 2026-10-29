import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../../core/asset.model';
import { supabase } from '../../../core/supabase.client';

interface AuthorizedIssuer {
  id: number;
  employee_id: number;
  is_active: boolean;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  employees = signal<Employee[]>([]);
  issuers = signal<AuthorizedIssuer[]>([]);
  isAdmin = signal(false);
  isSuperAdmin = signal(false);

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchText = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null);
  issuerActionId = signal<number | null>(null);

  form = {
    employee_no: '',
    full_name: '',
    unit_section: '',
    office_location: '',
    work_assignment: '',
    email: '',
    active: true,
  };

  ngOnInit(): void {
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.checkAdmin();
    await this.loadEmployees();
    await this.loadIssuers();
  }

  private async checkAdmin(): Promise<void> {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      const userId = authData.user?.id;

      if (!userId) {
        this.isAdmin.set(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const role = profile?.role;

      this.isAdmin.set(role === 'admin' || role === 'super_admin');

      this.isSuperAdmin.set(role === 'super_admin');
    } catch (error) {
      console.error('Unable to verify admin role:', error);
      this.isAdmin.set(false);
      this.isSuperAdmin.set(false);
    }
  }

  get filteredEmployees(): Employee[] {
    const search = this.searchText().trim().toLowerCase();

    if (!search) return this.employees();

    return this.employees().filter((employee) =>
      [
        employee.employee_no,
        employee.full_name,
        employee.unit_section,
        employee.office_location,
        employee.work_assignment,
        employee.email,
      ].some((value) => value?.toLowerCase().includes(search)),
    );
  }

  isIssuer(employeeId: number): boolean {
    return this.issuers().some((issuer) => issuer.employee_id === employeeId && issuer.is_active);
  }

  async loadEmployees(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_no, full_name, unit_section, office_location, email, active')
        .order('full_name');

      if (error) throw error;

      this.employees.set((data ?? []) as Employee[]);
    } catch (error) {
      console.error('Unable to load employees:', error);
      this.errorMessage.set('Unable to load employees. Check your Supabase permissions.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadIssuers(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('authorized_issuers')
        .select('id, employee_id, is_active');

      if (error) throw error;

      this.issuers.set((data ?? []) as AuthorizedIssuer[]);
    } catch (error) {
      console.error('Unable to load authorized issuers:', error);
      this.errorMessage.set('Unable to load issuer permissions. Check Supabase policies.');
    }
  }

  async toggleIssuer(employee: Employee): Promise<void> {
    if (!this.isAdmin()) {
      this.errorMessage.set('Only administrators can manage issuers.');
      return;
    }

    if (!employee.active && !this.isIssuer(employee.id)) {
      this.errorMessage.set('Activate the employee before authorizing them as an issuer.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.issuerActionId.set(employee.id);

    try {
      const existing = this.issuers().find((issuer) => issuer.employee_id === employee.id);

      if (existing?.is_active) {
        const { error } = await supabase
          .from('authorized_issuers')
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;

        this.successMessage.set(
          `${employee.full_name} is no longer authorized to issue equipment.`,
        );
      } else if (existing) {
        const { error } = await supabase
          .from('authorized_issuers')
          .update({
            is_active: true,
            deactivated_at: null,
          })
          .eq('id', existing.id);

        if (error) throw error;

        this.successMessage.set(`${employee.full_name} is now authorized to issue equipment.`);
      } else {
        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;

        const userId = authData.user?.id;

        if (!userId) {
          throw new Error('Your session has expired. Please sign in again.');
        }

        const { error } = await supabase.from('authorized_issuers').insert({
          employee_id: employee.id,
          is_active: true,
          authorized_by: userId,
        });

        if (error) throw error;

        this.successMessage.set(`${employee.full_name} is now authorized to issue equipment.`);
      }

      await this.loadIssuers();
    } catch (error: any) {
      console.error('Unable to update issuer authorization:', error);
      this.errorMessage.set(
        error?.message ?? 'Unable to update issuer authorization. Check your admin permissions.',
      );
    } finally {
      this.issuerActionId.set(null);
    }
  }

  openAddForm(): void {
    this.resetForm();
    this.editingId.set(null);
    this.showForm.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  openEditForm(employee: Employee): void {
    this.form = {
      employee_no: employee.employee_no ?? '',
      full_name: employee.full_name,
      unit_section: employee.unit_section ?? '',
      office_location: employee.office_location ?? '',
      work_assignment: employee.work_assignment ?? '',
      email: employee.email ?? '',
      active: employee.active,
    };

    this.editingId.set(employee.id);
    this.showForm.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async saveEmployee(): Promise<void> {
    if (!this.form.full_name.trim()) {
      this.errorMessage.set('Please enter the employee name.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      employee_no: this.form.employee_no.trim() || null,
      full_name: this.form.full_name.trim(),
      unit_section: this.form.unit_section.trim() || null,
      office_location: this.form.office_location.trim() || null,
      email: this.form.email.trim() || null,
      active: this.form.active,
    };

    try {
      const id = this.editingId();

      const result =
        id === null
          ? await supabase.from('employees').insert(payload)
          : await supabase.from('employees').update(payload).eq('id', id);

      if (result.error) throw result.error;

      this.showForm.set(false);
      this.resetForm();

      this.successMessage.set(
        id === null ? 'Employee added successfully.' : 'Employee updated successfully.',
      );

      await this.loadEmployees();
    } catch (error: any) {
      console.error('Unable to save employee:', error);
      this.errorMessage.set(
        error?.code === '23505'
          ? 'That employee number already exists.'
          : (error?.message ?? 'Unable to save employee.'),
      );
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(employee: Employee): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const { error } = await supabase
        .from('employees')
        .update({ active: !employee.active })
        .eq('id', employee.id);

      if (error) throw error;

      this.successMessage.set(employee.active ? 'Employee deactivated.' : 'Employee activated.');

      await this.loadEmployees();
    } catch (error: any) {
      console.error('Unable to update employee status:', error);
      this.errorMessage.set(error?.message ?? 'Unable to update employee status.');
    }
  }

  async deleteEmployee(employee: Employee): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${employee.full_name}?\n\n` +
        'This action cannot be undone. Employees with assignment, asset, ' +
        'or issuer history cannot be deleted.',
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.rpc('delete_employee_super_admin', {
        p_employee_id: employee.id,
      });

      if (error) throw error;

      this.successMessage.set(`${employee.full_name} was deleted successfully.`);
      this.errorMessage.set('');

      await this.loadEmployees();
      await this.loadIssuers();
    } catch (error: any) {
      console.error('Unable to delete employee:', error);

      this.errorMessage.set(error?.message ?? 'Unable to delete employee.');
      this.successMessage.set('');
    }
  }

  private resetForm(): void {
    this.form = {
      employee_no: '',
      full_name: '',
      unit_section: '',
      office_location: '',
      work_assignment: '',
      email: '',
      active: true,
    };
  }
}
