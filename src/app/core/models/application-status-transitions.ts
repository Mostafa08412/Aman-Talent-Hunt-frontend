import { ApplicationStatus } from './enums';

// ── Terminal statuses (no transitions out) ────────────────────────
export const TERMINAL_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
  ApplicationStatus.OfferDeclined,
  ApplicationStatus.Hired,
];

export function isTerminal(status: ApplicationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// ── Valid forward transitions (happy-path pipeline) ───────────────
const VALID_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  [ApplicationStatus.Submitted]:          [ApplicationStatus.Screened, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.Screened]:           [ApplicationStatus.Shortlisted, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.Shortlisted]:        [ApplicationStatus.InterviewScheduled, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.InterviewScheduled]: [ApplicationStatus.InterviewScheduled, ApplicationStatus.InterviewCompleted, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.InterviewCompleted]: [ApplicationStatus.OfferExtended, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.OfferExtended]:      [ApplicationStatus.OfferAccepted, ApplicationStatus.OfferDeclined, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.OfferAccepted]:      [ApplicationStatus.Hired, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
  [ApplicationStatus.Hired]:              [],
  [ApplicationStatus.Rejected]:           [],
  [ApplicationStatus.Withdrawn]:          [],
  [ApplicationStatus.OfferDeclined]:      [],
};

/** Check if a transition from `from` → `to` is allowed. */
export function isValidTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (isTerminal(from)) return false;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** All statuses a candidate can transition to from `from`. */
export function nextStatuses(from: ApplicationStatus): readonly ApplicationStatus[] {
  if (isTerminal(from)) return [];
  return VALID_TRANSITIONS[from] ?? [];
}
