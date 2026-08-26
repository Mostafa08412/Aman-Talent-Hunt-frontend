import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { EditorModule } from 'primeng/editor';

import { AdminJobPostsService } from '@core/services/admin-job-posts.service';
import {
  AdminJobPostDetailDto,
  ConfigureInterviewRoundsRequest,
  CreateInterviewRoundDto,
  UpdateJobPostConfigRequest,
  UpdateJobPostMarketingRequest,
} from '@core/models/admin-job-post-model';
import { InterviewFormat, JobType, PostingVisibility } from '@core/models/enums';
import { humanizeEnum } from '../shared/status-badge.component';

interface EnumOption {
  label: string;
  value: string;
}

/**
 * Setup tab (guide §8): four wholesale-save sections —
 * marketing text, config, screening questions, interview rounds.
 * All saves are RECRUITER-only; non-recruiters get a read-only view.
 */
@Component({
  selector: 'app-setup-tab',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    EditorModule,
  ],
  templateUrl: './setup-tab.component.html',
  styleUrl: './setup-tab.component.scss',
})
export class SetupTabComponent {
  private readonly jobPostsService = inject(AdminJobPostsService);
  private readonly fb = inject(FormBuilder);

  readonly post = input.required<AdminJobPostDetailDto>();
  readonly isRecruiter = input(false);
  /** Parent reloads the detail after any successful save. */
  readonly saved = output<void>();

  readonly savingSection = signal<string | null>(null);
  readonly questionsVersion = signal(0);
  readonly roundsVersion = signal(0);

  /** Snapshot arrays that produce new references when the FormArrays change. */
  readonly questionsList = computed(() => {
    this.questionsVersion();
    return this.questionsForm.controls.questions.controls.slice();
  });
  readonly roundsList = computed(() => {
    this.roundsVersion();
    return this.roundsForm.controls.rounds.controls.slice();
  });

