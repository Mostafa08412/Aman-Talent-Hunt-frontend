import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TabViewModule } from 'primeng/tabview';
import { EditorModule } from 'primeng/editor';
import { ConfirmationService, MessageService } from 'primeng/api';

import { JOB_REQUISITION_API } from '../../../core/services/job-requisition-api';
import type { JobRequisitionApi } from '../../../core/services/job-requisition-api';
import { AuthService } from '../../../core/services/auth.service';
import { AdminJobDescriptionsService } from '../../../core/services/admin-job-descriptions.service';
import type {
  JobRequisitionDetailDto,
  UpdateRequisitionRequest,
} from '../../../core/models/job-requisition-model';
import { JobRequisitionStatus, Location, RequisitionAvailableAction, SeniorityLevel } from '../../../core/models/job-requisition-model';
import type { CreateJobDescriptionRequest, JobDescriptionDetailDto } from '../../../core/models/admin-job-description-model';
import { EmploymentType } from '../../../core/models/enums';
import { Role } from '../../../core/models/role.model';
import type { LookupItemDto } from '../../../core/models/lookup-model';
import type { Result } from '../../../core/models/common';

function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value.trim().length > 0 ? null : { blank: true };
}

interface ActionButton {
  action: RequisitionAvailableAction;
  label: string;
  icon: string;
  severity: 'success' | 'warn' | 'danger' | 'contrast' | undefined;
}

@Component({
  selector: 'app-job-req-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    DialogModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    TabViewModule,
    EditorModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './job-req-detail.component.html',
  styleUrl: './job-req-detail.component.scss',
})
export class JobReqDetailComponent implements OnInit {
  private api = inject(JOB_REQUISITION_API);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private jdService = inject(AdminJobDescriptionsService);
  private readonly fb = inject(FormBuilder);

  // Bound from the :id route param via withComponentInputBinding().
  id = input.required<string>();

  loading = signal(true);
  loadError = signal<string | null>(null);
  requisition = signal<JobRequisitionDetailDto | null>(null);
  actionPending = signal<string | null>(null);

  readonly steps = ['Draft', 'Budget Approval', 'JD', 'HR Sign-off', 'Live', 'Fulfilled'];
  readonly Status = JobRequisitionStatus;
  readonly Action = RequisitionAvailableAction;

  /** Maps a current-approver role to its Assignment role card. */
  readonly approverRoles = {
    DepartmentHead: 'DEPARTMENT_HEAD',
    HiringManager: 'HIRING_MANAGER',
    HRManager: 'HR_MANAGER',
    SquadLeader: 'SQUAD_LEADER',
    Recruiter: 'RECRUITER',
  };

  isCurrentApprover(role: string): boolean {
    return this.requisition()?.currentApproverRole === role;
  }

  currentApproverRef(): string | null {
    return this.requisition()?.currentApproverReferenceNumber ?? null;
  }

  readonly statusStepIndex = computed(() => {
    const req = this.requisition();
    if (!req) return -1;
    switch (req.status) {
      case JobRequisitionStatus.Draft:
        return 0;
      case JobRequisitionStatus.Rejected:
        return -1;
      case JobRequisitionStatus.PendingBudgetApproval:
        return 1;
      case JobRequisitionStatus.PendingAttachingJD:
      case JobRequisitionStatus.PendingJDApproval:
      case JobRequisitionStatus.RequestedModifications:
        return 2;
      case JobRequisitionStatus.PendingHRManagerApproval:
        return 3;
      case JobRequisitionStatus.Approved:
      case JobRequisitionStatus.Published:
      case JobRequisitionStatus.OnHold:
        return 4;
      case JobRequisitionStatus.Closed:
        return 4;
      case JobRequisitionStatus.Fulfilled:
        return 5;
      default:
        return -1;
    }
  });

  readonly heroTitle = computed(() => {
    const req = this.requisition();
    if (!req) return 'Untitled position';
    const isExisting = Boolean(req.positionRegistryId);
    if (isExisting) {
      return req.positionTitle ?? req.proposedJobTitle ?? 'Untitled position';
    }
    return req.proposedJobTitle ?? req.positionTitle ?? 'Untitled position';
  });

