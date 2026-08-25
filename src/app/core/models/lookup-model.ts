import type { PagedResult, ResultWithData } from './common';

export interface LookupItemDto {
  id: string;
  referenceNumber: string | null;
  viewText: string | null;
  secondaryText: string | null;
}

export type LookupItemDtoPagedResult = PagedResult<LookupItemDto>;
export type LookupItemDtoPagedResultResult = ResultWithData<LookupItemDtoPagedResult>;

export interface BaseLookupParams {
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

export interface SquadsLookupParams extends BaseLookupParams {
  departmentId?: string;
}

export interface EmployeesLookupParams extends BaseLookupParams {
  departing?: boolean;
  squadId?: string;
  positionRegistryId?: string;
  role?: string;
}

export interface PositionsLookupParams extends BaseLookupParams {
  departmentId?: string;
}

export interface ManpowerPlansLookupParams extends BaseLookupParams {
  departmentId?: string;
  positionId?: string;
}

export interface JobDescriptionsLookupParams extends BaseLookupParams {
  status?: string;
}

/** @deprecated Use entity-specific params interfaces instead */
export type LookupQueryParams = BaseLookupParams;
