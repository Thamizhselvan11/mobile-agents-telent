import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../styles/theme';
import { Card, PrimaryButton } from './primitives';
import { WorkInformation, emptyWorkInformation, WorkInformationValue } from './WorkInformation';
import {
  ChecklistItemWithPhoto,
  emptyChecklistAnswer,
  isChecklistAnswerValid,
} from './ChecklistItemWithPhoto';
import type { ChecklistAnswer } from '../types/models';
import { computeOneRequiredStatus } from '../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getFormAnswers } from '../services/localStorage';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from './ScreenHeader';
import { useSaveOnBackground } from '../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../hooks/useIncompleteFieldHighlight';

export interface ChecklistFormConfig {
  /** Screen title shown in header, e.g. "Form 101 - UG CABLING" */
  title: string;
  /** Single section name shown above the field list, e.g. "UG CABLING" */
  sectionName: string;
  /** Full field list for this form (per acs.md AC32) */
  fields: string[];
  /** Which field index is the ONE mandatory question (AC27). Defaults to 0. */
  mandatoryIndex?: number;
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Shared screen shell for the 19 single-section child forms (all except
 * Form 201-CIVILS, which has 10 sub-titles and its own screen).
 * Handles: WorkInformation header (AC29), all fields via ChecklistItemWithPhoto
 * (AC22/AC28), one-mandatory-field completion rule (AC27), save-on-exit
 * (AC13) on Back/hardware-back/navigate-away, and incomplete-field
 * highlight/scroll (AC14).
 */
export function GenericChecklistFormScreen({
  config,
  routeParams,
}: {
  config: ChecklistFormConfig;
  routeParams: {
    auditId: string;
    orderNumber: string;
    parentFormID: string;
    childFormID: string;
  };
}) {
  const navigation = useNavigation<NavProp>();
  const { width } = useWindowDimensions();
  const mandatoryIndex = config.mandatoryIndex ?? 0;

  const [workInfo, setWorkInfo] = useState<WorkInformationValue>(emptyWorkInformation());
  const [answers, setAnswers] = useState<ChecklistAnswer[]>(
    () => config.fields.map(() => emptyChecklistAnswer()),
  );

  // Read-back (bug fix): on mount, load any previously-saved answers for
  // this exact form (matched by parentFormID + childFormID, then by each
  // field's own cateCode `F${i}` — the same keys persist() below writes
  // with) so revisiting a child form shows what was already entered instead
  // of always starting blank. `typeof getFormAnswers === 'function'` guards
  // call sites (e.g. existing unit tests) whose localStorage mock doesn't
  // stub this function — the real service module always exports it, so
  // production behavior is unaffected; this only avoids crashing an
  // incomplete test mock.
  useEffect(() => {
    let cancelled = false;
    if (typeof getFormAnswers === 'function') {
      getFormAnswers(routeParams.parentFormID, routeParams.childFormID)
        .then(rows => {
          if (cancelled || rows.length === 0) return;
          setAnswers(prev =>
            prev.map((current, i) => {
              const saved = rows.find(r => r.cateCode === `F${i}`);
              if (!saved) return current;
              try {
                return JSON.parse(saved.answer);
              } catch {
                return current;
              }
            }),
          );
        })
        .catch(() => {
          // No saved answers yet (or read failed) — keep the blank state.
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParams.parentFormID, routeParams.childFormID]);

  // AC14 — only the one mandatory field (per AC27) counts as "required" for
  // highlight purposes here, matching the original inline behavior exactly:
  // the mandatory field is the only field that can ever be "incomplete".
  const incompleteFields = useMemo(
    () =>
      config.fields.map((field, i) => ({
        key: `${i}`,
        required: i === mandatoryIndex,
        value: answers[i]?.option ?? null,
        valid: i === mandatoryIndex ? isChecklistAnswerValid(answers[i]) : true,
      })),
    [answers, config.fields, mandatoryIndex],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete } =
    useIncompleteFieldHighlight(incompleteFields);

  const status = useMemo(() => {
    const mandatoryAnswered =
      answers[mandatoryIndex]?.option != null &&
      isChecklistAnswerValid(answers[mandatoryIndex]);
    const anyOptionalAnswered = answers.some(a => a.option != null);
    return computeOneRequiredStatus(mandatoryAnswered ? 'answered' : '', anyOptionalAnswered);
  }, [answers, mandatoryIndex]);

  const persist = useCallback(async () => {
    await saveFormStatus(routeParams.childFormID, status);
    await Promise.all(
      config.fields.map((field, i) =>
        saveFormAnswer({
          visitId: routeParams.auditId,
          scheduleId: routeParams.auditId,
          parentFormID: routeParams.parentFormID,
          childFormID: routeParams.childFormID,
          orderNumber: routeParams.orderNumber,
          formName: config.title,
          cateCode: `F${i}`,
          answer: JSON.stringify(answers[i]),
        }),
      ),
    );
  }, [answers, config.fields, config.title, routeParams, status]);

  const handleBack = useCallback(() => {
    // Guard against 'GO_BACK not handled by any navigator' — fires when this
    // screen ends up as the first/only entry on the stack (e.g. a dev reload
    // while already on this screen, or any other stack-reset scenario).
    persist().finally(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('AuditForm', { auditId: routeParams.auditId, orderNumber: routeParams.orderNumber });
      }
    });
  }, [navigation, persist, routeParams.auditId, routeParams.orderNumber]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => sub.remove();
    }, [handleBack]),
  );

  // AC13 — save on app minimize (backgrounding), same trigger as
  // Back/Next/hardware-Back above.
  useSaveOnBackground(persist);

  function updateAnswer(index: number, next: ChecklistAnswer) {
    setAnswers(prev => prev.map((a, i) => (i === index ? next : a)));
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title={config.title} subtitle={`Order #${routeParams.orderNumber}`} onBack={handleBack} />
      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>Status: {status}</Text>
          {hasIncomplete ? (
            <Text style={styles.incompleteLink} onPress={goToFirstIncomplete}>
              Go to required field
            </Text>
          ) : null}
        </Card>

        <WorkInformation value={workInfo} onChange={setWorkInfo} />

        <Text style={styles.sectionName}>{config.sectionName}</Text>
        {config.fields.map((field, i) => (
          <View
            key={i}
            style={i === highlightIndex ? styles.highlighted : undefined}
            onLayout={e => {
              registerOffset(i, e.nativeEvent.layout.y);
            }}
          >
            <ChecklistItemWithPhoto
              label={`${i === mandatoryIndex ? '* ' : ''}${field}`}
              value={answers[i]}
              onChange={next => updateAnswer(i, next)}
            />
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Save & Back" onPress={handleBack} />
      </ScrollView>
      <View style={{ width }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  statusCard: { marginBottom: spacing.lg },
  statusText: { color: colors.textPrimary, fontWeight: '700' },
  incompleteLink: { color: colors.primary, marginTop: spacing.xs, fontWeight: '600' },
  sectionName: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  highlighted: {
    backgroundColor: colors.primaryTint3,
    borderRadius: 8,
  },
});
