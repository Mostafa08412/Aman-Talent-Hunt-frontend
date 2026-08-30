import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuModule } from 'primeng/menu';
import { MessageService } from 'primeng/api';

import { AdminJobPostsService } from '@core/services/admin-job-posts.service';
import { AdminEmployeesService } from '@core/services/admin-employees.service';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/role.model';
import { ApplicationSource } from '@core/models/enums';
import { AdminJobPostDetailDto } from '@core/models/admin-job-post-model';
import { APPLICATION_SOURCES, buildSourceLink } from '@core/utils/application-source.util';

import { StatusBadgeComponent, humanizeEnum } from './shared/status-badge.component';

type LifecycleAction = 'publish' | 'hold' | 'resume' | 'close' | 'mark-filled';

/**
 * Job post header: title + status badge + meta row + role/status-aware
 * lifecycle actions (guide §4.1–§4.2).
 */
@Component({
  selector: 'app-job-post-header',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    MenuModule,
    StatusBadgeComponent,
  ],
  templateUrl: './job-post-header.component.html',
  styleUrl: './job-post-header.component.scss',
})
export class JobPostHeaderComponent {
  private readonly jobPostsService = inject(AdminJobPostsService);
  private readonly employeesService = inject(AdminEmployeesService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly post = input.required<AdminJobPostDetailDto>();
  readonly back = output<void>();
  /** Parent must reload the detail after any successful mutation. */
  readonly changed = output<void>();

  readonly acting = signal<LifecycleAction | 'extend-deadline' | 'assign-recruiter' | null>(null);

  readonly deadlineDialogVisible = signal(false);
  readonly assignDialogVisible = signal(false);
  readonly recruitersLoading = signal(false);
  readonly recruiters = signal<{ id: string; viewText: string | null; secondaryText: string | null }[]>([]);

  /** Generate Link modal (source-tagged apply links). */
  readonly linkDialogVisible = signal(false);
  readonly linkSource = signal<ApplicationSource | null>(null);
  readonly linkCopied = signal(false);
  readonly APPLICATION_SOURCES = APPLICATION_SOURCES;

  readonly deadlineForm = this.fb.group({
    newDeadline: this.fb.control<Date | null>(null, Validators.required),
  });

  readonly assignForm = this.fb.group({
    recruiterId: this.fb.nonNullable.control<string>('', Validators.required),
  });

  recruiterSearchTerm = '';
  readonly minDate = new Date();

  private searchTimeout?: ReturnType<typeof setTimeout>;

  readonly isRecruiter = this.authService.hasRole(Role.Recruiter);
  readonly canExtendDeadline =
    this.authService.hasRole(Role.Recruiter) || this.authService.hasRole(Role.SuperAdmin);
  readonly canAssignRecruiter =
    this.authService.hasRole(Role.Recruiter) ||
    this.authService.hasRole(Role.SuperAdmin) ||
    this.authService.hasRole(Role.HRManager);
  readonly canGenerateLink =
    this.authService.hasRole(Role.Recruiter) ||
    this.authService.hasRole(Role.HiringManager) ||
    this.authService.hasRole(Role.HRManager) ||
    this.authService.hasRole(Role.SuperAdmin);

  /** Extra header actions (guide §4.2 — Assign Recruiter is any-stage). */
  readonly moreItems = [
    { label: 'Assign Recruiter', icon: 'pi pi-user-plus', command: () => this.openAssignDialog() },
  ];

  protected readonly enumLabel = humanizeEnum;

  openLinkDialog(): void {
    this.linkSource.set(null);
    this.linkCopied.set(false);
    this.linkDialogVisible.set(true);
  }

  selectLinkSource(source: ApplicationSource): void {
    this.linkSource.set(source);
    this.linkCopied.set(false);
  }

  /** The generated URL for the selected source (empty until a source is picked). */
  linkUrlFor(source: ApplicationSource): string {
    return buildSourceLink(this.post().id, source);
  }

  copyLink(): void {
    const source = this.linkSource();
    if (!source) return;
    const url = buildSourceLink(this.post().id, source);
    navigator.clipboard?.writeText(url).then(() => {
      this.linkCopied.set(true);
      this.messageService.add({
        severity: 'success',
        summary: 'Link copied',
        detail: `${source} apply link copied to clipboard.`,
      });
    });
  }

  openAssignDialog(): void {
    this.assignForm.reset({ recruiterId: '' });
    this.recruiterSearchTerm = '';
    this.recruiters.set([]);
    this.assignDialogVisible.set(true);
    this.loadRecruiters('');
  }

  searchRecruiters(term: string): void {
    this.recruiterSearchTerm = term;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (term.length < 2) {
      this.recruiters.set([]);
      return;
    }
    this.searchTimeout = setTimeout(() => this.loadRecruiters(term), 300);
  }

  private loadRecruiters(search: string): void {
    this.recruitersLoading.set(true);
    this.employeesService
      .getLookup({
        squadLeaderId: this.authService.currentUser()?.id,
        Search: search || undefined,
        PageSize: 10,
      })
      .subscribe({
        next: (res) => {
          this.recruiters.set(res.data?.items ?? []);
          this.recruitersLoading.set(false);
        },
        error: () => {
          this.recruiters.set([]);
          this.recruitersLoading.set(false);
        },
      });
  }

  runLifecycle(action: LifecycleAction): void {
    const id = this.post().id;
    this.acting.set(action);

    const call$ =
      action === 'publish'
        ? this.jobPostsService.publish(id)
        : action === 'hold'
          ? this.jobPostsService.hold(id)
          : action === 'resume'
            ? this.jobPostsService.resume(id)
            : action === 'close'
              ? this.jobPostsService.close(id)
              : this.jobPostsService.markFilled(id);

    call$.subscribe({
      next: () => {
        this.acting.set(null);
        this.changed.emit();
      },
      error: () => {
        this.acting.set(null);
      },
    });
  }

  extendDeadline(): void {
    if (this.deadlineForm.invalid) {
      this.deadlineForm.markAllAsTouched();
      return;
    }
    const newDeadline = this.deadlineForm.controls.newDeadline.value!;
    this.acting.set('extend-deadline');
    this.jobPostsService
      .extendDeadline(this.post().id, { newDeadline: newDeadline.toISOString() })
      .subscribe({
        next: () => {
          this.acting.set(null);
          this.deadlineDialogVisible.set(false);
          this.changed.emit();
        },
        error: () => {
          this.acting.set(null);
        },
      });
  }

  assignRecruiter(): void {
    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    const recruiterId = this.assignForm.controls.recruiterId.value;
    this.acting.set('assign-recruiter');
    this.jobPostsService
      .assignRecruiter(this.post().id, { recruiterEmployeeId: recruiterId })
      .subscribe({
        next: () => {
          this.acting.set(null);
          this.assignDialogVisible.set(false);
          this.changed.emit();
        },
        error: () => {
          this.acting.set(null);
        },
      });
  }
}
