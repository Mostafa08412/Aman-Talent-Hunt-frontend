import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { toApiError, IdentityErrors } from '@core/errors';

// Status codes for server-down — force logout is handled by errorInterceptor.
const SERVER_DOWN_STATUSES = new Set([0, 502, 503, 504]);

// Token errors handled by errorInterceptor — skip them here.
const TOKEN_ERROR_TITLES: Set<string> = new Set([
  IdentityErrors.ExpiredToken,
  IdentityErrors.MissingToken,
  IdentityErrors.InvalidToken,
]);

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token errors — errorInterceptor handles refresh/retry.
      const apiError = toApiError(err);

      if (TOKEN_ERROR_TITLES.has(apiError.title)) {
        return throwError(() => err);
      }

      // ── Server down ───────────────────────────────────────────────────
      if (SERVER_DOWN_STATUSES.has(err.status)) {
        messageService.add({
          severity: 'error',
          summary: 'Service Unavailable',
          detail: 'The server is not responding. Please try again later.',
        });
        return throwError(() => err);
      }

      // ── Business / validation errors ──────────────────────────────────
      switch (apiError.status) {
        case 403:
          messageService.add({
            severity: 'warn',
            summary: 'Access Denied',
            detail: 'You do not have permission to perform this action.',
          });
          break;

        case 404:
          messageService.add({
            severity: 'warn',
            summary: 'Not Found',
            detail: apiError.detail || 'The requested resource was not found.',
          });
          break;

        case 500:
          messageService.add({
            severity: 'error',
            summary: 'Server Error',
            detail: 'Something went wrong on our end. Please try again later.',
          });
          break;

        default:
          // 400, 409, 422, etc. — show the backend detail message.
          messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: apiError.detail || 'An unexpected error occurred.',
          });
      }

      return throwError(() => err);
    }),
  );
};
