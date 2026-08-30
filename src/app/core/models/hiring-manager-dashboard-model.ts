// ============================================================
// Hiring Manager Dashboard DTOs — mirrors GET /api/admin/dashboard/hiring-manager
// (see docs/hiring-manager-dashboard-frontend-guide.md).
// Server-side scoped: the Hiring Manager only sees requisitions where they are
// the Hiring Manager + job posts created from those requisitions. No mine/all toggle.
// ============================================================

import type { ResultWithData } from './common';
import type { ApplicationStatus } from './enums';

export interface HiringManagerDashboardCounts {
  activeJobPosts: number;
  openApplications: number;
  pendingJDApprovals: number;
  hiresInPeriod: number;
  newApplicantsInPeriod: number;
}

export interface HiringManagerTimeMetrics {
  averageTimeToFillDays: number | null;
  averageTimeToHireDays: number | null;
  timeToFillSampleCount: number;
  timeToHireSampleCount: number;
}

export interface HiringManagerPipelineStatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface HiringManagerJobPost {
  id: string;
  referenceNumber: string | null;
  title: string;
  status: string;
  numberOfOpenings: number;
  applicantCount: number;
  publishedAtUTC: string | null;
  closedAtUTC: string | null;
  timeToFillDays: number | null;
}

export interface HiringManagerRequisitionToApprove {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  requestedHeadcount: number;
  departmentName: string;
  hiringManagerName: string | null;
  createdAtUTC: string;
}

export interface HiringManagerRecentHire {
  id: string;
  candidateName: string;
  jobPostTitle: string;
  appliedAtUTC: string;
  hiredAtUTC: string;
  timeToHireDays: number;
}

export interface HiringManagerUpcomingInterview {
  id: string;
  applicantName: string;
  jobPostTitle: string;
  interviewerId: string | null;
  interviewerName: string | null;
  scheduledDate: string | null;
  roundName: string | null;
  meetingLink: string | null;
}

export interface HiringManagerDashboardDto {
  counts: HiringManagerDashboardCounts;
  timeMetrics: HiringManagerTimeMetrics;
  pipelineStatusCounts: HiringManagerPipelineStatusCount[];
  jobPosts: HiringManagerJobPost[];
  requisitionsToApprove: HiringManagerRequisitionToApprove[];
  recentHires: HiringManagerRecentHire[];
  upcomingInterviews: HiringManagerUpcomingInterview[];
}

export type HiringManagerDashboardResult = ResultWithData<HiringManagerDashboardDto>;
