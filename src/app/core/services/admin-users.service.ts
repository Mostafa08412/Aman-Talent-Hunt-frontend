import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import { Roles, UserStatus } from '@core/models/enums';
import {
  AssignRolesRequest,
  CreateUserRequest,
  StringIReadOnlyListResult,
  UpdateRolesRequest,
  UpdateUserRequest,
  UserAdminDetailDtoResult,
  UserAdminListItemDtoPagedResultResult,
} from '@core/models/admin-user-model';
import { toHttpParams } from './http-params.util';

export interface AdminUsersQueryParams {
  Role?: Roles;
  Status?: UserStatus;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(params?: AdminUsersQueryParams): Observable<UserAdminListItemDtoPagedResultResult> {
    return this.http.get<UserAdminListItemDtoPagedResultResult>(`${this.base}/api/admin/users`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  create(request: CreateUserRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/users`, request);
  }

  getById(id: string): Observable<UserAdminDetailDtoResult> {
    return this.http.get<UserAdminDetailDtoResult>(`${this.base}/api/admin/users/${id}`);
  }

  update(id: string, request: UpdateUserRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/users/${id}`, request);
  }

  activate(id: string): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/users/${id}/activate`, null);
  }

  lock(id: string): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/users/${id}/lock`, null);
  }

  unlock(id: string): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/users/${id}/unlock`, null);
  }

  resetPassword(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/users/${id}/reset-password`, null);
  }

  getRoles(id: string): Observable<StringIReadOnlyListResult> {
    return this.http.get<StringIReadOnlyListResult>(`${this.base}/api/admin/users/${id}/roles`);
  }

  updateRoles(id: string, request: UpdateRolesRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/users/${id}/roles`, request);
  }

  assignRoles(id: string, request: AssignRolesRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/users/${id}/roles`, request);
  }

  removeRole(id: string, role: Roles): Observable<Result> {
    return this.http.delete<Result>(`${this.base}/api/admin/users/${id}/roles/${role}`);
  }
}