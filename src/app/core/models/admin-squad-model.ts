import type { ResultWithData } from './common';
import type { DepartmentSummaryDto } from './admin-department-model';

export interface SquadListItemDto {
  id: string;
  referenceNumber: string | null;
  name: string | null;
  description: string | null;
  leaderId: string | null;
  leaderReferenceNumber: string | null;
  leaderName: string | null;
  leaderReference: string | null;
  membersCount: number;
  coveredDepartmentsCount: number;
  createdAtUTC: string;
}

export type SquadListItemDtoIReadOnlyListResult = ResultWithData<SquadListItemDto[]>;

export interface SquadLookupDto {
  id: string;
  referenceNumber: string | null;
  name: string | null;
}

export type SquadLookupDtoIReadOnlyListResult = ResultWithData<SquadLookupDto[]>;

export interface SquadSummaryDto {
  id: string;
  referenceNumber: string | null;
  name: string | null;
}

export interface SquadMemberDto {
  employeeId: string;
  employeeReferenceNumber: string | null;
  employeeName: string | null;
  employeeReference: string | null;
  jobTitle: string | null;
  email: string | null;
  isLeader: boolean;
}

export interface SquadResponse {
  id: string;
  referenceNumber: string | null;
  name: string | null;
  description: string | null;
  leader: SquadMemberDto | null;
  members: SquadMemberDto[] | null;
  departments: DepartmentSummaryDto[] | null;
  createdAtUTC: string;
}

export type SquadResponseResult = ResultWithData<SquadResponse>;

export interface CreateSquadRequest {
  name: string | null;
  description: string | null;
}

export interface UpdateSquadRequest {
  name: string | null;
  description: string | null;
}

export interface AddSquadMemberRequest {
  employeeId: string;
  isLeader: boolean;
}

export interface AssignSquadLeaderRequest {
  employeeId: string;
}

export interface MapSquadDepartmentsRequest {
  departmentIds: string[] | null;
}
