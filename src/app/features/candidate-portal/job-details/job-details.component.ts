import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { CandidateProfileService } from '../../../core/services/candidate-profile.service';
import { JobDetailsService } from '../../../core/services/job-details.service';
import { PublicJobPostDetailDto, ScreeningQuestionDto } from '../../../core/models/job-post-model';

@Component({
  selector: 'app-job-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TextareaModule,
    SelectModule,
    FileUploadModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './job-details.component.html',
  styleUrl: './job-details.component.scss',
})
export class JobDetailsComponent {
  private fb = inject(FormBuilder);
  private message = inject(MessageService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private profileService = inject(CandidateProfileService);
  private route = inject(ActivatedRoute);
  private jobDetailsService = inject(JobDetailsService);

  isLoggedIn = this.auth.isLoggedIn;

  job = signal<PublicJobPostDetailDto | null>(null);
  loading = signal(true);
  loadError = signal(false);

  currentResume = { name: 'No resume uploaded', meta: 'Current resume' };
  uploadVisible = signal(false);
  showUpload = signal(false);
  isSubmitting = signal(false);
  successVisible = signal(false);

  sourceOptions = [
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'Referral', value: 'referral' },
    { label: 'Job Board', value: 'job-board' },
    { label: 'Company Website', value: 'website' },
    { label: 'Other', value: 'other' },
  ];

  form = this.fb.nonNullable.group({
    answers: this.fb.array<FormControl<string>>([]),
    source: ['', Validators.required],
  });

  constructor() {
    this.loadJobDetails();
    if (this.isLoggedIn()) {
      this.loadCandidateResume();
    }
  }

  get answers(): FormArray<FormControl<string>> {
    return this.form.controls.answers;
  }

  get screeningQuestions(): ScreeningQuestionDto[] {
    return this.job()?.screeningQuestions ?? [];
  }

  private loadJobDetails(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.loadError.set(true);
      return;
    }

    this.jobDetailsService.getJobDetails(id).subscribe({
      next: (response) => {
        if (!response.data) {
          this.loading.set(false);
          this.loadError.set(true);
          return;
        }

        this.job.set(response.data);
        this.answers.clear();
        for (const question of this.screeningQuestions) {
          this.answers.push(this.fb.nonNullable.control('', Validators.required));
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  toList(value: string | null | undefined): string[] {
    return value
      ?.split(/\r?\n|•|(?<=\.)\s+(?=[A-Z])/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean) ?? [];
  }

  signInToApply(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  private loadCandidateResume(): void {
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.currentResume = {
          name: response.data?.resumeFileName || 'No resume uploaded',
          meta: 'Current resume',
        };
      },
      error: () => {
        this.currentResume = {
          name: 'Unable to load resume',
          meta: 'Please try again later',
        };
      },
    });
  }

  onResumeSelected(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) return;
    this.currentResume.name = file.name;
    this.message.add({
      severity: 'success',
      summary: 'Resume uploaded',
      detail: `${file.name} will be used for this application.`,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please complete all required fields.' });
      return;
    }
    this.isSubmitting.set(true);
    // Dummy submit — replace with applications service call.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.successVisible.set(true);
    }, 1200);
  }
}