import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// TODO: replace with real finance-approval API once a backend endpoint exists for it. Per the
// note in requisition.service.ts, only ManPowerPlansController, JobDescriptionsController,
// JobPostController, CandidatesController, ApplicationsController and the Admin/* controllers
// are confirmed in the .NET API today — nothing confirmed yet for finance-side plan lock/approve.
// This mocks the Finance Plan Approval View (wireframe #24) with placeholder budget lines.
// Swap this service's internals for real HttpClient calls once that endpoint lands; keep the
// public method signatures the same if possible so finance-plan-approval.component.ts doesn't
// need to change.

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface BudgetLineItem {
  id: string;
  position: string;
  grade: string;
  budgetedCount: number;
}

export interface DepartmentBudgetSummary {
  departmentId: string;
  department: string;
  fiscalYear: number;
  lines: BudgetLineItem[];
  locked: boolean;
}

const SIM_LATENCY = 300;

const MOCK_FISCAL_YEARS = [2025, 2026, 2027];

const MOCK_DEPARTMENTS: DepartmentOption[] = [
  { id: 'dept-tech', name: 'Technology' },
  { id: 'dept-product', name: 'Product' },
  { id: 'dept-ops', name: 'Operations' },
];

// Keyed by `${fiscalYear}:${departmentId}`.
let MOCK_SUMMARIES: Record<string, DepartmentBudgetSummary> = {
  '2026:dept-tech': {
    departmentId: 'dept-tech',
    department: 'Technology',
    fiscalYear: 2026,
    locked: false,
    lines: [
      { id: 'line-1', position: 'Senior .NET Dev', grade: 'Grade 10', budgetedCount: 3 },
      { id: 'line-2', position: 'UX Designer', grade: 'Grade 8', budgetedCount: 2 },
    ],
  },
  '2026:dept-product': {
    departmentId: 'dept-product',
    department: 'Product',
    fiscalYear: 2026,
    locked: false,
    lines: [{ id: 'line-3', position: 'Product Manager', grade: 'Grade 11', budgetedCount: 1 }],
  },
};

@Injectable({ providedIn: 'root' })
export class FinanceApprovalService {
  private _summaries = signal<Record<string, DepartmentBudgetSummary>>(MOCK_SUMMARIES);

  getFiscalYears(): number[] {
    return MOCK_FISCAL_YEARS;
  }

  getDepartments(): Observable<DepartmentOption[]> {
    return of(MOCK_DEPARTMENTS).pipe(delay(SIM_LATENCY));
  }

  getBudgetSummary(fiscalYear: number, departmentId: string): Observable<DepartmentBudgetSummary | undefined> {
    const key = `${fiscalYear}:${departmentId}`;
    const found = this._summaries()[key];
    if (found) return of(found).pipe(delay(SIM_LATENCY));

    // No submitted plan yet for this year/department — an empty, unlocked summary.
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === departmentId);
    const empty: DepartmentBudgetSummary = {
      departmentId,
      department: dept?.name ?? 'Unknown Department',
      fiscalYear,
      locked: false,
      lines: [],
    };
    return of(empty).pipe(delay(SIM_LATENCY));
  }

  lockAndApprove(fiscalYear: number, departmentId: string): Observable<void> {
    const key = `${fiscalYear}:${departmentId}`;
    this._summaries.update((map) => {
      const existing = map[key];
      if (!existing) return map;
      return { ...map, [key]: { ...existing, locked: true } };
    });
    MOCK_SUMMARIES = this._summaries();
    return of(void 0).pipe(delay(SIM_LATENCY));
  }
}
