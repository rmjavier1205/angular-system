
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase.client';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return router.createUrlTree(['/login']);
    }

    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return router.createUrlTree(['/login']);
  }
};
