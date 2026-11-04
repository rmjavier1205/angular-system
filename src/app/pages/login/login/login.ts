
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { supabase } from '../../../core/supabase.client';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  forgotPasswordMode = false;

  constructor(public router: Router) {}

  async login(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: this.email.trim(),
        password: this.password,
      });

      if (error) throw error;

      if (!data.session) {
        this.errorMessage = 'Unable to establish a login session.';
        return;
      }

      await this.router.navigate(['/dashboard']);
    } catch (error: unknown) {
      console.error('Login error:', error);
      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to log in. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  async sendPasswordReset(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.loading = true;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        this.email.trim(),
        {
        }
      );

      if (error) throw error;

      this.successMessage =
        'If an account exists for this email, a password reset link will be sent. Please check your inbox.';

    } catch (error: unknown) {
      console.error('Password reset request failed:', error);

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to send password reset email. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  backToLogin(): void {
    this.forgotPasswordMode = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}
