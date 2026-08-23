import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CandidateProfileService } from '@core/services/candidate-profile.service';
import { MilitaryStatus } from '@core/models/enums';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, SelectModule, ToastModule],
  providers: [MessageService],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.scss',
})
export class PersonalInfoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);
  private profileService = inject(CandidateProfileService);

  isLoading = signal(true);
  isSubmitting = signal(false);

  militaryStatusOptions = [
    { label: 'Not Applicable', value: MilitaryStatus.NotApplicable },
    { label: 'Completed', value: MilitaryStatus.Completed },
    { label: 'Exempted', value: MilitaryStatus.Exempted },
    { label: 'Postponed', value: MilitaryStatus.Postponed },
    { label: 'Not Required', value: MilitaryStatus.NotRequired },
    { label: 'Currently Serving', value: MilitaryStatus.CurrentlyServing },
  ];

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    phone: ['', [Validators.required]],
    militaryStatus: [MilitaryStatus.NotApplicable, Validators.required],
    linkedin: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (result) => {
        const profile = result.data;
        if (profile) {
          this.form.patchValue({
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            email: profile.email ?? '',
            phone: profile.phoneNumber ?? '',
            militaryStatus: profile.militaryStatus,
            linkedin: profile.linkedInProfile ?? '',
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.message.add({
          severity: 'error',
          summary: 'Could not load your profile',
          detail: 'Please try again in a moment.',
        });
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({ severity: 'warn', summary: 'Incomplete form', detail: 'Please fill in the required fields.' });
      return;
    }
    const { firstName, lastName, phone, militaryStatus, linkedin } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.profileService
      .updateProfile({
        firstName,
        lastName,
        phoneNumber: phone,
        militaryStatus,
        linkedInProfile: linkedin || null,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.message.add({ severity: 'success', summary: 'Saved', detail: 'Your personal information has been updated.' });
        },
        error: () => {
          this.isSubmitting.set(false);
          this.message.add({ severity: 'error', summary: 'Could not save', detail: 'Please try again.' });
        },
      });
  }
}