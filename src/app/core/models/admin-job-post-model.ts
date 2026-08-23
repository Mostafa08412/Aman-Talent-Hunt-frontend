import type { PagedResult, ResultWithData } from './common';
import type { ScreeningQuestionDto } from './job-post-model';
import type {
  EmploymentType,
  InterviewFormat,
  JobPostStatus,
  JobType,
  Location,
  PostingVisibility,
  SeniorityLevel,
} from './enums';

export type { ScreeningQuestionDto } from './job-post-model';

export interface InterviewRoundDto {
  id: string;
  name: string | null;
  format: InterviewFormat;
  estimatedDurationInMinutes: number;
  order: number;
}

export interface AdminJobPostListItemDto {
  id: string;
  title: string | null;
  numberOfOpenings: number;
  status: JobPostStatus;
  visibility: PostingVisibility;
  seniorityLevel: SeniorityLevel;
  jobType: JobType;
  employmentType: EmploymentType;
  location: Location;
  jobRequisitionId: string;
  positionId: string;
  departmentName: string | null;
  deadline: string | null;
  publishedAtUTC: string | null;
  createdAtUTC: string;
}

export type AdminJobPostListItemDtoPagedResult = PagedResult<AdminJobPostListItemDto>;
export type AdminJobPostListItemDtoPagedResultResult = ResultWithData<AdminJobPostListItemDtoPagedResult>;

export interface AdminJobPostDetailDto {
  id: string;
  title: string | null;
  numberOfOpenings: number;
  deadline: string | null;
  visibility: PostingVisibility;
  seniorityLevel: SeniorityLevel;
  status: JobPostStatus;
  location: Location;
  jobType: JobType;
  employmentType: EmploymentType;
  jobRequisitionId: string;
  positionId: string;
  jobDescriptionId: string;
  ownerEmployeeId: string;
  description: string | null;
  requirements: string | null;
  qualifications: string | null;
  publishedAtUTC: string | null;
  closedAtUTC: string | null;
  createdAtUTC: string;
  screeningQuestions: ScreeningQuestionDto[] | null;
  interviewRounds: InterviewRoundDto[] | null;
}

export type AdminJobPostDetailDtoResult = ResultWithData<AdminJobPostDetailDto>;

export interface CreateJobPostRequest {
  jobRequisitionId: string;
  jobType: JobType;
  numberOfOpenings: number;
  visibility: PostingVisibility;
  deadline: string | null;
}

export interface UpdateJobPostMarketingRequest {
  description: string | null;
  requirements: string | null;
  qualifications: string | null;
}

export interface UpdateJobPostConfigRequest {
  deadline: string | null;
  visibility: PostingVisibility;
  jobType: JobType;
}

export interface ExtendDeadlineRequest {
  newDeadline: string;
}

export interface ConfigureScreeningQuestionsRequest {
  questions: string[] | null;
}

export interface ConfigureInterviewRoundsRequest {
  rounds: CreateInterviewRoundDto[] | null;
}

export interface CreateInterviewRoundDto {
  name: string | null;
  format: InterviewFormat;
  estimatedDurationInMinutes: number;
  order: number;
}