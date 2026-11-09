import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { supabase } from '../../core/supabase.client';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css'
})
export class AppLayoutComponent implements OnInit {

  currentUserName = 'Loading user...';
  currentUserRole = '';
  currentUserDepartment = '';
  currentUserEmail = '';
  // Other existing properties and methods stay here.

    constructor(
      private router: Router,
      private cdr: ChangeDetectorRef
    ) {}
    ngOnInit(): void {
      this.loadCurrentUser();
    }

    async loadCurrentUser(): Promise<void> {
    try {
      const { data: { user }, error: authError } =
        await supabase.auth.getUser();

      if (authError || !user) {
        this.currentUserName = 'Guest User';
        this.currentUserRole = '';
        return;
      }

      this.currentUserEmail = user.email ?? '';

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, department, role')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        console.error('Unable to load user profile:', error);
        this.currentUserName = user.email ?? 'User';
        this.currentUserRole = '';
        return;
      }

      this.currentUserName = profile.full_name || user.email || 'User';
      this.currentUserRole = profile.role || '';
      this.currentUserDepartment = profile.department || '';

    } catch (error) {
      console.error('Failed to load current user:', error);
      this.currentUserName = 'User';
    } finally {
      this.cdr.markForCheck();
    }
  }

  get userInitials(): string {
    const name = this.currentUserName.trim();

    if (!name || name === 'Loading user...') {
      return 'U';
    }

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  get formattedRole(): string {
    if (!this.currentUserRole) return 'User';

    return this.currentUserRole
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout failed:', error);
      alert('Unable to log out. Please try again.');
      return;
    }

    await this.router.navigate(['/login']);
  }

  get isViewer(): boolean {
    return this.currentUserRole === 'viewer';
  }

  get isSuperAdmin(): boolean {
    return this.currentUserRole === 'super_admin';
  }

  get canAccessOperations(): boolean {
    return ['admin', 'it_staff', 'super_admin'].includes(
      this.currentUserRole
    );
  }
}