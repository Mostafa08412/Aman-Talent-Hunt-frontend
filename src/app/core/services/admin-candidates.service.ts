import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationStatus, MilitaryStatus } from '@core/models/enums';
import {
  CandidateListItemDtoPagedResultResult,
  CandidateProfileDtoResult,
} from '@core/models/admin-candidate-model';
import { toHttpParams } from './http-params.util';

export interface AdminCandidatesQueryParams {
  Status?: ApplicationStatus;
  MilitaryStatus?: MilitaryStatus;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminCandidatesService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(params?: AdminCandidatesQueryParams): Observable<CandidateListItemDtoPagedResultResult> {
    return this.http.get<CandidateListItemDtoPagedResultResult>(`${this.base}/api/admin/candidates`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getById(candidateId: string): Observable<CandidateProfileDtoResult> {
    return this.http.get<CandidateProfileDtoResult>(`${this.base}/api/admin/candidates/${candidateId}`);
  }
}