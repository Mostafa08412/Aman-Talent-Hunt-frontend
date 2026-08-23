import type { PagedResult, ResultWithData } from './common';
import type { EmploymentType, JobDescriptionStatus } from './enums';

export interface JobDescriptionListItemDto {
  id: string;
  summary: string | null;
  employmentType: EmploymentType;
  status: JobDescriptionStatus;
  lastUpdatedAtUTC: string | null;
}

export type JobDescriptionListItemDtoPagedResult = PagedResult<JobDescriptionListItemDto>;
export type JobDescriptionListItemDtoPagedResultResult = ResultWithData<JobDescriptionListItemDtoPagedResult>;

export interface JobDescriptionDetailDto {
  id: string;
  summary: string | null;
  employmentType: EmploymentType;
  status: JobDescriptionStatus;
  lastUpdatedAtUTC: string | null;
  responsibilities: string | null;
  requirements: string | null;
  rejectionReason: string | null;
  positionRegistryTitle: string | null;
}

export type JobDescriptionDetailDtoResult = ResultWithData<JobDescriptionDetailDto>;

export interface JobDescriptionSummaryDto {
  id: string;
  summary: string | null;
  employmentType: EmploymentType;
  status: JobDescriptionStatus;
}

export interface CreateJobDescriptionRequest {
  summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  employmentType: EmploymentType;
}

export interface UpdateJobDescriptionRequest {
  summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  employmentType: EmploymentType;
}

export interface RejectJobDescriptionRequest {
  reason: string | null;
}

export interface AttachJobDescriptionRequest {
  requisitionId: string;
}