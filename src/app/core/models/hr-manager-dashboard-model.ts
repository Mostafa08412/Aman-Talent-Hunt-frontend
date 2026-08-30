// ============================================================
// HR Manager Dashboard DTOs — mirrors GET /api/admin/dashboard/hr-manager
// (see docs/hr-manager-dashboard-frontend-guide.md). Company-wide scope:
// the HR Manager sees the whole org, no "mine/all" toggle.
// ============================================================

import type { ResultWithData } from './common';
import type { ApplicationStatus, PlanQuarter, PlanStatus } from './enums';

export interface HrManagerDashboardCounts {
  requisitionsPendingApproval: number;
  manPowerPlansPendingApproval: number;
  openJobPosts: number;
  openApplications: number;
  activeManPowerPlans: number;
}

export interface HrManagerRequisitionToApprove {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  requestedHeadcount: number;
  departmentName: string;
  hiringManagerName: string | null;
  createdAtUTC: string;
}

export interface HrManagerManPowerPlanToApprove {
  id: string;
  referenceNumber: string | null;
  fiscalYear: number;
  quarter: PlanQuarter;
  departmentName: string;
  positionTitle: string | null;
  targetHeadcount: number;
  status: PlanStatus;
}

export interface HrManagerRecruiterWorkload {
  employeeId: string;
  recruiterName: string;
  assignedRequisitions: number;
  ownedJobPosts: number;
  openApplications: number;
}

export interface HrManagerHeadcountByDepartment {
  departmentName: string;
  targetHeadcount: number;
  filledHeadcount: number;
  vacant: number;
}

export interface HrManagerApplicationInflow {
  weekOffset: number;
  weekStartUTC: string;
  count: number;
}

export interface HrManagerPipelineSummary {
  status: ApplicationStatus;
  count: number;
}

export interface HrManagerDashboardDto {
  counts: HrManagerDashboardCounts;
  requisitionsToApprove: HrManagerRequisitionToApprove[];
  manPowerPlansToApprove: HrManagerManPowerPlanToApprove[];
  recruiterWorkload: HrManagerRecruiterWorkload[];
  headcountByDepartment: HrManagerHeadcountByDepartment[];
  applicationInflow: HrManagerApplicationInflow[];
  pipelineSummary: HrManagerPipelineSummary[];
}

export type HrManagerDashboardResult = ResultWithData<HrManagerDashboardDto>;
