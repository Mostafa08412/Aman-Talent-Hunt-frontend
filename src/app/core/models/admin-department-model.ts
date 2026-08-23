import type { PagedResult, ResultWithData } from './common';
import type { PositionSummaryDto } from './admin-position-model';

export interface DepartmentListItemDto {
  id: string;
  name: string | null;
  squadId: string;
  squadName: string | null;
  headEmployeeId: string | null;
  headEmployeeName: string | null;
  employeeCount: number;
  activeRequisitionsCount: number;
  createdAtUTC: string;
}

export type DepartmentListItemDtoPagedResult = PagedResult<DepartmentListItemDto>;
export type DepartmentListItemDtoPagedResultResult = ResultWithData<DepartmentListItemDtoPagedResult>;

export interface DepartmentLookupDto {
  id: string;
  name: string | null;
}

export type DepartmentLookupDtoIReadOnlyListResult = ResultWithData<DepartmentLookupDto[]>;

export interface DepartmentResponse {
  id: string;
  name: string | null;
  squadId: string;
  squadName: string | null;
  headEmployeeId: string | null;
  headEmployeeName: string | null;
  positions: PositionSummaryDto[] | null;
  totalEmployees: number;
  createdAtUTC: string;
}

export type DepartmentResponseResult = ResultWithData<DepartmentResponse>;

export interface DepartmentSummaryDto {
  id: string;
  name: string | null;
}

export interface CreateDepartmentRequest {
  name: string | null;
  squadId: string;
  headEmployeeId: string | null;
}

export interface UpdateDepartmentRequest {
  name: string | null;
  squadId: string;
  headEmployeeId: string | null;
}