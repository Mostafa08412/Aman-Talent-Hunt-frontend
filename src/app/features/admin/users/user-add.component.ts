import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AdminUsersService } from '../../../core/services/admin-users.service';
import { Roles } from '../../../core/models/enums';
import { ROLE_DEFINITIONS } from '../../../core/roles/roles';

@Component({
  selector: 'app-user-add',
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
  templateUrl: './user-add.component.html',
  styleUrl: './user-add.component.scss',
})
export class UserAddComponent {
  private readonly usersService = inject(AdminUsersService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  isSubmitting = signal(false);
  selectedRole = signal<Roles>(Roles.HRManager);

  readonly roleOptions = ROLE_DEFINITIONS;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phoneNumber: ['', [Validators.pattern(/^\d{9}$/)]],
  });

  selectRole(role: Roles): void {
    this.selectedRole.set(role);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const value = this.form.getRawValue();

    this.usersService
      .create({
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        phoneNumber: value.phoneNumber,
        initialRole: this.selectedRole(),
        positionRegistryId: null,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'User created successfully. An invitation email has been sent.',
          });
          this.router.navigate(['/console/admin/users']);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create user.',
          });
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/console/admin/users']);
  }
}
