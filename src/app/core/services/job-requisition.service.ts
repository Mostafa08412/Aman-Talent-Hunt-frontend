// ============================================================
// FAKE implementation of the Job Requisition API — in-memory store with dummy data.
//
// SWAP GUIDE: the API contract + JOB_REQUISITION_API token live in
// job-requisition-api.ts; the concrete provider is wired in job-req.routes.ts.
// When the real JobRequisitionsController exists, write a JobRequisitionHttpService
// extending JobRequisitionApi with HttpClient calls, then change the `useClass`
// line in job-req.routes.ts. Screens never change.
//
// Note on failures: the fake returns a failed Result envelope (isCompletedSuccessfully
// false + message) instead of throwing HTTP errors; screens handle both paths.
// ============================================================

import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs';

import { ApproverRole, HiringType, JobRequisitionStatus, PermittedAction, RequisitionType, SeniorityLevel } from '@core/models/job-requisition-model';
import type {
  AssignRecruiterPayload,
  AttachJobDescriptionPayload,
  CloseRequest,
  CreateJobRequisitionRequest,
  JobRequisitionDetail,
  JobRequisitionDetailResult,
  JobRequisitionListQuery,
  JobRequisitionPagedResultResult,
  PatchDraftRequest,
  PendingCountResult,
  ReasonRequest,
  RequisitionStatsDto,
} from '@core/models/job-requisition-model';
import { ResultWithData, PagedResult } from '@core/models/common';
import { LookupItemDto } from '@core/models/lookup-model';
import { JobRequisitionApi } from './job-requisition-api';
import {
  MOCK_CALLER,
  MOCK_DEPARTMENTS,
  MOCK_EMPLOYEES,
  MOCK_JOB_DESCRIPTIONS,
  MOCK_MANPOWER_PLANS,
  MOCK_POSITIONS,
  MOCK_SQUADS,
  buildSeedRequisitions,
  nextReferenceNumber,
} from './job-requisition-fake-data';

const SIM_LATENCY_MS = 300;

const PENDING_STATUSES: JobRequisitionStatus[] = [
  JobRequisitionStatus.PendingBudgetApproval,
  JobRequisitionStatus.PendingAttachingJD,
  JobRequisitionStatus.PendingJDApproval,
  JobRequisitionStatus.PendingHRManagerApproval,
];

const OWNED_BY_SQUAD_STATUSES: JobRequisitionStatus[] = [
  JobRequisitionStatus.Approved,
  JobRequisitionStatus.Published,
  JobRequisitionStatus.OnHold,
  JobRequisitionStatus.Fulfilled,
];

@Injectable({ providedIn: 'root' })
export class FakeJobRequisitionService extends JobRequisitionApi {
  private readonly _store = signal<JobRequisitionDetail[]>(buildSeedRequisitions());

  private ok<T>(data: T): ResultWithData<T> {
    return { isCompletedSuccessfully: true, message: null, code: 200, data };
  }

  private fail(code: number, message: string): ResultWithData<never> {
    return { isCompletedSuccessfully: false, message, code, data: null };
  }

  private persist(updated: JobRequisitionDetail): void {
    this._store.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
  }

  private touch(r: JobRequisitionDetail): void {
    r.updatedAtUTC = new Date().toISOString();
  }

  private respond(detail: JobRequisitionDetail | null, error?: { code: number; message: string }): Observable<JobRequisitionDetailResult> {
    const body = (error ? this.fail(error.code, error.message) : this.ok(detail)) as JobRequisitionDetailResult;
    return of(body).pipe(delay(SIM_LATENCY_MS));
  }

  private transition(
    id: string,
    mutate: (r: JobRequisitionDetail) => void,
    guard?: (r: JobRequisitionDetail) => { code: number; message: string } | null,
  ): Observable<JobRequisitionDetailResult> {
    const current = this._store().find((r) => r.id === id);
    if (!current) return this.respond(null, { code: 404, message: 'JobRequisitionErrors.NotFound' });
    const violation = guard?.(current);
    if (violation) return this.respond(null, violation);

    const draft: JobRequisitionDetail = JSON.parse(JSON.stringify(current));
    mutate(draft);
    this.touch(draft);
    draft.permittedActions = computePermittedActions(draft);
    this.persist(draft);
    return this.respond(draft);
  }

  // ── Reads ──

