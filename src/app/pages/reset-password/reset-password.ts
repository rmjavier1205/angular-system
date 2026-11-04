
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { supabase } from '../../core/supabase.client';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(private router: Router) {}

  async updatePassword(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password.length < 8) {
      this.errorMessage = 'Your password must be at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          'Your reset link is invalid or has expired. Please request a new one.'
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: this.password,
      });

      if (error) throw error;

      this.successMessage =
        'Your password has been successfully updated. Please sign in with your new password.';

      await supabase.auth.signOut();

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error: unknown) {
      console.error('Password update failed:', error);

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to update your password. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
