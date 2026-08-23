import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApplicationResponseResult,
  CandidateApplicationDetailDtoResult,
  CandidateApplicationsDTOListResult,
  ScreeningAnswerRequest,
} from '@core/models/application-model';
import { ApplicationSource } from '@core/models/enums';

export interface SubmitApplicationFields {
  jobPostId: string;
  source: ApplicationSource;
  resume?: File | null;
  answers?: ScreeningAnswerRequest[];
}

@Injectable({ providedIn: 'root' })
export class CandidateApplicationsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  /** GET /api/applications — list the authenticated candidate's applications. */
  getMyApplications(): Observable<CandidateApplicationsDTOListResult> {
    return this.http.get<CandidateApplicationsDTOListResult>(`${this.base}/api/applications`);
  }

  /** GET /api/applications/{id} — one application with its timeline and interviews. */
  getMyApplicationById(id: string): Observable<CandidateApplicationDetailDtoResult> {
    return this.http.get<CandidateApplicationDetailDtoResult>(`${this.base}/api/applications/${id}`);
  }

  /** POST /api/applications — submit a new job application (multipart, for the resume file). */
  submit(fields: SubmitApplicationFields): Observable<ApplicationResponseResult> {
    const formData = new FormData();
    formData.append('JobPostId', fields.jobPostId);
    formData.append('Source', fields.source);
    if (fields.resume) {
      formData.append('Resume', fields.resume, fields.resume.name);
    }
    (fields.answers ?? []).forEach((answer, index) => {
      formData.append(`Answers[${index}].ScreeningQuestionId`, answer.screeningQuestionId);
      if (answer.answer != null) {
        formData.append(`Answers[${index}].Answer`, answer.answer);
      }
    });
    return this.http.post<ApplicationResponseResult>(`${this.base}/api/applications`, formData);
  }
}