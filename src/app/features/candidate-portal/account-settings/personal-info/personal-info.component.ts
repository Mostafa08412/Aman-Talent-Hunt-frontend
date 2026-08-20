import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.scss',
})
export class PersonalInfoComponent {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);

  isSubmitting = signal(false);

  militaryStatusOptions = [
    { label: 'Completed', value: 'completed' },
    { label: 'Exempted', value: 'exempted' },
    { label: 'Postponed', value: 'postponed' },
  ];

  form = this.fb.nonNullable.group({
    firstName: ['Alex', Validators.required],
    lastName: ['Mercer', Validators.required],
    email: ['alex.mercer@email.com', [Validators.required, Validators.email]],
    phone: ['+20 100 123 4567', [Validators.required]],
    militaryStatus: ['completed', Validators.required],
    linkedin: ['linkedin.com/in/alexmercer'],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({ severity: 'warn', summary: 'Incomplete form', detail: 'Please fill in the required fields.' });
      return;
    }
    this.isSubmitting.set(true);
    // Dummy submit — replace with profile service call.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.message.add({ severity: 'success', summary: 'Saved', detail: 'Your personal information has been updated.' });
    }, 800);
  }
}