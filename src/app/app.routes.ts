
import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard/dashboard').then(
            (m) => m.Dashboard
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory/inventory').then(
            (m) => m.Inventory
          ),
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./pages/employees/employees/employees').then(
            (m) => m.Employees
          ),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./pages/assignments/assignments/assignments').then(
            (m) => m.Assignments
          ),
      },
      {
        path: 'maintenance',
        loadComponent: () =>
          import('./pages/maintenance/maintenance/maintenance').then(
            (m) => m.Maintenance
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup/signup').then(
        (m) => m.Signup
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then(
        (m) => m.ResetPassword
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },

];
