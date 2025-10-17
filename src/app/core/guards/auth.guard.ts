import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles) {
    const hasRole = requiredRoles.some(role => authService.hasRole(role));
    if (!hasRole) {
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};