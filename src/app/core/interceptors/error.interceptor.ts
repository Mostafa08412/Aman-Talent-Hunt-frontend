import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const errorCodes = [""]
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      // Auth endpoints (login, refresh-token, …) must never be retried with a
      // refreshed token; falling back to a full logout keeps those clean.
      if (req.url.includes('/api/Authentication/')) {
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      return auth.refreshAccessToken().pipe(
        switchMap(() => {
          const token = auth.getToken();
          const cloned = token
            ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            : req;
          return next(cloned);
        }),
        catchError(() => {
          auth.logout();
          router.navigate(['/login']);
          return throwError(() => err);
        }),
      );
    }),
  );
};
