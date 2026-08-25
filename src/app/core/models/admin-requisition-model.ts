import type { PagedResult, ResultWithData } from './common';
import type { HiringType, Location, RequisitionAction, RequisitionStatus, SeniorityLevel } from './enums';

export interface JobRequisitionListItemDto {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  hiringType: HiringType;
  status: RequisitionStatus;
  requestedHeadcount: number;
  departmentName: string | null;
  assignedSquadName: string | null;
  assignedRecruiterName: string | null;
  hiringManagerId: string;
  hiringManagerReferenceNumber: string | null;
  hiringManagerName: string | null;
  createdAtUTC: string;
}

export type JobRequisitionListItemDtoPagedResult = PagedResult<JobRequisitionListItemDto>;
export type JobRequisitionListItemDtoPagedResultResult = ResultWithData<JobRequisitionListItemDtoPagedResult>;

export interface JobRequisitionDetailDto {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  hiringType: HiringType;
  status: RequisitionStatus;
  requestedHeadcount: number;
  departmentName: string | null;
  assignedSquadName: string | null;
  assignedRecruiterName: string | null;
  hiringManagerId: string;
  hiringManagerReferenceNumber: string | null;
  hiringManagerName: string | null;
  location: Location;
  manPowerPlanId: string | null;
  manPowerPlanReferenceNumber: string | null;
  positionRegistryId: string | null;
  positionReferenceNumber: string | null;
  jobDescriptionId: string | null;
  jobDescriptionReferenceNumber: string | null;
  proposedJobTitle: string | null;
  proposedJobSeniorityLevel: SeniorityLevel;
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
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  fulfilledAt: string | null;
  rejectionReason: string | null;
  onHoldReason: string | null;
  cancelReason: string | null;
  createdAtUTC: string;
}

export type JobRequisitionDetailDtoResult = ResultWithData<JobRequisitionDetailDto>;

export interface CreateRequisitionRequest {
  hiringType: HiringType;
  departmentId: string;
  requestedHeadcount: number;
  location: Location;
  selectedHRManagerId: string;
  manPowerPlanId: string | null;
  positionRegistryId: string | null;
  proposedJobTitle: string | null;
  proposedJobSeniorityLevel: SeniorityLevel;
  departingEmployeeName: string | null;
  departingEmployeeId: string | null;
  growthJustification: string | null;
}

export interface UpdateRequisitionRequest {
  requestedHeadcount: number;
  location: Location;
  departingEmployeeName: string | null;
  departingEmployeeId: string | null;
  growthJustification: string | null;
  proposedJobTitle: string | null;
  proposedJobSeniorityLevel: SeniorityLevel;
}

export interface AssignRecruiterRequest {
  recruiterId: string;
}

export interface RejectRequisitionRequest {
  reason: string | null;
}

export interface RequestModificationsRequest {
  comment: string | null;
}

export interface RequisitionStatusRequest {
  action: RequisitionAction;
  reason: string | null;
}