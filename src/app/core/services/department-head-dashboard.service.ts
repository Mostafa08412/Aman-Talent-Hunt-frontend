import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { DepartmentHeadDashboardResult } from '@core/models/department-head-dashboard-model';

@Injectable({ providedIn: 'root' })
export class DepartmentHeadDashboardService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/admin/dashboard/department-head — the department the user heads, in one request. */
  getDepartmentHeadDashboard(): Observable<DepartmentHeadDashboardResult> {
    return this.http.get<DepartmentHeadDashboardResult>(`${this.base}/api/admin/dashboard/department-head`);
  }
}
