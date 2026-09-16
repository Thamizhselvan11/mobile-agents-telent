import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, FieldLabel, ErrorText, PrimaryButton } from '../components/primitives';
import { colors, spacing } from '../styles/theme';
import { computeAndGroupStatus, isValidEmail } from '../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getFormAnswers } from '../services/localStorage';
import { useSaveOnBackground } from '../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../hooks/useIncompleteFieldHighlight';

type Props = NativeStackScreenProps<RootStackParamList, 'SummaryForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Summary sub-form (AC24). Inspector I/D and BT CMG Auditor I/D are
 * "retrieved from local database" per the AC — modeled here as pre-filled
 * from a local placeholder (no backend, storage-needed=true; the actual
 * local-DB read is 06-local-storage-agent's responsibility).
 */
export default function SummaryForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  const navigation = useNavigation<NavProp>();

  const [inspectorId] = useState('INSP-LOCAL-0001'); // TODO: 06-local-storage-agent — read from local DB
  const [btCmgAuditorId, setBtCmgAuditorId] = useState('AUD-LOCAL-0001'); // TODO: 06-local-storage-agent — read from local DB
  const [auditorEmail, setAuditorEmail] = useState('');

  // Read-back (bug fix): on mount, load any previously-saved answer for this
  // exact form (matched by parentFormID + childFormID + cateCode, same keys
  // persist() below writes with) so a revisit shows the editable fields
  // (BT CMG Auditor I/D, Auditor Email) the user already entered instead of
  // always resetting to the placeholder defaults. `typeof getFormAnswers
  // === 'function'` guards call sites (e.g. existing unit tests) whose
  // localStorage mock doesn't stub this function — the real service module
  // always exports it, so production behavior is unaffected; this only
  // avoids crashing an incomplete test mock.
  useEffect(() => {
    let cancelled = false;
    if (typeof getFormAnswers === 'function') {
      getFormAnswers(parentFormID, childFormID)
        .then(rows => {
          if (cancelled) return;
          const saved = rows.find(r => r.cateCode === 'SUMMARY');
          if (saved) {
            try {
              const parsed = JSON.parse(saved.answer);
              if (typeof parsed.btCmgAuditorId === 'string') setBtCmgAuditorId(parsed.btCmgAuditorId);
              if (typeof parsed.auditorEmail === 'string') setAuditorEmail(parsed.auditorEmail);
            } catch {
              // Corrupt/unexpected stored JSON — keep the default state.
            }
          }
        })
        .catch(() => {
          // No saved answer yet (or read failed) — keep the default state.
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentFormID, childFormID]);

  const emailError = auditorEmail && !isValidEmail(auditorEmail) ? 'Enter a valid email address.' : null;

  const status = useMemo(
    () => computeAndGroupStatus([inspectorId, btCmgAuditorId]),
    [inspectorId, btCmgAuditorId],
  );

  // AC14 — ordered required fields, same order they're rendered below.
  const incompleteFields = useMemo(
    () => [
      { key: 'inspectorId', required: true, value: inspectorId },
      { key: 'btCmgAuditorId', required: true, value: btCmgAuditorId },
    ],
    [inspectorId, btCmgAuditorId],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete } =
    useIncompleteFieldHighlight(incompleteFields);

  const persist = useCallback(async () => {
    await saveFormStatus(childFormID, status);
    await saveFormAnswer({
      visitId: auditId,
      scheduleId: auditId,
      parentFormID,
      childFormID,
      orderNumber,
      formName: 'Summary',
      cateCode: 'SUMMARY',
      answer: JSON.stringify({ inspectorId, btCmgAuditorId, auditorEmail }),
    });
  }, [auditId, auditorEmail, btCmgAuditorId, childFormID, inspectorId, orderNumber, parentFormID, status]);

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

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Summary" subtitle={`Order #${orderNumber}`} onBack={handleBack} />
      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>Status: {status}</Text>
          {hasIncomplete ? (
            <Text style={styles.incompleteLink} onPress={goToFirstIncomplete}>
              Go to required field
            </Text>
          ) : null}
        </Card>

        <View
          style={[styles.field, highlightIndex === 0 ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(0, e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Inspector I/D" required />
          <TextInput style={[styles.input, styles.inputDisabled]} value={inspectorId} editable={false} />
          <Text style={styles.noteText}>Non-editable — retrieved from local database</Text>
        </View>

        <View
          style={[styles.field, highlightIndex === 1 ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(1, e.nativeEvent.layout.y)}
        >
          <FieldLabel label="BT CMG Auditor I/D" required />
          <TextInput style={styles.input} value={btCmgAuditorId} onChangeText={setBtCmgAuditorId} />
          <Text style={styles.noteText}>
            Editable — retrieved from local database, shown with date and time: {new Date().toLocaleString()}
          </Text>
        </View>

        <View style={styles.field}>
          <FieldLabel label="Auditor Email" />
          <TextInput
            style={styles.input}
            value={auditorEmail}
            onChangeText={setAuditorEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <ErrorText message={emailError} />
        </View>

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Save & Back" onPress={handleBack} />
      </ScrollView>
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
  field: { marginBottom: spacing.lg },
  highlighted: { backgroundColor: colors.primaryTint3, borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputDisabled: { backgroundColor: colors.cardBorderLight, color: colors.textSecondary },
  noteText: { color: colors.textSecondary, fontSize: 11, marginTop: spacing.xs, fontStyle: 'italic' },
});
