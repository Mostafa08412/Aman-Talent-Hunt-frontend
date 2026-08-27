import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
  import { environment } from '../../../environments/environment';
import { PublicJobPostDetailDtoResult } from '@core/models/job-post-model';

@Injectable({ providedIn: 'root' })
export class JobDetailsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getJobDetails(id: string): Observable<PublicJobPostDetailDtoResult> {
    return this.http.get<PublicJobPostDetailDtoResult>(`${this.base}/api/JobPost/${id}/public`);
  }
}