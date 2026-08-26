import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { JOB_REQUISITION_API } from '../../../core/services/job-requisition-api';
import type { JobRequisitionApi } from '../../../core/services/job-requisition-api';
import type {
  AssignRecruiterPayload,
  AttachJobDescriptionPayload,
  CloseRequest,
  JobRequisitionDetail,
  JobRequisitionDetailResult,
  PatchDraftRequest,
  PermittedAction as PermittedActionType,
  ReasonRequest,
} from '../../../core/models/job-requisition-model';
import { JobRequisitionStatus, Location, PermittedAction, SeniorityLevel } from '../../../core/models/job-requisition-model';
import type { LookupItemDto } from '../../../core/models/lookup-model';

interface ActionButton {
  action: PermittedActionType;
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
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './job-req-detail.component.html',
  styleUrl: './job-req-detail.component.scss',
})
export class JobReqDetailComponent implements OnInit {
  private api = inject(JOB_REQUISITION_API);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  // Bound from the :id route param via withComponentInputBinding().
  id = input.required<string>();

  loading = signal(true);
  loadError = signal<string | null>(null);
  requisition = signal<JobRequisitionDetail | null>(null);
  actionPending = signal<string | null>(null);

  readonly steps = ['Draft', 'Budget Approval', 'Attach JD', 'JD Review', 'HR Sign-off', 'Live', 'Fulfilled'];
  readonly Status = JobRequisitionStatus;

  readonly statusStepIndex = computed(() => {
    const req = this.requisition();
    if (!req) return -1;
    switch (req.status) {
      case JobRequisitionStatus.Draft:
        return 0;
      case JobRequisitionStatus.PendingBudgetApproval:
        return 1;
      case JobRequisitionStatus.PendingAttachingJD:
        return 2;
      case JobRequisitionStatus.PendingJDApproval:
        return 3;
      case JobRequisitionStatus.PendingHRManagerApproval:
        return 4;
      case JobRequisitionStatus.Approved:
      case JobRequisitionStatus.Published:
      case JobRequisitionStatus.OnHold:
      case JobRequisitionStatus.Closed:
        return 5;
      case JobRequisitionStatus.Fulfilled:
        return 6;
      default:
        return -1;
    }
  });

  readonly visibleActions = computed<ActionButton[]>(() => {
    const req = this.requisition();
    if (!req) return [];
    return req.permittedActions.map((action) => ACTION_BUTTONS[action]).filter(Boolean);
  });

  /* Reason dialog (reject / request-modification / hold / close). */
  reasonDialogVisible = false;
  reasonDialogTitle = '';
  reasonSubtitle = '';
  reasonDialogRequired = true;
  reasonDialogAcceptLabel = 'Confirm';
  reasonSeverity: 'danger' | 'warn' | 'primary' = 'danger';
  private reasonTargetAction: PermittedActionType | null = null;
  reasonText = '';

  /* Assign recruiter dialog */
  assignDialogVisible = false;
  recruiters = signal<LookupItemDto[]>([]);
  selectedRecruiterId: string | null = null;

  /* Attach JD dialog */
  attachDialogVisible = false;
  draftDescriptions = signal<LookupItemDto[]>([]);
  selectedJobDescriptionId: string | null = null;

  /* Edit draft dialog */
  editDialogVisible = false;
  editHeadcount: number | null = null;
  editLocation: Location = Location.Cairo;
  editJobTitle = '';
  editSeniority: SeniorityLevel | null = null;
  editJustification = '';
  readonly locations = Object.values(Location);
  readonly seniorityLevels = Object.values(SeniorityLevel);

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

  recruiterLabel(req: JobRequisitionDetail): string {
    return req.assignedRecruiterId ? 'Assigned' : 'Unassigned';
  }

