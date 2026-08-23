import type { PagedResult, ResultWithData } from './common';
import type { Roles } from './enums';

export interface EmployeeListItemDto {
  id: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  positionRegistryId: string;
  jobTitle: string | null;
  squadId: string | null;
  squadName: string | null;
  isDeparting: boolean;
  createdAtUTC: string;
}

export type EmployeeListItemDtoPagedResult = PagedResult<EmployeeListItemDto>;
export type EmployeeListItemDtoPagedResultResult = ResultWithData<EmployeeListItemDtoPagedResult>;
export type EmployeeListItemDtoIReadOnlyListResult = ResultWithData<EmployeeListItemDto[]>;

export interface EmployeeLookupDto {
  id: string;
  fullName: string | null;
  jobTitle: string | null;
  departmentName: string | null;
}

export type EmployeeLookupDtoIReadOnlyListResult = ResultWithData<EmployeeLookupDto[]>;

export interface EmployeeResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  positionRegistryId: string;
  jobTitle: string | null;
  squadId: string | null;
  squadName: string | null;
  isSquadLeader: boolean;
  isDeparting: boolean;
  createdAtUTC: string;
}

export type EmployeeResponseResult = ResultWithData<EmployeeResponse>;

export interface CreateEmployeeRequest {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  positionRegistryId: string;
  squadId: string | null;
  role: Roles;
}

export interface UpdateEmployeeRequest {
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  positionRegistryId: string;
}