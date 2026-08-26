// ============================================================
// Job Requisition API contract — method signatures mirror secrets/job-req-module.md 1:1.
// Screens depend ONLY on this file (abstract class + injection token), never on the
// concrete implementation, so swapping fake -> real requires zero screen changes.
// ============================================================

import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
  AssignRecruiterPayload,
  AttachJobDescriptionPayload,
  CloseRequest,
  CreateJobRequisitionRequest,
  JobRequisitionDetailResult,
  JobRequisitionListQuery,
  JobRequisitionPagedResultResult,
  PatchDraftRequest,
  PendingCountResult,
  ReasonRequest,
  RequisitionStatsDto,
} from '@core/models/job-requisition-model';
import type { ResultWithData } from '@core/models/common';
import type { LookupItemDto } from '@core/models/lookup-model';

export abstract class JobRequisitionApi {
  abstract getList(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult>;
  abstract getById(id: string): Observable<JobRequisitionDetailResult>;
  abstract getPendingCount(): Observable<PendingCountResult>;
  abstract getStats(): Observable<ResultWithData<RequisitionStatsDto>>;

  abstract create(request: CreateJobRequisitionRequest): Observable<JobRequisitionDetailResult>;
  abstract updateDraft(id: string, request: PatchDraftRequest): Observable<JobRequisitionDetailResult>;

  abstract submit(id: string): Observable<JobRequisitionDetailResult>;
  abstract approveAsDepartmentHead(id: string): Observable<JobRequisitionDetailResult>;
  abstract approveAsHiringManager(id: string): Observable<JobRequisitionDetailResult>;
  abstract approveAsHRManager(id: string): Observable<JobRequisitionDetailResult>;
  abstract reject(id: string, body: ReasonRequest): Observable<JobRequisitionDetailResult>;
  abstract requestModification(id: string, body: ReasonRequest): Observable<JobRequisitionDetailResult>;

  abstract assignRecruiter(id: string, body: AssignRecruiterPayload): Observable<JobRequisitionDetailResult>;
  abstract attachJobDescription(id: string, body: AttachJobDescriptionPayload): Observable<JobRequisitionDetailResult>;

  abstract publish(id: string): Observable<JobRequisitionDetailResult>;
  abstract hold(id: string, body: ReasonRequest): Observable<JobRequisitionDetailResult>;
  abstract resume(id: string): Observable<JobRequisitionDetailResult>;
  abstract fulfill(id: string): Observable<JobRequisitionDetailResult>;
  abstract close(id: string, body: CloseRequest): Observable<JobRequisitionDetailResult>;

  // Wizard lookups — belong to their own modules on the real backend
  // (/api/admin/lookups/*); faked here so the creation screen isn't blocked.
  abstract getDepartmentOptions(): Observable<ResultWithData<LookupItemDto[]>>;
  abstract getSquadOptions(departmentId?: string): Observable<ResultWithData<LookupItemDto[]>>;
  abstract getEmployeeOptions(role: 'HR_MANAGER' | 'DEPARTMENT_HEAD' | 'RECRUITER', departmentId?: string): Observable<ResultWithData<LookupItemDto[]>>;
  abstract getOpenManPowerPlanOptions(departmentId?: string): Observable<ResultWithData<LookupItemDto[]>>;
  abstract getActivePositionOptions(departmentId?: string): Observable<ResultWithData<LookupItemDto[]>>;
  abstract getDepartingEmployeeOptions(): Observable<ResultWithData<LookupItemDto[]>>;
  abstract getDraftJobDescriptionOptions(squadId?: string): Observable<ResultWithData<LookupItemDto[]>>;
}

/** Screens inject this token; the concrete implementation is chosen in job-req.routes.ts. */
export const JOB_REQUISITION_API = new InjectionToken<JobRequisitionApi>('JOB_REQUISITION_API');
