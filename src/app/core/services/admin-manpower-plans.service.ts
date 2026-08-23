import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GuidResult, Result } from '@core/models/common';
import { PlanQuarter, PlanStatus } from '@core/models/enums';
import {
  CreateManPowerPlanRequest,
  ManPowerPlanListItemDtoIReadOnlyListResult,
  ManPowerPlanListItemDtoPagedResultResult,
  ManPowerPlanLookupDtoIReadOnlyListResult,
  ManPowerPlanResponseResult,
  PromotePositionRequest,
  RejectManPowerPlanRequest,
} from '@core/models/admin-manpower-plan-model';
import { toHttpParams } from './http-params.util';

export interface AdminManpowerPlansQueryParams {
  FiscalYear?: number;
  Quarter?: PlanQuarter;
  DepartmentId?: string;
  Status?: PlanStatus;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminManpowerPlansService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(params?: AdminManpowerPlansQueryParams): Observable<ManPowerPlanListItemDtoPagedResultResult> {
    return this.http.get<ManPowerPlanListItemDtoPagedResultResult>(`${this.base}/api/admin/manpower-plans`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getActive(departmentId?: string): Observable<ManPowerPlanListItemDtoIReadOnlyListResult> {
    return this.http.get<ManPowerPlanListItemDtoIReadOnlyListResult>(`${this.base}/api/admin/manpower-plans/active`, {
      params: toHttpParams({ departmentId }),
    });
  }

  getLookup(): Observable<ManPowerPlanLookupDtoIReadOnlyListResult> {
    return this.http.get<ManPowerPlanLookupDtoIReadOnlyListResult>(`${this.base}/api/admin/manpower-plans/lookup`);
  }

  create(request: CreateManPowerPlanRequest): Observable<GuidResult> {
    return this.http.post<GuidResult>(`${this.base}/api/admin/manpower-plans`, request);
  }

  getById(id: string): Observable<ManPowerPlanResponseResult> {
    return this.http.get<ManPowerPlanResponseResult>(`${this.base}/api/admin/manpower-plans/${id}`);
  }

  submit(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/manpower-plans/${id}/submit`, null);
  }

  approve(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/manpower-plans/${id}/approve`, null);
  }

  reject(id: string, request: RejectManPowerPlanRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/manpower-plans/${id}/reject`, request);
  }

  activate(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/manpower-plans/${id}/activate`, null);
  }

  promote(id: string, request: PromotePositionRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/manpower-plans/${id}/promote`, request);
  }

  close(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/manpower-plans/${id}/close`, null);
  }
}