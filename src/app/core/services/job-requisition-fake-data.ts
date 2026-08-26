// ============================================================
// Dummy data for FakeJobRequisitionService — DELETE THIS FILE when the real
// JobRequisitionsController lands. Everything here stands in for backend data.
// ============================================================

import { ApproverRole, HiringType, JobRequisitionStatus, Location, PermittedAction, RequisitionType, SeniorityLevel } from '@core/models/job-requisition-model';
import type {
  JobDescriptionRef,
  JobRequisitionDetail,
  ManPowerPlanRef,
  PositionRegistryRef,
} from '@core/models/job-requisition-model';

/** The identity the fake API resolves views/permissions against. */
export const MOCK_CALLER = {
  id: 'emp-hm-001',
  name: 'Sara Amin',
  role: ApproverRole.HiringManager,
  departmentId: 'dept-eng',
  departmentName: 'Platform Engineering',
  squadId: 'squad-nova',
};

export interface MockDepartment { id: string; name: string; headId: string; headName: string }
export interface MockSquad { id: string; name: string; departmentId: string; leaderId: string; leaderName: string }
export interface MockEmployee { id: string; name: string; role: ApproverRole | 'Employee'; squadId?: string }
export interface MockManPowerPlan { id: string; referenceNumber: string; departmentId: string; positionTitle: string }
export interface MockPosition { id: string; referenceNumber: string; title: string; seniorityLevel: SeniorityLevel; departmentId: string }
export interface MockJobDescription { id: string; referenceNumber: string; title: string; status: 'Draft' | 'Approved'; squadId: string }

export const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: 'dept-eng', name: 'Platform Engineering', headId: 'emp-dh-001', headName: 'Omar Khaled' },
  { id: 'dept-data', name: 'Data & AI', headId: 'emp-dh-002', headName: 'Hala Mostafa' },
  { id: 'dept-fin', name: 'Finance', headId: 'emp-dh-003', headName: 'Tarek Selim' },
];

export const MOCK_SQUADS: MockSquad[] = [
  { id: 'squad-nova', name: 'Squad Nova', departmentId: 'dept-eng', leaderId: 'emp-sq-001', leaderName: 'Youssef Adel' },
  { id: 'squad-orion', name: 'Squad Orion', departmentId: 'dept-eng', leaderId: 'emp-sq-002', leaderName: 'Menna Gamal' },
  { id: 'squad-atlas', name: 'Squad Atlas', departmentId: 'dept-data', leaderId: 'emp-sq-003', leaderName: 'Karim Nabil' },
  { id: 'squad-ledger', name: 'Squad Ledger', departmentId: 'dept-fin', leaderId: 'emp-sq-004', leaderName: 'Dina Fahmy' },
];

export const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: 'emp-hr-001', name: 'Laila Hassan', role: ApproverRole.HRManager },
  { id: 'emp-hr-002', name: 'Amr Zaki', role: ApproverRole.HRManager },
  { id: 'emp-dh-001', name: 'Omar Khaled', role: ApproverRole.DepartmentHead },
  { id: 'emp-dh-002', name: 'Hala Mostafa', role: ApproverRole.DepartmentHead },
  { id: 'emp-dh-003', name: 'Tarek Selim', role: ApproverRole.DepartmentHead },
  { id: 'emp-sq-001', name: 'Youssef Adel', role: ApproverRole.Recruiter, squadId: 'squad-nova' },
  { id: 'emp-sq-002', name: 'Menna Gamal', role: ApproverRole.Recruiter, squadId: 'squad-orion' },
  { id: 'emp-rec-010', name: 'Nour Ibrahim', role: ApproverRole.Recruiter, squadId: 'squad-nova' },
  { id: 'emp-rec-011', name: 'Ziad Ramzy', role: ApproverRole.Recruiter, squadId: 'squad-orion' },
  { id: 'emp-dep-077', name: 'Mahmoud Sami', role: 'Employee' },
  { id: 'emp-dep-078', name: 'Rana Wael', role: 'Employee' },
];

export const MOCK_MANPOWER_PLANS: MockManPowerPlan[] = [
  { id: 'mpp-2026-01', referenceNumber: 'MPP-2026-014', departmentId: 'dept-eng', positionTitle: 'Senior Platform Engineer' },
  { id: 'mpp-2026-02', referenceNumber: 'MPP-2026-021', departmentId: 'dept-eng', positionTitle: 'Platform Engineer' },
  { id: 'mpp-2026-03', referenceNumber: 'MPP-2026-007', departmentId: 'dept-data', positionTitle: 'ML Engineer' },
  { id: 'mpp-2026-04', referenceNumber: 'MPP-2026-003', departmentId: 'dept-fin', positionTitle: 'Financial Analyst' },
];

