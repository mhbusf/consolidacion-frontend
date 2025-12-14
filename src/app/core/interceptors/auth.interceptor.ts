import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Clonar la request y agregar withCredentials SIEMPRE
  let modifiedReq = req.clone({
    withCredentials: true, // ← CRÍTICO para CORS
  });

  // Si hay token, agregarlo al header Authorization
  if (token) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Asegurar Content-Type para requests con body JSON
  if (
    req.body &&
    typeof req.body === 'object' &&
    !req.headers.has('Content-Type')
  ) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos 401 Unauthorized, limpiar sesión y redirigir
      if (error.status === 401 && router.url !== '/login') {
        authService.logout();
        router.navigate(['/login']);
      }

      // Log para debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: error.message,
        url: error.url,
        error: error.error,
      });

      return throwError(() => error);
    })
  );
};
