/**
 * AC14 — "Incomplete Click" behavior.
 *
 * Extracted from `GenericChecklistFormScreen.tsx`'s original inline
 * `highlightIndex`/`fieldOffsets`/`jumpToIncomplete()` implementation
 * (the only place this behavior existed before this pass), so every
 * screen can share one implementation instead of re-writing it.
 *
 * Mechanism (unchanged from the original inline version):
 *  - The caller gives an ordered list of fields, each `{ key, required,
 *    value }` (or `{ key, required, valid }` — see `isFieldComplete`
 *    below). A field counts as "incomplete" when it is `required` and its
 *    value is empty/not filled (mirrors `isFilled()` in `formStatus.ts`,
 *    duplicated locally to keep this hook dependency-free) or explicitly
 *    marked `valid: false`.
 *  - `scrollRef` must be attached to the screen's `ScrollView`.
 *  - Each rendered field wraps itself in a `<View onLayout={...}>` and
 *    calls `registerOffset(index, e.nativeEvent.layout.y)` so the hook
 *    knows where every field sits without the screen managing its own
 *    ref array.
 *  - `highlightIndex` drives the "this field is highlighted" style, exactly
 *    like the original `i === highlightIndex` check.
 *  - `goToFirstIncomplete()` (renamed from the original screen-local
 *    `jumpToIncomplete()`, same behavior) finds the first incomplete
 *    field in list order, sets it as `highlightIndex`, and scrolls the
 *    attached ScrollView to its recorded offset — matching the original
 *    exactly for the single-mandatory-field case (where "first incomplete"
 *    and "the one mandatory field" are the same field), and generalizing
 *    correctly to screens with more than one required field.
 *  - `hasIncomplete` mirrors the original screen's `status !== 'Completed'`
 *    gate for showing the "Go to required field" link, computed directly
 *    from the field list so screens don't need to re-derive it.
 */
import { useMemo, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

export interface IncompleteFieldDescriptor {
  /** Stable identifier for the field (used only for clarity/debugging). */
  key: string;
  /** Whether this field is required for completion. */
  required: boolean;
  /** The field's current value — emptiness is checked the same way as `isFilled()`. */
  value: unknown;
  /** Optional: set false to mark an answered-but-invalid value as incomplete. */
  valid?: boolean;
}

function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return true;
}

function isFieldComplete(field: IncompleteFieldDescriptor): boolean {
  if (!field.required) return true;
  if (!isFieldFilled(field.value)) return false;
  return field.valid !== false;
}

export function useIncompleteFieldHighlight(fields: IncompleteFieldDescriptor[]) {
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const fieldOffsets = useRef<number[]>([]);

  const firstIncompleteIndex = useMemo(() => {
    const idx = fields.findIndex(f => !isFieldComplete(f));
    return idx === -1 ? null : idx;
  }, [fields]);

  const hasIncomplete = firstIncompleteIndex !== null;

  function registerOffset(index: number, y: number) {
    fieldOffsets.current[index] = y;
  }

  function goToFirstIncomplete() {
    const idx = firstIncompleteIndex ?? 0;
    setHighlightIndex(idx);
    const y = fieldOffsets.current[idx] ?? 0;
    scrollRef.current?.scrollTo({ y, animated: true });
  }

  return {
    scrollRef,
    highlightIndex,
    hasIncomplete,
    firstIncompleteIndex,
    registerOffset,
    goToFirstIncomplete,
  };
}
