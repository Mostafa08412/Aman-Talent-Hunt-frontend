import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '@core/services/auth.service';

interface StrengthRule {
  met: boolean;
  label: string;
}

@Component({
  selector: 'app-security-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './security-password.component.html',
  styleUrl: './security-password.component.scss',
})
export class SecurityPasswordComponent {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);
  private auth = inject(AuthService);

  isSubmitting = signal(false);

  form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });

  // FormControl.value is a plain property, not a signal — computed() never
  // sees it change. Bridge each control's valueChanges into a real signal so
  // the strength meter, match check, and submit button actually react as the
  // user types.
  private currentPasswordValue = toSignal(this.form.controls.currentPassword.valueChanges, {
    initialValue: this.form.controls.currentPassword.value,
  });
  private newPasswordValue = toSignal(this.form.controls.newPassword.valueChanges, {
    initialValue: this.form.controls.newPassword.value,
  });
  private confirmPasswordValue = toSignal(this.form.controls.confirmPassword.valueChanges, {
    initialValue: this.form.controls.confirmPassword.value,
  });

  rules = computed<StrengthRule[]>(() => {
    const password = this.newPasswordValue();
    return [
      { met: password.length >= 8, label: 'Minimum 8 characters' },
      { met: /[A-Z]/.test(password), label: 'At least one uppercase letter' },
      { met: /[0-9]/.test(password), label: 'At least one number' },
      { met: /[!@#$%^&*]/.test(password), label: 'At least one special character (!@#$%^&*)' },
    ];
  });

  score = computed(() => this.rules().filter((r) => r.met).length);

  strength = computed<{ label: string; level: 'weak' | 'medium' | 'strong'; filled: number }>(() => {
    const s = this.score();
    if (this.newPasswordValue().length === 0) {
      return { label: 'Strength', level: 'medium', filled: 0 };
    }
    if (s <= 1) return { label: 'Weak', level: 'weak', filled: 1 };
    if (s <= 3) return { label: 'Medium', level: 'medium', filled: s };
    return { label: 'Strong', level: 'strong', filled: 4 };
  });

  passwordsMatch = computed(
    () => this.newPasswordValue().length > 0 && this.newPasswordValue() === this.confirmPasswordValue(),
  );

  canSubmit = computed(
    () => this.score() === 4 && this.passwordsMatch() && this.currentPasswordValue().length > 0,
  );

  update(): void {
    if (this.form.invalid || !this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        if (result.isCompletedSuccessfully) {
          this.form.reset();
          this.message.add({
            severity: 'success',
            summary: 'Password updated',
            detail: 'Your password has been changed successfully.',
          });
        } else {
          this.message.add({
            severity: 'error',
            summary: 'Could not update password',
            detail: result.message ?? 'Please check your current password and try again.',
          });
        }
      },
      error: (err: HttpErrorResponse) => {

          const errorBody = err.error;
          const generalTitle = errorBody.title;
          const validationErrors = errorBody.errors;

        this.isSubmitting.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Could not update password',
          detail: generalTitle === "Identity.InvalidPassword" ? 'Your current password is incorrect.' : 'Please try again.',
        });
      },
    });
  }

  reviewDevices(): void {
    this.message.add({ severity: 'info', summary: 'Devices', detail: 'Signed-in devices list is not available yet.' });
  }
}