  readonly isAdHoc = computed<boolean>(
    () => !Boolean(this.requisition()?.positionRegistryId)
  );

  readonly heroSeniorityLabel = computed<string | null>(() => {
    const req = this.requisition();
    return req?.proposedJobSeniorityLevel
      ? humanize(req.proposedJobSeniorityLevel)
      : null;
  });

  readonly visibleActions = computed<ActionButton[]>(() => {
    const req = this.requisition();
    if (!req) return [];
    return req.availableActions
      .map((action) => ACTION_BUTTONS[action])
      .filter((b): b is ActionButton => Boolean(b));
  });

  /* Reason dialog (reject / request-modification / hold / close). */
  reasonDialogVisible = false;
  reasonDialogTitle = '';
  reasonSubtitle = '';
  reasonDialogRequired = true;
  reasonDialogAcceptLabel = 'Confirm';
  reasonSeverity: 'danger' | 'warn' | 'contrast' | 'success' = 'danger';
  private reasonTargetAction: RequisitionAvailableAction | null = null;
  reasonText = '';

  /* Assign recruiter dialog */
  assignDialogVisible = false;
  recruiters = signal<LookupItemDto[]>([]);
  selectedRecruiterId: string | null = null;

  /** Recruiter options, tagging "(me)" on the option that matches the signed-in user. */
  readonly recruiterOptions = computed<LookupItemDto[]>(() => {
    const myId = this.auth.currentUser()?.id?.toLowerCase();
    return this.recruiters().map((r) =>
      r.id?.toLowerCase() === myId ? { ...r, viewText: r.viewText ? `${r.viewText} (me)` : r.viewText } : r,
    );
  });

  /* Edit (modify) dialog */
  modifyDialogVisible = false;
  editHeadcount: number | null = null;
  editLocation: Location | '' = '';
  editJobTitle = '';
  editSeniority: SeniorityLevel | null = null;
  editJustification = '';
  readonly locations = Object.values(Location);
  readonly seniorityLevels = Object.values(SeniorityLevel);