  getList(query: JobRequisitionListQuery): Observable<JobRequisitionPagedResultResult> {
    let items = [...this._store()].filter((r) => matchesView(r, query.view, query.departmentId));

    if (query.status?.length) items = items.filter((r) => query.status!.includes(r.status));
    if (query.departmentId && query.view !== 'departmentAll') {
      items = items.filter((r) => r.departmentId === query.departmentId);
    }
    if (query.squadId) items = items.filter((r) => r.assignedSquad.id === query.squadId);
    if (query.hiringType) items = items.filter((r) => r.hiringType === query.hiringType);
    if (query.isAdHocJob !== undefined) items = items.filter((r) => r.isAdHocJob === query.isAdHocJob);
    if (query.search?.trim()) {
      const term = query.search.trim().toLowerCase();
      items = items.filter((r) =>
        [r.proposedJobTitle, r.departingEmployeeName ?? '', r.positionRegistry?.title ?? '', r.referenceNumber]
          .some((field) => field.toLowerCase().includes(term)),
      );
    }

    items.sort((a, b) => {
      const key = (query.sortBy ?? 'updatedAtUTC') as keyof JobRequisitionDetail;
      const dir = query.sortDir === 'asc' ? 1 : -1;
      const av = String(a[key] ?? '');
      const bv = String(b[key] ?? '');
      return av.localeCompare(bv) * dir;
    });

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const totalCount = items.length;
    const paged: PagedResult<JobRequisitionDetail> = {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      hasNextPage: page * pageSize < totalCount,
      hasPreviousPage: page > 1,
    };
    return (of(this.ok(paged)) as Observable<JobRequisitionPagedResultResult>).pipe(delay(SIM_LATENCY_MS));
  }

  getById(id: string): Observable<JobRequisitionDetailResult> {
    const found = this._store().find((r) => r.id === id) ?? null;
    return this.respond(found, found ? undefined : { code: 404, message: 'JobRequisitionErrors.NotFound' });
  }

  getPendingCount(): Observable<PendingCountResult> {
    const count = this._store().filter(
      (r) => r.currentApproverId === MOCK_CALLER.id && PENDING_STATUSES.includes(r.status),
    ).length;
    return of(this.ok({ count })).pipe(delay(SIM_LATENCY_MS));
  }

