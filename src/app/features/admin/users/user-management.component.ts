import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  AdminUsersService,
  AdminUsersQueryParams,
} from '../../../core/services/admin-users.service';
import { UserAdminListItemDto } from '../../../core/models/admin-user-model';
import { Roles, UserStatus } from '../../../core/models/enums';
import { ROLE_DEFINITIONS, ROLE_BY_VALUE } from '../../../core/roles/roles';

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  private readonly usersService = inject(AdminUsersService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly users = signal<UserAdminListItemDto[]>([]);
  readonly isLoading = signal(false);
  readonly totalCount = signal(0);

  search = '';
  roleFilter: Roles | null = null;
  statusFilter: UserStatus | null = null;

  private appliedSearch = '';
  private appliedRole: Roles | null = null;
  private appliedStatus: UserStatus | null = null;

  readonly page = signal(1);
  readonly pageSize = 10;

  readonly roleOptions: FilterOption<Roles>[] = ROLE_DEFINITIONS.map((r) => ({
    label: r.viewName,
    value: r.value,
  }));

  readonly statusOptions: FilterOption<UserStatus>[] = [
    { label: 'Active', value: UserStatus.Active },
    { label: 'Locked', value: UserStatus.Locked },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);

    const params: AdminUsersQueryParams = {
      Page: this.page(),
      PageSize: this.pageSize,
      Search: this.appliedSearch || undefined,
      Role: this.appliedRole ?? undefined,
      Status: this.appliedStatus ?? undefined,
    };

    this.usersService.getList(params).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.users.set([]);
          this.totalCount.set(0);
          this.isLoading.set(false);
          this.showError(res.message || 'Failed to load users.');
          return;
        }
        this.users.set(res.data?.items ?? []);
        this.totalCount.set(res.data?.totalCount ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.users.set([]);
        this.totalCount.set(0);
        this.isLoading.set(false);
        this.showError('Failed to load users.');
      },
    });
  }

  applyFilters(): void {
    this.appliedSearch = this.search.trim();
    this.appliedRole = this.roleFilter;
    this.appliedStatus = this.statusFilter;
    this.page.set(1);
    this.loadUsers();
  }

  clearFilters(): void {
    this.search = '';
    this.roleFilter = null;
    this.statusFilter = null;
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount() / this.pageSize));
  }

  get rangeStart(): number {
    if (this.totalCount() === 0) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page() * this.pageSize, this.totalCount());
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.page();

    if (total <= 6) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const wanted = [current - 1, current, current + 1, total].filter(
      (p) => p >= 1 && p <= total,
    );

    return [...new Set([1, ...wanted])].sort((a, b) => a - b);
  }

  goToPage(pageNumber: number): void {
    const clamped = Math.min(Math.max(1, pageNumber), this.totalPages);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.loadUsers();
  }

  previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  openUser(user: UserAdminListItemDto): void {
    this.router.navigate(['/console/admin/users', user.id, 'edit']);
  }

  editUser(user: UserAdminListItemDto, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/console/admin/users', user.id, 'edit']);
  }

  resetPassword(user: UserAdminListItemDto, event: MouseEvent): void {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Send password reset email to "${user.email ?? 'this user'}"?`,
    );
    if (!confirmed) return;

    this.usersService.resetPassword(user.id).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.showError(res.message || 'Failed to reset password.');
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Sent',
          detail: 'Password reset email has been sent.',
        });
      },
      error: () => this.showError('Failed to reset password.'),
    });
  }

  toggleLock(user: UserAdminListItemDto, event: MouseEvent): void {
    event.stopPropagation();

    const action$ = user.isLocked
      ? this.usersService.unlock(user.id)
      : this.usersService.lock(user.id);

    action$.subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully) {
          this.showError(res.message || 'Failed to update account status.');
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: user.isLocked
            ? 'Account unlocked successfully.'
            : 'Account locked successfully.',
        });
        this.loadUsers();
      },
      error: () => this.showError('Failed to update account status.'),
    });
  }

  getInitials(user: UserAdminListItemDto): string {
    const first = user.firstName?.[0]?.toUpperCase() ?? '';
    const last = user.lastName?.[0]?.toUpperCase() ?? '';
    return first + last || '?';
  }

  fullName(user: UserAdminListItemDto): string {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unknown';
  }

  primaryRole(user: UserAdminListItemDto): string {
    const roles = user.userRolesNames;
    if (!roles || roles.length === 0) return '--';
    const first = roles[0];
    return ROLE_BY_VALUE.get(first as Roles)?.viewName ?? first;
  }

  resolveRoleName(role: string): string {
    return ROLE_BY_VALUE.get(role as Roles)?.viewName ?? role;
  }

  roleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      SUPER_ADMIN: 'danger',
      HR_MANAGER: 'warn',
      RECRUITER: 'info',
      HIRING_MANAGER: 'success',
      DEPARTMENT_HEAD: 'contrast',
    };
    return map[role] ?? 'secondary';
  }

  statusLabel(user: UserAdminListItemDto): string {
    return user.isLocked ? 'Locked' : 'Active';
  }

  statusSeverity(user: UserAdminListItemDto): 'success' | 'danger' {
    return user.isLocked ? 'danger' : 'success';
  }

  formatDate(utc: string | null): string {
    if (!utc) return '--';
    const d = new Date(utc);
    if (Number.isNaN(d.getTime())) return utc;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDateTime(utc: string | null): string {
    if (!utc) return '--';
    const d = new Date(utc);
    if (Number.isNaN(d.getTime())) return utc;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
