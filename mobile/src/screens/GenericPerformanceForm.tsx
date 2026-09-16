import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, PrimaryButton, StatusBadge } from '../components/primitives';
import { WorkInformation, emptyWorkInformation, WorkInformationValue } from '../components/WorkInformation';
import { ChecklistItemWithPhoto, emptyChecklistAnswer } from '../components/ChecklistItemWithPhoto';
import type { ChecklistAnswer, FormStatusValue } from '../types/models';
import { GENERIC_PERFORMANCE_SUBSECTIONS } from '../data/genericPerformanceFields';
import { computeAndGroupStatus, computeOrGroupStatus } from '../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getFormAnswers } from '../services/localStorage';
import { useSaveOnBackground } from '../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../hooks/useIncompleteFieldHighlight';
import { colors, spacing } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'GenericPerformanceForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Generic Performance sub-form — 10 internal sub-sections (AC20).
 * AC11: status becomes Completed when ANY ONE of the 9 checklist
 * sub-sections is Completed (Work Information is a header, not part of
 * the OR group). All checklist fields use ChecklistItemWithPhoto (AC22/AC23).
 */
export default function GenericPerformanceForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  const navigation = useNavigation<NavProp>();

  const [activeSection, setActiveSection] = useState(0);
  const [workInfo, setWorkInfo] = useState<WorkInformationValue>(emptyWorkInformation());
  const [answersBySection, setAnswersBySection] = useState<ChecklistAnswer[][]>(
    () => GENERIC_PERFORMANCE_SUBSECTIONS.map(s => s.fields.map(() => emptyChecklistAnswer())),
  );

  // Read-back (bug fix): on mount, load any previously-saved answers for
  // this exact form (matched by parentFormID + childFormID, then by each
  // row's own cateCode — 'WORK_INFO' for the header, `S${sIdx}F${fIdx}` per
  // checklist field — the same keys persist() below writes with) so
  // revisiting shows what was already entered instead of always starting
  // blank. `typeof getFormAnswers === 'function'` guards call sites (e.g.
  // existing unit tests) whose localStorage mock doesn't stub this
  // function — the real service module always exports it, so production
  // behavior is unaffected; this only avoids crashing an incomplete test mock.
  useEffect(() => {
    let cancelled = false;
    if (typeof getFormAnswers === 'function') {
      getFormAnswers(parentFormID, childFormID)
        .then(rows => {
          if (cancelled || rows.length === 0) return;
          const savedWorkInfo = rows.find(r => r.cateCode === 'WORK_INFO');
          if (savedWorkInfo) {
            try {
              setWorkInfo(JSON.parse(savedWorkInfo.answer));
            } catch {
              // Corrupt/unexpected stored JSON — keep the empty state.
            }
          }
          setAnswersBySection(prev =>
            prev.map((sectionAnswers, sIdx) =>
              sectionAnswers.map((current, fIdx) => {
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

  const sectionStatuses = useMemo<FormStatusValue[]>(
    () =>
      answersBySection.map(answers =>
        computeAndGroupStatus(answers.map(a => (a.option ? 'answered' : ''))),
      ),
    [answersBySection],
  );

  // AC21 — Work Address required for the header itself
  const workInfoStatus = useMemo(
    () => computeAndGroupStatus([workInfo.workAddress]),
    [workInfo],
  );

  const overallStatus = useMemo(
    () => computeOrGroupStatus(sectionStatuses),
    [sectionStatuses],
  );

  // AC14 — Work Address (Work Information) is this screen's one required
  // field per AC21; the 9 checklist sub-sections are all optional (OR logic).
  const incompleteFields = useMemo(
    () => [{ key: 'workAddress', required: true, value: workInfo.workAddress }],
    [workInfo.workAddress],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete } =
    useIncompleteFieldHighlight(incompleteFields);

  const persist = useCallback(async () => {
    await saveFormStatus(childFormID, overallStatus);
    await saveFormAnswer({
      visitId: auditId,
      scheduleId: auditId,
      parentFormID,
      childFormID,
      orderNumber,
      formName: 'Generic Performance / Work Information',
      cateCode: 'WORK_INFO',
      answer: JSON.stringify(workInfo),
    });
    await Promise.all(
      GENERIC_PERFORMANCE_SUBSECTIONS.flatMap((section, sIdx) =>
        section.fields.map((_field, fIdx) =>
          saveFormAnswer({
            visitId: auditId,
            scheduleId: auditId,
            parentFormID,
            childFormID,
            orderNumber,
            formName: `Generic Performance / ${section.name}`,
            cateCode: `S${sIdx}F${fIdx}`,
            answer: JSON.stringify(answersBySection[sIdx][fIdx]),
          }),
        ),
      ),
    );
  }, [answersBySection, auditId, childFormID, orderNumber, overallStatus, parentFormID, workInfo]);

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

  function updateAnswer(sectionIdx: number, fieldIdx: number, next: ChecklistAnswer) {
    setAnswersBySection(prev =>
      prev.map((arr, sIdx) => (sIdx === sectionIdx ? arr.map((a, fIdx) => (fIdx === fieldIdx ? next : a)) : arr)),
    );
  }

  const current = GENERIC_PERFORMANCE_SUBSECTIONS[activeSection];

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Generic Performance" subtitle={`Order #${orderNumber}`} onBack={handleBack} />
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {GENERIC_PERFORMANCE_SUBSECTIONS.map((s, i) => (
            <TouchableOpacity
              key={s.name}
              style={[styles.tab, i === activeSection && styles.tabActive]}
              onPress={() => setActiveSection(i)}
            >
              <Text style={[styles.tabText, i === activeSection && styles.tabTextActive]} numberOfLines={1}>
                {s.name}
              </Text>
              <StatusBadge status={sectionStatuses[i]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>Overall Status: {overallStatus}</Text>
          <Text style={styles.hintText}>
            Completing any ONE sub-section marks the whole form Completed.
          </Text>
          {hasIncomplete ? (
            <Text style={styles.incompleteLink} onPress={goToFirstIncomplete}>
              Go to required field
            </Text>
          ) : null}
        </Card>

        <View
          style={highlightIndex === 0 ? styles.highlighted : undefined}
          onLayout={e => registerOffset(0, e.nativeEvent.layout.y)}
        >
          <WorkInformation value={workInfo} onChange={setWorkInfo} />
        </View>
        {workInfoStatus !== 'Completed' ? (
          <Text style={styles.workInfoHint}>Work Address is required (Work Information).</Text>
        ) : null}

        <Text style={styles.sectionName}>{current.name}</Text>
        {current.fields.map((field, fIdx) => (
          <ChecklistItemWithPhoto
            key={fIdx}
            label={field}
            value={answersBySection[activeSection][fIdx]}
            onChange={next => updateAnswer(activeSection, fIdx, next)}
          />
        ))}

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Save & Back" onPress={handleBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.cardBorderLight },
  tabsContent: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 100,
    backgroundColor: colors.background,
    alignItems: 'center',
    gap: 4,
    maxWidth: 170,
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
  workInfoHint: { color: colors.error, fontSize: 12, marginTop: -spacing.sm, marginBottom: spacing.md },
  sectionName: { color: colors.textPrimary, fontWeight: '800', fontSize: 15, marginBottom: spacing.sm },
  highlighted: { backgroundColor: colors.primaryTint3, borderRadius: 8 },
});
