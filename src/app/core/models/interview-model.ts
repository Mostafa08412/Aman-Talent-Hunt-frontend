import type { PagedResult, ResultWithData } from './common';
import type { InterviewFormat, InterviewResult, InterviewStatus } from './enums';

// ============================================================
// Interviews
// ============================================================

export interface InterviewListItemDto {
  id: string;
  /** Applicant this interview belongs to (used for pipeline chip maps). */
  applicantId: string;
  roundName: string | null;
  roundNumber: number;
  interviewerName: string | null;
  candidateFirstName: string | null;
  candidateLastName: string | null;
  scheduledDate: string | null;
  formatSnapshot: InterviewFormat;
  status: InterviewStatus;
  result: InterviewResult;
}

export type InterviewListItemDtoIReadOnlyListResult = ResultWithData<InterviewListItemDto[]>;
export type InterviewListItemDtoPagedResult = PagedResult<InterviewListItemDto>;
export type InterviewListItemDtoPagedResultResult = ResultWithData<InterviewListItemDtoPagedResult>;

export interface InterviewDetailDto {
  id: string;
  applicationReferenceNumber: string | null;
  interviewRoundId: string;
  roundName: string | null;
  roundNumber: number;
  estimatedDurationInMinutes: number;
  interviewerId: string;
  interviewerReferenceNumber: string | null;
  interviewerName: string | null;
  scheduledById: string | null;
  scheduledByReferenceNumber: string | null;
  scheduledByName: string | null;
  applicantId: string;
  candidateFirstName: string | null;
  candidateLastName: string | null;
  candidateEmail: string | null;
  scheduledDate: string | null;
  rescheduledFromDate: string | null;
  formatSnapshot: InterviewFormat;
  meetingLink: string | null;
  locationDetails: string | null;
  status: InterviewStatus;
  result: InterviewResult;
  reason: string | null;
  comment: string | null;
  completedAt: string | null;
  canceledAt: string | null;
}

export type InterviewDetailDtoResult = ResultWithData<InterviewDetailDto>;

// ============================================================
// Requests
// ============================================================

export interface ScheduleInterviewRequest {
  interviewRoundId: string;
  interviewerId: string;
  applicantId: string;
  scheduledDate: string;
  meetingLink?: string | null;
  locationDetails?: string | null;
}

export interface RescheduleInterviewRequest {
  newDate: string;
  meetingLink?: string | null;
  locationDetails?: string | null;
}

export interface CancelInterviewRequest {
  reason?: string | null;
}

export interface UpdateMeetingLinkRequest {
  meetingLink?: string | null;
  locationDetails?: string | null;
}

export interface SubmitInterviewResultRequest {
  result: InterviewResult;
  comment?: string | null;
}

export interface InterviewsQueryParams {
  JobPostId?: string;
  Status?: InterviewStatus;
  Format?: InterviewFormat;
  ScheduleDate?: string;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}
