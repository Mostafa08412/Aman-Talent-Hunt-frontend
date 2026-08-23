import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import {
  PublicJobPostListItemDto,
  EmploymentType
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
  @Input() department = '';
  @Input() featured = false;

  get employmentLabel(): string {
    const map: Record<EmploymentType, string> = {
      [EmploymentType.FullTime]: 'Full-Time',
      [EmploymentType.PartTime]: 'Part-Time',
      [EmploymentType.Contract]: 'Contract',
      [EmploymentType.Intern]: 'Internship'
    };
    return map[this.job.employmentType] ?? this.job.employmentType;
  }

  get locationLabel(): string {
    return this.job.location;
  }
}
