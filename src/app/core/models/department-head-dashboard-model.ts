// ============================================================
// Department Head Dashboard DTOs — mirrors GET /api/admin/dashboard/department-head
// (see docs/department-head-dashboard-frontend-guide.md).
// Server-side scoped: the Department Head only sees the department they head.
// No mine/all toggle.
// ============================================================

import type { ResultWithData } from './common';
import type { ApplicationStatus, PlanQuarter, PlanStatus } from './enums';

export interface DepartmentHeadDashboardCounts {
  budgetApprovalsPending: number;
  inFlightRequisitions: number;
  activeJobPosts: number;
  openApplications: number;
  activeManPowerPlans: number;
}

export interface DepartmentHeadBudgetApproval {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  requestedHeadcount: number;
  departmentName: string;
  hiringManagerName: string | null;
  createdAtUTC: string;
}

export interface DepartmentHeadPipelineStatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface DepartmentHeadManPowerPlan {
  id: string;
  referenceNumber: string | null;
  fiscalYear: number;
  quarter: PlanQuarter;
  positionTitle: string | null;
  targetHeadcount: number;
  filledHeadcount: number;
  vacant: number;
  status: PlanStatus;
}

export interface DepartmentHeadHeadcountSummary {
  departmentName: string;
  targetHeadcount: number;
  filledHeadcount: number;
  vacant: number;
}

export interface DepartmentHeadJobPost {
  id: string;
  referenceNumber: string | null;
  title: string;
  status: string;
  numberOfOpenings: number;
  applicantCount: number;
  deadline: string | null;
}

export interface DepartmentHeadDashboardDto {
  counts: DepartmentHeadDashboardCounts;
  budgetApprovals: DepartmentHeadBudgetApproval[];
  pipelineStatusCounts: DepartmentHeadPipelineStatusCount[];
  manPowerPlans: DepartmentHeadManPowerPlan[];
  headcountSummary: DepartmentHeadHeadcountSummary;
  jobPosts: DepartmentHeadJobPost[];
}

export type DepartmentHeadDashboardResult = ResultWithData<DepartmentHeadDashboardDto>;
