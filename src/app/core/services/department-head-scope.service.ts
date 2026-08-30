import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AdminDepartmentsService } from './admin-departments.service';
import { DepartmentResponse } from '@core/models/admin-department-model';

/**
 * Resolves the department headed by the current user from the backend
 * (GET /api/admin/departments/head). Used by the Department Head's
 * "My Department" page and the squad-detail guard to keep access scoped
 * to the head's own department.
 */
@Injectable({ providedIn: 'root' })
export class DepartmentHeadScopeService {
  private readonly departmentsService = inject(AdminDepartmentsService);

  /**
   * Loads the current user's department. Returns the department when the user
   * is the head of one, or `null` when no department is assigned yet.
   */
  loadDepartment(): Observable<DepartmentResponse | null> {
    return this.departmentsService.getHeadDepartment().pipe(
      map((res) => {
        if (!res.isCompletedSuccessfully) return null;
        return res.data && res.data.id ? res.data : null;
      }),
    );
  }
}