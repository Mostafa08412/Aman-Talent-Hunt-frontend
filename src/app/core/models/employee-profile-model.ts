import type { ResultWithData } from './common';

export interface EmployeeProfileDto {
  id: string;
  referenceNumber?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  joinedAt: string; // DateTimeOffset ISO
  positionRegistryId: string;
  jobTitle: string;
  squadId?: string | null;
  squadName?: string | null;
  isDeparting: boolean;
}

export type EmployeeProfileDtoResult = ResultWithData<EmployeeProfileDto>;

export interface UpdateEmployeeProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}