  /* Attach JD dialog */
  attachJdDialogVisible = false;
  jdMode: 'pick' | 'create' | 'edit' = 'pick';
  jdOptions = signal<LookupItemDto[]>([]);
  jdLoading = signal(false);
  selectedJdId: string | null = null;
  jdSubmitting = signal(false);
  readonly jdForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, nonBlankValidator]],
    summary: [''],
    responsibilities: [''],
    requirements: [''],
    employmentType: [EmploymentType.FullTime, Validators.required],
  });
  readonly employmentTypeOptions = Object.values(EmploymentType);

  /** Attached JD (edit tab only makes sense while a JD is linked). */
  readonly hasAttachedJd = computed(() => Boolean(this.requisition()?.jobDescriptionId));
  /** Tab order — hides the "Edit" tab when no JD is attached yet. */
  readonly jdTabs = computed<Array<'pick' | 'edit' | 'create'>>(() =>
    this.hasAttachedJd() ? ['pick', 'edit', 'create'] : ['pick', 'create'],
  );
  jdTabIndex = 0;
  private editJdId: string | null = null;

  /* JD preview (Hiring Manager review) */
  jdPreviewDialogVisible = false;
  jdPreview = signal<JobDescriptionDetailDto | null>(null);
  jdPreviewLoading = signal(false);
  readonly isHiringManager = computed(() => this.auth.currentUser()?.role === Role.HiringManager);

  ngOnInit(): void {
    this.loadRequisition();
  }

  loadRequisition(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getById(this.id()).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully || !res.data) {
          this.loadError.set(res.message ?? 'Requisition not found.');
        } else {
          this.requisition.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load this requisition right now.');
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    return humanize(status);
  }

  humanizeRole(role: string | null): string {
    return role ? humanize(role) : '—';
  }

  showTimestamp(value: string | null): boolean {
    return Boolean(value);
  }

  statusSeverity(status: JobRequisitionStatus): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case JobRequisitionStatus.Approved:
      case JobRequisitionStatus.Published:
      case JobRequisitionStatus.Fulfilled:
        return 'success';
      case JobRequisitionStatus.Rejected:
      case JobRequisitionStatus.Closed:
        return 'danger';
      case JobRequisitionStatus.OnHold:
        return 'warning';
      case JobRequisitionStatus.Draft:
        return 'secondary';
      default:
        return 'info';
    }
  }

  statusPillClass(status: JobRequisitionStatus): string {
    switch (this.statusSeverity(status)) {
      case 'success':
        return 'pill-success';
      case 'warning':
        return 'pill-warning';
      case 'danger':
        return 'pill-error';
      case 'secondary':
        return 'pill-draft';
      default:
        return 'pill-info';
    }
  }

  statusDotClass(status: JobRequisitionStatus): string {
    switch (this.statusSeverity(status)) {
      case 'success':
        return 'dot-success';
      case 'warning':
        return 'dot-warning';
      case 'danger':
        return 'dot-error';
      case 'info':
        return 'dot-info';
      default:
        return '';
    }
  }

  actionStyleClass(btn: ActionButton): string {
    switch (btn.severity) {
      case 'success':
        return 'btn-approve';
      case 'danger':
        return 'btn-reject';
      case 'warn':
        return 'btn-neutral';
      default:
        return 'btn-teal';
    }
  }

  // ── Action dispatch ──

  onAction(action: RequisitionAvailableAction): void {
    switch (action) {
      case RequisitionAvailableAction.Submit:
        this.confirm(action, 'Submit Requisition', 'Submit for budget approval? The department head becomes the current approver.');
        break;
      case RequisitionAvailableAction.Resume:
        this.confirm(action, 'Resume Requisition', 'Resume and continue its workflow?');
        break;
      case RequisitionAvailableAction.Fulfill:
        this.confirm(action, 'Mark Fulfilled', 'Mark this requisition as fulfilled? All openings have been hired.');
        break;
      case RequisitionAvailableAction.Modify:
        this.openModifyDialog();
        break;
      case RequisitionAvailableAction.AttachJD:
        this.openAttachJdDialog();
        break;
      case RequisitionAvailableAction.AssignRecruiter:
        this.openAssignDialog();
        break;
      case RequisitionAvailableAction.Approve:
        this.confirm(action, this.approveHeader(), this.approveMessage());
        break;
      case RequisitionAvailableAction.Reject:
        this.openReasonDialog(action, 'Reject Requisition', 'Rejection reason is recorded on the requisition.', true, 'Reject', 'danger');
        break;
      case RequisitionAvailableAction.RequestModifications:
        this.openReasonDialog(action, 'Request Modification', 'The employee who produced the current status will be asked to fix it.', true, 'Send Request', 'warn');
        break;
      case RequisitionAvailableAction.OnHold:
        this.openReasonDialog(action, 'Place On Hold', 'Explain why the requisition is being paused.', true, 'Place On-Hold', 'warn');
        break;
      case RequisitionAvailableAction.Cancel:
        this.openReasonDialog(action, 'Close Requisition', 'Closing is final and cannot be undone from this screen.', false, 'Close Requisition', 'danger');
        break;
    }
  }

  private approveHeader(): string {
    switch (this.requisition()?.status) {
      case JobRequisitionStatus.PendingBudgetApproval:
        return 'Approve Budget';
      case JobRequisitionStatus.PendingJDApproval:
        return 'Approve JD';
      default:
        return 'Final Approval';
    }
  }

  private approveMessage(): string {
    switch (this.requisition()?.status) {
      case JobRequisitionStatus.PendingBudgetApproval:
        return 'Approve the budget request?';
      case JobRequisitionStatus.PendingJDApproval:
        return 'Approve the attached job description?';
      default:
        return 'Give final HR approval?';
    }
  }

  private confirm(action: RequisitionAvailableAction, header: string, message: string): void {
    this.confirmationService.confirm({
      header,
      message,
      acceptLabel: header,
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: action === RequisitionAvailableAction.Submit ? 'contrast' : 'success' },
      accept: () => void this.executeAction(action),
    });
  }

  private openReasonDialog(
    action: RequisitionAvailableAction,
    title: string,
    subtitle: string,
    required: boolean,
    acceptLabel: string,
    severity: 'danger' | 'warn',
  ): void {
    this.reasonTargetAction = action;
    this.reasonDialogTitle = title;
    this.reasonDialogRequired = required;
    this.reasonDialogAcceptLabel = acceptLabel;
    this.reasonSeverity = severity;
    this.reasonSubtitle = subtitle;
    this.reasonText = '';
    this.reasonDialogVisible = true;
  }

  submitReason(): void {
    if (!this.reasonTargetAction) return;
    if (this.reasonDialogRequired && !this.reasonText.trim()) return;
    const target = this.reasonTargetAction;
    const reason = this.reasonText.trim();
    this.reasonDialogVisible = false;

    switch (target) {
      case RequisitionAvailableAction.RequestModifications:
        void this.executeAction(target, { comment: reason });
        break;
      case RequisitionAvailableAction.Reject:
      case RequisitionAvailableAction.OnHold:
        void this.executeAction(target, { reason });
        break;
      case RequisitionAvailableAction.Cancel:
        void this.executeAction(target, { reason: reason || null });
        break;
    }
  }

  openAssignDialog(): void {
    const req = this.requisition();
    if (!req) return;
    this.api.getEmployeeOptions({ squadLeaderId: this.auth.currentUser()?.id, PageSize: 10 }).subscribe({
      next: (res) => this.recruiters.set(res.data?.items ?? []),
      error: () => this.recruiters.set([]),
    });
    this.selectedRecruiterId = null;
    this.assignDialogVisible = true;
  }

  confirmAssignRecruiter(): void {
    if (!this.selectedRecruiterId) return;
    this.assignDialogVisible = false;
    void this.executeAction(RequisitionAvailableAction.AssignRecruiter, { recruiterId: this.selectedRecruiterId });
  }

  openModifyDialog(): void {
    const req = this.requisition();
    if (!req) return;
    this.editHeadcount = req.requestedHeadcount;
    this.editLocation = req.location ?? '';
    this.editJobTitle = req.proposedJobTitle ?? '';
    this.editSeniority = req.proposedJobSeniorityLevel ?? null;
    this.editJustification = req.growthJustification ?? '';
    this.modifyDialogVisible = true;
  }

  saveModify(): void {
    const req = this.requisition();
    if (!req || !this.editHeadcount) return;
    this.modifyDialogVisible = false;
    const body: UpdateRequisitionRequest = {
      requestedHeadcount: this.editHeadcount,
      location: this.editLocation as Location,
      growthJustification: this.editJustification.trim() || null,
      proposedJobTitle: this.editJobTitle.trim() || null,
      proposedJobSeniorityLevel: this.editSeniority as SeniorityLevel | null,
    };
    void this.executeAction(RequisitionAvailableAction.Modify, body);
  }

  /* ── Attach JD ── */

  openAttachJdDialog(): void {
    const req = this.requisition();
    if (!req || this.jdSubmitting()) return;
    this.selectedJdId = null;
    this.jdForm.reset({
      title: '',
      summary: '',
      responsibilities: '',
      requirements: '',
      employmentType: EmploymentType.FullTime,
    });
    // When a JD is already attached (modification-request loop), land on the Edit tab.
    this.jdTabIndex = this.hasAttachedJd() ? 1 : 0;
    this.jdMode = this.jdTabs()[this.jdTabIndex] ?? 'pick';
    this.editJdId = req.jobDescriptionId ?? null;
    this.attachJdDialogVisible = true;
    this.loadJdOptions();
    if (this.jdMode === 'edit') this.loadAttachedJd();
  }

  onJdTabChange(index: number): void {
    this.jdTabIndex = index;
    this.jdMode = this.jdTabs()[index] ?? 'pick';
    if (this.jdMode === 'pick' && this.jdOptions().length === 0) this.loadJdOptions();
    if (this.jdMode === 'edit') this.loadAttachedJd();
  }

  loadJdOptions(): void {
    if (this.jdLoading()) return;
    this.jdLoading.set(true);
    this.api.getDraftJobDescriptionOptions({ status: 'Draft', PageSize: 100 }).subscribe({
      next: (res) => this.jdOptions.set(res.data?.items ?? []),
      error: () => this.jdOptions.set([]),
      complete: () => this.jdLoading.set(false),
    });
  }

  loadAttachedJd(): void {
    const jdId = this.editJdId;
    if (!jdId) return;
    this.jdService.getById(jdId).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully || !res.data) return;
        const dto = res.data;
        this.jdForm.patchValue({
          title: dto.title ?? '',
          summary: dto.summary ?? '',
          responsibilities: dto.responsibilities ?? '',
          requirements: dto.requirements ?? '',
          employmentType: dto.employmentType ?? EmploymentType.FullTime,
        });
      },
    });
  }

  /* ── JD Preview (Hiring Manager) ── */

  openJdPreview(): void {
    const jdId = this.requisition()?.jobDescriptionId;
    if (!jdId) return;
    this.jdPreviewDialogVisible = true;
    this.jdPreviewLoading.set(true);
    this.jdService.getById(jdId).subscribe({
      next: (res) => this.jdPreview.set(res.isCompletedSuccessfully ? (res.data ?? null) : null),
      error: () => this.jdPreview.set(null),
      complete: () => this.jdPreviewLoading.set(false),
    });
  }

  attachSelectedJd(): void {
    if (!this.selectedJdId || this.jdSubmitting()) return;
    this.attachJdDialogVisible = false;
    void this.executeAction(RequisitionAvailableAction.AttachJD, { jobDescriptionId: this.selectedJdId });
  }

  saveAndReattachJd(): void {
    const jdId = this.editJdId;
    if (this.jdForm.invalid) {
      this.jdForm.markAllAsTouched();
      return;
    }
    if (!jdId || this.jdSubmitting()) return;
    const value = this.jdForm.getRawValue();

    const request: CreateJobDescriptionRequest = {
      title: value.title.trim(),
      summary: value.summary.trim() || null,
      responsibilities: value.responsibilities || null,
      requirements: value.requirements || null,
      employmentType: value.employmentType,
    };

    this.jdSubmitting.set(true);
    this.jdService.update(jdId, request).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          return;
        }
        this.attachJdDialogVisible = false;
        void this.executeAction(RequisitionAvailableAction.AttachJD, { jobDescriptionId: jdId });
      },
      complete: () => this.jdSubmitting.set(false),
    });
  }

  createAndAttachJd(): void {
    const req = this.requisition();
    if (this.jdForm.invalid) {
      this.jdForm.markAllAsTouched();
      return;
    }
    if (!req || this.jdSubmitting()) return;
    const value = this.jdForm.getRawValue();

    const request: CreateJobDescriptionRequest = {
      title: value.title.trim(),
      summary: value.summary.trim() || null,
      responsibilities: value.responsibilities || null,
      requirements: value.requirements || null,
      employmentType: value.employmentType,
    };

    this.jdSubmitting.set(true);
    this.jdService.create(request).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully || !res.data) {
          this.jdSubmitting.set(false);
          return;
        }
        this.jdSubmitting.set(false);
        this.attachJdDialogVisible = false;
        void this.executeAction(RequisitionAvailableAction.AttachJD, { jobDescriptionId: res.data });
      },
      error: () => {
        this.jdSubmitting.set(false);
      },
    });
  }

  private executeAction(action: RequisitionAvailableAction, body?: unknown): void {
    const req = this.requisition();
    if (!req || this.actionPending()) return;
    this.actionPending.set(action);

    const call$: Observable<Result> = resolveCall(this.api, action, req.id, req.status, body);
    call$.subscribe({
      next: (res) => {
        this.actionPending.set(null);
        if (!res.isCompletedSuccessfully) {
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Done',
          detail: `${ACTION_BUTTONS[action]!.label} completed.`,
        });
        this.loadRequisition();
      },
      error: () => {
        this.actionPending.set(null);
      },
    });
  }

  goBackToList(): void {
    this.router.navigate(['/console/job-requisitions']);
  }
}

