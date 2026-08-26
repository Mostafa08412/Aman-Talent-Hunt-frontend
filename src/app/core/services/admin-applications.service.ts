import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import { ApplicationSource, ApplicationStatus } from '@core/models/enums';
import {
  ApplicationStatusCountDtoIReadOnlyListResult,
  ApplicantDetailDtoResult,
  ApplicantListItemDtoPagedResultResult,
  ChangeApplicationStatusRequest,
} from '@core/models/admin-application-model';
import { toHttpParams } from './http-params.util';

export interface AdminApplicationsQueryParams {
  Status?: ApplicationStatus;
  JobPostId?: string;
  Source?: ApplicationSource;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminApplicationsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(
    params?: AdminApplicationsQueryParams,
  ): Observable<ApplicantListItemDtoPagedResultResult> {
    return this.http.get<ApplicantListItemDtoPagedResultResult>(`${this.base}/api/admin/applications`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getCounts(jobPostId: string): Observable<ApplicationStatusCountDtoIReadOnlyListResult> {
    return this.http.get<ApplicationStatusCountDtoIReadOnlyListResult>(
      `${this.base}/api/admin/applications/counts`,
      { params: toHttpParams({ jobPostId }) },
    );
  }

  getById(id: string): Observable<ApplicantDetailDtoResult> {
    return this.http.get<ApplicantDetailDtoResult>(`${this.base}/api/admin/applications/${id}`);
  }

  changeStatus(id: string, request: ChangeApplicationStatusRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/applications/${id}/status`, request);
  }


  /**
   * The backend streams the CV as a binary file (not a Result envelope),
   * so this returns the raw Blob for direct download.
   */

  downloadResume(id: string, inline = false): Observable<Blob> {
    return this.http.get(`${this.base}/api/admin/applications/${id}/resume`, {
      responseType: 'blob',
      params: inline ? { inline: 'true' } : undefined,
      headers: inline ? { 'X-Requested-With': 'XMLHttpRequest' } : undefined,
    });
  }
}
