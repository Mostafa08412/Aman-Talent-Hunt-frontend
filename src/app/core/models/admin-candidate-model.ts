import type { PagedResult, ResultWithData } from './common';
import type { CandidateApplicationsDTO, CandidateInterviewDto } from './application-model';
import type { CandidateProfileDto, CandidateProfileDtoResult } from './candidate-model';
import type { ApplicationSource, ApplicationStatus, MilitaryStatus } from './enums';

export type { CandidateApplicationsDTO, CandidateInterviewDto } from './application-model';
export type { CandidateProfileDto, CandidateProfileDtoResult } from './candidate-model';

export interface CandidateListItemDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  militaryStatus: MilitaryStatus;
  linkedInProfile: string | null;
  joinedAt: string;
  noOfApplications: number;
  lastAppliedAt: string | null;
}

export type CandidateListItemDtoPagedResult = PagedResult<CandidateListItemDto>;
export type CandidateListItemDtoPagedResultResult = ResultWithData<CandidateListItemDtoPagedResult>;