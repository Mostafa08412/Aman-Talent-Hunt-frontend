import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import {
  CreatePositionRegistryRequest,
  PositionRegistryListItemDtoListResult,
  PositionRegistryListItemDtoPagedResultResult,
  PositionRegistryResponseResult,
  PositionStatusRequest,
  UpdatePositionRegistryRequest,
} from '@core/models/admin-position-model';
import { LookupItemDtoPagedResultResult, PositionsLookupParams } from '@core/models/lookup-model';
import { toHttpParams } from './http-params.util';

export interface AdminPositionsQueryParams {
  DepartmentId?: string;
  IsActive?: boolean;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminPositionsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getLookup(params?: PositionsLookupParams): Observable<LookupItemDtoPagedResultResult> {
    return this.http.get<LookupItemDtoPagedResultResult>(`${this.base}/api/admin/lookups/positions`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getRegistry(departmentId?: string, search?: string): Observable<PositionRegistryListItemDtoListResult> {
    return this.http.get<PositionRegistryListItemDtoListResult>(`${this.base}/api/admin/positions/registry`, {
      params: toHttpParams({ departmentId, search }),
    });
  }

  getList(params?: AdminPositionsQueryParams): Observable<PositionRegistryListItemDtoPagedResultResult> {
    return this.http.get<PositionRegistryListItemDtoPagedResultResult>(`${this.base}/api/admin/positions`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  create(request: CreatePositionRegistryRequest): Observable<PositionRegistryResponseResult> {
    return this.http.post<PositionRegistryResponseResult>(`${this.base}/api/admin/positions`, request);
  }

  getById(id: string): Observable<PositionRegistryResponseResult> {
    return this.http.get<PositionRegistryResponseResult>(`${this.base}/api/admin/positions/${id}`);
  }

  update(id: string, request: UpdatePositionRegistryRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/positions/${id}`, request);
  }

  delete(id: string): Observable<Result> {
    return this.http.delete<Result>(`${this.base}/api/admin/positions/${id}`);
  }

  changeStatus(id: string, request: PositionStatusRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/positions/${id}/status`, request);
  }
}