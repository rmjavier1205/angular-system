import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  // Public pages - only accessible when logged out
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login/login').then((m) => m.Login),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/signup/signup/signup').then((m) => m.Signup),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then(
        (m) => m.ResetPassword
      ),
  },

  // Protected application pages
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [
          roleGuard(['it_staff', 'admin', 'super_admin']),
        ],
        loadComponent: () =>
          import('./pages/dashboard/dashboard/dashboard').then(
            (m) => m.Dashboard
          ),
      },
      {
        path: 'inventory',
        canActivate: [
          roleGuard(['it_staff', 'admin', 'super_admin']),
        ],
        loadComponent: () =>
          import('./pages/inventory/inventory/inventory').then(
            (m) => m.Inventory
          ),
      },
      {
        path: 'employees',
        canActivate: [
          roleGuard(['it_staff', 'admin', 'super_admin']),
        ],
        loadComponent: () =>
          import('./pages/employees/employees/employees').then(
            (m) => m.Employees
          ),
      },
      {
        path: 'assignments',
        canActivate: [
          roleGuard(['it_staff', 'admin', 'super_admin']),
        ],
        loadComponent: () =>
          import('./pages/assignments/assignments/assignments').then(
            (m) => m.Assignments
          ),
      },
      {
        path: 'maintenance',
        canActivate: [
          roleGuard(['it_staff', 'admin', 'super_admin']),
        ],
        loadComponent: () =>
          import('./pages/maintenance/maintenance/maintenance').then(
            (m) => m.Maintenance
          ),
      },
      {
        path: 'my-assigned-equipment',
        canActivate: [
          roleGuard(['viewer', 'it_staff', 'admin', 'super_admin']),
        ],
        loadComponent: () =>
          import(
            './pages/my-assigned-equipment/my-assigned-equipment/my-assigned-equipment'
          ).then(m => m.MyAssignedEquipmentComponent),
      },
      {
        path: 'audit-logs',
        canActivate: [
          roleGuard(['super_admin']),
        ],
        loadComponent: () =>
          import('./pages/audit-logs/audit-logs/audit-logs').then(
            m => m.AuditLogsComponent
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
    path: '**',
    redirectTo: 'login',
  },
];

