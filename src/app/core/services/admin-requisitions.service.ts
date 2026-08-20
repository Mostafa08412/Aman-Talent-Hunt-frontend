import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import { HiringType, RequisitionStatus } from '@core/models/enums';
import {
  AssignRecruiterRequest,
  CreateRequisitionRequest,
  JobRequisitionDetailDtoResult,
  JobRequisitionListItemDtoPagedResultResult,
  RejectRequisitionRequest,
  RequestModificationsRequest,
  RequisitionStatusRequest,
  UpdateRequisitionRequest,
} from '@core/models/admin-requisition-model';
import { toHttpParams } from './http-params.util';

export interface AdminRequisitionsQueryParams {
  HiringType?: HiringType;
  Status?: RequisitionStatus;
  DepartmentId?: string;
  RecruiterId?: string;
  CreatedBy?: string;
  Year?: number;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminRequisitionsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(params?: AdminRequisitionsQueryParams): Observable<JobRequisitionListItemDtoPagedResultResult> {
    return this.http.get<JobRequisitionListItemDtoPagedResultResult>(`${this.base}/api/admin/requisitions`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  create(request: CreateRequisitionRequest): Observable<GuidResult> {
    return this.http.post<GuidResult>(`${this.base}/api/admin/requisitions`, request);
  }

  getPendingApprovals(
    params?: AdminRequisitionsQueryParams,
  ): Observable<JobRequisitionListItemDtoPagedResultResult> {
    return this.http.get<JobRequisitionListItemDtoPagedResultResult>(
      `${this.base}/api/admin/requisitions/pending-approvals`,
      { params: toHttpParams(params as Record<string, unknown>) },
    );
  }

  getById(id: string): Observable<JobRequisitionDetailDtoResult> {
    return this.http.get<JobRequisitionDetailDtoResult>(`${this.base}/api/admin/requisitions/${id}`);
  }

  modify(id: string, request: UpdateRequisitionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/requisitions/${id}/modify`, request);
  }

  changeStatus(id: string, request: RequisitionStatusRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/requisitions/${id}/status`, request);
  }

  assignRecruiter(id: string, request: AssignRecruiterRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/requisitions/${id}/assign-recruiter`, request);
  }

  approve(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/requisitions/${id}/approve`, null);
  }

  reject(id: string, request: RejectRequisitionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/requisitions/${id}/reject`, request);
  }

  requestModifications(id: string, request: RequestModificationsRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/requisitions/${id}/request-modifications`, request);
  }
}