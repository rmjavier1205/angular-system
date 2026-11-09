
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { supabase } from '../../../core/supabase.client';

interface EmployeeOption {
  id: number;
  employee_no: string;
  full_name: string;
}

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup implements OnInit {
  employees: EmployeeOption[] = [];

  selectedEmployeeId: number | null = null;
  employeeNo = '';
  email = '';
  password = '';
  confirmPassword = '';

  loading = false;
  loadingEmployees = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  registrationSubmitted = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  // Load active employees through the secure Supabase RPC
  async loadEmployees(): Promise<void> {
    this.loadingEmployees = true;
    this.errorMessage = '';

    try {
      const { data, error } = await supabase.rpc(
        'get_registration_employees'
      );

      if (error) {
        throw error;
      }

      const employeeRecords = (data ?? []) as EmployeeOption[];

      this.employees = employeeRecords
        .filter(employee => employee.full_name?.trim())
        .map(employee => ({
          id: employee.id,
          employee_no: employee.employee_no?.trim() ?? '',
          full_name: employee.full_name.trim(),
        }));

    } catch (error: unknown) {
      console.error('Unable to load employees:', error);

      this.errorMessage =
        'Unable to load the employee list. Please try again later.';

    } finally {
      this.loadingEmployees = false;
      this.cdr.detectChanges();
    }
  }

  // Register new AssetDesk account
  async signup(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';

    // Find selected employee
    const employee = this.employees.find(
      item => item.id === Number(this.selectedEmployeeId)
    );

    const employeeNo = this.employeeNo.trim();
    const email = this.email.trim().toLowerCase();

    // Validate employee selection
    if (!this.selectedEmployeeId || !employee) {
      this.errorMessage = 'Please select your employee name.';
      return;
    }

    // Validate required fields
    if (
      !employeeNo ||
      !email ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    // Validate employee number
    if (
      employee.employee_no.trim().toLowerCase() !==
      employeeNo.toLowerCase()
    ) {
      this.errorMessage =
        'The employee number does not match the selected employee.';
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Validate password
    if (this.password.length < 8) {
      this.errorMessage =
        'Your password must be at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: this.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            employee_id: employee.id,
            employee_no: employeeNo,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          'Account creation was not completed.'
        );
      }

      // Detect an existing email when Supabase returns an empty identity list
      if (data.user.identities?.length === 0) {
        throw new Error(
          'This email address is already registered. Please sign in instead.'
        );
      }

      // Registration submitted successfully
      this.registrationSubmitted = true;

      this.successMessage =
        'Your account has been created! Please check your email for the verification link.';

      // Clear registration fields
      this.selectedEmployeeId = null;
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

    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Return to login page
  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}
