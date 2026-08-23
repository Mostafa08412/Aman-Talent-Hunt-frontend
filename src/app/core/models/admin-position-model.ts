import type { PagedResult, ResultWithData } from './common';
import type { SeniorityLevel } from './enums';
import type { JobDescriptionSummaryDto } from './admin-job-description-model';

export interface PositionRegistryListItemDto {
  id: string;
  title: string | null;
  seniorityLevel: SeniorityLevel;
  departmentId: string;
  departmentName: string | null;
  jobDescriptionId: string;
  isActive: boolean;
  createdAtUTC: string;
}

export type PositionRegistryListItemDtoListResult = ResultWithData<PositionRegistryListItemDto[]>;
export type PositionRegistryListItemDtoPagedResult = PagedResult<PositionRegistryListItemDto>;
export type PositionRegistryListItemDtoPagedResultResult = ResultWithData<PositionRegistryListItemDtoPagedResult>;

export interface PositionRegistryLookupDto {
  id: string;
  title: string | null;
  jobDescriptionId: string;
  jobDescriptionTitle: string | null;
}

export type PositionRegistryLookupDtoIReadOnlyListResult = ResultWithData<PositionRegistryLookupDto[]>;

export interface PositionRegistryResponse {
  id: string;
  title: string | null;
  seniorityLevel: SeniorityLevel;
  departmentId: string;
  departmentName: string | null;
  jobDescriptionId: string;
  isActive: boolean;
  createdAtUTC: string;
  jobDescription: JobDescriptionSummaryDto | null;
  employeeCount: number;
}

export type PositionRegistryResponseResult = ResultWithData<PositionRegistryResponse>;

export interface PositionSummaryDto {
  id: string;
  title: string | null;
}

export interface CreatePositionRegistryRequest {
  title: string | null;
  departmentId: string;
  jobDescriptionId: string;
  seniorityLevel: SeniorityLevel;
}

export interface UpdatePositionRegistryRequest {
  title: string | null;
  departmentId: string;
  jobDescriptionId: string;
  seniorityLevel: SeniorityLevel;
}

export interface PositionStatusRequest {
  isActive: boolean;
}