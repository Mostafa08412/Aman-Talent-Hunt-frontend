// ============================================================
// Job Posts
// ============================================================

import { ResultWithData } from "./common";
import { EmploymentType, JobType, Location, SeniorityLevel } from "./enums";

export interface PublicJobPostListItemDto {
  id: string; // uuid
  title?: string | null;
  description?: string | null;
  location: Location;
  jobType: JobType;
  employmentType: EmploymentType;
  seniorityLevel: SeniorityLevel;
  createdAtUTC: string; // date-time
}

export interface PublicJobPostListItemDtoPagedResult {
  items?: PublicJobPostListItemDto[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type PublicJobPostListItemDtoPagedResultResult =
  ResultWithData<PublicJobPostListItemDtoPagedResult>;

export interface ScreeningQuestionDto {
  id: string; // uuid
  question?: string | null;
}


/** Query params for GET /api/JobPost/public */
export interface PublicJobPostQueryParams {
  Location?: Location;
  EmploymentType?: EmploymentType;
  SeniorityLevel?: SeniorityLevel;
  DatePosted?: string; // date-time
  JobType?: JobType;
  DepartmentId?: string; // uuid
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
  NormalizedPage?: number;
  NormalizedPageSize?: number;
}