const ACTION_BUTTONS: Partial<Record<RequisitionAvailableAction, ActionButton>> = {
  [RequisitionAvailableAction.Submit]: { action: RequisitionAvailableAction.Submit, label: 'Submit', icon: 'pi pi-send', severity: 'contrast' },
  [RequisitionAvailableAction.Modify]: { action: RequisitionAvailableAction.Modify, label: 'Modify', icon: 'pi pi-pencil', severity: undefined },
  [RequisitionAvailableAction.Approve]: { action: RequisitionAvailableAction.Approve, label: 'Approve', icon: 'pi pi-check', severity: 'success' },
  [RequisitionAvailableAction.Resume]: { action: RequisitionAvailableAction.Resume, label: 'Resume', icon: 'pi pi-play', severity: 'success' },
  [RequisitionAvailableAction.Fulfill]: { action: RequisitionAvailableAction.Fulfill, label: 'Mark Fulfilled', icon: 'pi pi-verified', severity: 'success' },
  [RequisitionAvailableAction.AssignRecruiter]: { action: RequisitionAvailableAction.AssignRecruiter, label: 'Assign Recruiter', icon: 'pi pi-user-plus', severity: undefined },
  [RequisitionAvailableAction.AttachJD]: { action: RequisitionAvailableAction.AttachJD, label: 'Attach JD', icon: 'pi pi-file-edit', severity: undefined },
  [RequisitionAvailableAction.RequestModifications]: { action: RequisitionAvailableAction.RequestModifications, label: 'Request Modification', icon: 'pi pi-refresh', severity: 'warn' },
  [RequisitionAvailableAction.OnHold]: { action: RequisitionAvailableAction.OnHold, label: 'Hold', icon: 'pi pi-pause', severity: 'warn' },
  [RequisitionAvailableAction.Reject]: { action: RequisitionAvailableAction.Reject, label: 'Reject', icon: 'pi pi-times', severity: 'danger' },
  [RequisitionAvailableAction.Cancel]: { action: RequisitionAvailableAction.Cancel, label: 'Close', icon: 'pi pi-ban', severity: 'danger' },
};

