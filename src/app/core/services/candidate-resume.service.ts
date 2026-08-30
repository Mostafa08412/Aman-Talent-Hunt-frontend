import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import { ResumeInfoResult } from '@core/models';

@Injectable({ providedIn: 'root' })
export class CandidateResumeService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /**
   * GET /api/candidate/resume/info — resume metadata for the authenticated
   * candidate. data is a ResumeInfoDto ({ id, name }) when a resume exists,
   * null otherwise (HTTP 200).
   */
  getInfo(): Observable<ResumeInfoResult> {
    return this.http.get<ResumeInfoResult>(`${this.base}/api/candidate/resume/info`);
  }

  /** POST /api/candidate/resume — upload/replace the authenticated candidate's resume. */
  upload(file: File): Observable<Result> {
    const formData = new FormData();
    formData.append('Resume', file, file.name);
    return this.http.post<Result>(`${this.base}/api/candidate/resume`, formData);
  }

  /**
   * GET /api/candidate/resume/download — the raw resume file.
   * Pass inline=true to get it without Content-Disposition: attachment so
   * browsers/frames render it instead of saving it.
   */
  download(inline = false): Observable<Blob> {
    return this.http.get(`${this.base}/api/candidate/resume/stream`, {
      responseType: 'blob',
      params: inline ? { inline: 'true' } : undefined,
      headers: inline ? { 'X-Requested-With': 'XMLHttpRequest' } : undefined,
    });
  }
}
