import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  title: string;
  detail: string;
  status: number;
  traceId?: string;
}

export function toApiError(err: HttpErrorResponse): ApiError {
  return {
    title: (err.error?.title as string) ?? '',
    detail: (err.error?.detail as string) ?? 'An unexpected error occurred.',
    status: err.status,
    traceId: err.error?.traceId,
  };
}
