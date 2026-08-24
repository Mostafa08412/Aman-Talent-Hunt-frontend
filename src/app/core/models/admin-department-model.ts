import type { PagedResult, ResultWithData } from './common';
import type { PositionSummaryDto } from './admin-position-model';
import type { SquadSummaryDto } from './admin-squad-model';

export interface DepartmentListItemDto {
  id: string;
  referenceNumber: string | null;
  name: string | null;
  squads: SquadSummaryDto[] | null;
  headEmployeeId: string | null;
  headEmployeeReferenceNumber: string | null;
  headEmployeeName: string | null;
  employeeCount: number;
  activeRequisitionsCount: number;
  createdAtUTC: string;
}

export type DepartmentListItemDtoPagedResult = PagedResult<DepartmentListItemDto>;
export type DepartmentListItemDtoPagedResultResult = ResultWithData<DepartmentListItemDtoPagedResult>;

export interface DepartmentLookupDto {
  id: string;
  referenceNumber: string | null;
  name: string | null;
}

export type DepartmentLookupDtoIReadOnlyListResult = ResultWithData<DepartmentLookupDto[]>;

export interface DepartmentResponse {
  id: string;
  name: string | null;
  referenceNumber: string | null;
  squads: SquadSummaryDto[] | null;
  headEmployeeId: string | null;
  headEmployeeReferenceNumber: string | null;
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
  headEmployeeId: string | null;
}

export interface UpdateDepartmentRequest {
  name: string | null;
  headEmployeeId: string | null;
}
