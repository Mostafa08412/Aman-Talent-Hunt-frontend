import { HttpParams } from '@angular/common/http';

export function toHttpParams(params?: Record<string, unknown>): HttpParams {
  let httpParams = new HttpParams();
  if (!params) return httpParams;

  const entries = Object.entries(params) as [string, unknown][];
  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === '') continue;
    httpParams = httpParams.set(key, String(value));
  }
  return httpParams;
}