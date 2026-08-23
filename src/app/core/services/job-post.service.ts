import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PublicJobPostDetailDtoResult,
  PublicJobPostListItemDtoPagedResultResult,
  PublicJobPostQueryParams,
} from '@core/models/job-post-model';

@Injectable({ providedIn: 'root' })
export class JobPostService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getPublicList(
    params?: PublicJobPostQueryParams,
  ): Observable<PublicJobPostListItemDtoPagedResultResult> {
    return this.http.get<PublicJobPostListItemDtoPagedResultResult>(
      `${this.base}/api/JobPost/public`,
      { params: this.toHttpParams(params) },
    );
  }

  getPublicById(id: string): Observable<PublicJobPostDetailDtoResult> {
    return this.http.get<PublicJobPostDetailDtoResult>(
      `${this.base}/api/JobPost/${id}/public`,
    );
  }

  private toHttpParams(params?: PublicJobPostQueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    const entries = Object.entries(params) as [string, unknown][];
    for (const [key, value] of entries) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}