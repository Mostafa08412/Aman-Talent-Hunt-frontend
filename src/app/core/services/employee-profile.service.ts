import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import {
  EmployeeProfileDtoResult,
  UpdateEmployeeProfileRequest,
} from '@core/models/employee-profile-model';

@Injectable({ providedIn: 'root' })
export class EmployeeProfileService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/employee/profile — the authenticated employee's own profile. */
  getProfile(): Observable<EmployeeProfileDtoResult> {
    return this.http.get<EmployeeProfileDtoResult>(`${this.base}/api/employee/profile`);
  }

  /** PUT /api/employee/profile — update own name + phone (admin-managed fields excluded). */
  updateProfile(request: UpdateEmployeeProfileRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/employee/profile`, request);
  }
}
