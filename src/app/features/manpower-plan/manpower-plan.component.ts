import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {
  ManpowerPlanService,
  ManpowerPlanEntry,
  DepartmentOption,
} from '../../core/services/manpower-plan.service';

const ALL_DEPARTMENTS = '__all__';

@Component({
  selector: 'app-manpower-plan',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    MessageModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './manpower-plan.component.html',
  styleUrl: './manpower-plan.component.scss',
})
export class ManpowerPlanComponent {
  private manpowerPlanService = inject(ManpowerPlanService);
  private confirmationService = inject(ConfirmationService);

  readonly ALL_DEPARTMENTS = ALL_DEPARTMENTS;

  fiscalYears = this.manpowerPlanService.getFiscalYears();
  departmentOptions = signal<{ id: string; name: string }[]>([]);

  fiscalYear = signal<number>(this.fiscalYears[this.fiscalYears.length - 1]);
  departmentFilter = signal<string>(ALL_DEPARTMENTS);

  loading = signal(true);
  loadError = signal<string | null>(null);
  entries = signal<ManpowerPlanEntry[]>([]);

  submitPending = signal(false);
  submitted = signal(false);

  // Add Plan Entry dialog
  addDialogOpen = signal(false);
  newTitle = signal('');
  newDepartmentId = signal<string | null>(null);
  newQ1 = signal<number>(0);
  newQ2 = signal<number>(0);
  addError = signal<string | null>(null);
  addPending = signal(false);

  canAddEntry = computed(
    () => this.newTitle().trim().length > 0 && !!this.newDepartmentId() && this.newQ1() >= 0 && this.newQ2() >= 0,
  );

  remaining(entry: ManpowerPlanEntry): number {
    return entry.q1Planned + entry.q2Planned - entry.hired;
  }

  constructor() {
    this.manpowerPlanService.getDepartments().subscribe((depts: DepartmentOption[]) => {
      this.departmentOptions.set([{ id: ALL_DEPARTMENTS, name: 'All' }, ...depts]);
    });
    this.load();
  }

  onFilterChange(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.submitted.set(false);
    const dept = this.departmentFilter() === ALL_DEPARTMENTS ? null : this.departmentFilter();
    this.manpowerPlanService.getPlan(this.fiscalYear(), dept).subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load the manpower plan right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  openAddDialog(): void {
    this.newTitle.set('');
    this.newDepartmentId.set(null);
    this.newQ1.set(0);
    this.newQ2.set(0);
    this.addError.set(null);
    this.addDialogOpen.set(true);
  }

  closeAddDialog(): void {
    this.addDialogOpen.set(false);
  }

  confirmAddEntry(): void {
    if (!this.canAddEntry() || this.addPending()) return;
    this.addPending.set(true);
    this.addError.set(null);
    this.manpowerPlanService
      .addEntry(this.fiscalYear(), {
        title: this.newTitle().trim(),
        departmentId: this.newDepartmentId()!,
        q1Planned: this.newQ1(),
        q2Planned: this.newQ2(),
      })
      .subscribe({
        next: () => {
          this.addPending.set(false);
          this.addDialogOpen.set(false);
          this.load();
        },
        error: () => {
          this.addPending.set(false);
          this.addError.set('Unable to add this plan entry right now. Please try again later.');
        },
      });
  }

  confirmSubmitForFinance(): void {
    if (this.entries().length === 0) return;
    this.confirmationService.confirm({
      header: 'Submit Plan for Finance Approval',
      message: `Submit the ${this.fiscalYear()} manpower plan for Finance approval? It will be locked for edits until reviewed.`,
      acceptLabel: 'Submit',
      rejectLabel: 'Cancel',
      accept: () => this.submitForFinance(),
    });
  }

  private submitForFinance(): void {
    this.submitPending.set(true);
    this.manpowerPlanService.submitForFinanceApproval(this.fiscalYear()).subscribe(() => {
      this.submitPending.set(false);
      this.submitted.set(true);
    });
  }
}