export const MOCK_POSITIONS: MockPosition[] = [
  { id: 'pos-101', referenceNumber: 'POS-2026-101', title: 'Senior Platform Engineer', seniorityLevel: SeniorityLevel.Senior, departmentId: 'dept-eng' },
  { id: 'pos-102', referenceNumber: 'POS-2026-102', title: 'Platform Engineer', seniorityLevel: SeniorityLevel.Junior, departmentId: 'dept-eng' },
  { id: 'pos-201', referenceNumber: 'POS-2026-201', title: 'ML Engineer', seniorityLevel: SeniorityLevel.Senior, departmentId: 'dept-data' },
  { id: 'pos-301', referenceNumber: 'POS-2026-301', title: 'Financial Analyst', seniorityLevel: SeniorityLevel.Fresh, departmentId: 'dept-fin' },
];

export const MOCK_JOB_DESCRIPTIONS: MockJobDescription[] = [
  { id: 'jd-501', referenceNumber: 'JD-2026-501', title: 'Platform Engineer JD', status: 'Draft', squadId: 'squad-nova' },
  { id: 'jd-502', referenceNumber: 'JD-2026-502', title: 'Senior Platform Engineer JD v2', status: 'Draft', squadId: 'squad-nova' },
  { id: 'jd-503', referenceNumber: 'JD-2026-503', title: 'Mobile Engineer JD', status: 'Approved', squadId: 'squad-orion' },
  { id: 'jd-504', referenceNumber: 'JD-2026-504', title: 'ML Engineer JD', status: 'Draft', squadId: 'squad-atlas' },
];

let sequence = 20460;

export function nextReferenceNumber(): string {
  return `REQ-2026-${++sequence}`;
}

type RequisitionSeed = Omit<Partial<JobRequisitionDetail>, 'assignedSquad'> & {
  id: string;
  requisitionType: RequisitionType;
  status: JobRequisitionStatus;
  assignedSquadId?: string;
};

