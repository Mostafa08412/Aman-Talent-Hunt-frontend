import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Result } from '@core/models/common';
import { InterviewResult } from '@core/models/enums';
import {
  CancelInterviewRequest,
  InterviewDetailDtoResult,
  InterviewListItemDtoIReadOnlyListResult,
  InterviewListItemDtoPagedResultResult,
  InterviewsQueryParams,
  RescheduleInterviewRequest,
  ScheduleInterviewRequest,
  SubmitInterviewResultRequest,
  UpdateMeetingLinkRequest,
} from '@core/models/interview-model';
import { toHttpParams } from './http-params.util';

// UI-facing aliases over the backend InterviewResult enum, keeping the
// Pass/Reject/Pending member names used by the scorecard UI.
export const ScorecardDecision = {
  Pass: InterviewResult.Passed,
  Reject: InterviewResult.Failed,
  Pending: InterviewResult.PendingFeedback,
} as const;

export type ScorecardDecision = InterviewResult;

export interface InterviewScorecardContext {
  interviewId: string;
  candidateId: string;
  candidateName: string;
  roundName: string;
  resumeUrl: string;
}

export interface SubmitScorecardRequest {
  interviewId: string;
  decision: ScorecardDecision;
  feedback: string;
}

export interface ScoredCandidate {
  candidateId: string;
  candidateName: string;
  score: number; // 0-100
  highlights: string;
}

const SIM_LATENCY = 300;

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  // ── Spec endpoints (/api/interviews) ──────────────────────

  schedule(request: ScheduleInterviewRequest): Observable<InterviewDetailDtoResult> {
    return this.http.post<InterviewDetailDtoResult>(`${this.base}/api/interviews/schedule`, request);
  }

  getList(params?: InterviewsQueryParams): Observable<InterviewListItemDtoPagedResultResult> {
    return this.http.get<InterviewListItemDtoPagedResultResult>(`${this.base}/api/interviews`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  getById(id: string): Observable<InterviewDetailDtoResult> {
    return this.http.get<InterviewDetailDtoResult>(`${this.base}/api/interviews/${id}`);
  }

  reschedule(id: string, request: RescheduleInterviewRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/interviews/${id}/reschedule`, request);
  }

  cancel(id: string, request: CancelInterviewRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/interviews/${id}/cancel`, request);
  }

  updateMeetingLink(id: string, request: UpdateMeetingLinkRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/interviews/${id}/meeting-link`, request);
  }

  submitResult(id: string, request: SubmitInterviewResultRequest): Observable<Result> {
    return this.http.patch<Result>(`${this.base}/api/interviews/${id}/result`, request);
  }

  getByScheduledDate(date: string): Observable<InterviewListItemDtoIReadOnlyListResult> {
    return this.http.get<InterviewListItemDtoIReadOnlyListResult>(
      `${this.base}/api/interviews/by-scheduled-date`,
      { params: toHttpParams({ date }) },
    );
  }

  getMy(): Observable<InterviewListItemDtoIReadOnlyListResult> {
    return this.http.get<InterviewListItemDtoIReadOnlyListResult>(`${this.base}/api/interviews/my`);
  }

  getAdminList(params?: InterviewsQueryParams): Observable<InterviewListItemDtoPagedResultResult> {
    return this.http.get<InterviewListItemDtoPagedResultResult>(`${this.base}/api/admin/interviews`, {
      params: toHttpParams(params as Record<string, unknown>),
    });
  }

  // ── Convenience wrappers used by scorecard/finalist pages ─

  getScorecardContext(interviewId: string): Observable<InterviewScorecardContext | undefined> {
    return this.getById(interviewId).pipe(
      map((res) => {
        const dto = res.data;
        if (!dto) return undefined;
        return {
          interviewId: dto.id,
          candidateId: dto.applicantId,
          candidateName:
            [dto.candidateFirstName, dto.candidateLastName].filter(Boolean).join(' ').trim() ||
            'Unknown candidate',
          roundName: dto.roundName ?? `Round ${dto.roundNumber}`,
          resumeUrl: '',
        };
      }),
    );
  }

  submitScorecard(request: SubmitScorecardRequest): Observable<Result> {
    return this.submitResult(request.interviewId, {
      result: request.decision,
      comment: request.feedback,
    });
  }

  // TODO: no backend endpoint exists yet for scored candidates / finalist
  // selection — still mocked. Wire these up when the API lands.
  getScoredCandidates(requisitionId: string): Observable<ScoredCandidate[]> {
    void requisitionId;
    return of([]).pipe(delay(SIM_LATENCY));
  }

  selectFinalist(requisitionId: string, candidateId: string): Observable<void> {
    void requisitionId;
    void candidateId;
    return of(void 0).pipe(delay(SIM_LATENCY));
  }
}
