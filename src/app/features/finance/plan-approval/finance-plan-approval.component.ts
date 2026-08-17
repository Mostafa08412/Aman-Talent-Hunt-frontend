import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import {
  FinanceApprovalService,
  DepartmentBudgetSummary,
  DepartmentOption,
} from '../../../core/services/finance-approval.service';

@Component({
  selector: 'app-finance-plan-approval',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    SelectModule,
    TagModule,
    MessageModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './finance-plan-approval.component.html',
  styleUrl: './finance-plan-approval.component.scss',
})
export class FinancePlanApprovalComponent {
  private financeApprovalService = inject(FinanceApprovalService);
  private confirmationService = inject(ConfirmationService);

  fiscalYears = this.financeApprovalService.getFiscalYears();
  departments = signal<DepartmentOption[]>([]);

  fiscalYear = signal<number>(this.fiscalYears[this.fiscalYears.length - 1]);
  departmentId = signal<string | null>(null);

  loading = signal(true);
  loadError = signal<string | null>(null);
  summary = signal<DepartmentBudgetSummary | null>(null);

  lockPending = signal(false);

  proposedHeadcount = computed(() => this.summary()?.lines.reduce((sum, line) => sum + line.budgetedCount, 0) ?? 0);

  constructor() {
    this.financeApprovalService.getDepartments().subscribe((depts) => {
      this.departments.set(depts);
      if (!this.departmentId() && depts.length > 0) {
        this.departmentId.set(depts[0].id);
        this.load();
      }
    });
  }

  onFilterChange(): void {
    this.load();
  }

  private load(): void {
    const deptId = this.departmentId();
    if (!deptId) return;
    this.loading.set(true);
    this.loadError.set(null);
    this.financeApprovalService.getBudgetSummary(this.fiscalYear(), deptId).subscribe({
      next: (summary) => {
        this.summary.set(summary ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load the department budget summary right now. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  confirmLockAndApprove(): void {
    const summary = this.summary();
    if (!summary || summary.locked || summary.lines.length === 0) return;
    this.confirmationService.confirm({
      header: 'Lock & Finance-Approve Annual Plan',
      message: `Lock and finance-approve the ${summary.fiscalYear} plan for ${summary.department} at ${this.proposedHeadcount()} headcount? This cannot be edited afterward.`,
      acceptLabel: 'Lock & Approve',
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: 'success' },
      accept: () => this.lockAndApprove(),
    });
  }

  private lockAndApprove(): void {
    const summary = this.summary();
    if (!summary) return;
    this.lockPending.set(true);
    this.financeApprovalService.lockAndApprove(summary.fiscalYear, summary.departmentId).subscribe(() => {
      this.lockPending.set(false);
      this.load();
    });
  }
}
