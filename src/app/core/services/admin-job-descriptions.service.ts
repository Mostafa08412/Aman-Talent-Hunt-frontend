import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import {
  AttachJobDescriptionRequest,
  CreateJobDescriptionRequest,
  JobDescriptionDetailDtoResult,
  JobDescriptionListItemDtoPagedResultResult,
  RejectJobDescriptionRequest,
  UpdateJobDescriptionRequest,
} from '@core/models/admin-job-description-model';
import { JobDescriptionsLookupParams, LookupItemDtoPagedResultResult } from '@core/models/lookup-model';
import { toHttpParams } from './http-params.util';

export interface AdminJobDescriptionsQueryParams {
  Status?: string;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminJobDescriptionsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getLookup(params?: JobDescriptionsLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.base}/api/admin/lookups/job-descriptions`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getList(
    params?: AdminJobDescriptionsQueryParams,
  ): Observable<JobDescriptionListItemDtoPagedResultResult> {
    return this.http.get<JobDescriptionListItemDtoPagedResultResult>(`${this.base}/api/admin/job-descriptions`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  create(request: CreateJobDescriptionRequest): Observable<GuidResult> {
    return this.http.post<GuidResult>(`${this.base}/api/admin/job-descriptions`, request);
  }

  getById(id: string): Observable<JobDescriptionDetailDtoResult> {
    return this.http.get<JobDescriptionDetailDtoResult>(`${this.base}/api/admin/job-descriptions/${id}`);
  }

  update(id: string, request: UpdateJobDescriptionRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/job-descriptions/${id}`, request);
  }

  delete(id: string): Observable<Result> {
    return this.http.delete<Result>(`${this.base}/api/admin/job-descriptions/${id}`);
  }

  submit(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-descriptions/${id}/submit`, null);
  }

  approve(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-descriptions/${id}/approve`, null);
  }

  reject(id: string, request: RejectJobDescriptionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-descriptions/${id}/reject`, request);
  }

  attachToRequisition(id: string, request: AttachJobDescriptionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-descriptions/${id}/attach-to-req`, request);
  }
}