function resolveCall(
  api: JobRequisitionApi,
  action: RequisitionAvailableAction,
  id: string,
  status: JobRequisitionStatus,
  body: unknown,
): Observable<Result> {
  switch (action) {
    case RequisitionAvailableAction.Submit:
      return api.submit(id);
    case RequisitionAvailableAction.Modify:
      return api.modify(id, body as UpdateRequisitionRequest);
    case RequisitionAvailableAction.Approve:
      return resolveApprove(api, id, status);
    case RequisitionAvailableAction.AssignRecruiter:
      return api.assignRecruiter(id, body as { recruiterId: string });
    case RequisitionAvailableAction.AttachJD:
      return api.attachJD(id, body as { jobDescriptionId: string });
    case RequisitionAvailableAction.RequestModifications:
      return api.requestModification(id, body as { comment: string });
    case RequisitionAvailableAction.Reject:
      return api.reject(id, body as { reason: string });
    case RequisitionAvailableAction.OnHold:
      return api.hold(id, body as { reason: string });
    case RequisitionAvailableAction.Resume:
      return api.resume(id);
    case RequisitionAvailableAction.Cancel:
      return api.close(id, body as { reason: string | null });
    case RequisitionAvailableAction.Fulfill:
      return api.fulfill(id);
    default:
      throw new Error(`Unhandled available action: ${action}`);
  }
}

