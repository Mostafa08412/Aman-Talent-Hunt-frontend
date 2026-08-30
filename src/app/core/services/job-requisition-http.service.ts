// ============================================================
// REAL HttpClient implementation of the Job Requisition API. Talks to the shipped
// AdminRequisitionsController + LookupsController. Screens depend only on the
// JobRequisitionApi contract + JOB_REQUISITION_API token (see job-req.routes.ts).
// ============================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  AssignRecruiterRequest,
  AttachJobDescriptionToRequisitionRequest,
  CreateRequisitionRequest,
  JobRequisitionDetailResult,
  JobRequisitionListQuery,
  JobRequisitionPagedResultResult,
  RejectRequisitionRequest,
  RequestModificationsRequest,
  RequisitionLifecycleRequest,
  UpdateRequisitionRequest,
} from '@core/models/job-requisition-model';
import type {
  BaseLookupParams,
  EmployeesLookupParams,
  JobDescriptionsLookupParams,
  LookupItemDtoPagedResultResult,
  ManpowerPlansLookupParams,
  PositionsLookupParams,
  SquadsLookupParams,
} from '@core/models/lookup-model';
import type { Result, ResultWithData } from '@core/models/common';
import { toHttpParams } from './http-params.util';
import { JobRequisitionApi } from './job-requisition-api';
import type { EmployeeLookupForDepartingParams } from './job-requisition-api';

@Injectable({ providedIn: 'root' })
export class JobRequisitionHttpService extends JobRequisitionApi {
  private http = inject(HttpClient);
  private base = environment.apiBase;
  private readonly requisitionsUrl = `${this.base}/api/admin/requisitions`;
  private readonly lookupsUrl = `${this.base}/api/admin/lookups`;

  // ── Reads ──

  getList(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult> {
    return this.http.get<JobRequisitionPagedResultResult>(this.requisitionsUrl, {
      params: toHttpParams(query as unknown as Record<string, unknown>),
    });
  }

  getPendingApprovals(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult> {
    return this.http.get<JobRequisitionPagedResultResult>(`${this.requisitionsUrl}/pending-approvals`, {
      params: toHttpParams(query as unknown as Record<string, unknown>),
    });
  }

  getPendingModifications(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult> {
    return this.http.get<JobRequisitionPagedResultResult>(`${this.requisitionsUrl}/pending-modifications`, {
      params: toHttpParams(query as unknown as Record<string, unknown>),
    });
  }

  getAssigned(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult> {
    return this.http.get<JobRequisitionPagedResultResult>(`${this.requisitionsUrl}/assigned`, {
      params: toHttpParams(query as unknown as Record<string, unknown>),
    });
  }

  getById(id: string): Observable<JobRequisitionDetailResult> {
    return this.http.get<JobRequisitionDetailResult>(`${this.requisitionsUrl}/${id}`);
  }

  // ── Create & edit ──

  create(request: CreateRequisitionRequest): Observable<ResultWithData<string>> {
    return this.http.post<ResultWithData<string>>(this.requisitionsUrl, request);
  }

  modify(id: string, request: UpdateRequisitionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/modify`, request);
  }

  // ── Draft lifecycle ──

  submit(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/submit`, null);
  }

  // ── Approval chain ──

  approveAsDepartmentHead(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/approve/department-head`, null);
  }

  approveAsHiringManager(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/approve/hiring-manager`, null);
  }

  approveAsHRManager(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/approve/hr-manager`, null);
  }

  reject(id: string, body: RejectRequisitionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/reject`, body);
  }

  requestModification(id: string, body: RequestModificationsRequest): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/request-modifications`, body);
  }

  // ── Recruiter / squad actions ──

  assignRecruiter(id: string, body: AssignRecruiterRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.requisitionsUrl}/${id}/assign-recruiter`, body);
  }

  // ── JD workflow ──

  attachJD(id: string, body: AttachJobDescriptionToRequisitionRequest): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/attach-jd`, body);
  }

  // ── Lifecycle actions ──

  hold(id: string, body: RequisitionLifecycleRequest): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/hold`, body);
  }

  resume(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/resume`, null);
  }

  close(id: string, body: RequisitionLifecycleRequest): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/close`, body);
  }

  fulfill(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.requisitionsUrl}/${id}/fulfill`, null);
  }

  // ── Creation wizard lookups (all paged) ──

  getDepartmentOptions(params?: BaseLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/departments`, {
      params: toHttpParams(params as unknown as Record<string, unknown>),
    });
  }

  getSquadOptions(params?: SquadsLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/squads`, {
      params: toHttpParams(params as unknown as Record<string, unknown>),
    });
  }

  getEmployeeOptions(params?: EmployeesLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/employees`, {
      params: toHttpParams(params as unknown as Record<string, unknown>),
    });
  }

  // The backend GetActivePlansLookupAsync always returns only Active plans, so we do
  // NOT send a `status` param here (PlanStatus has no "Open" member).
  getOpenManPowerPlanOptions(params?: ManpowerPlansLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/manpower-plans`, {
      params: toHttpParams(params as unknown as Record<string, unknown>),
    });
  }

  getActivePositionOptions(params?: PositionsLookupParams): Observable<LookupItemDtoPagedResultResult> {
    const merged: Record<string, unknown> = { ...(params as Record<string, unknown> ?? {}) };
    merged['isActive'] = merged['isActive'] ?? true;
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/positions`, {
      params: toHttpParams(merged),
    });
  }

  getDepartingEmployeeOptions(params?: EmployeeLookupForDepartingParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/employees`, {
      params: toHttpParams({ ...params, departing: true } as unknown as Record<string, unknown>),
    });
  }

  getDraftJobDescriptionOptions(params?: JobDescriptionsLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.lookupsUrl}/job-descriptions`, {
      params: toHttpParams({ ...params, status: params?.status ?? 'Draft' } as unknown as Record<string, unknown>),
    });
  }
}
