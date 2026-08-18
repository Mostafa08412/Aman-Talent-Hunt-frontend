import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { Role } from '../models/role.model';
import {
  AdminUser,
  CreateUserRequest,
  Squad,
  CreateSquadRequest,
  SquadMember,
  Position,
  CreatePositionRequest,
  Department,
} from '../models/admin.models';

/* ─────────────────────────────────────────────
   Mock data — replace with real HTTP calls once
   the .NET API endpoints are available.
   ───────────────────────────────────────────── */

const MOCK_USERS: AdminUser[] = [
  {
    id: 'u1',
    fullName: 'Sara Ali',
    email: 'sara@ath.com',
    roles: [Role.Recruiter],
    status: 'Active',
    createdAt: '2025-01-15',
  },
  {
    id: 'u2',
    fullName: 'Ahmed Gill',
    email: 'ahmed@ath.com',
    roles: [Role.HRManager],
    status: 'Active',
    createdAt: '2025-02-10',
  },
  {
    id: 'u3',
    fullName: 'Omar Farid',
    email: 'omar@ath.com',
    roles: [Role.HiringManager],
    status: 'Inactive',
    createdAt: '2025-03-05',
  },
  {
    id: 'u4',
    fullName: 'Layla Hassan',
    email: 'layla@ath.com',
    roles: [Role.DepartmentHead],
    status: 'Active',
    createdAt: '2025-04-20',
  },
  {
    id: 'u5',
    fullName: 'Karim Nasser',
    email: 'karim@ath.com',
    roles: [Role.FinanceApprover],
    status: 'Active',
    createdAt: '2025-05-12',
  },
  {
    id: 'u6',
    fullName: 'Nour Saleh',
    email: 'nour@ath.com',
    roles: [Role.OnboardingCoordinator],
    status: 'Active',
    createdAt: '2025-06-01',
  },
];

const MOCK_SQUADS: Squad[] = [
  {
    id: 's1',
    name: 'Tech Squad',
    departments: ['Engineering', 'Software Eng.', 'Infrastructure', 'DevOps'],
    members: [
      { id: 'u1', fullName: 'Omar Ali', role: 'Squad Leader', isLeader: true },
      { id: 'u2', fullName: 'Sara Mostafa', role: 'Developer', isLeader: false },
      { id: 'u3', fullName: 'Karim Hassan', role: 'DevOps Engineer', isLeader: false },
    ],
  },
  {
    id: 's2',
    name: 'Commercial Squad',
    departments: ['Sales', 'Marketing'],
    members: [
      { id: 'u4', fullName: 'Layla Farid', role: 'Squad Leader', isLeader: true },
      { id: 'u5', fullName: 'Ahmed Nour', role: 'Sales Rep', isLeader: false },
    ],
  },
  {
    id: 's3',
    name: 'Operations Squad',
    departments: ['HR', 'Finance', 'Administration'],
    members: [
      { id: 'u6', fullName: 'Nour Saleh', role: 'Squad Leader', isLeader: true },
      { id: 'u7', fullName: 'Hassan Ali', role: 'Finance Analyst', isLeader: false },
      { id: 'u8', fullName: 'Dina Kamal', role: 'HR Specialist', isLeader: false },
      { id: 'u9', fullName: 'Youssef Adel', role: 'Admin Officer', isLeader: false },
    ],
  },
];

const MOCK_POSITIONS: Position[] = [
  { id: 'p1', code: 'POS-001', title: 'Senior .NET Dev', department: 'Tech', approved: 3, filled: 2, vacant: 1, status: 'Active' },
  { id: 'p2', code: 'POS-002', title: 'UX Designer', department: 'Product', approved: 2, filled: 0, vacant: 2, status: 'Draft' },
  { id: 'p3', code: 'POS-003', title: 'Sales Manager', department: 'Commercial', approved: 1, filled: 1, vacant: 0, status: 'Active' },
  { id: 'p4', code: 'POS-004', title: 'DevOps Engineer', department: 'Tech', approved: 2, filled: 1, vacant: 1, status: 'Active' },
  { id: 'p5', code: 'POS-005', title: 'HR Specialist', department: 'Operations', approved: 1, filled: 0, vacant: 1, status: 'Draft' },
  { id: 'p6', code: 'POS-006', title: 'Marketing Lead', department: 'Commercial', approved: 1, filled: 1, vacant: 0, status: 'Active' },
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Tech' },
  { id: 'd2', name: 'Product' },
  { id: 'd3', name: 'Commercial' },
  { id: 'd4', name: 'Operations' },
  { id: 'd5', name: 'Finance' },
  { id: 'd6', name: 'HR' },
];