function resolveApprove(api: JobRequisitionApi, id: string, status: JobRequisitionStatus): Observable<Result> {
  switch (status) {
    case JobRequisitionStatus.PendingBudgetApproval:
      return api.approveAsDepartmentHead(id);
    case JobRequisitionStatus.PendingJDApproval:
    case JobRequisitionStatus.PendingAttachingJD:
      return api.approveAsHiringManager(id);
    default:
      return api.approveAsHRManager(id);
  }
}

const ENUM_ABBREVIATIONS: Record<string, string> = { JD: 'Job Description' };

/**
 * Humanizes backend enum wire values for display:
 *  - PascalCase (e.g. "PendingAttachingJD", "OnHold") → "Pending Attaching JD" …
 *  - SCREAMING_SNAKE (e.g. "HIRING_MANAGER") → "Hiring Manager"
 *  - expands common acronyms (JD → Job Description, etc.)
 * Leaves ordinary words (Backfill, Draft, …) as-is.
 */
function humanize(value: string): string {
  if (!value) return value;
  const words = String(value)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 0);

  return words
    .map((word) => {
      const upper = word.toUpperCase();
      const abbreviation = ENUM_ABBREVIATIONS[upper];
      if (abbreviation) return abbreviation;
      if (word === upper && word.length <= 3) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
