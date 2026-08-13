import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Subject, interval , Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, MessageModule],
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.scss',
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private destroy$ = new Subject<void>();
  private countdownSub?: Subscription;

  email = signal('');
  loading = signal(false);
  resendLoading = signal(false);
  error = signal<string | null>(null);
  resendDisabled = signal(false);
  resendCountdown = signal(45);
  isCountdownActive = signal(false);

  otpForm = this.fb.nonNullable.group({
    otp: this.fb.array(this.createOtpControls()),
  });

 get otpArray(): FormArray<FormControl<string>> {
  return this.otpForm.get('otp') as FormArray<FormControl<string>>;
}

  ngOnInit(): void {
    // Read email from route query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const emailParam = params['email'];
      if (emailParam) {
        this.email.set(emailParam);
          this.startCountdown();
      } else {
        // Redirect to login if no email provided
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.countdownSub?.unsubscribe();

    this.destroy$.next();
    this.destroy$.complete();
  }

  private createOtpControls(): FormControl[] {
    return Array(6)
      .fill(null)
      .map(() => new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]));
  }

  /**
   * Handle input change for OTP fields
   */
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow single digit
    if (value.length > 1) {
  const digit = value.slice(-1);

  input.value = digit;
  this.otpArray.at(index).setValue(digit);

  return;
}

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    // Update form control
    const control = this.otpArray.at(index);
    if (value) {
      control.setValue(value);
      // Auto move to next field
      if (index < 5) {
        this.moveNext(index);
      }
    } else {
      control.setValue('');
    }
  }

  /**
   * Handle backspace key press
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (input.value === '') {
        // Move to previous field
        if (index > 0) {
          this.movePrevious(index);
        }
      }
    }
  }

  /**
   * Move focus to next input field
   */
  moveNext(currentIndex: number): void {
    if (currentIndex < 5) {
      const nextInput = document.getElementById(`otp-${currentIndex + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  /**
   * Move focus to previous input field
   */
  movePrevious(currentIndex: number): void {
    if (currentIndex > 0) {
      const prevInput = document.getElementById(`otp-${currentIndex - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        // Clear the previous field value
        const prevControl = this.otpArray.at(currentIndex - 1);
        prevControl.setValue('');
      }
    }
  }

  /**
   * Verify OTP
   */
  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.error.set('Please enter all 6 digits');
      return;
    }

    const otpDigits = this.otpArray.value;
    const otp = otpDigits.join('');

    this.loading.set(true);
    this.error.set(null);

    this.auth.confirmEmail({ email: this.email(), otp }).subscribe({
      next: () => {
        this.loading.set(false);
        this.navigateToJobBoard();
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Invalid OTP. Please try again.';
        this.error.set(errorMessage);
        this.loading.set(false);
      },
    });
  }

  /**
   * Resend OTP verification code
   */
  resendCode(): void {
    
     if (this.resendDisabled()) {
     return;
    }

    this.error.set(null);
    this.resendLoading.set(true);

    this.auth.resendConfirmationEmail({ email: this.email() }).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.startCountdown();
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Failed to resend code. Please try again.';
        this.error.set(errorMessage);
        this.resendLoading.set(false);
      },
    });
  }

  /**
   * Start countdown timer for resend button
   */
  startCountdown(): void {
  this.countdownSub?.unsubscribe();

  this.isCountdownActive.set(true);
  this.resendDisabled.set(true);
  this.resendCountdown.set(45);

  this.countdownSub = interval(1000)
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      const current = this.resendCountdown();

      if (current > 1) {
        this.resendCountdown.set(current - 1);
      } else {
        this.countdownSub?.unsubscribe();
        this.isCountdownActive.set(false);
        this.resendDisabled.set(false);
        this.resendCountdown.set(45);
      }
    });
}

  /**
   * Navigate to Job Board after successful verification
   */
  private navigateToJobBoard(): void {
    this.router.navigate(['/jobs']);
  }
}
