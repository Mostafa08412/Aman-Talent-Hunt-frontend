import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../../core/services/auth.service';
import { EmployeeProfileService } from '../../../core/services/employee-profile.service';
import { EmployeeProfileDto } from '@core/models/employee-profile-model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);
  private auth = inject(AuthService);
  private employeeService = inject(EmployeeProfileService);

  currentUser = this.auth.currentUser;
  profile = signal<EmployeeProfileDto | null>(null);

  fullName = computed(() => {
    const p = this.profile();
    if (!p) return this.currentUser()?.fullName ?? '';
    return `${p.firstName} ${p.lastName}`.trim();
  });

  initials = computed(() => {
    const name = this.fullName() || (this.currentUser()?.fullName ?? '');
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase() || '??';
  });

  isLoading = signal(true);
  isSavingProfile = signal(false);
  isSavingPassword = signal(false);

  profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s\-()]{7,20}$/)]],
  });

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatchValidator });

  readonly passwordRequirements = computed(() => {
    const pw = this.passwordForm.controls.newPassword.value ?? '';
    return [
      { label: 'At least 8 characters', met: pw.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(pw) },
      { label: 'One number', met: /[0-9]/.test(pw) },
      { label: 'One special character (!@#$%)', met: /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
    ];
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(silent = false): void {
    if (!silent) this.isLoading.set(true);
    this.employeeService.getProfile().subscribe({
      next: (res) => {
        const p = res.data ?? null;
        this.profile.set(p);
        this.patchFormFrom(p);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private patchFormFrom(p: EmployeeProfileDto | null): void {
    this.profileForm.patchValue({
      firstName: p?.firstName ?? '',
      lastName: p?.lastName ?? '',
      phoneNumber: p?.phoneNumber ?? '',
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isSavingProfile.set(true);
    const v = this.profileForm.getRawValue();

    this.employeeService.updateProfile({
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      phoneNumber: v.phoneNumber,
    }).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.message.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated successfully.' });
        this.auth.updateLocalUser({
          fullName: `${v.firstName.trim()} ${v.lastName.trim()}`.trim(),
        });
        this.loadProfile(true);
      },
      error: () => this.isSavingProfile.set(false),
    });
  }

  resetProfileForm(): void {
    this.loadProfile(true);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.isSavingPassword.set(true);
    const v = this.passwordForm.getRawValue();

    this.auth.changePassword({
      currentPassword: v.currentPassword,
      newPassword: v.newPassword,
    }).subscribe({
      next: (res) => {
        this.isSavingPassword.set(false);
        if (!res.isCompletedSuccessfully) {
          return;
        }
        this.message.add({ severity: 'success', summary: 'Saved', detail: 'Password changed successfully.' });
        this.passwordForm.reset();
      },
      error: () => {
        this.isSavingPassword.set(false);
      },
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPw = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    if (newPw && confirm && newPw.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }
}
