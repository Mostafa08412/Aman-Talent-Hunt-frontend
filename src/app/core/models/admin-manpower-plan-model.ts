import type { PagedResult, ResultWithData } from './common';
import type { PlanQuarter, PlanStatus, SeniorityLevel } from './enums';

export interface ManPowerPlanListItemDto {
  id: string;
  referenceNumber: string | null;
  fiscalYear: number;
  quarter: PlanQuarter;
  departmentName: string | null;
  positionTitle: string | null;
  targetHeadcount: number;
  vacant: number;
  status: PlanStatus;
}

export type ManPowerPlanListItemDtoPagedResult = PagedResult<ManPowerPlanListItemDto>;
export type ManPowerPlanListItemDtoPagedResultResult = ResultWithData<ManPowerPlanListItemDtoPagedResult>;
export type ManPowerPlanListItemDtoIReadOnlyListResult = ResultWithData<ManPowerPlanListItemDto[]>;

export interface ManPowerPlanResponse {
  id: string;
  referenceNumber: string | null;
  fiscalYear: number;
  quarter: PlanQuarter;
  departmentId: string;
  departmentReferenceNumber: string | null;
  departmentName: string | null;
  targetHeadcount: number;
  filledHeadcount: number;
  pendingRequisitionsCount: number;
  vacant: number;
  status: PlanStatus;
  isNewPositionTitle: boolean;
  positionTitle: string | null;
  approvedAt: string | null;
  fulfilledAt: string | null;
  rejectionReason: string | null;
}

export type ManPowerPlanResponseResult = ResultWithData<ManPowerPlanResponse>;

export interface CreateManPowerPlanRequest {
  fiscalYear: number;
  quarter: PlanQuarter;
  departmentId: string;
  targetHeadcount: number;
  isNewPositionTitle: boolean;
  proposedJobTitle: string | null;
  proposedJobSeniorityLevel: SeniorityLevel;
  positionRegistryId: string | null;
}

export interface RejectManPowerPlanRequest {
  reason: string | null;
}

export interface PromotePositionRequest {
  positionRegistryId: string;
}
