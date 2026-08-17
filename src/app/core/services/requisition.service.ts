import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';

// TODO: replace with real requisitions API once a backend RequisitionsController exists.
// There is no RequisitionsController in the .NET API today (confirmed: only
// ManPowerPlansController, JobDescriptionsController, JobPostController, CandidatesController,
// ApplicationsController and the Admin/* controllers exist), so every DTO and status/stage
// name below is a placeholder shape for UI purposes only — not confirmed against a backend
// contract. Swap RequisitionService's internals for real HttpClient calls once that
// controller lands; keep the public method signatures the same if possible so the screens
// in requisitions/ and hm-dashboard/ don't need to change.

export enum HiringType {
  NewHeadcount = 'NewHeadcount',
  Replacement = 'Replacement',
  Backfill = 'Backfill',
}

export const HIRING_TYPE_OPTIONS: { value: HiringType; label: string }[] = [
  { value: HiringType.NewHeadcount, label: 'New Headcount' },
  { value: HiringType.Replacement, label: 'Replacement' },
  { value: HiringType.Backfill, label: 'Backfill' },
];

// The 4 stages of the Requisition Control Center stepper (wireframe #11).
export enum RequisitionStage {
  Draft = 'Draft',
  Approval = 'Approval',
  Sourcing = 'Sourcing',
  Filled = 'Filled',
}

export const REQUISITION_STAGES: { value: RequisitionStage; label: string }[] = [
  { value: RequisitionStage.Draft, label: 'Draft' },
  { value: RequisitionStage.Approval, label: 'Approval' },
  { value: RequisitionStage.Sourcing, label: 'Sourcing' },
  { value: RequisitionStage.Filled, label: 'Filled' },
];

// Exception states that pause the stepper rather than advance it.
export enum RequisitionHoldState {
  None = 'None',
  OnHold = 'OnHold',
  Cancelled = 'Cancelled',
}

export interface RequisitionSummary {
  id: string;
  reqNumber: string;
  title: string;
  department: string;
  squad: string;
  hiringType: HiringType;
  stage: RequisitionStage;
  holdState: RequisitionHoldState;
  headcount: number;
  createdAtUTC: string;
  candidatesPendingTechEval: number;
}

export interface RequisitionDetail extends RequisitionSummary {
  recruiterName: string;
  budgetCode: string;
  startDate: string;
}

export interface CreateRequisitionRequest {
  title: string;
  hiringType: HiringType;
  departmentId: string;
  squadId: string;
  headcount: number;
  startDate: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface SquadOption {
  id: string;
  name: string;
  departmentId: string;
}

// Mock lookahead lists — TODO: replace with real department/squad lookups once it's
// confirmed HM/Recruiter roles can call an endpoint for these (today AdminDepartmentsController
// / AdminSquadsController exist but are Admin-scoped; no public list endpoint is confirmed).
const MOCK_DEPARTMENTS: DepartmentOption[] = [
  { id: 'dept-eng', name: 'Engineering' },
  { id: 'dept-product', name: 'Product' },
  { id: 'dept-ops', name: 'Operations' },
];

const MOCK_SQUADS: SquadOption[] = [
  { id: 'squad-platform', name: 'Platform', departmentId: 'dept-eng' },
  { id: 'squad-mobile', name: 'Mobile', departmentId: 'dept-eng' },
  { id: 'squad-growth', name: 'Growth', departmentId: 'dept-product' },
  { id: 'squad-logistics', name: 'Logistics', departmentId: 'dept-ops' },
];

let MOCK_REQUISITIONS: RequisitionDetail[] = [
  {
    id: 'req-1001',
    reqNumber: 'REQ-1001',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    squad: 'Platform',
    hiringType: HiringType.NewHeadcount,
    stage: RequisitionStage.Sourcing,
    holdState: RequisitionHoldState.None,
    headcount: 2,
    createdAtUTC: '2026-06-02T09:00:00Z',
    candidatesPendingTechEval: 3,
    recruiterName: 'Sara Youssef',
    budgetCode: 'BC-ENG-2026-014',
    startDate: '2026-09-01',
  },
  {
    id: 'req-1002',
    reqNumber: 'REQ-1002',
    title: 'Mobile Engineer (iOS)',
    department: 'Engineering',
    squad: 'Mobile',
    hiringType: HiringType.Replacement,
    stage: RequisitionStage.Approval,
    holdState: RequisitionHoldState.None,
    headcount: 1,
    createdAtUTC: '2026-07-14T09:00:00Z',
    candidatesPendingTechEval: 0,
    recruiterName: 'Karim Adel',
    budgetCode: 'BC-ENG-2026-021',
    startDate: '2026-10-15',
  },
  {
    id: 'req-1003',
    reqNumber: 'REQ-1003',
    title: 'Growth Marketing Lead',
    department: 'Product',
    squad: 'Growth',
    hiringType: HiringType.Backfill,
    stage: RequisitionStage.Draft,
    holdState: RequisitionHoldState.None,
    headcount: 1,
    createdAtUTC: '2026-08-01T09:00:00Z',
    candidatesPendingTechEval: 0,
    recruiterName: 'Unassigned',
    budgetCode: 'BC-PRD-2026-005',
    startDate: '2026-11-01',
  },
  {
    id: 'req-1004',
    reqNumber: 'REQ-1004',
    title: 'Logistics Coordinator',
    department: 'Operations',
    squad: 'Logistics',
    hiringType: HiringType.NewHeadcount,
    stage: RequisitionStage.Filled,
    holdState: RequisitionHoldState.None,
    headcount: 1,
    createdAtUTC: '2026-04-20T09:00:00Z',
    candidatesPendingTechEval: 0,
    recruiterName: 'Nourhan Fathy',
    budgetCode: 'BC-OPS-2026-002',
    startDate: '2026-05-15',
  },
];

const SIM_LATENCY = 300;

@Injectable({ providedIn: 'root' })
export class RequisitionService {
  // TODO: replace with real interviews API once backend InterviewsController exists —
  // pendingTechEval counts above stand in for what would really be derived from
  // scheduled/completed interview records per requisition.

