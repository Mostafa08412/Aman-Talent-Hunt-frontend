import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, MessageModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  selectedFile: File | null = null;

  onFileSelected(event: Event):void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    this.selectedFile = input.files[0];
  }
}
  
  form = this.fb.nonNullable.group(
{
firstName: ['', [Validators.required]],
lastName: ['', [Validators.required]],
phoneNumber: ['', [Validators.required]],
email: ['', [Validators.required, Validators.email]],
password: [
  '',
  [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/)
  ]
],
confirmPassword: ['', [Validators.required]],
militaryStatus: ['', [Validators.required]],
linkedInProfile: [''],
},
{
validators: this.passwordsMatchValidator,
},
);

 private passwordsMatchValidator(control: AbstractControl) {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordsMismatch: true };
}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
if (!this.selectedFile) {
  this.error.set('Please upload your resume.');
  return;
}
    this.loading.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();

const formData = new FormData();

formData.append('FirstName', value.firstName);
formData.append('LastName', value.lastName);
formData.append('PhoneNumber', value.phoneNumber);
formData.append('Email', value.email);
formData.append('Password', value.password);
formData.append('MilitaryStatus', value.militaryStatus);

if (value.linkedInProfile) {
  formData.append('LinkedInProfile', value.linkedInProfile);
}

if (this.selectedFile) {
  formData.append('UploadedResume', this.selectedFile);
}


this.auth.register(formData).subscribe({
  next: () => {
    this.loading.set(false);

    this.router.navigate(['/verify-email'], {
      queryParams: { email: formData.get('Email') },
    });
  },
  error: () => {
    this.error.set(
      'Unable to complete registration. Please verify your details and try again.'
    );
    this.loading.set(false);
  },
});
  }
}
