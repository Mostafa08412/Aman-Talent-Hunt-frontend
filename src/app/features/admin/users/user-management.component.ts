import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AdminService } from '../../../core/services/admin.service';
import { AdminUser, CreateUserRequest } from '../../../core/models/admin.models';
import { Role, INTERNAL_ROLES } from '../../../core/models/role.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private messageService = inject(MessageService);
  private confirmService = inject(ConfirmationService);

  users = this.adminService.users;
  searchValue = '';

  /* Dialog state */
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');

  formFullName = '';
  formEmail = '';
  formPassword = '';
  formRole: Role = Role.Recruiter;
  editingUserId: string | null = null;

  roleOptions = INTERNAL_ROLES.map((r) => ({ label: r, value: r }));

  ngOnInit(): void {
    this.adminService.loadUsers();
  }

  /* ── Helpers ── */

  getStatusSeverity(status: string): "success" | "secondary" {
    return status === 'Active' ? 'success' : 'secondary';
  }

  getRoleSeverity(_role: string): "info" | "warn" | "success" | "danger" | "secondary" | "contrast" {
    const map: Record<string, "info" | "warn" | "success" | "danger" | "secondary" | "contrast"> = {
      Admin: 'danger',
      HRManager: 'warn',
      Recruiter: 'info',
      HiringManager: 'success',
      DepartmentHead: 'contrast',
      FinanceApprover: 'secondary',
      OnboardingCoordinator: 'info',
    };
    return map[_role] ?? 'info';
  }

  getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  /* ── CRUD ── */

  openCreateDialog(): void {
    this.dialogMode.set('create');
    this.formFullName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.formRole = Role.Recruiter;
    this.editingUserId = null;
    this.dialogVisible.set(true);
  }

  openEditDialog(user: AdminUser): void {
    this.dialogMode.set('edit');
    this.formFullName = user.fullName;
    this.formEmail = user.email;
    this.formPassword = '';
    this.formRole = user.roles[0];
    this.editingUserId = user.id;
    this.dialogVisible.set(true);
  }

  saveUser(): void {
    if (this.dialogMode() === 'create') {
      const req: CreateUserRequest = {
        fullName: this.formFullName,
        email: this.formEmail,
        password: this.formPassword,
        roles: [this.formRole],
      };
      this.adminService.createUser(req).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Created', detail: `User "${req.fullName}" created successfully.` });
        this.dialogVisible.set(false);
      });
    } else {
      this.adminService.updateUser(this.editingUserId!, {
        fullName: this.formFullName,
        email: this.formEmail,
        roles: [this.formRole],
      }).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated successfully.' });
        this.dialogVisible.set(false);
      });
    }
  }

  confirmDelete(user: AdminUser): void {
    this.confirmService.confirm({
      message: `Are you sure you want to delete "${user.fullName}"?`,
      header: 'Delete User',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.adminService.deleteUser(user.id).subscribe(() => {
          this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `User "${user.fullName}" removed.` });
        });
      },
    });
  }

  toggleStatus(user: AdminUser): void {
    this.adminService.toggleUserStatus(user.id).subscribe((updated) => {
      this.messageService.add({
        severity: 'info',
        summary: 'Status Changed',
        detail: `${updated.fullName} is now ${updated.status}.`,
      });
    });
  }
}
