import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { supabase } from './supabase.client';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async () => {
    const router = inject(Router);

    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return router.createUrlTree(['/login']);
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        console.error('Unable to retrieve user role:', error);
        return router.createUrlTree(['/login']);
      }

      if (!allowedRoles.includes(profile.role)) {

        // Regular employees should go to their own equipment page.
        if (profile.role === 'viewer') {
          return router.createUrlTree(['/my-assigned-equipment']);
        }

        // Other unauthorized users return to the dashboard.
        return router.createUrlTree(['/dashboard']);
      }

      return true;

    } catch (error) {
      console.error('Role verification failed:', error);
      return router.createUrlTree(['/login']);
    }
  };
};