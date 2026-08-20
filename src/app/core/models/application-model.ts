// ============================================================
// Applications
// ============================================================

import { ApplicationSource, ApplicationStatus, InterviewFormat, InterviewStatus, ResultWithData } from ".";


export interface ScreeningAnswerRequest {
  screeningQuestionId: string; // uuid
  answer?: string | null;
}

export interface ApplicationResponse {
  id: string; // uuid
  jobPostId: string; // uuid
  jobPostTitle?: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  candidateFirstName?: string | null;
  candidateLastName?: string | null;
  candidateEmail?: string | null;
  candidatePhoneNumber?: string | null;
  resumeFileName?: string | null;
  createdAtUTC: string; // date-time
}

export type ApplicationResponseResult =
  ResultWithData<ApplicationResponse>;

export interface CandidateInterviewDto {
  id: string; // uuid
  roundName?: string | null;
  scheduledDate?: string | null; // date-time
  format: InterviewFormat;
  meetingLink?: string | null;
  locationDetails?: string | null;
  status: InterviewStatus;
}

export interface CandidateApplicationsDTO {
  id: string; // uuid
  jobPostId: string; // uuid
  jobPostTitle?: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  createdAtUTC: string; // date-time
  upcomingInterview?: CandidateInterviewDto | null;
}

export type CandidateApplicationsDTOListResult =
  ResultWithData<CandidateApplicationsDTO[]>;

export interface CandidateTimelineEventDto {
  status: ApplicationStatus;
  atUTC: string; // date-time
  note?: string | null;
}

export interface CandidateApplicationDetailDto {
  id: string; // uuid
  jobPostId: string; // uuid
  jobPostTitle?: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  createdAtUTC: string; // date-time
  timeline?: CandidateTimelineEventDto[] | null;
  interviews?: CandidateInterviewDto[] | null;
}
export interface SubmitApplicationRequest {
  JobPostId: string; // uuid
  Source: ApplicationSource;
  Resume?: File | null;
  Answers?: ScreeningAnswerRequest[];
}
export type CandidateApplicationDetailDtoResult =
  ResultWithData<CandidateApplicationDetailDto>;