  statusSeverity(status: JobRequisitionStatus): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    switch (status) {
      case JobRequisitionStatus.Approved:
      case JobRequisitionStatus.Published:
      case JobRequisitionStatus.Fulfilled:
        return 'success';
      case JobRequisitionStatus.Rejected:
        return 'danger';
      case JobRequisitionStatus.OnHold:
      case JobRequisitionStatus.Closed:
        return 'warning';
      case JobRequisitionStatus.Draft:
        return 'neutral';
      default:
        return 'info';
    }
  }

  // ── Action dispatch ──

  onAction(action: PermittedActionType): void {
    switch (action) {
      case PermittedAction.Submit:
        this.confirmSimple(action, 'Submit Requisition', `Submit for budget approval? The department head becomes the current approver.`);
        break;
      case PermittedAction.ApproveDepartmentHead:
        this.confirmSimple(action, 'Approve Budget', 'Approve the budget request and release it to the squad for JD attachment?');
        break;
      case PermittedAction.ApproveHiringManager:
        this.confirmSimple(action, 'Approve JD', 'Approve the attached job description and send to HR for final sign-off?');
        break;
      case PermittedAction.ApproveHRManager:
        this.confirmSimple(action, 'Final HR Approval', 'Give final HR approval? The requisition will move to the assigned squad.');
        break;
      case PermittedAction.Publish:
        this.confirmSimple(action, 'Publish', 'Publish this approved requisition so sourcing can start?');
        break;
      case PermittedAction.Resume:
        this.confirmSimple(action, 'Resume Posting', 'Resume the posting and return it to Published?');
        break;
      case PermittedAction.Fulfill:
        this.confirmSimple(action, 'Mark Fulfilled', 'Mark this posting as fulfilled? All openings have been hired.');
        break;
      case PermittedAction.AssignRecruiter:
        this.openAssignDialog();
        break;
      case PermittedAction.AttachJobDescription:
        this.openAttachDialog();
        break;
      case PermittedAction.EditDraft:
        this.openEditDialog();
        break;
      case PermittedAction.Reject:
        this.openReasonDialog(action, 'Reject Requisition', 'Rejection reason is recorded on the requisition.', true, 'Reject', 'danger');
        break;
      case PermittedAction.RequestModification:
        this.openReasonDialog(action, 'Request Modification', 'The actor who produced the current status will be asked to fix it.', true, 'Send Request', 'warn');
        break;
      case PermittedAction.Hold:
        this.openReasonDialog(action, 'Place On Hold', 'Explain why the posting is being paused.', true, 'Place On-Hold', 'warn');
        break;
      case PermittedAction.Close:
        this.openReasonDialog(action, 'Close Requisition', 'Closing is final and cannot be reopened from this screen.', false, 'Close Requisition', 'danger');
        break;
    }
  }

  private confirmSimple(action: PermittedActionType, header: string, message: string): void {
    this.confirmationService.confirm({
      header,
      message,
      acceptLabel: header,
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: action === PermittedAction.Submit ? 'contrast' : 'success' },
      accept: () => void this.executeAction(action),
    });
  }

  private openReasonDialog(
    action: PermittedActionType,
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
    const body = { reason: this.reasonText.trim() };
    const target = this.reasonTargetAction;
    this.reasonDialogVisible = false;

    switch (target) {
      case PermittedAction.Reject:
        void this.executeAction(target, body);
        break;
      case PermittedAction.RequestModification:
        void this.executeAction(target, body);
        break;
      case PermittedAction.Hold:
        void this.executeAction(target, body);
        break;
      case PermittedAction.Close:
        void this.executeAction(target, { reason: body.reason || null });
        break;
    }
  }

  openAssignDialog(): void {
    const req = this.requisition();
    if (!req) return;
    this.api.getEmployeeOptions('RECRUITER', req.departmentId).subscribe({
      next: (res) => this.recruiters.set(res.data ?? []),
      error: () => this.recruiters.set([]),
    });
    this.selectedRecruiterId = req.assignedRecruiterId;
    this.assignDialogVisible = true;
  }

  confirmAssignRecruiter(): void {
    if (!this.selectedRecruiterId) return;
    this.assignDialogVisible = false;
    void this.executeAction(PermittedAction.AssignRecruiter, { recruiterId: this.selectedRecruiterId });
  }

  openAttachDialog(): void {
    const req = this.requisition();
    if (!req) return;
    this.api.getDraftJobDescriptionOptions(req.assignedSquad.id).subscribe({
      next: (res) => this.draftDescriptions.set(res.data ?? []),
      error: () => this.draftDescriptions.set([]),
    });
    this.selectedJobDescriptionId = req.jobDescription?.id ?? null;
    this.attachDialogVisible = true;
  }

  confirmAttachJobDescription(): void {
    if (!this.selectedJobDescriptionId) return;
    this.attachDialogVisible = false;
    void this.executeAction(PermittedAction.AttachJobDescription, { jobDescriptionId: this.selectedJobDescriptionId });
  }

  openEditDialog(): void {
    const req = this.requisition();
    if (!req) return;
    this.editHeadcount = req.requestedHeadcount;
    this.editLocation = req.location;
    this.editJobTitle = req.proposedJobTitle;
    this.editSeniority = null;
    this.editJustification = req.growthJustification ?? '';
    this.editDialogVisible = true;
  }

  saveDraftEdits(): void {
    const req = this.requisition();
    if (!req || !this.editHeadcount) return;
    this.editDialogVisible = false;
    void this.executeAction(PermittedAction.EditDraft, {
      requestedHeadcount: this.editHeadcount,
      location: this.editLocation,
      growthJustification: this.editJustification.trim() || null,
      proposedJobTitle: this.editJobTitle.trim() || null,
      proposedJobSeniorityLevel: this.editSeniority,
    });
  }

  private executeAction(
    action: PermittedActionType,
    body?: unknown,
  ): void {
    const req = this.requisition();
    if (!req || this.actionPending()) return;
    this.actionPending.set(action);

    const call$ = resolveCall(this.api, action, req.id, body);
    call$.subscribe({
      next: (res) => {
        this.actionPending.set(null);
        if (!res.isCompletedSuccessfully || !res.data) {
          this.messageService.add({
            severity: 'error',
            summary: 'Action failed',
            detail: res.message ?? 'The server rejected this action.',
          });
          return;
        }
        this.requisition.set(res.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Done',
          detail: `${ACTION_BUTTONS[action].label} completed.`,
        });
      },
      error: () => {
        this.actionPending.set(null);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Network error while performing this action.' });
      },
    });
  }

  goBackToList(): void {
    this.router.navigate(['/console/job-requisitions']);
  }
}

