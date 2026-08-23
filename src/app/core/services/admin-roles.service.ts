import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Roles } from '@core/models/enums';
import { RoleDtoIReadOnlyListResult, UserAdminListItemDtoPagedResultResult } from '@core/models/admin-user-model';
import { toHttpParams } from './http-params.util';

export interface AdminRolesUsersQueryParams {
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminRolesService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getRoles(): Observable<RoleDtoIReadOnlyListResult> {
    return this.http.get<RoleDtoIReadOnlyListResult>(`${this.base}/api/admin/roles`);
  }

  getUsersByRole(role: Roles, params?: AdminRolesUsersQueryParams): Observable<UserAdminListItemDtoPagedResultResult> {
    return this.http.get<UserAdminListItemDtoPagedResultResult>(`${this.base}/api/admin/roles/${role}/users`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }
}