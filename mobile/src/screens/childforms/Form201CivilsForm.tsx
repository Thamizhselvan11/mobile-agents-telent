import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card, PrimaryButton, StatusBadge } from '../../components/primitives';
import { WorkInformation, emptyWorkInformation, WorkInformationValue } from '../../components/WorkInformation';
import {
  ChecklistItemWithPhoto,
  emptyChecklistAnswer,
  isChecklistAnswerValid,
} from '../../components/ChecklistItemWithPhoto';
import type { ChecklistAnswer, FormStatusValue } from '../../types/models';
import { FORM_201_CIVILS_SUBTITLES } from '../../data/form201CivilsFields';
import { computeOneRequiredStatus, computeOrGroupStatus } from '../../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getFormAnswers } from '../../services/localStorage';
import { useSaveOnBackground } from '../../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../../hooks/useIncompleteFieldHighlight';
import { colors, spacing } from '../../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Form201CivilsForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Form 201 - CIVILS — 10 sub-titles (AC30), each independently tracked.
 * Per AC27, the user only needs to complete ONE sub-title (its first field
 * as the mandatory question) for the whole child form to be Completed —
 * mirrors Generic Performance's OR-logic across its 10 sub-sections (AC11).
 */
export default function Form201CivilsForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  const navigation = useNavigation<NavProp>();

  const [activeSubTitle, setActiveSubTitle] = useState(0);
  const [workInfo, setWorkInfo] = useState<WorkInformationValue>(emptyWorkInformation());
  const [answersBySubTitle, setAnswersBySubTitle] = useState<ChecklistAnswer[][]>(
    () => FORM_201_CIVILS_SUBTITLES.map(st => st.fields.map(() => emptyChecklistAnswer())),
  );

  // Read-back (bug fix): on mount, load any previously-saved answers for
  // this exact form (matched by parentFormID + childFormID, then by each
  // row's own cateCode `S${sIdx}F${fIdx}` — the same keys persist() below
  // writes with) so revisiting shows what was already entered instead of
  // always starting blank. `typeof getFormAnswers === 'function'` guards
  // call sites (e.g. existing unit tests) whose localStorage mock doesn't
  // stub this function — the real service module always exports it, so
  // production behavior is unaffected; this only avoids crashing an
  // incomplete test mock.
  useEffect(() => {
    let cancelled = false;
    if (typeof getFormAnswers === 'function') {
      getFormAnswers(parentFormID, childFormID)
        .then(rows => {
          if (cancelled || rows.length === 0) return;
          setAnswersBySubTitle(prev =>
            prev.map((subTitleAnswers, sIdx) =>
              subTitleAnswers.map((current, fIdx) => {
                const saved = rows.find(r => r.cateCode === `S${sIdx}F${fIdx}`);
                if (!saved) return current;
                try {
                  return JSON.parse(saved.answer);
                } catch {
                  return current;
                }
              }),
            ),
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
  }, [parentFormID, childFormID]);

  const current = FORM_201_CIVILS_SUBTITLES[activeSubTitle];

  const subTitleStatuses = useMemo<FormStatusValue[]>(
    () =>
      answersBySubTitle.map(answers => {
        const mandatoryOk = answers[0]?.option != null && isChecklistAnswerValid(answers[0]);
        const anyOptional = answers.some(a => a.option != null);
        return computeOneRequiredStatus(mandatoryOk ? 'answered' : '', anyOptional);
      }),
    [answersBySubTitle],
  );

  const overallStatus = useMemo(() => computeOrGroupStatus(subTitleStatuses), [subTitleStatuses]);

  // AC14 — mirrors GenericChecklistFormScreen's mechanism: within the
  // active sub-title, only its first field (index 0) is mandatory (AC27);
  // the rest are optional. If the active sub-title is already Completed
  // but no sub-title overall is, jump to the first not-Completed sub-title
  // (switching tabs) instead, since that's the one still needing attention.
  const activeAnswers = answersBySubTitle[activeSubTitle];
  const incompleteFields = useMemo(
    () =>
      current.fields.map((field, i) => ({
        key: `${i}`,
        required: i === 0,
        value: activeAnswers[i]?.option ?? null,
        valid: i === 0 ? isChecklistAnswerValid(activeAnswers[i]) : true,
      })),
    [activeAnswers, current.fields],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete: jumpWithinActiveSubTitle } =
    useIncompleteFieldHighlight(incompleteFields);

  // Set when goToFirstIncomplete() had to switch tabs to reach the first
  // not-Completed sub-title — the jump itself runs after that tab's fields
  // have rendered (see effect below), since it needs their layout offsets.
  const pendingJumpAfterTabSwitch = useRef(false);

  function goToFirstIncomplete() {
    if (subTitleStatuses[activeSubTitle] !== 'Completed') {
      jumpWithinActiveSubTitle();
      return;
    }
    const firstIncompleteSubTitle = subTitleStatuses.findIndex(s => s !== 'Completed');
    if (firstIncompleteSubTitle !== -1) {
      pendingJumpAfterTabSwitch.current = true;
      setActiveSubTitle(firstIncompleteSubTitle);
    }
  }

  useEffect(() => {
    if (pendingJumpAfterTabSwitch.current) {
      pendingJumpAfterTabSwitch.current = false;
      jumpWithinActiveSubTitle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTitle]);

  const persist = useCallback(async () => {
    await saveFormStatus(childFormID, overallStatus);
    await Promise.all(
      FORM_201_CIVILS_SUBTITLES.flatMap((st, sIdx) =>
        st.fields.map((_field, fIdx) =>
          saveFormAnswer({
            visitId: auditId,
            scheduleId: auditId,
            parentFormID,
            childFormID,
            orderNumber,
            formName: `Form 201 - CIVILS / ${st.name}`,
            cateCode: `S${sIdx}F${fIdx}`,
            answer: JSON.stringify(answersBySubTitle[sIdx][fIdx]),
          }),
        ),
      ),
    );
  }, [answersBySubTitle, auditId, childFormID, orderNumber, overallStatus, parentFormID]);

  const handleBack = useCallback(() => {
    persist().finally(() => navigation.goBack());
  }, [navigation, persist]);

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

  function updateAnswer(subTitleIdx: number, fieldIdx: number, next: ChecklistAnswer) {
    setAnswersBySubTitle(prev =>
      prev.map((arr, sIdx) => (sIdx === subTitleIdx ? arr.map((a, fIdx) => (fIdx === fieldIdx ? next : a)) : arr)),
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Form 201 - CIVILS" subtitle={`Order #${orderNumber}`} onBack={handleBack} />
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {FORM_201_CIVILS_SUBTITLES.map((st, i) => (
            <TouchableOpacity
              key={st.name}
              style={[styles.tab, i === activeSubTitle && styles.tabActive]}
              onPress={() => setActiveSubTitle(i)}
            >
              <Text style={[styles.tabText, i === activeSubTitle && styles.tabTextActive]} numberOfLines={1}>
                {st.name}
              </Text>
              <StatusBadge status={subTitleStatuses[i]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>Overall Status: {overallStatus}</Text>
          <Text style={styles.hintText}>Only one sub-title needs to be completed.</Text>
          {hasIncomplete ? (
            <Text style={styles.incompleteLink} onPress={goToFirstIncomplete}>
              Go to required field
            </Text>
          ) : null}
        </Card>

        <WorkInformation value={workInfo} onChange={setWorkInfo} />

        <Text style={styles.sectionName}>{current.name}</Text>
        {current.fields.map((field, fIdx) => (
          <View
            key={fIdx}
            style={fIdx === highlightIndex ? styles.highlighted : undefined}
            onLayout={e => registerOffset(fIdx, e.nativeEvent.layout.y)}
          >
            <ChecklistItemWithPhoto
              label={`${fIdx === 0 ? '* ' : ''}${field}`}
              value={answersBySubTitle[activeSubTitle][fIdx]}
              onChange={next => updateAnswer(activeSubTitle, fIdx, next)}
            />
          </View>
        ))}

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Save & Back" onPress={handleBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabsWrap: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderLight,
  },
  tabsContent: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 100,
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: 4,
    maxWidth: 160,
  },
  tabActive: { backgroundColor: colors.primaryTint3 },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  statusCard: { marginBottom: spacing.lg },
  statusText: { color: colors.textPrimary, fontWeight: '700' },
  incompleteLink: { color: colors.primary, marginTop: spacing.xs, fontWeight: '600' },
  hintText: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  sectionName: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: spacing.sm },
  highlighted: { backgroundColor: colors.primaryTint3, borderRadius: 8 },
});
