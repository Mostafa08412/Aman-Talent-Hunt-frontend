// ============================================================
// Enums
// ============================================================

export enum ApplicationSource {
  LinkedIn = 'LinkedIn',
  Wuzzuf = 'Wuzzuf',
  Portal = 'Portal'
}

export enum ApplicationStatus {
  Submitted = 'Submitted',
  Screened = 'Screened',
  Shortlisted = 'Shortlisted',
  InterviewScheduled = 'InterviewScheduled',
  InterviewCompleted = 'InterviewCompleted',
  OfferExtended = 'OfferExtended',
  OfferAccepted = 'OfferAccepted',
  Hired = 'Hired',
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn',
  OfferDeclined = 'OfferDeclined'
}

export enum EmploymentType {
  FullTime = 'FullTime',
  PartTime = 'PartTime',
  Contract = 'Contract',
  Intern = 'Intern'
}

export enum InterviewFormat {
  InPerson = 'InPerson',
  Video = 'Video',
  Phone = 'Phone',
  Panel = 'Panel'
}

export enum InterviewStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Rescheduled = 'Rescheduled'
}

export enum InterviewResult {
  PendingFeedback = 'PendingFeedback',
  Passed = 'Passed',
  Failed = 'Failed'
}

export enum JobType {
  OnSite = 'OnSite',
  Hybrid = 'Hybrid',
  Remote = 'Remote'
}

export enum Location {
  Cairo = 'Cairo',
  Giza = 'Giza',
  Alexandria = 'Alexandria',
  Riyadh = 'Riyadh'
}

export enum MilitaryStatus {
  NotApplicable = 'NotApplicable',
  Completed = 'Completed',
  Exempted = 'Exempted',
  Postponed = 'Postponed',
  NotRequired = 'NotRequired',
  CurrentlyServing = 'CurrentlyServing',
  OnReserve = 'OnReserve'
}

export enum SeniorityLevel {
  Intern = 'Intern',
  Fresh = 'Fresh',
  MidLevel = 'MidLevel',
  Junior = 'Junior',
  Senior = 'Senior'
}

export enum HiringType {
  Replacement = 'Replacement',
  NewPosition = 'NewPosition',
  Backfill = 'Backfill'
}

export enum JobDescriptionStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export enum JobPostStatus {
  Draft = 'Draft',
  Published = 'Published',
  Closed = 'Closed',
  Filled = 'Filled',
  OnHold = 'OnHold'
}

export enum PlanQuarter {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
  FullYear = 'FullYear'
}

export enum PlanStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Active = 'Active',
  Fulfilled = 'Fulfilled',
  Closed = 'Closed'
}

export enum PostingVisibility {
  Public = 'Public',
  InternalOnly = 'InternalOnly'
}

export enum RequisitionAction {
  OnHold = 'OnHold',
  Resume = 'Resume',
  Cancel = 'Cancel'
}

export enum RequisitionStatus {
  Draft = 'Draft',
  PendingBudgetApproval = 'PendingBudgetApproval',
  PendingAttachingJD = 'PendingAttachingJD',
  PendingJDApproval = 'PendingJDApproval',
  PendingHRManagerApproval = 'PendingHRManagerApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Published = 'Published',
  Fulfilled = 'Fulfilled',
  OnHold = 'OnHold',
  Closed = 'Closed'
}

export enum UserStatus {
  Active = 'Active',
  Locked = 'Locked'
}

export enum Roles {
  SuperAdmin = 'SUPER_ADMIN',
  Recruiter = 'RECRUITER',
  HRManager = 'HR_MANAGER',
  DepartmentHead = 'DEPARTMENT_HEAD',
  HiringManager = 'HIRING_MANAGER',
  Candidate = 'CANDIDATE'
}
