import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const apiUrl = environment.apiUrl.replace(/\/$/, '');
  const isApiRequest = req.url === apiUrl || req.url.startsWith(`${apiUrl}/`)
    || (apiUrl.startsWith('/') && new URL(req.url, window.location.origin).pathname.startsWith(`${apiUrl}/`));
  if (!isApiRequest) {
    return next(req);
  }

  const token = authService.getToken();
  const modifiedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && router.url !== '/login') {
        authService.logout();
        router.navigate(['/login']);
      }

      if (error.status === 403 && error.error?.mustChangePassword === true && router.url !== '/change-password') {
        authService.markPasswordChangeRequired();
        router.navigate(['/change-password']);
      }

      if (!environment.production) {
        console.error('HTTP Error:', {
          status: error.status,
          message: error.message,
          url: error.url,
          error: error.error,
        });
      }

      return throwError(() => error);
    })
  );
};
