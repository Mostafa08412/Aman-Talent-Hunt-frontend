import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { toApiError, IdentityErrors } from '@core/errors';

// Token-related error codes that should trigger a refresh attempt.
const TOKEN_ERRORS: Set<string> = new Set([
  IdentityErrors.ExpiredToken,
  IdentityErrors.MissingToken,
  IdentityErrors.InvalidToken,
]);

// Server-down status codes that should force logout.
const SERVER_DOWN_STATUSES = new Set([0, 502, 503, 504]);

// Auth endpoints must never be retried with a refreshed token.
const AUTH_ENDPOINTS = ['/api/Authentication/'];

// ── Concurrent refresh coordination ──────────────────────────────────
const isRefreshing = signal(false);
const refreshedToken$ = new BehaviorSubject<string | false | null>(null);

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function isTokenError(errorTitle: string): boolean {
  return TOKEN_ERRORS.has(errorTitle);
}

function isServerError(err: HttpErrorResponse): boolean {
  return SERVER_DOWN_STATUSES.has(err.status);
}

function cloneWithToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // Skip auth endpoints — never refresh on login/register/etc.
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Server down — force logout immediately (toast handled by apiErrorInterceptor).
      if (isServerError(err)) {
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      }

      const { title } = toApiError(err);

      // Not a token error — let component-level handlers deal with it.
      if (!isTokenError(title)) {
        return throwError(() => err);
      }

      // First request to hit a token error — start a single refresh.
      if (!isRefreshing()) {
        isRefreshing.set(true);
        refreshedToken$.next(null);

        return auth.refreshAccessToken().pipe(
          switchMap((res) => {
            const newToken = res.data?.accessToken ?? null;
            refreshedToken$.next(newToken);
            if (newToken) {
              return next(cloneWithToken(req, newToken));
            }
            // Refresh succeeded but returned no token — treat as invalid session.
            auth.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          }),
          catchError(() => {
            refreshedToken$.next(false);
            auth.logout();
            router.navigate(['/login']);
            return throwError(() => err);
          }),
          finalize(() => {
            isRefreshing.set(false);
          }),
        );
      }

      // Another request hit a token error while refresh is in flight — wait for it.
      return refreshedToken$.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          if (token === false) {
            return throwError(() => err);
          }
          return next(cloneWithToken(req, token));
        }),
      );
    }),
  );
};