/* ─────────────────────────────────────────────
   Admin Service
   ───────────────────────────────────────────── */

@Injectable({ providedIn: 'root' })
export class AdminService {
  /* ── Reactive state ── */
  private _users = signal<AdminUser[]>([...MOCK_USERS]);
  private _squads = signal<Squad[]>([...MOCK_SQUADS]);
  private _positions = signal<Position[]>([...MOCK_POSITIONS]);

  readonly users = this._users.asReadonly();
  readonly squads = this._squads.asReadonly();
  readonly positions = this._positions.asReadonly();
  readonly departments = signal<Department[]>(MOCK_DEPARTMENTS).asReadonly();

  /* ── Users (ADM-01) ── */

  loadUsers(): void {
    // In production: this.http.get<AdminUser[]>(`${env.apiBase}/api/Admin/users`)
    this._users.set([...MOCK_USERS]);
  }

  createUser(req: CreateUserRequest): Observable<AdminUser> {
    const user: AdminUser = {
      id: `u${Date.now()}`,
      fullName: req.fullName,
      email: req.email,
      roles: req.roles,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    };
    return of(user).pipe(
      delay(300),
      tap(() => this._users.update((list) => [...list, user])),
    );
  }

  updateUser(id: string, patch: Partial<AdminUser>): Observable<AdminUser> {
    const updated = { ...this._users().find((u) => u.id === id)!, ...patch };
    return of(updated).pipe(
      delay(200),
      tap(() => this._users.update((list) => list.map((u) => (u.id === id ? updated : u)))),
    );
  }

  deleteUser(id: string): Observable<void> {
    return of(void 0).pipe(
      delay(200),
      tap(() => this._users.update((list) => list.filter((u) => u.id !== id))),
    );
  }

  toggleUserStatus(id: string): Observable<AdminUser> {
    const user = this._users().find((u) => u.id === id)!;
    return this.updateUser(id, { status: user.status === 'Active' ? 'Inactive' : 'Active' });
  }

  /* ── Squads (ADM-02) ── */

  loadSquads(): void {
    this._squads.set([...MOCK_SQUADS]);
  }

  createSquad(req: CreateSquadRequest): Observable<Squad> {
    const squad: Squad = {
      id: `s${Date.now()}`,
      name: req.name,
      departments: req.departments,
      members: req.memberIds.map((mid) => ({
        id: mid,
        fullName: `Member ${mid}`,
        role: mid === req.leaderId ? 'Squad Leader' : 'Member',
        isLeader: mid === req.leaderId,
      })),
    };
    return of(squad).pipe(
      delay(300),
      tap(() => this._squads.update((list) => [...list, squad])),
    );
  }

  updateSquad(id: string, patch: Partial<Squad>): Observable<Squad> {
    const updated = { ...this._squads().find((s) => s.id === id)!, ...patch };
    return of(updated).pipe(
      delay(200),
      tap(() => this._squads.update((list) => list.map((s) => (s.id === id ? updated : s)))),
    );
  }

  deleteSquad(id: string): Observable<void> {
    return of(void 0).pipe(
      delay(200),
      tap(() => this._squads.update((list) => list.filter((s) => s.id !== id))),
    );
  }

  /* ── Positions (ADM-03) ── */

  loadPositions(): void {
    this._positions.set([...MOCK_POSITIONS]);
  }

  createPosition(req: CreatePositionRequest): Observable<Position> {
    const pos: Position = {
      id: `p${Date.now()}`,
      code: req.code,
      title: req.title,
      department: req.departmentId,
      approved: req.approved,
      filled: 0,
      vacant: req.approved,
      status: req.status,
    };
    return of(pos).pipe(
      delay(300),
      tap(() => this._positions.update((list) => [...list, pos])),
    );
  }

  updatePosition(id: string, patch: Partial<Position>): Observable<Position> {
    let updated = { ...this._positions().find((p) => p.id === id)!, ...patch };
    updated.vacant = updated.approved - updated.filled;
    return of(updated).pipe(
      delay(200),
      tap(() => this._positions.update((list) => list.map((p) => (p.id === id ? updated : p)))),
    );
  }

  deletePosition(id: string): Observable<void> {
    return of(void 0).pipe(
      delay(200),
      tap(() => this._positions.update((list) => list.filter((p) => p.id !== id))),
    );
  }
}
