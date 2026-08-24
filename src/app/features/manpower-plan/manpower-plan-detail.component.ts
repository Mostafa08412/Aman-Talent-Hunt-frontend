import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { Result } from '@core/models/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AdminManpowerPlansService } from '../../core/services/admin-manpower-plans.service';
import { AdminPositionsService } from '../../core/services/admin-positions.service';
import {
  ManPowerPlanResponse,
  PromotePositionRequest,
  RejectManPowerPlanRequest,
} from '../../core/models/admin-manpower-plan-model';
import { PositionRegistryListItemDto } from '../../core/models/admin-position-model';
import { PlanStatus } from '../../core/models/enums';
import { BadgeModule } from 'primeng/badge';

interface StatusStyle {
  pillClass: string;
  dotClass: string;
}

interface TimelineStep {
  label: string;
  state: 'completed' | 'current' | 'upcoming' | 'error';
}

@Component({
  selector: 'app-manpower-plan-detail',
  standalone: true,
  imports: [
    CommonModule,
    BadgeModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    ToastModule,
    ProgressSpinnerModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './manpower-plan-detail.component.html',
  styleUrl: './manpower-plan-detail.component.scss',
})
export class ManpowerPlanDetailComponent implements OnInit {
  private readonly plansService = inject(AdminManpowerPlansService);
  private readonly positionsService = inject(AdminPositionsService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  /** Route param bound via withComponentInputBinding (must match the :id param name). */
  readonly id = input.required<string>();
  readonly plan = signal<ManPowerPlanResponse | null>(null);
  readonly isLoading = signal(true);
  readonly pendingAction = signal<string | null>(null);

  /* Reject dialog */
  readonly rejectDialogVisible = signal(false);
  rejectReason = '';

  /* Promotion dialog */
  readonly promoteDialogVisible = signal(false);
  positionSearch = '';
  readonly searchResults = signal<PositionRegistryListItemDto[]>([]);
  readonly isSearching = signal(false);
  readonly selectedPosition = signal<PositionRegistryListItemDto | null>(null);

  statusStyles: Record<PlanStatus, StatusStyle> = {
    [PlanStatus.Draft]: { pillClass: 'pill-draft', dotClass: '' },
    [PlanStatus.PendingApproval]: { pillClass: 'pill-warning', dotClass: 'dot-warning' },
    [PlanStatus.Approved]: { pillClass: 'pill-success', dotClass: 'dot-success' },
    [PlanStatus.Rejected]: { pillClass: 'pill-error', dotClass: 'dot-error' },
    [PlanStatus.Active]: { pillClass: 'pill-teal', dotClass: 'dot-teal' },
    [PlanStatus.Fulfilled]: { pillClass: 'pill-info', dotClass: 'dot-info' },
    [PlanStatus.Closed]: { pillClass: 'pill-draft', dotClass: '' },
  };

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      this.router.navigate(['/console/manpower-plan']);
      return;
    }
    this.loadPlan(id);
  }

  loadPlan(id: string): void {
    this.isLoading.set(true);
    this.plansService.getById(id).subscribe({
      next: (res) => {
        this.plan.set(res.data ?? null);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load the manpower plan.',
        });
      },
    });
  }

  /* ── Derived view state ── */

  readonly status = computed(() => this.plan()?.status ?? null);

  readonly canSubmit = computed(() => this.status() === PlanStatus.Draft);
  readonly canReview = computed(() => this.status() === PlanStatus.PendingApproval);
  readonly canActivateAction = computed(() => this.status() === PlanStatus.Approved);
  readonly canPromote = computed(
    () => this.status() === PlanStatus.Approved || this.status() === PlanStatus.Active,
  );
  readonly canClose = computed(
    () => this.status() === PlanStatus.Active || this.status() === PlanStatus.Fulfilled,
  );

  readonly filledPct = computed(() => {
    const plan = this.plan();
    if (!plan || plan.targetHeadcount <= 0) return 0;
    return Math.min((plan.filledHeadcount / plan.targetHeadcount) * 100, 100);
  });

  readonly pipelinePct = computed(() => {
    const plan = this.plan();
    if (!plan || plan.targetHeadcount <= 0) return 0;
    const remaining = 100 - this.filledPct();
    return Math.min((plan.pendingRequisitionsCount / plan.targetHeadcount) * 100, remaining);
  });

  readonly completePct = computed(() => Math.round(this.filledPct()));

  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const current = this.status();
    const order: PlanStatus[] = [
      PlanStatus.Draft,
      PlanStatus.PendingApproval,
      PlanStatus.Approved,
      PlanStatus.Active,
      PlanStatus.Fulfilled,
      PlanStatus.Closed,
    ];

    if (current === PlanStatus.Rejected) {
      return [
        { label: 'Draft', state: 'completed' },
        { label: 'Pending Approval', state: 'completed' },
        { label: 'Rejected', state: 'error' },
        { label: 'Active', state: 'upcoming' },
        { label: 'Fulfilled', state: 'upcoming' },
        { label: 'Closed', state: 'upcoming' },
      ];
    }

    const index = order.indexOf(current!);
    return order.map((step, i) => ({
      label: step === PlanStatus.PendingApproval ? 'Pending Approval' : step,
      state:
        i < index ? ('completed' as const) : i === index ? ('current' as const) : ('upcoming' as const),
    }));
  });

  readonly showRejectionCard = computed(
    () =>
      (this.status() === PlanStatus.Rejected || !!this.plan()?.rejectionReason) &&
      !!this.plan()?.rejectionReason,
  );

  /* ── Workflow actions ── */

  submit(): void {
    this.runAction('submit', () => this.plansService.submit(this.id()));
  }

  approve(): void {
    this.runAction('approve', () => this.plansService.approve(this.id()), 'Manpower plan approved.');
  }

  activate(): void {
    this.runAction('activate', () => this.plansService.activate(this.id()), 'Manpower plan activated.');
  }

  close(): void {
    this.runAction('close', () => this.plansService.close(this.id()), 'Manpower plan closed.');
  }

  openRejectDialog(): void {
    this.rejectReason = '';
    this.rejectDialogVisible.set(true);
  }

  confirmReject(): void {
    const reason = this.rejectReason.trim();
    if (!reason) return;

    const request: RejectManPowerPlanRequest = { reason };
    this.rejectDialogVisible.set(false);
    this.runAction(
      'reject',
      () => this.plansService.reject(this.id(), request),
      'Manpower plan rejected.',
    );
  }

  /* ── Promotion dialog ── */

  openPromoteDialog(): void {
    this.positionSearch = '';
    this.searchResults.set([]);
    this.selectedPosition.set(null);
    this.promoteDialogVisible.set(true);
  }

  searchPositions(): void {
    const term = this.positionSearch.trim();
    if (!term || this.isSearching()) return;

    this.isSearching.set(true);
    this.positionsService.getRegistry(undefined, term).subscribe({
      next: (res) => {
        this.searchResults.set(res.data ?? []);
        this.isSearching.set(false);
      },
      error: () => {
        this.searchResults.set([]);
        this.isSearching.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Position search failed.',
        });
      },
    });
  }

  selectPosition(position: PositionRegistryListItemDto): void {
    this.selectedPosition.set(position);
  }

  confirmPromotion(): void {
    const selected = this.selectedPosition();
    if (!selected) return;

    const request: PromotePositionRequest = { positionRegistryId: selected.id };
    this.promoteDialogVisible.set(false);
    this.runAction(
      'promote',
      () => this.plansService.promote(this.id(), request),
      'Plan promoted to a job position.',
    );
  }

  private runAction(action: string, call: () => Observable<Result>, successDetail?: string): void {
    if (this.pendingAction()) return;
    this.pendingAction.set(action);
    call().subscribe({
      next: () => {
        this.pendingAction.set(null);
        if (successDetail) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: successDetail });
        }
        this.loadPlan(this.id());
      },
      error: () => {
        this.pendingAction.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'The action could not be completed.',
        });
      },
    });
  }
}
