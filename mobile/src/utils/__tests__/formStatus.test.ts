/**
 * formStatus.ts — shared status-computation + per-field validation helpers
 * used across every screen with real per-field validation logic from
 * acs.md (AC11, AC12, AC27). Exercised indirectly through the screens
 * above; this file adds direct unit coverage for the pure functions
 * themselves (required-field checks, format rules) since they are easy to
 * get subtly wrong (boundary conditions, regex edge cases) and every screen
 * depends on them being right.
 */
import {
  isFilled,
  computeAndGroupStatus,
  computeOrGroupStatus,
  computeOneRequiredStatus,
  isValidEmail,
  hasNoEmojis,
  isAlphabeticOnly,
  isNumericOnly,
  isExactDigits,
  isAlphanumeric,
  isPresentOrFuture,
} from '../formStatus';

describe('isFilled', () => {
  it('treats null/undefined as not filled', () => {
    expect(isFilled(null)).toBe(false);
    expect(isFilled(undefined)).toBe(false);
  });

  it('treats an empty/whitespace-only string as not filled', () => {
    expect(isFilled('')).toBe(false);
    expect(isFilled('   ')).toBe(false);
  });

  it('treats a non-empty string as filled', () => {
    expect(isFilled('x')).toBe(true);
  });

  it('treats an empty array as not filled, non-empty array as filled', () => {
    expect(isFilled([])).toBe(false);
    expect(isFilled([1])).toBe(true);
  });

  it('treats any boolean as filled (including false)', () => {
    expect(isFilled(true)).toBe(true);
    expect(isFilled(false)).toBe(true);
  });
});

describe('computeAndGroupStatus (AC12 — AND logic)', () => {
  it('is Not Started when the list is empty', () => {
    expect(computeAndGroupStatus([])).toBe('Not Started');
  });

  it('is Not Started when nothing is filled', () => {
    expect(computeAndGroupStatus(['', '', ''])).toBe('Not Started');
  });

  it('is In Progress when some but not all are filled', () => {
    expect(computeAndGroupStatus(['x', '', ''])).toBe('In Progress');
  });

  it('is Completed when every value is filled', () => {
    expect(computeAndGroupStatus(['x', 'y', 'z'])).toBe('Completed');
  });
});

describe('computeOrGroupStatus (AC11 — OR logic across sub-sections)', () => {
  it('is Completed if ANY sub-section is Completed, regardless of the others', () => {
    expect(computeOrGroupStatus(['Not Started', 'Completed', 'In Progress'])).toBe('Completed');
  });

  it('is In Progress if none are Completed but at least one is In Progress', () => {
    expect(computeOrGroupStatus(['Not Started', 'In Progress', 'Not Started'])).toBe('In Progress');
  });

  it('is Not Started when every sub-section is Not Started', () => {
    expect(computeOrGroupStatus(['Not Started', 'Not Started'])).toBe('Not Started');
  });
});

describe('computeOneRequiredStatus (AC27 — one mandatory question per form)', () => {
  it('is Completed once the mandatory value is filled, regardless of optional answers', () => {
    expect(computeOneRequiredStatus('answered', false)).toBe('Completed');
    expect(computeOneRequiredStatus('answered', true)).toBe('Completed');
  });

  it('is In Progress when the mandatory value is empty but some optional field is answered', () => {
    expect(computeOneRequiredStatus('', true)).toBe('In Progress');
  });

  it('is Not Started when nothing at all is answered', () => {
    expect(computeOneRequiredStatus('', false)).toBe('Not Started');
  });
});

describe('isValidEmail', () => {
  it('treats an empty value as valid (optional-when-empty)', () => {
    expect(isValidEmail('')).toBe(true);
  });

  it('accepts a well-formed email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects a value with no @ or no domain', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@nodot')).toBe(false);
  });
});

describe('hasNoEmojis', () => {
  it('accepts plain text with no emoji/pictograph characters', () => {
    expect(hasNoEmojis('Hello World 123')).toBe(true);
  });

  it('rejects text containing an emoji', () => {
    expect(hasNoEmojis('Hello 🎉')).toBe(false);
  });
});

describe('isAlphabeticOnly', () => {
  it('treats an empty value as valid (optional-when-empty)', () => {
    expect(isAlphabeticOnly('')).toBe(true);
  });

  it('accepts letters and spaces only', () => {
    expect(isAlphabeticOnly('John Smith')).toBe(true);
  });

  it('rejects digits', () => {
    expect(isAlphabeticOnly('John123')).toBe(false);
  });
});

describe('isNumericOnly', () => {
  it('treats an empty value as valid', () => {
    expect(isNumericOnly('')).toBe(true);
  });

  it('accepts digits only', () => {
    expect(isNumericOnly('1234567890')).toBe(true);
  });

  it('rejects letters', () => {
    expect(isNumericOnly('123abc')).toBe(false);
  });
});

describe('isExactDigits', () => {
  it('accepts a string of exactly the required digit length', () => {
    expect(isExactDigits('1234567890', 10)).toBe(true);
  });

  it('rejects a string shorter or longer than the required length', () => {
    expect(isExactDigits('123', 10)).toBe(false);
    expect(isExactDigits('12345678901', 10)).toBe(false);
  });

  it('rejects non-digit characters even at the right length', () => {
    expect(isExactDigits('12345abcde', 10)).toBe(false);
  });
});

describe('isAlphanumeric', () => {
  it('treats an empty value as valid', () => {
    expect(isAlphanumeric('')).toBe(true);
  });

  it('accepts letters, digits, and spaces', () => {
    expect(isAlphanumeric('Fixed issue 123')).toBe(true);
  });

  it('rejects punctuation/symbols', () => {
    expect(isAlphanumeric('Fixed! issue #123')).toBe(false);
  });
});

describe('isPresentOrFuture', () => {
  it('rejects a null date', () => {
    expect(isPresentOrFuture(null)).toBe(false);
  });

  it('accepts the current time (within clock-skew tolerance)', () => {
    expect(isPresentOrFuture(new Date())).toBe(true);
  });

  it('accepts a future date', () => {
    expect(isPresentOrFuture(new Date(Date.now() + 60_000))).toBe(true);
  });

  it('rejects a date well in the past', () => {
    expect(isPresentOrFuture(new Date(Date.now() - 10 * 60_000))).toBe(false);
  });
});
