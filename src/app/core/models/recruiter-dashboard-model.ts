// ============================================================
// Recruiter Dashboard DTOs — mirrors GET /api/admin/dashboard/recruiter
// (see docs/recruiter-dashboard-frontend-guide.md). Server-side scoped:
// the recruiter only ever sees job posts they own + their squad's requisitions.
// ============================================================

import type { ResultWithData } from './common';
import type {
  ApplicationStatus,
  JobPostStatus,
} from './enums';
import type { JobRequisitionStatus } from './job-requisition-model';

export interface RecruiterDashboardCounts {
  activeJobPosts: number;
  requisitionsNeedingAction: number;
  openApplications: number;
  interviewsToday: number;
  shortlistedCandidates: number;
}

export interface PipelineStatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface RecruiterDashboardJobPost {
  id: string;
  referenceNumber: string | null;
  title: string;
  status: JobPostStatus;
  numberOfOpenings: number;
  applicantCount: number;
  deadline: string | null;
}

export interface RecruiterDashboardRequisitionToDo {
  id: string;
  referenceNumber: string | null;
  positionTitle: string | null;
  status: JobRequisitionStatus;
  requestedHeadcount: number;
  departmentName: string;
  assignedRecruiterName: string | null;
}

export interface RecruiterDashboardUpcomingInterview {
  id: string;
  applicantName: string;
  jobPostTitle: string;
  interviewerId: string | null;
  interviewerName: string | null;
  scheduledDate: string | null;
  roundName: string | null;
  meetingLink: string | null;
}

export interface RecruiterDashboardRecentApplication {
  id: string;
  candidateName: string;
  jobPostTitle: string;
  status: ApplicationStatus;
  createdAtUTC: string;
}

export interface RecruiterDashboardDto {
  counts: RecruiterDashboardCounts;
  pipelineStatusCounts: PipelineStatusCount[];
  jobPosts: RecruiterDashboardJobPost[];
  requisitionToDos: RecruiterDashboardRequisitionToDo[];
  upcomingInterviews: RecruiterDashboardUpcomingInterview[];
  recentApplications: RecruiterDashboardRecentApplication[];
}

export type RecruiterDashboardResult = ResultWithData<RecruiterDashboardDto>;
