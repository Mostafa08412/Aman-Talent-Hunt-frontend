import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import {
  CandidateProfileDtoResult,
  UpdateCandidateProfileRequest,
} from '@core/models/candidate-model';

@Injectable({ providedIn: 'root' })
export class CandidateProfileService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/candidate/profile — the authenticated candidate's profile. */
  getProfile(): Observable<CandidateProfileDtoResult> {
    return this.http.get<CandidateProfileDtoResult>(`${this.base}/api/candidate/profile`);
  }

  /** PUT /api/candidate/profile — update the authenticated candidate's profile. */
  updateProfile(request: UpdateCandidateProfileRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/candidate/profile`, request);
  }
}