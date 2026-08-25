import type { PagedResult, ResultWithData } from './common';
import type { EmploymentType, JobDescriptionStatus } from './enums';

export interface JobDescriptionListItemDto {
  id: string;
  referenceNumber: string | null;
  title: string | null;
  summary: string | null;
  author: string | null;
  employmentType: EmploymentType;
  status: JobDescriptionStatus;
  lastUpdatedAtUTC: string | null;
}

export type JobDescriptionListItemDtoPagedResult = PagedResult<JobDescriptionListItemDto>;
export type JobDescriptionListItemDtoPagedResultResult = ResultWithData<JobDescriptionListItemDtoPagedResult>;

export interface JobDescriptionDetailDto {
  id: string;
  referenceNumber: string | null;
  title: string | null;
  summary: string | null;
  author: string | null;
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
  referenceNumber: string | null;
  title: string | null;
  summary: string | null;
  author: string | null;
  employmentType: EmploymentType;
  status: JobDescriptionStatus;
}

export interface CreateJobDescriptionRequest {
  title: string | null;
  summary: string | null;
  responsibilities: string | null;
  requirements: string | null;
  employmentType: EmploymentType;
}

export interface UpdateJobDescriptionRequest {
  title: string | null;
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
