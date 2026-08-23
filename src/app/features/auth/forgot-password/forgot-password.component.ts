import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router ,RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, MessageModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

 submit(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const email = this.form.controls.email.value;

  this.loading.set(true);
  this.error.set(null);

  this.auth.requestResetPassword({ email }).subscribe({
    next: () => {
      this.loading.set(false);

      this.router.navigate(['/reset-password'], {
        queryParams: { email },
      });
    },
    error: (error) => {
      this.loading.set(false);

      this.error.set(
        error?.error?.message ||
        'Unable to send reset code. Please try again.'
      );
    },
  });
}
}
