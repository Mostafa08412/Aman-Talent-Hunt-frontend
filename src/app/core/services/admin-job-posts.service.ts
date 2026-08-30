import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import { EmploymentType, JobPostStatus, JobType, Location, PostingVisibility, SeniorityLevel } from '@core/models/enums';
import {
  AdminJobPostDetailDtoResult,
  AdminJobPostListItemDtoPagedResultResult,
  AssignJobPostRecruiterRequest,
  ConfigureInterviewRoundsRequest,
  ConfigureScreeningQuestionsRequest,
  CreateJobPostRequest,
  ExtendDeadlineRequest,
  UpdateJobPostConfigRequest,
  UpdateJobPostMarketingRequest,
} from '@core/models/admin-job-post-model';
import { toHttpParams } from './http-params.util';

export interface AdminJobPostsQueryParams {
  Status?: JobPostStatus;
  DepartmentId?: string;
  PositionId?: string;
  OwnerId?: string;
  EmploymentType?: EmploymentType;
  SeniorityLevel?: SeniorityLevel;
  Location?: Location;
  DatePosted?: string;
  JobType?: JobType;
  Visibility?: PostingVisibility;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortAscending?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminJobPostsService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  getList(params?: AdminJobPostsQueryParams): Observable<AdminJobPostListItemDtoPagedResultResult> {
    return this.http.get<AdminJobPostListItemDtoPagedResultResult>(`${this.base}/api/admin/job-posts`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  /** Job posts created for the current hiring manager (view-only scope). */
  getHiringManagerPosts(
    params?: AdminJobPostsQueryParams,
  ): Observable<AdminJobPostListItemDtoPagedResultResult> {
    return this.http.get<AdminJobPostListItemDtoPagedResultResult>(
      `${this.base}/api/admin/job-posts/hiring-manager`,
      { params: toHttpParams(params as Record<string, unknown>) },
    );
  }

  getById(id: string): Observable<AdminJobPostDetailDtoResult> {
    return this.http.get<AdminJobPostDetailDtoResult>(`${this.base}/api/admin/job-posts/${id}`);
  }

  createFromRequisition(
    requisitionId: string,
    request: CreateJobPostRequest,
  ): Observable<AdminJobPostDetailDtoResult> {
    return this.http.post<AdminJobPostDetailDtoResult>(
      `${this.base}/api/admin/job-posts/from-requisition/${requisitionId}`,
      request,
    );
  }

  updateMarketing(id: string, request: UpdateJobPostMarketingRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/job-posts/${id}/marketing`, request);
  }

  updateConfiguration(id: string, request: UpdateJobPostConfigRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/job-posts/${id}/configuration`, request);
  }

  publish(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-posts/${id}/publish`, null);
  }

  hold(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-posts/${id}/hold`, null);
  }

  resume(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-posts/${id}/resume`, null);
  }

  close(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-posts/${id}/close`, null);
  }

  markFilled(id: string): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-posts/${id}/mark-filled`, null);
  }

  extendDeadline(id: string, request: ExtendDeadlineRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/admin/job-posts/${id}/extend-deadline`, request);
  }

  configureScreeningQuestions(
    id: string,
    request: ConfigureScreeningQuestionsRequest,
  ): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/job-posts/${id}/screening-questions`, request);
  }

  configureInterviewRounds(id: string, request: ConfigureInterviewRoundsRequest): Observable<Result> {
    return this.http.put<Result>(`${this.base}/api/admin/job-posts/${id}/interview-rounds`, request);
  }

  assignRecruiter(id: string, request: AssignJobPostRecruiterRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/admin/job-posts/${id}/assign-recruiter`, request);
  }
}