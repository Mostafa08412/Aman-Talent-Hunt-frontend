import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {

  PublicJobPostListItemDtoPagedResultResult,
  PublicJobPostQueryParams,
} from '@core/models/job-post-model';
import { DepartmentLookupDtoIReadOnlyListResult } from '@core/models/admin-department-model';

@Injectable({ providedIn: 'root' })
export class JobPostService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/Departments/lookup — lightweight department list for filters. */
  getDepartmentLookup(): Observable<DepartmentLookupDtoIReadOnlyListResult> {
    return this.http.get<DepartmentLookupDtoIReadOnlyListResult>(
      `${this.base}/api/Departments/lookup`,
    );
  }

  getPublicList(
    params?: PublicJobPostQueryParams,
  ): Observable<PublicJobPostListItemDtoPagedResultResult> {
    return this.http.get<PublicJobPostListItemDtoPagedResultResult>(
      `${this.base}/api/JobPost/public`,
      { params: this.toHttpParams(params) },
    );
  }


  private toHttpParams(params?: PublicJobPostQueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    const entries = Object.entries(params) as [string, unknown][];
    for (const [key, value] of entries) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
