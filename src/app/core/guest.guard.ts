import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase.client';

export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session check failed:', error);
      return true;
    }

    // Already logged in: redirect to dashboard
    if (data.session) {
      return router.createUrlTree(['/dashboard']);
    }

    // Not logged in: allow access
    return true;

  } catch (error) {
    console.error('Guest guard check failed:', error);
    return true;
  }
};