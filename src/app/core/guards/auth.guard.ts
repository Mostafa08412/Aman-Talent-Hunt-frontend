import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { DepartmentHeadScopeService } from '../services/department-head-scope.service';
import { Role } from '../models/role.model';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const roleGuard = (allowed: Role[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.hasRole(...allowed)) {
      router.navigate(['/forbidden']);
      return false;
    }
    return true;
  };
};

export const guestRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }
  return true;
};

/**
 * For Department Head only: allows opening a squad detail page only when the
 * squad belongs to the department headed by the current user. Other roles
 * always pass through (existing Admin/SuperAdmin roleGuard still applies).
 */
export const departmentHeadSquadGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.role() !== Role.DepartmentHead) {
    return true;
  }

  const scope = inject(DepartmentHeadScopeService);
  const squadId = _route.paramMap.get('id');
  if (!squadId) {
    router.navigate(['/forbidden']);
    return false;
  }

  return scope.loadDepartment().pipe(
    map((dept) => {
      const allowed = !!dept && !!dept.squads?.some((squad) => squad.id === squadId);
      if (!allowed) router.navigate(['/forbidden']);
      return allowed;
    }),
  );
};
