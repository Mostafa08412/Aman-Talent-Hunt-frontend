import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import {
  CreateDepartmentRequest,
  DepartmentListItemDtoPagedResultResult,
  DepartmentLookupDtoIReadOnlyListResult,
  DepartmentResponseResult,
  UpdateDepartmentRequest,
} from '@core/models/admin-department-model';
import { toHttpParams } from './http-params.util';

export interface AdminDepartmentsQueryParams {
  SquadId?: string;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminDepartmentsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getLookup(): Observable<DepartmentLookupDtoIReadOnlyListResult> {
    return this.http.get<DepartmentLookupDtoIReadOnlyListResult>(`${this.base}/api/admin/departments/lookup`);
  }

  getList(params?: AdminDepartmentsQueryParams): Observable<DepartmentListItemDtoPagedResultResult> {
    return this.http.get<DepartmentListItemDtoPagedResultResult>(`${this.base}/api/admin/departments`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getById(id: string): Observable<DepartmentResponseResult> {
    return this.http.get<DepartmentResponseResult>(`${this.base}/api/admin/departments/${id}`);
  }

  create(request: CreateDepartmentRequest): Observable<GuidResult> {
    return this.http.post<GuidResult>(`${this.base}/api/admin/departments`, request);
  }

  update(id: string, request: UpdateDepartmentRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/departments/${id}`, request);
  }

  delete(id: string): Observable<Result> {
    return this.http.delete<Result>(`${this.base}/api/admin/departments/${id}`);
  }
}