  private _requisitions = signal<RequisitionDetail[]>(MOCK_REQUISITIONS);

  getDepartments(): Observable<DepartmentOption[]> {
    return of(MOCK_DEPARTMENTS).pipe(delay(SIM_LATENCY));
  }

  getSquads(departmentId?: string): Observable<SquadOption[]> {
    const squads = departmentId ? MOCK_SQUADS.filter((s) => s.departmentId === departmentId) : MOCK_SQUADS;
    return of(squads).pipe(delay(SIM_LATENCY));
  }

  // Requisitions owned/created by the current Hiring Manager — for now this is just
  // "all mock requisitions" since there's no auth/ownership wiring on the mock data.
  getMyRequisitions(): Observable<RequisitionSummary[]> {
    return of(this._requisitions()).pipe(delay(SIM_LATENCY));
  }

  getById(id: string): Observable<RequisitionDetail | undefined> {
    return of(this._requisitions().find((r) => r.id === id)).pipe(delay(SIM_LATENCY));
  }

  create(request: CreateRequisitionRequest): Observable<RequisitionDetail> {
    const department = MOCK_DEPARTMENTS.find((d) => d.id === request.departmentId);
    const squad = MOCK_SQUADS.find((s) => s.id === request.squadId);
    const next = this._requisitions().length + 1001;
    const created: RequisitionDetail = {
      id: `req-${next}`,
      reqNumber: `REQ-${next}`,
      title: request.title,
      department: department?.name ?? 'Unknown Department',
      squad: squad?.name ?? 'Unknown Squad',
      hiringType: request.hiringType,
      stage: RequisitionStage.Draft,
      holdState: RequisitionHoldState.None,
      headcount: request.headcount,
      createdAtUTC: new Date().toISOString(),
      candidatesPendingTechEval: 0,
      recruiterName: 'Unassigned',
      budgetCode: 'Pending Finance Assignment',
      startDate: request.startDate,
    };
    this._requisitions.update((list) => [...list, created]);
    MOCK_REQUISITIONS = this._requisitions();
    return of(created).pipe(delay(SIM_LATENCY));
  }

  placeOnHold(id: string): Observable<void> {
    this._requisitions.update((list) =>
      list.map((r) => (r.id === id ? { ...r, holdState: RequisitionHoldState.OnHold } : r)),
    );
    MOCK_REQUISITIONS = this._requisitions();
    return of(void 0).pipe(delay(SIM_LATENCY));
  }

  cancel(id: string): Observable<void> {
    this._requisitions.update((list) =>
      list.map((r) => (r.id === id ? { ...r, holdState: RequisitionHoldState.Cancelled } : r)),
    );
    MOCK_REQUISITIONS = this._requisitions();
    return of(void 0).pipe(delay(SIM_LATENCY));
  }

  // Dashboard stat tracker (wireframe #9). "Total this ATC" = every requisition opened
  // under the current Annual Talent Cycle, regardless of status.
  getDashboardStats(): Observable<{
    activeReqs: number;
    pendingTechEval: number;
    pendingApproval: number;
    totalThisAtc: number;
  }> {
    return this.getMyRequisitions().pipe(
      map((reqs) => ({
        activeReqs: reqs.filter(
          (r) => r.holdState === RequisitionHoldState.None && r.stage !== RequisitionStage.Filled,
        ).length,
        pendingTechEval: reqs.reduce((sum, r) => sum + r.candidatesPendingTechEval, 0),
        pendingApproval: reqs.filter((r) => r.stage === RequisitionStage.Approval).length,
        totalThisAtc: reqs.length,
      })),
    );
  }
}
