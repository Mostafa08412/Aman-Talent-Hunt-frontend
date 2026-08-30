import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { DepartmentResponse } from '@core/models/admin-department-model';
import { DepartmentHeadScopeService } from '@core/services/department-head-scope.service';

@Component({
  selector: 'app-my-department',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, ProgressSpinnerModule],
  templateUrl: './my-department.component.html',
  styleUrl: './my-department.component.scss',
})
export class MyDepartmentComponent implements OnInit {
  private readonly scope = inject(DepartmentHeadScopeService);

  readonly department = signal<DepartmentResponse | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.scope.loadDepartment().subscribe({
      next: (dept) => {
        this.department.set(dept);
        this.isLoading.set(false);
      },
      error: () => {
        this.department.set(null);
        this.isLoading.set(false);
      },
    });
  }
}