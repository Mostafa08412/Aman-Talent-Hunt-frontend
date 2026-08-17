import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// TODO: replace with real interviews API once backend InterviewsController exists —
// there is no InterviewsController in the .NET API today, so every DTO and method
// below is a placeholder shape for UI purposes only, not confirmed against a backend
// contract. Keep the public method signatures the same if possible so
// interviews-scorecard/ and finalist-selection/ don't need to change when it lands.

export enum ScorecardDecision {
  Pass = 'Pass',
  Reject = 'Reject',
  Pending = 'Pending',
}

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

const MOCK_SCORECARD_CONTEXTS: Record<string, InterviewScorecardContext> = {
  'interview-2001': {
    interviewId: 'interview-2001',
    candidateId: 'cand-501',
    candidateName: 'Mona Tarek',
    roundName: 'Technical Round 2',
    resumeUrl: '/assets/mock/mona-tarek-resume.pdf',
  },
};

const MOCK_SCORED_CANDIDATES: Record<string, ScoredCandidate[]> = {
  'req-1001': [
    { candidateId: 'cand-501', candidateName: 'Mona Tarek', score: 92, highlights: 'Strong system design; led migration at previous role.' },
    { candidateId: 'cand-502', candidateName: 'Ali Hassan', score: 84, highlights: 'Solid fundamentals; less production experience.' },
    { candidateId: 'cand-503', candidateName: 'Farida Samir', score: 78, highlights: 'Great communicator; needs ramp-up on distributed systems.' },
  ],
};

@Injectable({ providedIn: 'root' })
export class InterviewService {
  getScorecardContext(interviewId: string): Observable<InterviewScorecardContext | undefined> {
    return of(MOCK_SCORECARD_CONTEXTS[interviewId]).pipe(delay(SIM_LATENCY));
  }

  submitScorecard(request: SubmitScorecardRequest): Observable<void> {
    return of(void 0).pipe(delay(SIM_LATENCY));
  }

  getScoredCandidates(requisitionId: string): Observable<ScoredCandidate[]> {
    return of(MOCK_SCORED_CANDIDATES[requisitionId] ?? []).pipe(delay(SIM_LATENCY));
  }

  selectFinalist(requisitionId: string, candidateId: string): Observable<void> {
    return of(void 0).pipe(delay(SIM_LATENCY));
  }
}
