import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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

  isSubmitting = signal(false);

  form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', Validators.required],
    confirmPassword: ['', Validators.required],
  });

  rules = computed<StrengthRule[]>(() => {
    const password = this.form.controls.newPassword.value;
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
    if (this.form.controls.newPassword.value.length === 0) {
      return { label: 'Strength', level: 'medium', filled: 0 };
    }
    if (s <= 1) return { label: 'Weak', level: 'weak', filled: 1 };
    if (s <= 3) return { label: 'Medium', level: 'medium', filled: s };
    return { label: 'Strong', level: 'strong', filled: 4 };
  });

  passwordsMatch = computed(
    () =>
      this.form.controls.newPassword.value.length > 0 &&
      this.form.controls.newPassword.value === this.form.controls.confirmPassword.value,
  );

  canSubmit = computed(
    () => this.score() === 4 && this.passwordsMatch() && this.form.controls.currentPassword.value.length > 0,
  );

  update(): void {
    if (this.form.invalid || !this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    // Dummy submit — replace with password service call.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.form.reset();
      this.message.add({ severity: 'success', summary: 'Password updated', detail: 'Your password has been changed successfully.' });
    }, 800);
  }

  reviewDevices(): void {
    this.message.add({ severity: 'info', summary: 'Devices', detail: 'Signed-in devices list is not available in this demo.' });
  }
}