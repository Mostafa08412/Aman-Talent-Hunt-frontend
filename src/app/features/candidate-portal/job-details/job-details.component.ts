import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
import { CandidateApplicationsService } from '../../../core/services/candidate-applications.service';
import { CandidateResumeService } from '../../../core/services/candidate-resume.service';
import { JobDetailsService } from '../../../core/services/job-details.service';
import { PublicJobPostDetailDto, ScreeningQuestionDto } from '../../../core/models/job-post-model';
import { ApplicationSource } from '../../../core/models/enums';
import { Role } from '@core/models/role.model';
import { PanelModule } from 'primeng/panel';
import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from '@core/errors';
import { throwError, switchMap, of, tap, filter } from 'rxjs';
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
    PanelModule
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
  private applicationsService = inject(CandidateApplicationsService);
  private resumeService = inject(CandidateResumeService);
  private route = inject(ActivatedRoute);
  private jobDetailsService = inject(JobDetailsService);

  isUserCandidate = this.auth.hasRole(Role.Candidate);

  isLoggedIn = this.auth.isLoggedIn;

  job = signal<PublicJobPostDetailDto | null>(null);
  loading = signal(true);
  loadError = signal(false);

  currentResume = signal<{ name: string } | null>(null);
  hasExistingResume = signal(false);
  canSubmit = computed(() => this.hasExistingResume());

  selectedFile = signal<File | null>(null);
  uploadVisible = signal(false);
  showUpload = signal(false);
  isSubmitting = signal(false);
  successVisible = signal(false);

  sourceOptions = [
    { label: 'LinkedIn', value: ApplicationSource.LinkedIn },
    { label: 'Referral', value: ApplicationSource.Wuzzuf },
    { label: 'Other', value: ApplicationSource.Portal },
  ];

  form = this.fb.nonNullable.group({
    answers: this.fb.array<FormControl<string>>([]),
    source: ['', Validators.required],
  });

  constructor() {
    this.loadJobDetails();
    if (this.isLoggedIn() && this.isUserCandidate) {
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

  signInToApply(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  private loadCandidateResume(): void {
    if (this.auth.hasResume()) {
            console.log("here")

      this.currentResume.set({ name: this.auth.getResumeFileName() || 'Resume on file' });
      this.hasExistingResume.set(true);
    } else {
      this.currentResume.set(null);
      this.hasExistingResume.set(false);
      this.showUpload.set(true);
    }
  }

  onResumeSelected(event: { files: File[] }): void {
    const file = event.files[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.currentResume.set({ name: file.name });
    this.hasExistingResume.set(true);
    this.auth.updateLocalResume(this.auth.getResumeId(), file.name);
    this.showUpload.set(false);
    this.message.add({
      severity: 'success',
      summary: 'Resume uploaded',
      detail: `${file.name} will be used for this application.`,
    });
  }

  submit(): void {
    if (!this.hasExistingResume()) {

      this.message.add({ severity: 'warn', summary: 'Resume required', detail: 'Please upload a resume before applying.' });
      return;
    }


    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please complete all required fields.' });
      return;
    }

    const j = this.job();
    if (!j) return;

    this.isSubmitting.set(true);

    const answers = this.screeningQuestions.map((q, i) => ({
      screeningQuestionId: q.id,
      answer: this.answers.at(i)?.value ?? '',
    }));

    const resume$ = this.selectedFile()
      ? of(this.selectedFile()!)
      : this.resumeService.download().pipe(
          switchMap(blob => {
            const name = this.currentResume()?.name || 'resume.pdf';
            return of(new File([blob], name, { type: blob.type || 'application/pdf' }));
          })
        );

    resume$.pipe(
      switchMap(resumeFile =>
        this.applicationsService.submit({
          jobPostId: j.id,
          source: this.form.getRawValue().source as ApplicationSource,
          resume: resumeFile,
          answers,
        })
      ),
      tap(appRes => {
        if (appRes.isCompletedSuccessfully) {
          this.successVisible.set(true);

          this.isSubmitting.set(false);
        }
      }),
      filter(appRes => !appRes.isCompletedSuccessfully),
      switchMap(() => this.profileService.getProfile()),
    ).subscribe({
      next: (profileRes) => {
        this.isSubmitting.set(false);
        const profile = profileRes.data;
        if (profile) {
          this.auth.updateLocalResume(profile.resumeId, profile.resumeFileName);
        }
        this.successVisible.set(true);
        this.message.add({ severity: 'success', summary: 'Application submitted', detail: 'Your application has been received successfully.' });
      },
      error: (err: HttpErrorResponse) => {
        const error = toApiError(err);
        this.isSubmitting.set(false);
        return throwError(() => err);
      },
    });
  }
}
