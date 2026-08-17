import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, Role } from '../models/role.model';

interface AuthResponse {
  isCompletedSuccessfully: boolean;
  message: string;
  code: number;

  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailConfirmed: boolean;
    accessToken: string;
    roles: string[];
    accessTokenExpirationDate: string;
    refreshToken: string;
    refreshTokenExpirationDate: string;
  };
}
interface ConfirmEmailResponse {
  isCompletedSuccessfully: boolean;
  message: string;
  code: number;
}
const TOKEN_KEY = 'ath_token';
const USER_KEY = 'ath_user';

// Backend returns SCREAMING_SNAKE_CASE role names (see AmanTalentHunt.Domain.Enums.Roles);
// the frontend Role enum uses PascalCase. Translate at the boundary so hasRole()/roleGuard
// checks against Role.* actually match.
const BACKEND_ROLE_MAP: Record<string, Role> = {
  SUPER_ADMIN: Role.Admin,
  RECRUITER: Role.Recruiter,
  HR_MANAGER: Role.HRManager,
  DEPARTMENT_HEAD: Role.DepartmentHead,
  HIRING_MANAGER: Role.HiringManager,
  CANDIDATE: Role.Candidate,
};

function normalizeRole(raw: string): Role {
  return BACKEND_ROLE_MAP[raw] ?? (raw as Role);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiBase;

  private _currentUser = signal<CurrentUser | null>(this.loadUser());
  currentUser = this._currentUser.asReadonly();

  isLoggedIn = computed(() => this._currentUser() !== null);
  role = computed(() => this._currentUser()?.role ?? null);

  hasRole(...roles: Role[]): boolean {
    const r = this._currentUser()?.role;
    return !!r && roles.includes(r);
  }

  login(email: string, password: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(
    `${this.base}/api/Authentication/login`,
    { email, password }
  ).pipe(
    tap((res) => {

      const user: CurrentUser = {
        id: res.data.userId,
        fullName: `${res.data.firstName} ${res.data.lastName}`,
        email: res.data.email,
        role: normalizeRole(res.data.roles[0])
      };

      localStorage.setItem(
        TOKEN_KEY,
        res.data.accessToken
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
      );

      this._currentUser.set(user);
    }),
  );
}
  register(data: FormData): Observable<unknown> {
  return this.http.post(
    `${this.base}/api/Authentication/register`,
    data);
}

requestResetPassword(email: string): Observable<unknown> {
  return this.http.post(
    `${this.base}/api/Authentication/request-reset-password`,
    { email }
  );
}

  resetPassword(request: {
    email: string;
    otp: string;
    newPassword: string;
  }): Observable<unknown> {
    return this.http.post(
      `${this.base}/api/Authentication/reset-password`,
      request
    );
  }

  confirmEmail(
  request: { email: string; otp: string }
): Observable<ConfirmEmailResponse> {
  return this.http.post<ConfirmEmailResponse>(
    `${this.base}/api/Authentication/confirm-email`,
    request
  );
}

  resendConfirmationEmail(request: { email: string }): Observable<unknown> {
    return this.http.post(
      `${this.base}/api/Authentication/resend-confirmation-email`,
      request
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user: CurrentUser = JSON.parse(raw);
    // Self-heal sessions persisted before role normalization was added.
    user.role = normalizeRole(user.role);
    return user;
  }
}
