// ============================================================
// Job Requisition module — DTOs mirroring the shipped backend contract
// (AdminRequisitionsController + LookupsController). Field names / wire
// values match AmanTalentHunt.Application DTOs 1:1.
// ============================================================

import type { PagedResult, Result, ResultWithData } from './common';

// Re-exported so screens can treat this file as the module's single model import.
export { HiringType, Location, SeniorityLevel } from './enums';
import { HiringType, Location, SeniorityLevel } from './enums';

// Wire values for RequisitionStatus (AmanTalentHunt.Domain.Enums.RequisitionStatus).
// The API serializes enums via JsonStringEnumConverter with default naming, so the wire
// values are the raw PascalCase member names.
export enum JobRequisitionStatus {
  Draft = 'Draft',
  PendingBudgetApproval = 'PendingBudgetApproval',
  PendingAttachingJD = 'PendingAttachingJD',
  PendingJDApproval = 'PendingJDApproval',
  PendingHRManagerApproval = 'PendingHRManagerApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  RequestedModifications = 'RequestedModifications',
  Published = 'Published',
  Fulfilled = 'Fulfilled',
  OnHold = 'OnHold',
  Closed = 'Closed',
}

// Wire values for RequisitionAvailableAction (per-caller affordances returned on
// every detail response). The UI renders buttons from this list, not from status/role.
export enum RequisitionAvailableAction {
  Submit = 'Submit',
  Modify = 'Modify',
  AttachJD = 'AttachJD',
  AssignRecruiter = 'AssignRecruiter',
  Approve = 'Approve',
  Reject = 'Reject',
  RequestModifications = 'RequestModifications',
  Publish = 'Publish',
  OnHold = 'OnHold',
  Resume = 'Resume',
  Cancel = 'Cancel',
  Fulfill = 'Fulfill',
}

// Creation discriminator used by the New Requisition wizard. The backend models this
// via HiringType + optional ids; the wizard maps it into a CreateRequisitionRequest.
export enum RequisitionType {
  PlannedExisting = 'PLANNED_EXISTING',
  PlannedAdHoc = 'PLANNED_ADHOC',
  Replacement = 'REPLACEMENT',
  GrowthExisting = 'GROWTH_EXISTING',
  GrowthAdHoc = 'GROWTH_ADHOC',
}

// JobRequisitionListItemDto — rows for the list / queue screens.
export interface JobRequisitionListItemDto {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  hiringType: HiringType;
  status: JobRequisitionStatus;
  requestedHeadcount: number;
  departmentName: string | null;
  assignedSquadName: string | null;
  assignedSquadLeaderId: string | null;
  assignedSquadLeaderName: string | null;
  assignedRecruiterId: string | null;
  assignedRecruiterName: string | null;
  hiringManagerId: string;
  hiringManagerReferenceNumber: string | null;
  hiringManagerName: string | null;
  // Who performed the action that produced the current status. Populated for the
  // "needs my fix" (pending-modifications) queue so the screen can show who must act.
  lastActionByEmployeeId: string | null;
  lastActionByEmployeeName: string | null;
  lastActionByRole: string | null;
  rejectionReason: string | null;
  requestedModificationsAt: string | null;
  createdAtUTC: string;
}

// JobRequisitionDetailDto — single-resource read, extends the list row fields.
export interface JobRequisitionDetailDto extends JobRequisitionListItemDto {
  location: Location;
  manPowerPlanId: string | null;
  manPowerPlanReferenceNumber: string | null;
  positionRegistryId: string | null;
  positionReferenceNumber: string | null;
  positionSeniorityLevel: string | null;
  jobDescriptionId: string | null;
  jobDescriptionReferenceNumber: string | null;
  jobPostId: string | null;
  proposedJobTitle: string | null;
  proposedJobSeniorityLevel: SeniorityLevel | null;
  departingEmployeeName: string | null;
  departingEmployeeId: string | null;
  departingEmployeeReferenceNumber: string | null;
  growthJustification: string | null;
  selectedHRManagerId: string;
  selectedHRManagerReferenceNumber: string | null;
  selectedHRManagerName: string | null;
  currentApproverId: string | null;
  currentApproverReferenceNumber: string | null;
  currentApproverRole: string | null;
  // Distinct from lastActionBy*: lastActionBy is who produced the current status
  // (the one responsible for fixing a REQUESTED_MODIFICATIONS).
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  requestedModificationsAt: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  fulfilledAt: string | null;
  rejectionReason: string | null;
  onHoldReason: string | null;
  cancelReason: string | null;
  createdAtUTC: string;
  availableActions: RequisitionAvailableAction[];
}

// JobRequisitionFilter — query params for the list / pending-approvals /
// pending-modifications endpoints (BaseFilter paging + scoped filters).
export interface JobRequisitionListQuery {
  hiringType?: HiringType;
  status?: JobRequisitionStatus;
  departmentId?: string;
  recruiterId?: string;
  squadId?: string;
  createdBy?: string;
  year?: number;
  search?: string;
  sortBy?: string;
  sortAscending?: boolean;
  page?: number;
  pageSize?: number;
}

export type JobRequisitionPagedResult = PagedResult<JobRequisitionListItemDto>;
export type JobRequisitionPagedResultResult = ResultWithData<JobRequisitionPagedResult>;
export type JobRequisitionDetailResult = ResultWithData<JobRequisitionDetailDto>;

// ── Request payloads ──

// Matches backend CreateRequisitionRequest (discriminated by hiringType + which
// optional id is present).
export interface CreateRequisitionRequest {
  hiringType: HiringType;
  assignedSquadId: string;
  departmentId: string;
  requestedHeadcount: number;
  location: Location;
  selectedHRManagerId: string;

  manPowerPlanId?: string | null; // Planned (Backfill) paths
  positionRegistryId?: string | null; // Existing-job paths
  proposedJobTitle?: string | null; // Ad-hoc / proposed paths
  proposedJobSeniorityLevel?: SeniorityLevel | null;
  departingEmployeeName?: string | null; // Replacement only
  departingEmployeeId?: string | null; // Replacement only
  growthJustification?: string | null; // Growth only
}

// Matches backend UpdateRequisitionRequest (mutable Draft / REQUESTED_MODIFICATIONS fields).
export interface UpdateRequisitionRequest {
  requestedHeadcount: number;
  location: Location;
  departingEmployeeName?: string | null;
  departingEmployeeId?: string | null;
  growthJustification?: string | null;
  proposedJobTitle?: string | null;
  proposedJobSeniorityLevel?: SeniorityLevel | null;
}

export interface AssignRecruiterRequest {
  recruiterId: string;
}

export interface RejectRequisitionRequest {
  reason: string;
}

export interface RequestModificationsRequest {
  comment: string;
}

export interface RequisitionLifecycleRequest {
  reason: string | null;
}

// POST /api/admin/requisitions/{id}/attach-jd — links a Job Description to the requisition.
export interface AttachJobDescriptionToRequisitionRequest {
  jobDescriptionId: string;
}

export type { Result };
