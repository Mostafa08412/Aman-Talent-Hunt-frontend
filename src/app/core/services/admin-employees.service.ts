import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import {
  CreateEmployeeRequest,
  EmployeeListItemDtoIReadOnlyListResult,
  EmployeeListItemDtoPagedResultResult,
  EmployeeLookupDtoIReadOnlyListResult,
  EmployeeResponseResult,
  UpdateEmployeeRequest,
} from '@core/models/admin-employee-model';
import { toHttpParams } from './http-params.util';

export interface AdminEmployeesQueryParams {
  DepartmentId?: string;
  SquadId?: string;
  PositionRegistryId?: string;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}
export interface AdminEmployeesLookupQueryParams {
  departing?: boolean;
  search?: string;
}
@Injectable({ providedIn: 'root' })
export class AdminEmployeesService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(params?: AdminEmployeesQueryParams): Observable<EmployeeListItemDtoPagedResultResult> {
    return this.http.get<EmployeeListItemDtoPagedResultResult>(`${this.base}/api/admin/employees`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  create(request: CreateEmployeeRequest): Observable<GuidResult> {
    return this.http.post<GuidResult>(`${this.base}/api/admin/employees`, request);
  }

  getLookup(params?: AdminEmployeesLookupQueryParams): Observable<EmployeeLookupDtoIReadOnlyListResult> {
    return this.http.get<EmployeeLookupDtoIReadOnlyListResult>(`${this.base}/api/admin/employees/lookup`,  {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getDeparting(search?: string): Observable<EmployeeListItemDtoIReadOnlyListResult> {
    return this.http.get<EmployeeListItemDtoIReadOnlyListResult>(`${this.base}/api/admin/employees/departing`, {
      params: toHttpParams({ search }),
    });
  }

  getById(id: string): Observable<EmployeeResponseResult> {
    return this.http.get<EmployeeResponseResult>(`${this.base}/api/admin/employees/${id}`);
  }

  update(id: string, request: UpdateEmployeeRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/employees/${id}`, request);
  }
}
