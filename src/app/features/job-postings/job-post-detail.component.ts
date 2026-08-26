import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';

import { AdminJobPostsService } from '@core/services/admin-job-posts.service';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/role.model';
import { AdminJobPostDetailDto } from '@core/models/admin-job-post-model';

import { JobPostHeaderComponent } from './job-post-header.component';
import { PipelineTabComponent } from './pipeline-tab/pipeline-tab.component';
import { SubmittedTabComponent } from './submitted-tab/submitted-tab.component';
import { ApplicantsTabComponent } from './applicants-tab/applicants-tab.component';
import { InterviewsTabComponent } from './interviews-tab/interviews-tab.component';
import { SetupTabComponent } from './setup-tab/setup-tab.component';

/**
 * Job post detail page (guide §4): loads the detail once, renders the
 * header + 4 tabs; re-fetches after lifecycle actions.
 */
@Component({
  selector: 'app-job-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TabViewModule,
    JobPostHeaderComponent,
    PipelineTabComponent,
    SubmittedTabComponent,
    ApplicantsTabComponent,
    InterviewsTabComponent,
    SetupTabComponent,
  ],
  templateUrl: './job-post-detail.component.html',
  styleUrl: './job-post-detail.component.scss',
})
export class JobPostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobPostsService = inject(AdminJobPostsService);
  private readonly authService = inject(AuthService);

  readonly post = signal<AdminJobPostDetailDto | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTabIndex = signal(0);

  readonly postId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  readonly isRecruiter = this.authService.hasRole(Role.Recruiter);
  /** Stage moves: RECRUITER, HR_MANAGER, SUPER_ADMIN (guide §5.4/§5.6). */
  readonly canManageStages =
    this.authService.hasRole(Role.Recruiter) ||
    this.authService.hasRole(Role.HRManager) ||
    this.authService.hasRole(Role.SuperAdmin);

  constructor() {
    this.load();
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    const id = this.postId();
    if (!id) {
      this.errorMessage.set('No job post id provided.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.jobPostsService.getById(id).subscribe({
      next: (res) => {
        if (res.data) {
          this.post.set(res.data);
          this.errorMessage.set(null);
        } else {
          this.post.set(null);
          this.errorMessage.set(res.message ?? null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.post.set(null);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/console/postings']);
  }
}
