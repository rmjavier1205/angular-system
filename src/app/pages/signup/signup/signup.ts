
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { supabase } from '../../../core/supabase.client';

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  employeeNo = '';
  email = '';
  password = '';
  confirmPassword = '';

  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  registrationSubmitted = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async signup(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    const employeeNo = this.employeeNo.trim();
    const email = this.email.trim().toLowerCase();

    // Validate required fields
    if (!employeeNo || !email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'Your password must be at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    // console.log('1. Starting registration request...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: this.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            employee_no: employeeNo,
          },
        },
      });

      // console.log('2. Registration response received:', {
      //   data,
      //   error,
      // });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Account creation was not completed.');
      }

      if (data.user.identities?.length === 0) {
        throw new Error(
          'This email address is already registered. Please sign in instead.'
        );
      }

      this.registrationSubmitted = true;

      this.cdr.markForCheck();

      this.successMessage =
        'Your account has been created! Please check your email for the verification link.';

      this.employeeNo = '';
      this.email = '';
      this.password = '';
      this.confirmPassword = '';

    } catch (error: unknown) {
      console.error('Registration failed:', error);

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to complete registration. Please contact your administrator.';

      this.cdr.detectChanges();

    } finally {
      this.loading = false;

      this.cdr.detectChanges();

      // console.log(
      //   '3. Registration finished. Loading:',
      //   this.loading
      // );
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}
