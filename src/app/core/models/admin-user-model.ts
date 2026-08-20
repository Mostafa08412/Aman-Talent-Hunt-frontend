import type { PagedResult, ResultWithData } from './common';
import type { Roles, UserStatus } from './enums';

export interface UserAdminListItemDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  isLocked: boolean;
  isEmailConfirmed: boolean;
  lastLoginUTC: string | null;
  createdAtUTC: string;
  userRolesNames: string[] | null;
}

export type UserAdminListItemDtoPagedResult = PagedResult<UserAdminListItemDto>;
export type UserAdminListItemDtoPagedResultResult = ResultWithData<UserAdminListItemDtoPagedResult>;

export interface UserAdminDetailDto {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isLocked: boolean;
  isEmailConfirmed: boolean;
  requiresResetPassword: boolean;
  lastLoginUTC: string | null;
  createdAtUTC: string | null;
  userRolesNames: string[] | null;
}

export type UserAdminDetailDtoResult = ResultWithData<UserAdminDetailDto>;

export interface CreateUserRequest {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  initialRole: Roles;
  positionRegistryId: string | null;
}

export interface UpdateUserRequest {
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
}

export interface AssignRolesRequest {
  roles: Roles[] | null;
}

export interface UpdateRolesRequest {
  roles: Roles[] | null;
}

export interface RoleDto {
  name: string | null;
  count: number;
}

export type RoleDtoIReadOnlyListResult = ResultWithData<RoleDto[]>;
export type StringIReadOnlyListResult = ResultWithData<string[]>;