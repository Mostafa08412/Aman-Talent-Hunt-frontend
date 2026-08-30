import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { HrManagerDashboardResult } from '@core/models/hr-manager-dashboard-model';

@Injectable({ providedIn: 'root' })
export class HrManagerDashboardService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/admin/dashboard/hr-manager — company-wide HR overview in one request. */
  getHrManagerDashboard(): Observable<HrManagerDashboardResult> {
    return this.http.get<HrManagerDashboardResult>(`${this.base}/api/admin/dashboard/hr-manager`);
  }
}