const ACTION_BUTTONS: Record<PermittedActionType, ActionButton> = {
  [PermittedAction.Submit]: { action: PermittedAction.Submit, label: 'Submit', icon: 'pi pi-send', severity: 'contrast' },
  [PermittedAction.EditDraft]: { action: PermittedAction.EditDraft, label: 'Edit Draft', icon: 'pi pi-pencil', severity: undefined },
  [PermittedAction.ApproveDepartmentHead]: { action: PermittedAction.ApproveDepartmentHead, label: 'Approve Budget', icon: 'pi pi-check', severity: 'success' },
  [PermittedAction.AttachJobDescription]: { action: PermittedAction.AttachJobDescription, label: 'Attach JD', icon: 'pi pi-paperclip', severity: 'success' },
  [PermittedAction.ApproveHiringManager]: { action: PermittedAction.ApproveHiringManager, label: 'Approve JD', icon: 'pi pi-check', severity: 'success' },
  [PermittedAction.ApproveHRManager]: { action: PermittedAction.ApproveHRManager, label: 'Final Approval', icon: 'pi pi-check-circle', severity: 'success' },
  [PermittedAction.Publish]: { action: PermittedAction.Publish, label: 'Publish', icon: 'pi pi-globe', severity: 'success' },
  [PermittedAction.Resume]: { action: PermittedAction.Resume, label: 'Resume', icon: 'pi pi-play', severity: 'success' },
  [PermittedAction.Fulfill]: { action: PermittedAction.Fulfill, label: 'Mark Fulfilled', icon: 'pi pi-verified', severity: 'success' },
  [PermittedAction.AssignRecruiter]: { action: PermittedAction.AssignRecruiter, label: 'Assign Recruiter', icon: 'pi pi-user-plus', severity: undefined },
  [PermittedAction.RequestModification]: { action: PermittedAction.RequestModification, label: 'Request Modification', icon: 'pi pi-refresh', severity: 'warn' },
  [PermittedAction.Hold]: { action: PermittedAction.Hold, label: 'Hold', icon: 'pi pi-pause', severity: 'warn' },
  [PermittedAction.Reject]: { action: PermittedAction.Reject, label: 'Reject', icon: 'pi pi-times', severity: 'danger' },
  [PermittedAction.Close]: { action: PermittedAction.Close, label: 'Close', icon: 'pi pi-ban', severity: 'danger' },
};

function resolveCall(
  api: JobRequisitionApi,
  action: PermittedActionType,
  id: string,
  body: unknown,
): Observable<JobRequisitionDetailResult> {
  switch (action) {
    case PermittedAction.Submit:
      return api.submit(id);
    case PermittedAction.EditDraft:
      return api.updateDraft(id, body as PatchDraftRequest);
    case PermittedAction.ApproveDepartmentHead:
      return api.approveAsDepartmentHead(id);
    case PermittedAction.AttachJobDescription:
      return api.attachJobDescription(id, body as AttachJobDescriptionPayload);
    case PermittedAction.ApproveHiringManager:
      return api.approveAsHiringManager(id);
    case PermittedAction.ApproveHRManager:
      return api.approveAsHRManager(id);
    case PermittedAction.Publish:
      return api.publish(id);
    case PermittedAction.Resume:
      return api.resume(id);
    case PermittedAction.Fulfill:
      return api.fulfill(id);
    case PermittedAction.AssignRecruiter:
      return api.assignRecruiter(id, body as AssignRecruiterPayload);
    case PermittedAction.RequestModification:
      return api.requestModification(id, body as ReasonRequest);
    case PermittedAction.Hold:
      return api.hold(id, body as ReasonRequest);
    case PermittedAction.Reject:
      return api.reject(id, body as ReasonRequest);
    case PermittedAction.Close:
      return api.close(id, body as CloseRequest);
  }
}

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
