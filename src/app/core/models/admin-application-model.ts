import type { PagedResult, ResultWithData } from './common';
import type { ResumeDownloadResult, ResumeDownloadResultResult } from './resume-model';
import type { ApplicationSource, ApplicationStatus, MilitaryStatus } from './enums';

export type { ResumeDownloadResult, ResumeDownloadResultResult } from './resume-model';

export interface AnswerDetail {
  screeningQuestionId: string;
  question: string | null;
  answer: string | null;
}

export interface ApplicantListItemDto {
  id: string;
  candidateFirstName: string | null;
  candidateLastName: string | null;
  candidateEmail: string | null;
  jobPostTitle: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  createdAtUTC: string;
}

export type ApplicantListItemDtoPagedResult = PagedResult<ApplicantListItemDto>;
export type ApplicantListItemDtoPagedResultResult = ResultWithData<ApplicantListItemDtoPagedResult>;

export interface ApplicantDetailDto {
  id: string;
  candidateFirstName: string | null;
  candidateLastName: string | null;
  candidateEmail: string | null;
  candidatePhoneNumber: string | null;
  militaryStatus: MilitaryStatus;
  linkedInProfile: string | null;
  jobPostTitle: string | null;
  status: ApplicationStatus;
  source: ApplicationSource;
  createdAtUTC: string;
  answers: AnswerDetail[] | null;
  resumeFileName: string | null;
}

export type ApplicantDetailDtoResult = ResultWithData<ApplicantDetailDto>;

export interface ChangeApplicationStatusRequest {
  status: ApplicationStatus;
}