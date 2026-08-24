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

// Auth endpoints must never be retried with a refreshed token.
const AUTH_ENDPOINTS = ['/api/Authentication/'];

// ── Concurrent refresh coordination ──────────────────────────────────
// `isRefreshing` is a signal — simple synchronous flag, like a bool property.
// `refreshedToken$` MUST stay RxJS — queued requests need filter+take(1)
// to async-wait until the refresh observable emits the new token.
// ─────────────────────────────────────────────────────────────────────
const isRefreshing = signal(false);
const refreshedToken$ = new BehaviorSubject<string | null>(null);

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function isTokenError(errorTitle: string): boolean {
  return TOKEN_ERRORS.has(errorTitle);
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
            return next(newToken ? cloneWithToken(req, newToken) : req);
          }),
          catchError(() => {
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
        switchMap((token) => next(cloneWithToken(req, token!))),
      );
    }),
  );
};
