import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { RecruiterDashboardResult } from '@core/models/recruiter-dashboard-model';

@Injectable({ providedIn: 'root' })
export class RecruiterDashboardService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/admin/dashboard/recruiter — everything the recruiter overview needs in one request. */
  getRecruiterDashboard(): Observable<RecruiterDashboardResult> {
    return this.http.get<RecruiterDashboardResult>(`${this.base}/api/admin/dashboard/recruiter`);
  }
}