  getStats(): Observable<ResultWithData<RequisitionStatsDto>> {
    const all = this._store();
    const byStatus: Record<string, number> = {};
    for (const r of all) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

    const daysBetween = (from: string | null, to: string | null) =>
      from && to ? (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000 : null;
    const fills = all.map((r) => daysBetween(r.submittedAtUTC, r.publishedAtUTC)).filter((d): d is number => d !== null);
    const hires = all.map((r) => daysBetween(r.submittedAtUTC, r.fulfilledAtUTC)).filter((d): d is number => d !== null);
    const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

    const stats: RequisitionStatsDto = {
      totalRequisitions: all.length,
      byStatus,
      averageTimeToFillDays: Math.round((average(fills) ?? 0) * 10) / 10 || null,
      averageTimeToHireDays: Math.round((average(hires) ?? 0) * 10) / 10 || null,
    };
    return of(this.ok(stats)).pipe(delay(SIM_LATENCY_MS));
  }

  // ── Create & edit ──

  create(request: CreateJobRequisitionRequest): Observable<JobRequisitionDetailResult> {
    const department = MOCK_DEPARTMENTS.find((d) => d.id === request.departmentId);
    const squad = MOCK_SQUADS.find((s) => s.id === request.assignedSquadId);
    const hrManager = MOCK_EMPLOYEES.find((e) => e.id === request.hrManagerId);
    if (!department || !squad || !hrManager) {
      return this.respond(null, { code: 400, message: 'JobRequisitionErrors.InvalidReferences' });
    }

    const derived = deriveTypeFields(request.requisitionType);
    const detail: JobRequisitionDetail = {
      id: `jr-${Date.now()}`,
      referenceNumber: nextReferenceNumber(),
      requisitionType: request.requisitionType,
      status: JobRequisitionStatus.Draft,
      departmentId: department.id,
      departmentName: department.name,
      requestedHeadcount: request.requestedHeadcount,
      location: request.location,
      hiringManagerId: MOCK_CALLER.id,
      hiringManagerName: MOCK_CALLER.name,
      currentApproverRole: null,
      currentApproverId: null,
      currentApproverName: null,
      proposedJobTitle:
        (request as { proposedJobTitle?: string }).proposedJobTitle ??
        MOCK_MANPOWER_PLANS.find((p) => p.id === (request as { manPowerPlanId?: string }).manPowerPlanId)?.positionTitle ??
        'Untitled position',
      submittedAtUTC: null,
      updatedAtUTC: new Date().toISOString(),
      isAdHocJob: derived.isAdHocJob,
      hiringType: derived.hiringType,
      manPowerPlan: mapManPowerPlan((request as { manPowerPlanId?: string | null }).manPowerPlanId ?? null),
      positionRegistry: mapPosition((request as { positionRegistryId?: string | null }).positionRegistryId ?? null),
      jobDescription: null,
      assignedSquad: { id: squad.id, name: squad.name, leaderId: squad.leaderId },
      assignedRecruiterId: null,
      departingEmployeeName: (request as { departingEmployeeName?: string | null }).departingEmployeeName ?? null,
      departingEmployeeId: (request as { departingEmployeeId?: string | null }).departingEmployeeId ?? null,
      growthJustification: (request as { growthJustification?: string | null }).growthJustification ?? null,
      rejectionReason: null,
      onHoldReason: null,
      cancelReason: null,
      approvedAtUTC: null,
      publishedAtUTC: null,
      rejectedAtUTC: null,
      fulfilledAtUTC: null,
      closedAtUTC: null,
      isLockedForModification: false,
      isReassignmentLocked: false,
      pendingModificationOwnerId: null,
      pendingModificationOwnerName: null,
      pendingModificationOwnerRole: null,
      permittedActions: [PermittedAction.EditDraft, PermittedAction.Submit],
    };

    this._store.update((list) => [detail, ...list]);
    return this.respond(detail);
  }

  updateDraft(id: string, request: PatchDraftRequest): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.requestedHeadcount = request.requestedHeadcount;
        r.location = request.location;
        if (request.growthJustification !== undefined) r.growthJustification = request.growthJustification;
        if (request.proposedJobTitle !== undefined) r.proposedJobTitle = request.proposedJobTitle ?? r.proposedJobTitle;
        if (request.proposedJobSeniorityLevel !== undefined && request.proposedJobSeniorityLevel !== null) {
          (r as { proposedJobSeniorityLevel?: SeniorityLevel }).proposedJobSeniorityLevel = request.proposedJobSeniorityLevel;
        }
        clearModificationFlag(r);
      },
      editableGuard,
    );
  }

  // ── Draft lifecycle ──

  submit(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.PendingBudgetApproval;
        r.submittedAtUTC = r.updatedAtUTC;
        const head = MOCK_DEPARTMENTS.find((d) => d.id === r.departmentId);
        r.currentApproverRole = ApproverRole.DepartmentHead;
        r.currentApproverId = head?.headId ?? null;
        r.currentApproverName = head?.headName ?? null;
        clearModificationFlag(r);
      },
      editableGuard,
    );
  }

  // ── Approval chain ──

  approveAsDepartmentHead(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.PendingAttachingJD;
        r.currentApproverRole = ApproverRole.Recruiter;
        r.currentApproverId = r.assignedSquad.leaderId;
        r.currentApproverName = MOCK_SQUADS.find((s) => s.id === r.assignedSquad.id)?.leaderName ?? null;
        clearModificationFlag(r);
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.PendingBudgetApproval),
    );
  }

  approveAsHiringManager(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.PendingHRManagerApproval;
        const hr = MOCK_EMPLOYEES.find((e) => e.role === ApproverRole.HRManager);
        r.currentApproverRole = ApproverRole.HRManager;
        r.currentApproverId = hr?.id ?? null;
        r.currentApproverName = hr?.name ?? null;
        clearModificationFlag(r);
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.PendingJDApproval),
    );
  }

  approveAsHRManager(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.Approved;
        r.approvedAtUTC = r.updatedAtUTC;
        r.currentApproverRole = ApproverRole.Recruiter;
        r.currentApproverId = r.assignedSquad.leaderId;
        r.currentApproverName = MOCK_SQUADS.find((s) => s.id === r.assignedSquad.id)?.leaderName ?? null;
        clearModificationFlag(r);
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.PendingHRManagerApproval),
    );
  }

  reject(id: string, body: ReasonRequest): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.Rejected;
        r.rejectionReason = body.reason;
        r.rejectedAtUTC = r.updatedAtUTC;
        r.currentApproverRole = null;
        r.currentApproverId = null;
        r.currentApproverName = null;
      },
      (r) =>
        !PENDING_STATUSES.includes(r.status)
          ? { code: 409, message: 'JobRequisitionErrors.InvalidStatusTransition' }
          : null,
    );
  }

  // Modification requests bounce the requisition back to whoever produced the
  // current status (see mapping in the module doc), NOT to the next approver.
  requestModification(id: string, body: ReasonRequest): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        const owner = modificationOwnerFor(r.status, r);
        r.status = owner.returnStatus;
        r.rejectionReason = body.reason;
        r.pendingModificationOwnerId = owner.id;
        r.pendingModificationOwnerName = owner.name;
        r.pendingModificationOwnerRole = owner.role;
      },
      (r) =>
        !PENDING_STATUSES.includes(r.status)
          ? { code: 409, message: 'JobRequisitionErrors.InvalidStatusTransition' }
          : null,
    );
  }

  // ── Recruiter / squad actions ──

  assignRecruiter(id: string, body: AssignRecruiterPayload): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.assignedRecruiterId = body.recruiterId;
      },
      (r) => {
        if (r.isReassignmentLocked) return { code: 409, message: 'JobRequisitionErrors.ReassignmentLocked' };
        return notInStatusGuard(r, JobRequisitionStatus.PendingAttachingJD);
      },
    );
  }

  attachJobDescription(id: string, body: AttachJobDescriptionPayload): Observable<JobRequisitionDetailResult> {
    const jd = MOCK_JOB_DESCRIPTIONS.find((j) => j.id === body.jobDescriptionId);
    if (!jd) return this.respond(null, { code: 400, message: 'JobDescriptionErrors.NotFound' });

    return this.transition(
      id,
      (r) => {
        r.jobDescription = { id: jd.id, referenceNumber: jd.referenceNumber, status: jd.status };
        r.status = JobRequisitionStatus.PendingJDApproval;
        r.currentApproverRole = ApproverRole.HiringManager;
        r.currentApproverId = r.hiringManagerId;
        r.currentApproverName = r.hiringManagerName;
        clearModificationFlag(r);
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.PendingAttachingJD),
    );
  }

  // ── Publish / lifecycle ──

  publish(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.Published;
        r.publishedAtUTC = r.updatedAtUTC;
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.Approved),
    );
  }

  hold(id: string, body: ReasonRequest): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.OnHold;
        r.onHoldReason = body.reason;
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.Published),
    );
  }

  resume(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.Published;
        r.onHoldReason = null;
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.OnHold),
    );
  }

  fulfill(id: string): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.Fulfilled;
        r.fulfilledAtUTC = r.updatedAtUTC;
      },
      (r) => notInStatusGuard(r, JobRequisitionStatus.Published),
    );
  }

  close(id: string, body: CloseRequest): Observable<JobRequisitionDetailResult> {
    return this.transition(
      id,
      (r) => {
        r.status = JobRequisitionStatus.Closed;
        r.closedAtUTC = r.updatedAtUTC;
        r.cancelReason = body.reason;
        r.currentApproverRole = null;
        r.currentApproverId = null;
        r.currentApproverName = null;
      },
      (r) =>
        ![JobRequisitionStatus.Approved, JobRequisitionStatus.Published].includes(r.status)
          ? { code: 409, message: 'JobRequisitionErrors.InvalidStatusTransition' }
          : null,
    );
  }

  // ── Wizard lookups ──

  getDepartmentOptions(): Observable<ResultWithData<LookupItemDto[]>> {
    const items = MOCK_DEPARTMENTS.map((d) => ({ id: d.id, referenceNumber: null, viewText: d.name, secondaryText: null }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }

  getSquadOptions(departmentId?: string): Observable<ResultWithData<LookupItemDto[]>> {
    const squads = departmentId ? MOCK_SQUADS.filter((s) => s.departmentId === departmentId) : MOCK_SQUADS;
    const items = squads.map((s) => ({ id: s.id, referenceNumber: null, viewText: s.name, secondaryText: s.leaderName }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }

  getEmployeeOptions(role: 'HR_MANAGER' | 'DEPARTMENT_HEAD' | 'RECRUITER', departmentId?: string): Observable<ResultWithData<LookupItemDto[]>> {
    let employees = MOCK_EMPLOYEES.filter((e) => e.role === role);
    if (role === 'DEPARTMENT_HEAD' && departmentId) {
      const dept = MOCK_DEPARTMENTS.find((d) => d.id === departmentId);
      employees = employees.filter((e) => e.id === dept?.headId);
    }
    const items = employees.map((e) => ({
      id: e.id,
      referenceNumber: null,
      viewText: e.name,
      secondaryText: role.replace('_', ' ').toLowerCase(),
    }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }

  getOpenManPowerPlanOptions(departmentId?: string): Observable<ResultWithData<LookupItemDto[]>> {
    const plans = departmentId ? MOCK_MANPOWER_PLANS.filter((p) => p.departmentId === departmentId) : MOCK_MANPOWER_PLANS;
    const items = plans.map((p) => ({ id: p.id, referenceNumber: p.referenceNumber, viewText: p.positionTitle, secondaryText: p.referenceNumber }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }

  getActivePositionOptions(departmentId?: string): Observable<ResultWithData<LookupItemDto[]>> {
    const positions = departmentId ? MOCK_POSITIONS.filter((p) => p.departmentId === departmentId) : MOCK_POSITIONS;
    const items = positions.map((p) => ({ id: p.id, referenceNumber: p.referenceNumber, viewText: p.title, secondaryText: p.seniorityLevel }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }

  getDepartingEmployeeOptions(): Observable<ResultWithData<LookupItemDto[]>> {
    const items = MOCK_EMPLOYEES.filter((e) => e.role === 'Employee').map((e) => ({
      id: e.id,
      referenceNumber: null,
      viewText: e.name,
      secondaryText: 'Departing',
    }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }

  getDraftJobDescriptionOptions(squadId?: string): Observable<ResultWithData<LookupItemDto[]>> {
    const drafts = squadId ? MOCK_JOB_DESCRIPTIONS.filter((j) => j.squadId === squadId) : MOCK_JOB_DESCRIPTIONS;
    const items = drafts.map((j) => ({ id: j.id, referenceNumber: j.referenceNumber, viewText: j.title, secondaryText: j.status }));
    return of(this.ok(items)).pipe(delay(SIM_LATENCY_MS));
  }
}

// ── Shared pure helpers ──

function notInStatusGuard(r: JobRequisitionDetail, expected: JobRequisitionStatus): { code: number; message: string } | null {
  return r.status === expected ? null : { code: 409, message: 'JobRequisitionErrors.InvalidStatusTransition' };
}

/** Drafts are editable; so are rejected items awaiting their owner's fix + resubmit. */
function editableGuard(r: JobRequisitionDetail): { code: number; message: string } | null {
  const fixable = r.status === JobRequisitionStatus.Rejected && r.pendingModificationOwnerId !== null;
  if (r.status === JobRequisitionStatus.Draft || fixable) return null;
  return { code: 409, message: 'JobRequisitionErrors.InvalidStatusTransition' };
}

function clearModificationFlag(r: JobRequisitionDetail): void {
  r.rejectionReason = null;
  r.pendingModificationOwnerId = null;
  r.pendingModificationOwnerName = null;
  r.pendingModificationOwnerRole = null;
}

/** Server-side view resolution — identity comes from the (mocked) auth token. */
function matchesView(r: JobRequisitionDetail, view: JobRequisitionListQuery['view'], departmentId?: string): boolean {
  switch (view) {
    case 'mine':
      return r.hiringManagerId === MOCK_CALLER.id;
    case 'pendingMyApproval':
      return r.currentApproverId === MOCK_CALLER.id && PENDING_STATUSES.includes(r.status);
    case 'pendingMyModification':
      return (
        r.pendingModificationOwnerId === MOCK_CALLER.id &&
        r.rejectionReason !== null &&
        r.status !== JobRequisitionStatus.Closed
      );
    case 'assignedToMySquad':
      return r.assignedSquad.id === MOCK_CALLER.squadId && r.status === JobRequisitionStatus.PendingAttachingJD;
    case 'ownedByMySquad':
      return r.assignedSquad.id === MOCK_CALLER.squadId && OWNED_BY_SQUAD_STATUSES.includes(r.status);
    case 'departmentAll':
      return r.departmentId === (departmentId ?? MOCK_CALLER.departmentId);
    case 'all':
      return true;
  }
}

/**
 * Mirrors what the real backend computes from Status + CurrentApproverRole +
 * caller identity. The UI renders buttons straight from this list.
 */
function computePermittedActions(r: JobRequisitionDetail): PermittedAction[] {
  switch (r.status) {
    case JobRequisitionStatus.Draft:
      return [PermittedAction.EditDraft, PermittedAction.Submit];
    case JobRequisitionStatus.PendingBudgetApproval:
      return [PermittedAction.ApproveDepartmentHead, PermittedAction.Reject, PermittedAction.RequestModification];
    case JobRequisitionStatus.PendingAttachingJD:
      return [
        ...(r.isReassignmentLocked ? [] : [PermittedAction.AssignRecruiter]),
        PermittedAction.AttachJobDescription,
        PermittedAction.RequestModification,
      ];
    case JobRequisitionStatus.PendingJDApproval:
      return [PermittedAction.ApproveHiringManager, PermittedAction.Reject, PermittedAction.RequestModification];
    case JobRequisitionStatus.PendingHRManagerApproval:
      return [PermittedAction.ApproveHRManager, PermittedAction.Reject, PermittedAction.RequestModification];
    case JobRequisitionStatus.Approved:
      return [PermittedAction.Publish, PermittedAction.Close];
    case JobRequisitionStatus.Published:
      return [PermittedAction.Hold, PermittedAction.Fulfill, PermittedAction.Close];
    case JobRequisitionStatus.OnHold:
      return [PermittedAction.Resume];
    case JobRequisitionStatus.Rejected:
      // Rejected items whose owner still owes a fix stay actionable (edit + resubmit);
      // plain rejections are terminal.
      return r.pendingModificationOwnerId ? [PermittedAction.EditDraft, PermittedAction.Submit] : [];
    default:
      return [];
  }
}

/** Where a modification request sends the requisition back to, and who fixes it. */
function modificationOwnerFor(status: JobRequisitionStatus, r: JobRequisitionDetail): {
  returnStatus: JobRequisitionStatus;
  id: string;
  name: string;
  role: ApproverRole;
} {
  const recruiterName = MOCK_SQUADS.find((s) => s.id === r.assignedSquad.id)?.leaderName ?? 'Recruiter';
  switch (status) {
    // Entered via Submit() -> the Hiring Manager fixes it.
    case JobRequisitionStatus.PendingBudgetApproval:
      return { returnStatus: JobRequisitionStatus.Draft, id: r.hiringManagerId, name: r.hiringManagerName, role: ApproverRole.HiringManager };
    // Entered via ApproveByDepartmentHead().
    case JobRequisitionStatus.PendingAttachingJD:
      return { returnStatus: JobRequisitionStatus.PendingBudgetApproval, id: r.currentApproverId!, name: r.currentApproverName!, role: ApproverRole.DepartmentHead };
    // Entered via AttachDraftJobDescription() -> the Recruiter fixes it.
    case JobRequisitionStatus.PendingJDApproval:
      return { returnStatus: JobRequisitionStatus.PendingAttachingJD, id: r.assignedSquad.leaderId, name: recruiterName, role: ApproverRole.Recruiter };
    // Entered via ApproveByHiringManager().
    default:
      return { returnStatus: JobRequisitionStatus.PendingJDApproval, id: r.hiringManagerId, name: r.hiringManagerName, role: ApproverRole.HiringManager };
  }
}

function deriveTypeFields(type: RequisitionType): { hiringType: HiringType; isAdHocJob: boolean } {
  switch (type) {
    case RequisitionType.PlannedAdHoc:
      return { hiringType: HiringType.Backfill, isAdHocJob: true };
    case RequisitionType.PlannedExisting:
      return { hiringType: HiringType.Backfill, isAdHocJob: false };
    case RequisitionType.Replacement:
      return { hiringType: HiringType.Replacement, isAdHocJob: false };
    case RequisitionType.GrowthAdHoc:
      return { hiringType: HiringType.NewPosition, isAdHocJob: true };
    case RequisitionType.GrowthExisting:
      return { hiringType: HiringType.NewPosition, isAdHocJob: false };
  }
}

function mapManPowerPlan(id: string | null) {
  const plan = MOCK_MANPOWER_PLANS.find((p) => p.id === id);
  return plan ? { id: plan.id, referenceNumber: plan.referenceNumber, isNewPositionTitle: false } : null;
}

function mapPosition(id: string | null) {
  const pos = MOCK_POSITIONS.find((p) => p.id === id);
  return pos ? { id: pos.id, referenceNumber: pos.referenceNumber, title: pos.title, isActive: true } : null;
}
