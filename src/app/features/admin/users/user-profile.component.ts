import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUsersService } from '../../../core/services/admin-users.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);
  private auth = inject(AuthService);
  private usersService = inject(AdminUsersService);

  currentUser = this.auth.currentUser;

  initials = computed(() => {
    const name = this.currentUser()?.fullName ?? '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase() || '??';
  });

  isLoading = signal(true);
  isSavingProfile = signal(false);
  isSavingPassword = signal(false);

  userId = '';

  profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.pattern(/^\d{9}$/)]],
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

  private loadProfile(): void {
    const uid = this.currentUser()?.id;
    if (!uid) {
      this.isLoading.set(false);
      return;
    }
    this.userId = uid;

    this.usersService.getById(uid).subscribe({
      next: (res) => {
        if (!res.data) {
          this.isLoading.set(false);
          return;
        }
        const u = res.data;
        this.profileForm.patchValue({
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          phoneNumber: u.phoneNumber ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isSavingProfile.set(true);
    const v = this.profileForm.getRawValue();

    this.usersService.update(this.userId, {
      firstName: v.firstName,
      lastName: v.lastName,
      phoneNumber: v.phoneNumber || null,
    }).subscribe({
      next: (res) => {
        this.isSavingProfile.set(false);
        if (!res.isCompletedSuccessfully) {
          this.message.add({ severity: 'error', summary: 'Error', detail: res.message || 'Failed to update profile.' });
          return;
        }
        this.message.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated successfully.' });
      },
      error: () => {
        this.isSavingProfile.set(false);
        this.message.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile.' });
      },
    });
  }

  resetProfileForm(): void {
    this.loadProfile();
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
          this.message.add({ severity: 'error', summary: 'Error', detail: res.message || 'Failed to change password.' });
          return;
        }
        this.message.add({ severity: 'success', summary: 'Saved', detail: 'Password changed successfully.' });
        this.passwordForm.reset();
      },
      error: () => {
        this.isSavingPassword.set(false);
        this.message.add({ severity: 'error', summary: 'Error', detail: 'Failed to change password.' });
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
