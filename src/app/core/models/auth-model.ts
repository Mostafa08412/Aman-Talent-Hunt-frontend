// ============================================================
// Authentication
// ============================================================

import { ResultWithData } from './common';

export type OTPPurpose = 'EmailConfirmation' | 'ResetPassword';

export interface LoginRequest {
  email?: string | null;
  password?: string | null;
}

export interface LoginResponse {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isEmailConfirmed: boolean;
  requiresResetPassword: boolean;
  accessToken?: string | null;
  roles?: string[] | null;
  accessTokenExpirationDate: string;
  refreshToken?: string | null;
  refreshTokenExpirationDate: string;
}

export type LoginResponseResult = ResultWithData<LoginResponse>;

export interface RefreshTokenRequest {
  refreshToken?: string | null;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  otpPurpose: OTPPurpose;
}

export interface RequestResetPasswordRequest {
  email?: string | null;
}

export interface ResetPasswordRequest {
  email?: string | null;
  otp?: string | null;
  newPassword?: string | null;
}

export interface ConfirmEmailRequest {
  email?: string | null;
  otp?: string | null;
}

export interface ResendConfirmationEmailRequest {
  email?: string | null;
}

export interface ChangeTempPasswordRequest {
  newPassword?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword?: string | null;
  newPassword?: string | null;
}