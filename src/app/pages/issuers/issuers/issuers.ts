import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthorizedIssuer } from '../../../core/asset.model';
import { supabase } from '../../../core/supabase.client';

@Component({
  selector: 'app-issuers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './issuers.html',
  styleUrl: './issuers.css',
})
export class Issuers implements OnInit {
  issuers = signal<AuthorizedIssuer[]>([]);
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchText = signal('');
  showForm = signal(false);
  editingId = signal<string | null>(null);

  form = {
    full_name: '',
    employee_no: '',
    email: '',
    active: true,
  };

  ngOnInit(): void {
    void this.loadIssuers();
  }

  get filteredIssuers(): AuthorizedIssuer[] {
    const search = this.searchText().trim().toLowerCase();

    if (!search) return this.issuers();

    return this.issuers().filter((issuer) =>
      [issuer.full_name, issuer.employee_no, issuer.email].some((value) =>
        value?.toLowerCase().includes(search),
      ),
    );
  }

  async loadIssuers(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const { data, error } = await supabase
        .from('authorized_issuers')
        .select('id, full_name, employee_no, email, active, created_at, updated_at')
        .order('full_name');

      if (error) throw error;

      this.issuers.set((data ?? []) as AuthorizedIssuer[]);
    } catch (error) {
      console.error('Unable to load issuers:', error);
      this.errorMessage.set('Unable to load authorized issuers. Check your Supabase permissions.');
    } finally {
      this.loading.set(false);
    }
  }

  openAddForm(): void {
    this.resetForm();
    this.editingId.set(null);
    this.showForm.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  openEditForm(issuer: AuthorizedIssuer): void {
    this.form = {
      full_name: issuer.full_name,
      employee_no: issuer.employee_no ?? '',
      email: issuer.email ?? '',
      active: issuer.active,
    };

    this.editingId.set(issuer.id);
    this.showForm.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  async saveIssuer(): Promise<void> {
    if (!this.form.full_name.trim()) {
      this.errorMessage.set('Please enter the issuer name.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      full_name: this.form.full_name.trim(),
      employee_no: this.form.employee_no.trim() || null,
      email: this.form.email.trim().toLowerCase() || null,
      active: this.form.active,
      updated_at: new Date().toISOString(),
    };

    try {
      const id = this.editingId();

      const result =
        id === null
          ? await supabase.from('authorized_issuers').insert(payload)
          : await supabase.from('authorized_issuers').update(payload).eq('id', id);

      if (result.error) throw result.error;

      this.showForm.set(false);
      this.resetForm();
      this.successMessage.set(
        id === null
          ? 'Authorized issuer added successfully.'
          : 'Authorized issuer updated successfully.',
      );

      await this.loadIssuers();
    } catch (error: any) {
      console.error('Unable to save issuer:', error);

      this.errorMessage.set(
        error?.code === '23505'
          ? 'That employee number or email address already exists.'
          : (error?.message ?? 'Unable to save authorized issuer.'),
      );
    } finally {
      this.saving.set(false);
    }
  }

  async toggleActive(issuer: AuthorizedIssuer): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const { error } = await supabase
        .from('authorized_issuers')
        .update({
          active: !issuer.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', issuer.id);

      if (error) throw error;

      this.successMessage.set(issuer.active ? 'Issuer deactivated.' : 'Issuer activated.');

      await this.loadIssuers();
    } catch (error: any) {
      console.error('Unable to update issuer:', error);
      this.errorMessage.set(error?.message ?? 'Unable to update issuer status.');
    }
  }

  private resetForm(): void {
    this.form = {
      full_name: '',
      employee_no: '',
      email: '',
      active: true,
    };
  }
}
