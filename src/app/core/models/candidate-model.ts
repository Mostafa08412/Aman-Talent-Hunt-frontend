// ============================================================
// Candidate Profile
// ============================================================

import { CandidateApplicationsDTO, MilitaryStatus, ResultWithData } from ".";

export interface CandidateProfileDto {
  id: string; // uuid
  referenceNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  militaryStatus: MilitaryStatus;
  linkedInProfile?: string | null;
  joinedAt: string; // date-time
  resumeId: string; // uuid
  resumeFileName?: string | null;
  applications?: CandidateApplicationsDTO[] | null;
}

export type CandidateProfileDtoResult =
  ResultWithData<CandidateProfileDto>;

export interface UpdateCandidateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  militaryStatus?: MilitaryStatus;
  linkedInProfile?: string | null;
}
