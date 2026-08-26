// ============================================================
// Job Requisition module — DTOs mirroring secrets/job-req-module.md
// (one resource, view-scoped lists, server-computed permittedActions)
// ============================================================

import type { PagedResult, ResultWithData } from './common';
import { HiringType, Location, SeniorityLevel } from './enums';

// Re-exported so screens can treat this file as the module's single model import.
export { HiringType, Location, SeniorityLevel };

// Creation discriminator — derived on the backend into HiringType + IsAdHocJob.
export enum RequisitionType {
  PlannedAdHoc = 'PLANNED_ADHOC',
  PlannedExisting = 'PLANNED_EXISTING',
  Replacement = 'REPLACEMENT',
  GrowthAdHoc = 'GROWTH_ADHOC',
  GrowthExisting = 'GROWTH_EXISTING',
}

export enum JobRequisitionStatus {
  Draft = 'DRAFT',
  PendingBudgetApproval = 'PENDING_BUDGET_APPROVAL',
  PendingAttachingJD = 'PENDING_ATTACHING_JD',
  PendingJDApproval = 'PENDING_JD_APPROVAL',
  PendingHRManagerApproval = 'PENDING_HR_MANAGER_APPROVAL',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Published = 'PUBLISHED',
  OnHold = 'ON_HOLD',
  Fulfilled = 'FULFILLED',
  Closed = 'CLOSED',
}

export enum ApproverRole {
  DepartmentHead = 'DEPARTMENT_HEAD',
  HiringManager = 'HIRING_MANAGER',
  HRManager = 'HR_MANAGER',
  Recruiter = 'RECRUITER',
}

// Values that can appear in JobRequisitionDetail.permittedActions.
export enum PermittedAction {
  Submit = 'SUBMIT',
  ApproveDepartmentHead = 'APPROVE_DEPARTMENT_HEAD',
  ApproveHiringManager = 'APPROVE_HIRING_MANAGER',
  ApproveHRManager = 'APPROVE_HR_MANAGER',
  Reject = 'REJECT',
  RequestModification = 'REQUEST_MODIFICATION',
  AssignRecruiter = 'ASSIGN_RECRUITER',
  AttachJobDescription = 'ATTACH_JOB_DESCRIPTION',
  Publish = 'PUBLISH',
  Hold = 'HOLD',
  Resume = 'RESUME',
  Fulfill = 'FULFILL',
  Close = 'CLOSE',
  EditDraft = 'EDIT_DRAFT',
}

export type RequisitionView =
  | 'mine'
  | 'pendingMyApproval'
  | 'pendingMyModification'
  | 'assignedToMySquad'
  | 'ownedByMySquad'
  | 'departmentAll'
  | 'all';

export interface ManPowerPlanRef {
  id: string;
  referenceNumber: string;
  isNewPositionTitle: boolean;
}

export interface PositionRegistryRef {
  id: string | null;
  referenceNumber: string;
  title: string | null;
  isActive: boolean;
}

export interface JobDescriptionRef {
  id: string | null;
  referenceNumber: string;
  status: 'Draft' | 'Approved' | null;
}

export interface AssignedSquadRef {
  id: string;
  name: string;
  leaderId: string;
}

export interface JobRequisitionSummary {
  id: string;
  referenceNumber: string;
  requisitionType: RequisitionType;
  status: JobRequisitionStatus;
  departmentId: string;
  departmentName: string;
  requestedHeadcount: number;
  location: Location;
  hiringManagerId: string;
  hiringManagerName: string;
  currentApproverRole: ApproverRole | null;
  currentApproverId: string | null;
  currentApproverName: string | null;
  proposedJobTitle: string;
  submittedAtUTC: string | null;
  updatedAtUTC: string | null;
}

