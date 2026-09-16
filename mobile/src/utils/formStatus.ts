/**
 * Shared form-status computation (AC12): every form (sub-form or child form)
 * computes status from its required questions:
 *  - Not Started: all required fields empty
 *  - In Progress: at least one required field answered, not all
 *  - Completed: all required fields answered with valid data
 *
 * Also implements AC11's OR-logic exception for Generic Performance
 * (see computeOrGroupStatus) and AC27's "one mandatory question per
 * form/sub-title" rule for child forms (see computeOneRequiredStatus).
 */
import type { FormStatusValue } from '../types/models';

export function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return true;
}

/** AC12 — AND logic: every required field must be filled to be Completed. */
export function computeAndGroupStatus(
  requiredValues: unknown[],
): FormStatusValue {
  if (requiredValues.length === 0) return 'Not Started';
  const filledCount = requiredValues.filter(isFilled).length;
  if (filledCount === 0) return 'Not Started';
  if (filledCount === requiredValues.length) return 'Completed';
  return 'In Progress';
}

/**
 * AC11 — OR logic across sub-sections: Generic Performance is Completed
 * when ANY ONE of its 10 sub-sections is itself Completed (not all).
 */
export function computeOrGroupStatus(
  subSectionStatuses: FormStatusValue[],
): FormStatusValue {
  if (subSectionStatuses.some(s => s === 'Completed')) return 'Completed';
  if (subSectionStatuses.some(s => s === 'In Progress')) return 'In Progress';
  return 'Not Started';
}

/**
 * AC27 — child forms (and Form 201-CIVILS's sub-titles) need only ONE
 * mandatory question answered to be Completed; other questions are optional
 * and don't block completion, but an answered-but-invalid mandatory field
 * still counts as In Progress.
 */
export function computeOneRequiredStatus(
  mandatoryValue: unknown,
  anyOptionalAnswered: boolean,
): FormStatusValue {
  if (isFilled(mandatoryValue)) return 'Completed';
  if (anyOptionalAnswered) return 'In Progress';
  return 'Not Started';
}

export function isValidEmail(value: string): boolean {
  if (!value) return true; // optional fields are valid when empty
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function hasNoEmojis(value: string): boolean {
  // Broad emoji/pictograph range check
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  return !emojiRegex.test(value);
}

export function isAlphabeticOnly(value: string): boolean {
  if (!value) return true;
  return /^[A-Za-z\s]+$/.test(value);
}

export function isNumericOnly(value: string): boolean {
  if (!value) return true;
  return /^[0-9]+$/.test(value);
}

export function isExactDigits(value: string, length: number): boolean {
  return new RegExp(`^[0-9]{${length}}$`).test(value);
}

export function isAlphanumeric(value: string): boolean {
  if (!value) return true;
  return /^[A-Za-z0-9\s]+$/.test(value);
}

export function isPresentOrFuture(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() >= Date.now() - 60000; // allow small clock skew
}
