import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { HiringManagerDashboardResult } from '@core/models/hiring-manager-dashboard-model';

@Injectable({ providedIn: 'root' })
export class HiringManagerDashboardService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/admin/dashboard/hiring-manager — the Hiring Manager's scoped overview in one request. */
  getHiringManagerDashboard(): Observable<HiringManagerDashboardResult> {
    return this.http.get<HiringManagerDashboardResult>(`${this.base}/api/admin/dashboard/hiring-manager`);
  }
}