  readonly jobTypeOptions: EnumOption[] = Object.values(JobType).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));
  readonly visibilityOptions: EnumOption[] = Object.values(PostingVisibility).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));
  readonly formatOptions: EnumOption[] = Object.values(InterviewFormat).map((v) => ({
    label: humanizeEnum(v),
    value: v,
  }));

  // ── Marketing ──
  readonly marketingForm = this.fb.group({
    description: [''],
    requirements: [''],
    qualifications: [''],
  });

  // ── Config ──
  readonly configForm = this.fb.group({
    deadline: [null as Date | null],
    visibility: [PostingVisibility.Public as PostingVisibility, Validators.required],
    jobType: [JobType.OnSite as JobType, Validators.required],
  });

  // ── Screening questions (full replace semantics) ──
  readonly questionsForm = this.fb.group({
    questions: this.fb.array([]),
  });

  // ── Interview rounds (full replace semantics) ──
  readonly roundsForm = this.fb.group({
    rounds: this.fb.array([]),
  });

  constructor() {
    // Re-seed all forms whenever a new post detail arrives.
    effect(() => {
      const p = this.post();
      if (!p) return;

      this.marketingForm.reset({
        description: p.description ?? '',
        requirements: p.requirements ?? '',
        qualifications: p.qualifications ?? '',
      });

      this.configForm.reset({
        deadline: p.deadline ? new Date(p.deadline) : null,
        visibility: p.visibility,
        jobType: p.jobType,
      });

      this.questionsArray.clear({ emitEvent: false });
      for (const q of p.screeningQuestions ?? []) {
        this.questionsArray.push(this.fb.nonNullable.control(q.question ?? ''), { emitEvent: false });
      }
      this.questionsVersion.update((v) => v + 1);

      this.roundsArray.clear({ emitEvent: false });
      for (const r of [...(p.interviewRounds ?? [])].sort((a, b) => a.order - b.order)) {
        this.roundsArray.push(this.buildRoundGroup(r), { emitEvent: false });
      }
      this.roundsVersion.update((v) => v + 1);
    });
  }

  get questionsArray(): FormArray<ReturnType<typeof this.fb.nonNullable.control<string>>> {
    return this.questionsForm.controls.questions as FormArray<ReturnType<typeof this.fb.nonNullable.control<string>>>;
  }

  get roundsArray(): FormArray<any> {
    return this.roundsForm.controls.rounds as FormArray<any>;
  }

  addQuestion(): void {
    if (!this.isRecruiter()) return;
    this.questionsArray.push(this.fb.nonNullable.control(''));
    this.questionsVersion.update((v) => v + 1);
  }

  removeQuestion(index: number): void {
    if (!this.isRecruiter()) return;
    this.questionsArray.removeAt(index);
    this.questionsVersion.update((v) => v + 1);
  }

  buildRoundGroup(round?: Partial<CreateInterviewRoundDto>): any {
    return this.fb.group({
      name: [round?.name ?? ''],
      format: [round?.format ?? InterviewFormat.Video, Validators.required],
      estimatedDurationInMinutes: [round?.estimatedDurationInMinutes ?? 45, [
        Validators.required,
        Validators.min(5),
      ]],
    });
  }

  addRound(): void {
    if (!this.isRecruiter()) return;
    this.roundsArray.push(this.buildRoundGroup());
    this.roundsVersion.update((v) => v + 1);
  }

  removeRound(index: number): void {
    if (!this.isRecruiter()) return;
    this.roundsArray.removeAt(index);
    this.roundsVersion.update((v) => v + 1);
  }

  moveRound(index: number, direction: -1 | 1): void {
    if (!this.isRecruiter()) return;
    const target = index + direction;
    if (target < 0 || target >= this.roundsArray.length) return;
    const group = this.roundsArray.at(index);
    this.roundsArray.removeAt(index, { emitEvent: false });
    this.roundsArray.insert(target, group);
    this.roundsVersion.update((v) => v + 1);
  }

  saveMarketing(): void {
    if (!this.isRecruiter() || this.savingSection()) return;
    const value = this.marketingForm.getRawValue();
    const request: UpdateJobPostMarketingRequest = {
      description: value.description || null,
      requirements: value.requirements || null,
      qualifications: value.qualifications || null,
    };
    this.save('marketing', () => this.jobPostsService.updateMarketing(this.post().id, request));
  }

  saveConfig(): void {
    if (!this.isRecruiter() || this.savingSection()) return;
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }
    const value = this.configForm.getRawValue();
    const request: UpdateJobPostConfigRequest = {
      deadline: value.deadline ? value.deadline.toISOString() : null,
      visibility: value.visibility ?? PostingVisibility.Public,
      jobType: value.jobType ?? JobType.OnSite,
    };
    this.save('config', () => this.jobPostsService.updateConfiguration(this.post().id, request));
  }

  saveQuestions(): void {
    if (!this.isRecruiter() || this.savingSection()) return;
    const questions = this.questionsArray.controls
      .map((c) => c.value.trim())
      .filter((q) => q.length > 0);

    this.save(
      'questions',
      () => this.jobPostsService.configureScreeningQuestions(this.post().id, { questions }),
    );
  }

  saveRounds(): void {
    if (!this.isRecruiter() || this.savingSection()) return;
    if (this.roundsForm.invalid) {
      this.roundsForm.markAllAsTouched();
      return;
    }

    const raw = this.roundsArray.controls.map((g) => g.getRawValue() as CreateInterviewRoundDto);
    const rounds = raw.map((r, i) => ({
      name: r.name?.trim() || null,
      format: r.format,
      estimatedDurationInMinutes: r.estimatedDurationInMinutes,
      order: i + 1, // order is derived from list position
    }));

    const request: ConfigureInterviewRoundsRequest = { rounds };
    this.save('rounds', () => this.jobPostsService.configureInterviewRounds(this.post().id, request));
  }

  private save(section: string, call$: () => import('rxjs').Observable<{ isCompletedSuccessfully: boolean; message?: string | null }>): void {
    this.savingSection.set(section);
    call$().subscribe({
      next: () => {
        this.savingSection.set(null);
        this.saved.emit();
      },
      error: () => {
        this.savingSection.set(null);
      },
    });
  }
}
