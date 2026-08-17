import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {
  RequisitionService,
  RequisitionDetail,
  HiringType,
  HIRING_TYPE_OPTIONS,
  REQUISITION_STAGES,
  RequisitionStage,
  RequisitionHoldState,
  DepartmentOption,
  SquadOption,
} from '../../../core/services/requisition.service';

@Component({
  selector: 'app-requisition-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectButtonModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    InputTextModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './requisition-detail.component.html',
  styleUrl: './requisition-detail.component.scss',
})
export class RequisitionDetailComponent {
  private requisitionService = inject(RequisitionService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // Bound automatically from the `:id` route param via withComponentInputBinding();
  // undefined on the `requisitions/new` route, which has no :id segment.
  id = input<string>();

  isCreateMode = computed(() => !this.id());

  hiringTypeOptions = HIRING_TYPE_OPTIONS;
  stages = REQUISITION_STAGES;
  RequisitionStage = RequisitionStage;
  RequisitionHoldState = RequisitionHoldState;

  // ── Create mode (#10) ──
  title = signal('');
  hiringType = signal<HiringType>(HiringType.NewHeadcount);
  departmentId = signal<string | null>(null);
  squadId = signal<string | null>(null);
  headcount = signal<number>(1);
  startDate = signal<Date | null>(null);

  departments = signal<DepartmentOption[]>([]);
  squads = signal<SquadOption[]>([]);
  availableSquads = computed(() => this.squads().filter((s) => s.departmentId === this.departmentId()));

  submitting = signal(false);
  formError = signal<string | null>(null);

  canSubmit = computed(
    () =>
      this.title().trim().length > 0 &&
      !!this.departmentId() &&
      !!this.squadId() &&
      this.headcount() > 0 &&
      !!this.startDate(),
  );

  // ── Control Center mode (#11) ──
  loading = signal(true);
  loadError = signal<string | null>(null);
  requisition = signal<RequisitionDetail | null>(null);
  actionPending = signal(false);

  currentStageIndex = computed(() => {
    const req = this.requisition();
    if (!req) return -1;
    return REQUISITION_STAGES.findIndex((s) => s.value === req.stage);
  });

  constructor() {
    if (this.isCreateMode()) {
      this.requisitionService.getDepartments().subscribe((d) => this.departments.set(d));
      this.requisitionService.getSquads().subscribe((s) => this.squads.set(s));
    } else {
      this.loadRequisition();
    }
  }

  onDepartmentChange(): void {
    this.squadId.set(null);
  }

  private loadRequisition(): void {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    this.loadError.set(null);
    this.requisitionService.getById(id).subscribe({
      next: (req) => {
        if (!req) {
          this.loadError.set('Requisition not found.');
        } else {
          this.requisition.set(req);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load this requisition right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.formError.set(null);
    this.requisitionService
      .create({
        title: this.title().trim(),
        hiringType: this.hiringType(),
        departmentId: this.departmentId()!,
        squadId: this.squadId()!,
        headcount: this.headcount(),
        startDate: (this.startDate() as Date).toISOString(),
      })
      .subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.router.navigate(['/console/requisitions', created.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.formError.set('Unable to submit this requisition right now. Please try again later.');
        },
      });
  }

  confirmPlaceOnHold(): void {
    const req = this.requisition();
    if (!req) return;
    this.confirmationService.confirm({
      header: 'Place Requisition On-Hold',
      message: `Place ${req.reqNumber} — ${req.title} on hold? Sourcing activity will pause until it's resumed.`,
      acceptLabel: 'Place On-Hold',
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: 'warn' },
      accept: () => this.placeOnHold(),
    });
  }

  confirmCancel(): void {
    const req = this.requisition();
    if (!req) return;
    this.confirmationService.confirm({
      header: 'Cancel Requisition',
      message: `Cancel ${req.reqNumber} — ${req.title}? This cannot be undone from this screen.`,
      acceptLabel: 'Cancel Requisition',
      rejectLabel: 'Keep Requisition',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.cancel(),
    });
  }

  private placeOnHold(): void {
    const req = this.requisition();
    if (!req) return;
    this.actionPending.set(true);
    this.requisitionService.placeOnHold(req.id).subscribe(() => {
      this.actionPending.set(false);
      this.loadRequisition();
    });
  }

  private cancel(): void {
    const req = this.requisition();
    if (!req) return;
    this.actionPending.set(true);
    this.requisitionService.cancel(req.id).subscribe(() => {
      this.actionPending.set(false);
      this.loadRequisition();
    });
  }
}
