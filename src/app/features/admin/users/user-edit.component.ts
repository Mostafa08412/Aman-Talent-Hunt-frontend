import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminUsersService } from '../../../core/services/admin-users.service';
import { UserAdminDetailDto } from '../../../core/models/admin-user-model';
import { Roles } from '../../../core/models/enums';
import { ROLE_DEFINITIONS } from '../../../core/roles/roles';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
  private readonly usersService = inject(AdminUsersService);
   readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  isLoading = signal(true);
  isEditMode = signal(false);
  isSaving = signal(false);
  isSavingRoles = signal(false);
  isLocking = signal(false);
  isResetting = signal(false);

  user = signal<UserAdminDetailDto | null>(null);
  selectedRoles = signal<Set<Roles>>(new Set());

  readonly roleOptions = ROLE_DEFINITIONS;

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.pattern(/^\d{9}$/)]],
  });

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.userId) {
      this.router.navigate(['/console/admin/users']);
      return;
    }
    this.loadUser();
  }

   loadUser(): void {
    this.isLoading.set(true);
    this.usersService.getById(this.userId).subscribe({
      next: (res) => {
        if (!res.isCompletedSuccessfully || !res.data) {
          this.showError('Failed to load user.');
          this.router.navigate(['/console/admin/users']);
          return;
        }
        this.user.set(res.data);
        this.populateForm(res.data);
        this.loadRoles(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showError('Failed to load user.');
        this.router.navigate(['/console/admin/users']);
      },
    });
  }

  private populateForm(user: UserAdminDetailDto): void {
    this.profileForm.patchValue({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
    });
  }

  private loadRoles(user: UserAdminDetailDto): void {
    const roles = new Set<Roles>();
    const names = user.userRolesNames ?? [];
    for (const name of names) {
      const normalized = name.replace(/[\s_]/g, '').toUpperCase();
      const enumKey = Object.keys(Roles).find(
        (key) => key.replace(/[\s_]/g, '').toUpperCase() === normalized,
      );
      if (enumKey) {
        roles.add(Roles[enumKey as keyof typeof Roles]);
      }
    }
    this.selectedRoles.set(roles);
  }

  toggleEditMode(): void {
    if (this.isEditMode()) {
      this.cancelEdit();
    } else {
      this.isEditMode.set(true);
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    const user = this.user();
    if (user) this.populateForm(user);
  }

  savePersonalInfo(): void {
    if (this.profileForm.invalid || this.isSaving()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const value = this.profileForm.getRawValue();

    this.usersService
      .update(this.userId, {
        firstName: value.firstName,
        lastName: value.lastName,
        phoneNumber: value.phoneNumber,
      })
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (!res.isCompletedSuccessfully) {
            this.showError(res.message || 'Failed to update user.');
            return;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Personal information updated successfully.',
          });
          this.isEditMode.set(false);
          this.loadUser();
        },
        error: () => {
          this.isSaving.set(false);
          this.showError('Failed to update user.');
        },
      });
  }

  toggleRole(role: Roles): void {
    const current = new Set(this.selectedRoles());
    if (current.has(role)) {
      current.delete(role);
    } else {
      current.add(role);
    }
    this.selectedRoles.set(current);
  }

  isRoleSelected(role: Roles): boolean {
    return this.selectedRoles().has(role);
  }

  saveRoles(): void {
    if (this.isSavingRoles()) return;

    this.isSavingRoles.set(true);
    const roles = Array.from(this.selectedRoles());

    this.usersService
      .updateRoles(this.userId, { roles })
      .subscribe({
        next: (res) => {
          this.isSavingRoles.set(false);
          if (!res.isCompletedSuccessfully) {
            this.showError(res.message || 'Failed to update roles.');
            return;
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Roles updated successfully.',
          });
          this.loadUser();
        },
        error: () => {
          this.isSavingRoles.set(false);
          this.showError('Failed to update roles.');
        },
      });
  }

  toggleLock(): void {
    const user = this.user();
    if (!user || this.isLocking()) return;

    this.isLocking.set(true);
    const request$ = user.isLocked
      ? this.usersService.unlock(this.userId)
      : this.usersService.lock(this.userId);

    request$.subscribe({
      next: (res) => {
        this.isLocking.set(false);
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
        this.loadUser();
      },
      error: () => {
        this.isLocking.set(false);
        this.showError('Failed to update account status.');
      },
    });
  }

  resetPassword(): void {
    if (this.isResetting()) return;

    this.isResetting.set(true);
    this.usersService.resetPassword(this.userId).subscribe({
      next: (res) => {
        this.isResetting.set(false);
        if (!res.isCompletedSuccessfully) {
          this.showError(res.message || 'Failed to reset password.');
          return;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Sent',
          detail: 'Password reset email has been sent.',
        });
        this.loadUser();
      },
      error: () => {
        this.isResetting.set(false);
        this.showError('Failed to reset password.');
      },
    });
  }

  formatDate(utc: string | null): string {
    if (!utc) return '--';
    const d = new Date(utc);
    if (Number.isNaN(d.getTime())) return utc;
    return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
