import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ApprovalService, PendingApproval, ApprovalDecision } from '../../../core/services/approval.service';

type ReasonDialogMode = ApprovalDecision.Rejected | ApprovalDecision.ChangesRequested;

function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value.trim().length > 0 ? null : { blank: true };
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    RadioButtonModule,
    DialogModule,
    TextareaModule,
    MessageModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss',
})
export class ApprovalsComponent {
  private approvalService = inject(ApprovalService);
  private confirmationService = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  ApprovalDecision = ApprovalDecision;

  loading = signal(true);
  loadError = signal<string | null>(null);
  approvals = signal<PendingApproval[]>([]);
  actionPending = signal(false);

  selectedId = signal<string | null>(null);
  selected = computed(() => this.approvals().find((a) => a.id === this.selectedId()) ?? null);
  hasSelection = computed(() => !!this.selected());

  // Reject / Request Changes both require a note before they can be sent.
  reasonDialogOpen = signal(false);
  reasonDialogMode = signal<ReasonDialogMode | null>(null);
  readonly reasonForm = this.fb.nonNullable.group({
    note: ['', [Validators.required, nonBlankValidator]],
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.approvalService.getPendingApprovals().subscribe({
      next: (list) => {
        this.approvals.set(list);
        if (!list.some((a) => a.id === this.selectedId())) {
          this.selectedId.set(null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load pending approvals right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  confirmApprove(): void {
    const req = this.selected();
    if (!req) return;
    this.confirmationService.confirm({
      header: 'Approve Requisition',
      message: `Approve ${req.reqNumber} — ${req.title}? This moves it into sourcing.`,
      acceptLabel: 'Approve',
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: 'success' },
      accept: () => this.decide(ApprovalDecision.Approved),
    });
  }

  openReasonDialog(mode: ReasonDialogMode): void {
    if (!this.selected()) return;
    this.reasonForm.reset();
    this.reasonDialogMode.set(mode);
    this.reasonDialogOpen.set(true);
  }

  closeReasonDialog(): void {
    this.reasonDialogOpen.set(false);
  }

  confirmReasonDialog(): void {
    if (this.reasonForm.invalid) {
      this.reasonForm.controls.note.markAsTouched();
      return;
    }
    const mode = this.reasonDialogMode();
    if (!mode) return;
    this.reasonDialogOpen.set(false);
    this.decide(mode, this.reasonForm.controls.note.value.trim());
  }

  private decide(decision: ApprovalDecision, comment?: string): void {
    const req = this.selected();
    if (!req || this.actionPending()) return;
    this.actionPending.set(true);
    this.approvalService.decide(req.id, decision, comment).subscribe(() => {
      this.actionPending.set(false);
      this.selectedId.set(null);
      this.load();
    });
  }
}
