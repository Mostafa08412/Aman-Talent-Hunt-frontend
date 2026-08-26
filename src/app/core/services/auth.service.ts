import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, Role } from '../models/role.model';
import { Result, ResultWithData } from '../models/common';
import {
  ChangePasswordRequest,
  ChangeTempPasswordRequest,
  ConfirmEmailRequest,
  LoginResponse,
  LoginResponseResult,
  RefreshTokenRequest,
  RequestResetPasswordRequest,
  ResendConfirmationEmailRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '../models/auth-model';

/* -------------------------------------------------------------------------- */
/* Session storage keys                                                        */
/* -------------------------------------------------------------------------- */

const TOKEN_KEY = 'ath_token';
const REFRESH_TOKEN_KEY = 'ath_refresh_token';
const TOKEN_EXPIRATION_KEY = 'ath_token_expiration';
const REFRESH_EXPIRATION_KEY = 'ath_refresh_expiration';
const USER_KEY = 'ath_user';

/* -------------------------------------------------------------------------- */
/* Role translation                                                            */
/*                                                                             */
/* Backend returns SCREAMING_SNAKE_CASE role names (see                         */
/* AmanTalentHunt.Domain.Enums.Roles); the frontend Role enum uses PascalCase. */
/* Translate at the boundary so hasRole()/roleGuard checks against Role.*      */
/* actually match.                                                             */
/* -------------------------------------------------------------------------- */

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

function normalizeRoles(raw?: string[] | null): Role[] {
  return (raw ?? []).map(normalizeRole);
}

/* -------------------------------------------------------------------------- */
/* Service                                                                     */
/* -------------------------------------------------------------------------- */

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiBase;

  private _currentUser = signal<CurrentUser | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();

  private _requiresPasswordChange = signal(false);
  readonly requiresPasswordChange = this._requiresPasswordChange.asReadonly();

  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly role = computed(() => this._currentUser()?.role ?? null);

  hasRole(...roles: Role[]): boolean {
    const r = this._currentUser()?.role;
    return !!r && roles.includes(r);
  }

  /** Patch the locally stored session user (e.g. after a self-service profile rename). */
  updateLocalUser(patch: Partial<CurrentUser>): void {
    const current = this._currentUser();
    if (!current) return;
    const updated: CurrentUser = { ...current, ...patch };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this._currentUser.set(updated);
  }

  /** Sync resume info from profile API into the local session. */
  updateLocalResume(resumeId: string | null | undefined, resumeFileName: string | null | undefined): void {
    this.updateLocalUser({
      resumeId: resumeId ?? undefined,
      resumeFileName: resumeFileName ?? undefined,
    });
  }

  /** Resume info from the cached session (avoids extra API call). */
  getResumeId(): string | undefined {
    return this._currentUser()?.resumeId;
  }

  getResumeFileName(): string | undefined {
    return this._currentUser()?.resumeFileName;
  }

hasResume(): boolean {
    const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
    const u = this._currentUser();

    const resumeId = u?.resumeId;
    const hasValidId = resumeId && resumeId.toLowerCase() !== EMPTY_GUID;
    const hasFileName = !!u?.resumeFileName;

    return !!(hasValidId || hasFileName);
  }

  /* ── Session helpers ── */

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getTokenExpiration(): string | null {
    return localStorage.getItem(TOKEN_EXPIRATION_KEY);
  }

  private applySession(data: LoginResponse): void {
    const roles = normalizeRoles(data.roles);
    const user: CurrentUser = {
      id: data.userId,
      fullName: `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim(),
      email: data.email ?? '',
      role: roles[0] ?? Role.Candidate,
    };

    localStorage.setItem(TOKEN_KEY, data.accessToken ?? '');
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken ?? '');
    localStorage.setItem(TOKEN_EXPIRATION_KEY, data.accessTokenExpirationDate);
    localStorage.setItem(REFRESH_EXPIRATION_KEY, data.refreshTokenExpirationDate);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    this._currentUser.set(user);
    this._requiresPasswordChange.set(data.requiresResetPassword);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRATION_KEY);
    localStorage.removeItem(REFRESH_EXPIRATION_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this._requiresPasswordChange.set(false);
  }

  private loadUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as CurrentUser;
      // Self-heal sessions persisted before role normalization was added.
      user.role = normalizeRole(user.role);
      return user;
    } catch {
      return null;
    }
  }

  /* ── Authentication endpoints ── */

  login(email: string, password: string): Observable<LoginResponseResult> {
    return this.http
      .post<LoginResponseResult>(`${this.base}/api/Authentication/login`, { email, password })
      .pipe(
        tap((res) => {
          if (res.data) this.applySession(res.data);
        }),
      );
  }

  refreshAccessToken(): Observable<LoginResponseResult> {
    return this.http
      .post<LoginResponseResult>(`${this.base}/api/Authentication/refresh-token`, {
        refreshToken: this.getRefreshToken(),
      } satisfies RefreshTokenRequest)
      .pipe(
        tap((res) => {
          if (res.data) this.applySession(res.data);
        }),
      );
  }

  register(data: FormData): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/Authentication/register`, data);
  }

  verifyOtp(request: VerifyOtpRequest): Observable<ResultWithData<boolean>> {
    return this.http.post<ResultWithData<boolean>>(
      `${this.base}/api/Authentication/verify-otp`,
      request,
    );
  }

  requestResetPassword(
    request: RequestResetPasswordRequest,
  ): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/Authentication/request-reset-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/Authentication/reset-password`, request);
  }

  confirmEmail(request: ConfirmEmailRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/Authentication/confirm-email`, request);
  }

  resendConfirmationEmail(request: ResendConfirmationEmailRequest): Observable<Result> {
    return this.http.post<Result>(
      `${this.base}/api/Authentication/resend-confirmation-email`,
      request,
    );
  }

  changeTempPassword(request: ChangeTempPasswordRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/Authentication/change-temp-password`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<Result> {
    return this.http.post<Result>(`${this.base}/api/Authentication/change-password`, request);
  }

  logout(): void {
    // Best-effort server-side refresh-token invalidation; always clear local state
    // even if the call fails (e.g. token already expired).
    this.http
      .post<Result>(`${this.base}/api/Authentication/logout`, {})
      .pipe(finalize(() => { this.clearSession();  this.router.navigate(['/login']); }))
      .subscribe({
        error: () => this.clearSession(),
      });

  }
}