export interface JobRequisitionDetail extends JobRequisitionSummary {
  isAdHocJob: boolean;
  hiringType: HiringType;
  manPowerPlan: ManPowerPlanRef | null;
  positionRegistry: PositionRegistryRef | null;
  jobDescription: JobDescriptionRef | null;
  assignedSquad: AssignedSquadRef;
  assignedRecruiterId: string | null;
  departingEmployeeName: string | null;
  departingEmployeeId: string | null;
  growthJustification: string | null;
  rejectionReason: string | null;
  onHoldReason: string | null;
  cancelReason: string | null;
  approvedAtUTC: string | null;
  publishedAtUTC: string | null;
  rejectedAtUTC: string | null;
  fulfilledAtUTC: string | null;
  closedAtUTC: string | null;
  isLockedForModification: boolean;
  isReassignmentLocked: boolean;
  // Populated while rejectionReason != null — the actor responsible for fixing the
  // requisition (the one whose action produced the current status), not the approver.
  pendingModificationOwnerId: string | null;
  pendingModificationOwnerName: string | null;
  pendingModificationOwnerRole: ApproverRole | null;
  // Computed server-side per caller — the UI never derives actions from status/role.
  permittedActions: PermittedAction[];
}

export interface JobRequisitionListQuery {
  view: RequisitionView;
  status?: JobRequisitionStatus[];
  departmentId?: string;
  squadId?: string;
  hiringType?: HiringType;
  isAdHocJob?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export type JobRequisitionPagedResult = PagedResult<JobRequisitionSummary>;
export type JobRequisitionPagedResultResult = ResultWithData<JobRequisitionPagedResult>;
export type JobRequisitionDetailResult = ResultWithData<JobRequisitionDetail>;

// ── Create payloads, discriminated by requisitionType ──

export interface CreateGrowthRequestBase {
  requisitionType: RequisitionType.GrowthAdHoc | RequisitionType.GrowthExisting;
  departmentId: string;
  departmentHeadId?: string | null;
  assignedSquadId: string;
  location: Location;
  requestedHeadcount: number;
  growthJustification?: string | null;
  proposedJobTitle: string;
  proposedJobSeniorityLevel: SeniorityLevel;
  hrManagerId: string;
}

export interface CreatePlannedExistingRequest {
  requisitionType: RequisitionType.PlannedExisting;
  manPowerPlanId: string;
  departmentId: string;
  assignedSquadId: string;
  location: Location;
  requestedHeadcount: number;
  hrManagerId: string;
}

export interface CreatePlannedAdHocRequest {
  requisitionType: RequisitionType.PlannedAdHoc;
  manPowerPlanId?: string | null;
  departmentId: string;
  assignedSquadId: string;
  location: Location;
  requestedHeadcount: number;
  proposedJobTitle: string;
  proposedJobSeniorityLevel: SeniorityLevel;
  growthJustification?: string | null;
  hrManagerId: string;
}

export interface CreateReplacementRequest {
  requisitionType: RequisitionType.Replacement;
  departmentId: string;
  assignedSquadId: string;
  location: Location;
  departingEmployeeName: string;
  departingEmployeeId: string;
  positionRegistryId: string;
  requestedHeadcount: number;
  hrManagerId: string;
}

export type CreateJobRequisitionRequest =
  | CreateGrowthRequestBase
  | CreatePlannedExistingRequest
  | CreatePlannedAdHocRequest
  | CreateReplacementRequest;

// PATCH /job-requisitions/{id} — mutable Draft fields only.
export interface PatchDraftRequest {
  requestedHeadcount: number;
  location: Location;
  growthJustification?: string | null;
  proposedJobTitle?: string | null;
  proposedJobSeniorityLevel?: SeniorityLevel | null;
}

export interface ReasonRequest {
  reason: string;
}

export interface AssignRecruiterPayload {
  recruiterId: string;
}

export interface AttachJobDescriptionPayload {
  jobDescriptionId: string;
}

export interface CloseRequest {
  reason: string | null;
}

export interface PendingCountResult extends ResultWithData<{ count: number }> {}

// HR oversight aggregate — Time-to-Fill and Time-to-Hire for now.
export interface RequisitionStatsDto {
  totalRequisitions: number;
  byStatus: Record<string, number>;
  averageTimeToFillDays: number | null;
  averageTimeToHireDays: number | null;
}
