// ============================================================
// Job Requisition API contract — method signatures mirror the shipped backend
// (AdminRequisitionsController + LookupsController) 1:1. Screens depend ONLY on
// this file (abstract class + injection token), never on the concrete
// implementation, so the provider can be swapped without touching screens.
// ============================================================

import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

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
import type { BaseLookupParams, EmployeesLookupParams, JobDescriptionsLookupParams, LookupItemDtoPagedResultResult, ManpowerPlansLookupParams, PositionsLookupParams, SquadsLookupParams } from '@core/models/lookup-model';
import type { Result, ResultWithData } from '@core/models/common';

export abstract class JobRequisitionApi {
  // ── Reads ──
  abstract getList(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult>;
  abstract getPendingApprovals(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult>;
  abstract getPendingModifications(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult>;
  abstract getAssigned(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult>;
  abstract getById(id: string): Observable<JobRequisitionDetailResult>;

  // ── Create & edit ──
  abstract create(request: CreateRequisitionRequest): Observable<ResultWithData<string>>;
  abstract modify(id: string, request: UpdateRequisitionRequest): Observable<Result>;

  // ── Draft lifecycle ──
  abstract submit(id: string): Observable<Result>;

  // ── Approval chain (per-role) ──
  abstract approveAsDepartmentHead(id: string): Observable<Result>;
  abstract approveAsHiringManager(id: string): Observable<Result>;
  abstract approveAsHRManager(id: string): Observable<Result>;
  abstract reject(id: string, body: RejectRequisitionRequest): Observable<Result>;
  abstract requestModification(id: string, body: RequestModificationsRequest): Observable<Result>;

  // ── Recruiter / squad actions ──
  abstract assignRecruiter(id: string, body: AssignRecruiterRequest): Observable<Result>;

  // ── JD workflow ──
  abstract attachJD(id: string, body: AttachJobDescriptionToRequisitionRequest): Observable<Result>;

  // ── Lifecycle actions ──
  abstract hold(id: string, body: RequisitionLifecycleRequest): Observable<Result>;
  abstract resume(id: string): Observable<Result>;
  abstract close(id: string, body: RequisitionLifecycleRequest): Observable<Result>;
  abstract fulfill(id: string): Observable<Result>;

  // ── Creation wizard lookups (LookupsController, all paged) ──
  abstract getDepartmentOptions(params?: BaseLookupParams): Observable<LookupItemDtoPagedResultResult>;
  abstract getSquadOptions(params?: SquadsLookupParams): Observable<LookupItemDtoPagedResultResult>;
  abstract getEmployeeOptions(params?: EmployeesLookupParams): Observable<LookupItemDtoPagedResultResult>;
  abstract getOpenManPowerPlanOptions(params?: ManpowerPlansLookupParams): Observable<LookupItemDtoPagedResultResult>;
  abstract getActivePositionOptions(params?: PositionsLookupParams): Observable<LookupItemDtoPagedResultResult>;
  abstract getDepartingEmployeeOptions(params?: EmployeeLookupForDepartingParams): Observable<LookupItemDtoPagedResultResult>;
  abstract getDraftJobDescriptionOptions(params?: JobDescriptionsLookupParams): Observable<LookupItemDtoPagedResultResult>;
}

/** Screens inject this token; the concrete implementation is chosen in job-req.routes.ts. */
export const JOB_REQUISITION_API = new InjectionToken<JobRequisitionApi>('JOB_REQUISITION_API');

/** Employees lookup restricted to departing employees (lookups/employees?departing=true). */
export interface EmployeeLookupForDepartingParams extends BaseLookupParams {
  departing?: boolean;
}
