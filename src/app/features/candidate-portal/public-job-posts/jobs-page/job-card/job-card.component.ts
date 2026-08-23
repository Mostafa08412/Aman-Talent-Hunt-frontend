import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
  PublicJobPostListItemDto,
  EmploymentType,
  JobType,
  SeniorityLevel
} from '@core/models';

@Component({
  selector: 'app-job-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TagModule],
  templateUrl: './job-card.component.html',
  styleUrl: './job-card.component.scss'
})
export class JobCardComponent {
  @Input({ required: true }) job!: PublicJobPostListItemDto;

  get employmentLabel(): string {
    const map: Record<EmploymentType, string> = {
      [EmploymentType.FullTime]: 'Full-Time',
      [EmploymentType.PartTime]: 'Part-Time',
      [EmploymentType.Contract]: 'Contract',
      [EmploymentType.Intern]: 'Internship'
    };
    return map[this.job.employmentType] ?? this.job.employmentType;
  }

  get jobTypeLabel(): string {
    const map: Record<JobType, string> = {
      [JobType.OnSite]: 'On-site',
      [JobType.Hybrid]: 'Hybrid',
      [JobType.Remote]: 'Remote'
    };
    return map[this.job.jobType] ?? this.job.jobType;
  }

  get seniorityLabel(): string {
    return this.job.seniorityLevel;
  }

  get locationLabel(): string {
    return this.job.location;
  }

  get postedLabel(): string {
    const posted = new Date(this.job.createdAtUTC);
    const days = Math.floor((Date.now() - posted.getTime()) / 86_400_000);
    if (days <= 0) return 'Posted today';
    if (days === 1) return 'Posted yesterday';
    if (days < 30) return `Posted ${days} days ago`;
    const months = Math.floor(days / 30);
    return `Posted ${months} month${months === 1 ? '' : 's'} ago`;
  }
}
