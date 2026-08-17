import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

// TODO: wire to the real ManPowerPlansController once its request/response contract is
// confirmed. A ManPowerPlansController does exist in the .NET API (see requisition.service.ts
// note), but its DTO shape hasn't been confirmed against this frontend yet, so this mocks the
// Manpower Plan Manager (wireframe #23) with placeholder data. Keep the public method
// signatures the same if possible so manpower-plan.component.ts doesn't need to change.

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface ManpowerPlanEntry {
  id: string;
  title: string;
  departmentId: string;
  department: string;
  q1Planned: number;
  q2Planned: number;
  hired: number;
}

export interface CreatePlanEntryRequest {
  title: string;
  departmentId: string;
  q1Planned: number;
  q2Planned: number;
}

const SIM_LATENCY = 300;

const MOCK_FISCAL_YEARS = [2025, 2026, 2027];

// TODO: replace with the real department lookup once it's confirmed HR Manager can call an
// endpoint for these (today AdminDepartmentsController exists but is Admin-scoped).
const MOCK_DEPARTMENTS: DepartmentOption[] = [
  { id: 'dept-eng', name: 'Engineering' },
  { id: 'dept-product', name: 'Product' },
  { id: 'dept-ops', name: 'Operations' },
];

let MOCK_PLANS_BY_YEAR: Record<number, ManpowerPlanEntry[]> = {
  2026: [
    {
      id: 'plan-1',
      title: 'Senior .NET Dev',
      departmentId: 'dept-eng',
      department: 'Engineering',
      q1Planned: 3,
      q2Planned: 2,
      hired: 3,
    },
    {
      id: 'plan-2',
      title: 'UX Designer',
      departmentId: 'dept-product',
      department: 'Product',
      q1Planned: 1,
      q2Planned: 1,
      hired: 0,
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class ManpowerPlanService {
  private _plansByYear = signal<Record<number, ManpowerPlanEntry[]>>(MOCK_PLANS_BY_YEAR);

  getFiscalYears(): number[] {
    return MOCK_FISCAL_YEARS;
  }

  getDepartments(): Observable<DepartmentOption[]> {
    return of(MOCK_DEPARTMENTS).pipe(delay(SIM_LATENCY));
  }

  getPlan(fiscalYear: number, departmentId?: string | null): Observable<ManpowerPlanEntry[]> {
    const entries = this._plansByYear()[fiscalYear] ?? [];
    const filtered = departmentId ? entries.filter((e) => e.departmentId === departmentId) : entries;
    return of(filtered).pipe(delay(SIM_LATENCY));
  }

  addEntry(fiscalYear: number, request: CreatePlanEntryRequest): Observable<ManpowerPlanEntry> {
    const dept = MOCK_DEPARTMENTS.find((d) => d.id === request.departmentId);
    const created: ManpowerPlanEntry = {
      id: `plan-${Date.now()}`,
      title: request.title,
      departmentId: request.departmentId,
      department: dept?.name ?? 'Unknown Department',
      q1Planned: request.q1Planned,
      q2Planned: request.q2Planned,
      hired: 0,
    };
    this._plansByYear.update((map) => ({
      ...map,
      [fiscalYear]: [...(map[fiscalYear] ?? []), created],
    }));
    MOCK_PLANS_BY_YEAR = this._plansByYear();
    return of(created).pipe(delay(SIM_LATENCY));
  }

  // Locks the plan for Finance review — no-op against mock data beyond simulated latency.
  submitForFinanceApproval(fiscalYear: number): Observable<void> {
    return of(void 0).pipe(delay(SIM_LATENCY));
  }
}
