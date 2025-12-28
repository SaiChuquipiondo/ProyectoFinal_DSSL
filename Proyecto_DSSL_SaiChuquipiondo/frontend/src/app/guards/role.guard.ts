import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRole = route.data['role'];
  const user = authService.getCurrentUser();

  if (user && user.rol === expectedRole) {
    return true;
  }

  // Si es ASESOR o JURADO, permitir acceso a /docente
  if (expectedRole === 'ASESOR' && (user?.rol === 'ASESOR' || user?.rol === 'JURADO')) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
