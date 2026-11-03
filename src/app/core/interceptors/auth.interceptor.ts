import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';
import { SESSION_EXPIRED_REASON } from '../constants/auth-session.constants';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);
  const apiUrl = environment.apiUrl.replace(/\/$/, '');
  const requestUrl = new URL(req.url, window.location.origin);
  const apiBaseUrl = new URL(apiUrl, window.location.origin);
  const isApiRequest = req.url === apiUrl || req.url.startsWith(`${apiUrl}/`)
    || (apiUrl.startsWith('/') && requestUrl.origin === apiBaseUrl.origin && requestUrl.pathname.startsWith(`${apiUrl}/`));
  if (!isApiRequest) {
    return next(req);
  }

  const apiBasePath = apiBaseUrl.pathname.replace(/\/$/, '');
  const apiPath = requestUrl.pathname.startsWith(`${apiBasePath}/`)
    ? requestUrl.pathname.slice(apiBasePath.length)
    : requestUrl.pathname === apiBasePath ? '' : requestUrl.pathname;
  const isPublicRequest = apiPath === '/public'
    || apiPath.startsWith('/public/')
    || apiPath === '/comunas'
    || apiPath.startsWith('/comunas/')
    || apiPath === '/auth/login'
    || apiPath === '/auth/forgot-password'
    || apiPath === '/auth/reset-password';
  const token = isPublicRequest ? null : authService.getToken();
  const modifiedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicRequest) {
        authService.logout();
        if (router.url.split('?')[0] !== '/login') {
          void router.navigate(['/login'], {
            replaceUrl: true,
            state: { reason: SESSION_EXPIRED_REASON },
          });
        }
      }

      if (error.status === 403 && error.error?.mustChangePassword === true && router.url !== '/change-password') {
        authService.markPasswordChangeRequired();
        router.navigate(['/change-password']);
      }

      logger.httpError(`api.${req.method.toLowerCase()}`, error);

      return throwError(() => error);
    })
  );
};
