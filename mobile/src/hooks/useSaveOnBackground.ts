/**
 * AC13 — "app minimize" save trigger.
 *
 * Back press, Next press, and the hardware Back button already call a
 * screen's `persist()` before navigating away (each screen wires that up
 * itself via `BackHandler.addEventListener('hardwareBackPress', ...)` in a
 * `useFocusEffect`). The 4th trigger named by AC13 — backgrounding the app
 * (home button / app switch, i.e. AppState transitioning away from
 * 'active') — had no implementation anywhere in the codebase.
 *
 * This hook fills that gap with the same shape as the existing
 * save-on-exit pattern: pass it the screen's own `persist` callback and it
 * subscribes to `AppState` changes for the lifetime of the calling
 * component, firing `persist()` once whenever the app leaves the 'active'
 * state (backgrounded or inactive), and unsubscribing on unmount — mirrors
 * the BackHandler subscription's own setup/teardown shape so it composes
 * naturally alongside it rather than conflicting.
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useSaveOnBackground(persist: () => void | Promise<void>) {
  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    let previousState: string | null | undefined = AppState.currentState;

    const subscription = AppState.addEventListener('change', nextState => {
      const wasActive = previousState === 'active';
      const leavingActive = wasActive && nextState !== 'active';
      previousState = nextState;
      if (leavingActive) {
        void persistRef.current();
      }
    });

    return () => subscription.remove();
  }, []);
}
