import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import {
  CreateDepartmentRequest,
  DepartmentListItemDtoPagedResultResult,
  DepartmentResponseResult,
  UpdateDepartmentRequest,
} from '@core/models/admin-department-model';
import { LookupItemDtoPagedResultResult, LookupQueryParams } from '@core/models/lookup-model';
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

  getLookup(params?: LookupQueryParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.base}/api/admin/lookups/departments`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getList(params?: AdminDepartmentsQueryParams): Observable<DepartmentListItemDtoPagedResultResult> {
    return this.http.get<DepartmentListItemDtoPagedResultResult>(`${this.base}/api/admin/departments`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getById(id: string): Observable<DepartmentResponseResult> {
    return this.http.get<DepartmentResponseResult>(`${this.base}/api/admin/departments/${id}`);
  }

  /** Returns the department headed by the current user (Department Head). */
  getHeadDepartment(): Observable<DepartmentResponseResult> {
    return this.http.get<DepartmentResponseResult>(`${this.base}/api/admin/departments/head`);
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