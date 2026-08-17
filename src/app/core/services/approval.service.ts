import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// TODO: replace with real approvals API once a backend ApprovalsController exists.
// There is no ApprovalsController in the .NET API today (confirmed: only
// ManPowerPlansController, JobDescriptionsController, JobPostController, CandidatesController,
// ApplicationsController and the Admin/* controllers exist — see requisition.service.ts), so
// every DTO and method below is a placeholder shape for UI purposes only, modeling the pending
// requisition-approval requests shown in the Approvals Inbox (wireframe #22). Swap this
// service's internals for real HttpClient calls once that controller lands; keep the public
// method signatures the same if possible so approvals.component.ts doesn't need to change.

export enum ApprovalDecision {
  Approved = 'Approved',
  Rejected = 'Rejected',
  ChangesRequested = 'ChangesRequested',
}

export interface PendingApproval {
  id: string;
  reqNumber: string;
  title: string;
  department: string;
  headcount: number;
  submittedAtUTC: string;
}

const SIM_LATENCY = 300;

let MOCK_APPROVALS: PendingApproval[] = [
  {
    id: 'appr-1',
    reqNumber: 'REQ-042',
    title: 'Senior .NET Dev',
    department: 'Tech',
    headcount: 1,
    submittedAtUTC: '2026-08-05T09:00:00Z',
  },
  {
    id: 'appr-2',
    reqNumber: 'REQ-039',
    title: 'UX Designer',
    department: 'Product',
    headcount: 1,
    submittedAtUTC: '2026-08-07T09:00:00Z',
  },
];

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private _pending = signal<PendingApproval[]>(MOCK_APPROVALS);

  // Approvals waiting on the current approver (HR Manager / Dept Head / Finance Approver).
  getPendingApprovals(): Observable<PendingApproval[]> {
    return of(this._pending()).pipe(delay(SIM_LATENCY));
  }

  // Approve, reject, or send back for changes. `comment` is required for Rejected /
  // ChangesRequested by the component before this is called.
  decide(id: string, decision: ApprovalDecision, comment?: string): Observable<void> {
    this._pending.update((list) => list.filter((a) => a.id !== id));
    MOCK_APPROVALS = this._pending();
    return of(void 0).pipe(delay(SIM_LATENCY));
  }
}