/** Fills every non-seeded field with coherent defaults so seeds stay short. */
export function makeRequisition(seed: RequisitionSeed): JobRequisitionDetail {
  const { assignedSquadId, ...rest } = seed;
  const department = MOCK_DEPARTMENTS.find((d) => d.id === rest.departmentId) ?? MOCK_DEPARTMENTS[0];
  const squad = assignedSquadId
    ? MOCK_SQUADS.find((s) => s.id === assignedSquadId)!
    : MOCK_SQUADS.find((s) => s.departmentId === department.id)!;
  const hiringManagerId = seed.hiringManagerId ?? (seed.status === JobRequisitionStatus.Draft ? MOCK_CALLER.id : 'emp-hm-001');
  const hiringManagerName = seed.hiringManagerName ?? (hiringManagerId === MOCK_CALLER.id ? MOCK_CALLER.name : 'Hazem Fouad');

  const derivedType = deriveTypeFields(seed.requisitionType);
  const manPowerPlan: ManPowerPlanRef | null =
    seed.manPowerPlan ?? (derivedType.hiringType !== HiringType.NewPosition && seed.requisitionType !== RequisitionType.Replacement
      ? { id: 'mpp-2026-01', referenceNumber: 'MPP-2026-014', isNewPositionTitle: false }
      : null);
  const positionRegistry: PositionRegistryRef | null =
    seed.positionRegistry ?? (seed.requisitionType === RequisitionType.Replacement || derivedType.isAdHocJob
      ? { id: 'pos-101', referenceNumber: 'POS-2026-101', title: 'Senior Platform Engineer', isActive: true }
      : null);
  const jobDescription: JobDescriptionRef | null =
    seed.jobDescription ?? (seed.status && [JobRequisitionStatus.PendingJDApproval, JobRequisitionStatus.PendingHRManagerApproval].includes(seed.status)
      ? { id: 'jd-501', referenceNumber: 'JD-2026-501', status: 'Draft' }
      : null);

  return {
    referenceNumber: nextReferenceNumber(),
    departmentId: department.id,
    departmentName: department.name,
    requestedHeadcount: 1,
    location: Location.Cairo,
    hiringManagerId,
    hiringManagerName,
    currentApproverRole: defaultApproverFor(seed.status),
    currentApproverId: null,
    currentApproverName: null,
    proposedJobTitle: 'Platform Engineer',
    submittedAtUTC: seed.status === JobRequisitionStatus.Draft ? null : '2026-07-02T09:12:00Z',
    updatedAtUTC: '2026-08-20T14:03:00Z',
    // Detail-only fields
    isAdHocJob: derivedType.isAdHocJob,
    hiringType: derivedType.hiringType,
    manPowerPlan,
    positionRegistry,
    jobDescription,
    assignedSquad: { id: squad.id, name: squad.name, leaderId: squad.leaderId },
    assignedRecruiterId: squad.leaderId,
    departingEmployeeName: seed.requisitionType === RequisitionType.Replacement ? 'Mahmoud Sami' : null,
    departingEmployeeId: seed.requisitionType === RequisitionType.Replacement ? 'emp-dep-077' : null,
    growthJustification: seed.requisitionType.startsWith('GROWTH') ? 'Sustained product growth requires additional delivery capacity.' : null,
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
    permittedActions: [],
    ...rest,
  } as JobRequisitionDetail;
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

function defaultApproverFor(status: JobRequisitionStatus | undefined): ApproverRole | null {
  switch (status) {
    case JobRequisitionStatus.PendingBudgetApproval:
      return ApproverRole.DepartmentHead;
    case JobRequisitionStatus.PendingAttachingJD:
      return ApproverRole.Recruiter;
    case JobRequisitionStatus.PendingJDApproval:
      return ApproverRole.HiringManager;
    case JobRequisitionStatus.PendingHRManagerApproval:
      return ApproverRole.HRManager;
    default:
      return null;
  }
}

/**
 * Seed board — one requisition per workflow state so every view tab, badge and
 * action button can be exercised without touching code.
 */
export function buildSeedRequisitions(): JobRequisitionDetail[] {
  return [
    makeRequisition({
      id: 'jr-9001', requisitionType: RequisitionType.GrowthAdHoc, status: JobRequisitionStatus.Draft,
      proposedJobTitle: 'Staff Platform Engineer', requestedHeadcount: 1,
      growthJustification: 'New platform initiative approved for H2.',
    }),
    makeRequisition({
      id: 'jr-9002', requisitionType: RequisitionType.PlannedExisting, status: JobRequisitionStatus.PendingBudgetApproval,
      proposedJobTitle: 'Platform Engineer', manPowerPlan: { id: 'mpp-2026-02', referenceNumber: 'MPP-2026-021', isNewPositionTitle: false },
      currentApproverId: 'emp-dh-001', currentApproverName: 'Omar Khaled',
    }),
    makeRequisition({
      id: 'jr-9003', requisitionType: RequisitionType.GrowthExisting, status: JobRequisitionStatus.PendingAttachingJD,
      proposedJobTitle: 'Senior Platform Engineer', requestedHeadcount: 2, assignedSquadId: 'squad-nova',
      currentApproverId: 'emp-sq-001', currentApproverName: 'Youssef Adel',
    }),
    makeRequisition({
      id: 'jr-9004', requisitionType: RequisitionType.GrowthAdHoc, status: JobRequisitionStatus.PendingJDApproval,
      proposedJobTitle: 'Site Reliability Engineer', assignedSquadId: 'squad-nova',
      currentApproverId: MOCK_CALLER.id, currentApproverName: MOCK_CALLER.name,
      jobDescription: { id: 'jd-501', referenceNumber: 'JD-2026-501', status: 'Draft' },
    }),
    makeRequisition({
      id: 'jr-9005', requisitionType: RequisitionType.PlannedExisting, status: JobRequisitionStatus.PendingHRManagerApproval,
      proposedJobTitle: 'Data Engineer', departmentId: 'dept-data', assignedSquadId: 'squad-atlas',
      hiringManagerId: 'emp-hm-002', hiringManagerName: 'Hazem Fouad',
      currentApproverId: 'emp-hr-001', currentApproverName: 'Laila Hassan',
      manPowerPlan: { id: 'mpp-2026-03', referenceNumber: 'MPP-2026-007', isNewPositionTitle: false },
    }),
    makeRequisition({
      id: 'jr-9006', requisitionType: RequisitionType.GrowthExisting, status: JobRequisitionStatus.Approved,
      proposedJobTitle: 'Mobile Engineer', assignedSquadId: 'squad-nova',
      approvedAtUTC: '2026-08-05T11:30:00Z',
    }),
    makeRequisition({
      id: 'jr-9007', requisitionType: RequisitionType.Replacement, status: JobRequisitionStatus.Rejected,
      proposedJobTitle: 'QA Engineer', requestedHeadcount: 1, assignedSquadId: 'squad-nova',
      submittedAtUTC: '2026-06-18T10:00:00Z', rejectedAtUTC: '2026-06-25T09:40:00Z',
      rejectionReason: 'Backfill request lacks the updated role scope — please attach the revised position description before resubmitting.',
      pendingModificationOwnerId: MOCK_CALLER.id, pendingModificationOwnerName: MOCK_CALLER.name,
      pendingModificationOwnerRole: ApproverRole.HiringManager,
    }),
    makeRequisition({
      id: 'jr-9008', requisitionType: RequisitionType.PlannedExisting, status: JobRequisitionStatus.Published,
      proposedJobTitle: 'Platform Engineer', assignedSquadId: 'squad-nova',
      approvedAtUTC: '2026-07-20T13:00:00Z', publishedAtUTC: '2026-07-22T08:15:00Z',
    }),
    makeRequisition({
      id: 'jr-9009', requisitionType: RequisitionType.GrowthAdHoc, status: JobRequisitionStatus.OnHold,
      proposedJobTitle: 'Developer Advocate', departmentId: 'dept-data', assignedSquadId: 'squad-atlas',
      hiringManagerId: 'emp-hm-002', hiringManagerName: 'Hazem Fouad',
      onHoldReason: 'Paused until the Q4 employer-branding budget is released.',
      publishedAtUTC: '2026-08-01T09:00:00Z',
    }),
    makeRequisition({
      id: 'jr-9010', requisitionType: RequisitionType.PlannedExisting, status: JobRequisitionStatus.Fulfilled,
      proposedJobTitle: 'Financial Analyst', departmentId: 'dept-fin', assignedSquadId: 'squad-ledger',
      hiringManagerId: 'emp-hm-003', hiringManagerName: 'Salma Rashad',
      submittedAtUTC: '2026-05-04T08:00:00Z', approvedAtUTC: '2026-05-19T10:00:00Z',
      publishedAtUTC: '2026-05-21T09:00:00Z', fulfilledAtUTC: '2026-06-30T15:00:00Z',
    }),
    makeRequisition({
      id: 'jr-9011', requisitionType: RequisitionType.GrowthExisting, status: JobRequisitionStatus.Closed,
      proposedJobTitle: 'Integration Engineer', assignedSquadId: 'squad-nova',
      approvedAtUTC: '2026-04-10T10:00:00Z', publishedAtUTC: '2026-04-12T09:00:00Z',
      closedAtUTC: '2026-05-28T17:20:00Z', cancelReason: 'Priority shifted to the platform consolidation program.',
    }),
    makeRequisition({
      id: 'jr-9012', requisitionType: RequisitionType.Replacement, status: JobRequisitionStatus.Published,
      proposedJobTitle: 'Payroll Specialist', departmentId: 'dept-fin', assignedSquadId: 'squad-ledger',
      hiringManagerId: 'emp-hm-003', hiringManagerName: 'Salma Rashad', location: Location.Riyadh,
      departingEmployeeName: 'Rana Wael', departingEmployeeId: 'emp-dep-078',
      positionRegistry: { id: 'pos-301', referenceNumber: 'POS-2026-301', title: 'Payroll Specialist', isActive: true },
      publishedAtUTC: '2026-08-10T07:45:00Z',
    }),
    makeRequisition({
      id: 'jr-9013', requisitionType: RequisitionType.PlannedExisting, status: JobRequisitionStatus.PendingBudgetApproval,
      proposedJobTitle: 'ML Engineer', departmentId: 'dept-data', assignedSquadId: 'squad-atlas',
      hiringManagerId: 'emp-hm-002', hiringManagerName: 'Hazem Fouad', requestedHeadcount: 3,
      currentApproverId: 'emp-dh-002', currentApproverName: 'Hala Mostafa',
      manPowerPlan: { id: 'mpp-2026-03', referenceNumber: 'MPP-2026-007', isNewPositionTitle: false },
    }),
  ];
}
