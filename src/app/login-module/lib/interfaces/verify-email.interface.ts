/** Outcome of a request for a new confirmation link. */
export type ResendOutcome =
  | { kind: 'sent' }
  | { kind: 'throttled'; minutes: number }
  | { kind: 'too_many_attempts' }
  | { kind: 'wrong_credentials' }
  | { kind: 'already_verified' }
  | { kind: 'error' };
