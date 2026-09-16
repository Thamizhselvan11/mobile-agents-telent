import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, FieldLabel, ErrorText, PrimaryButton, SectionTitle } from '../components/primitives';
import { colors, spacing } from '../styles/theme';
import { computeAndGroupStatus, hasNoEmojis } from '../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getCurrentLocationStub, getFormAnswers } from '../services/localStorage';
import { useSaveOnBackground } from '../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../hooks/useIncompleteFieldHighlight';

type Props = NativeStackScreenProps<RootStackParamList, 'GeneralInformationForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface FormState {
  exchangeArea: string;
  jobDescription: string;
  jobAddress: string;
  gqttTemplate: string;
  contractNumber: string;
  estimateNumber: string;
  location: string;
  jobOrderNo: string;
  cqpCheckNumber: string;
  dpSubPoleNo: string;
  a1024A75Number: string;
  mappedGqttTemplate: string;
  qCheckDateTime: string;
  gangId: string;
  operativeId1: string;
  operativeId2: string;
  operativeId3: string;
  operativeId4: string;
  operativeId5to8Revealed: boolean;
  operativeId5: string;
  operativeId6: string;
  operativeId7: string;
  operativeId8: string;
  comments: string;
  surveyDate: string;
  surveyorId: string;
  checkType: string;
  jobType: string;
  reinstatementType: string;
  gang: string;
  startOn: string;
  supplier: string;
}

function emptyState(jobOrderNo: string): FormState {
  return {
    exchangeArea: '',
    jobDescription: '',
    jobAddress: '',
    gqttTemplate: '',
    contractNumber: '',
    estimateNumber: '',
    location: '',
    jobOrderNo,
    cqpCheckNumber: '',
    dpSubPoleNo: '',
    a1024A75Number: '',
    mappedGqttTemplate: '',
    qCheckDateTime: '',
    gangId: '',
    operativeId1: '',
    operativeId2: '',
    operativeId3: '',
    operativeId4: '',
    operativeId5to8Revealed: false,
    operativeId5: '',
    operativeId6: '',
    operativeId7: '',
    operativeId8: '',
    comments: '',
    surveyDate: '',
    surveyorId: '',
    checkType: '',
    jobType: '',
    reinstatementType: '',
    gang: '',
    startOn: '',
    supplier: '',
  };
}

/**
 * General Information sub-form (AC10, AC15, AC16, AC17).
 * "API auto-populated" fields (Stubs/Deferred) are manually-enterable here
 * with a TODO, since backend-needed=false and no API contract exists.
 */
export default function GeneralInformationForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  const navigation = useNavigation<NavProp>();
  const [form, setForm] = useState<FormState>(() => emptyState(orderNumber));

  // Read-back (bug fix): on mount, load any previously-saved answer for this
  // exact form (matched by parentFormID + childFormID + cateCode, same keys
  // saveFormAnswer writes with in persist() below) so a revisit shows the
  // data the user already entered, instead of always starting blank.
  // `typeof getFormAnswers === 'function'` guards call sites (e.g. existing
  // unit tests) whose localStorage mock doesn't stub this function — the
  // real service module always exports it, so production behavior is
  // unaffected; this only prevents a crash against an incomplete test mock.
  useEffect(() => {
    let cancelled = false;
    if (typeof getFormAnswers === 'function') {
      getFormAnswers(parentFormID, childFormID)
        .then(rows => {
          if (cancelled) return;
          const saved = rows.find(r => r.cateCode === 'GENERAL_INFO');
          if (saved) {
            try {
              setForm(JSON.parse(saved.answer));
            } catch {
              // Corrupt/unexpected stored JSON — keep the blank state.
            }
          }
        })
        .catch(() => {
          // No saved answer yet (or read failed) — keep the blank state.
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentFormID, childFormID]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const requiredValues = useMemo(
    () => [
      form.exchangeArea,
      form.jobDescription,
      form.jobAddress,
      form.contractNumber,
      form.estimateNumber,
      form.location,
      form.jobOrderNo,
      form.qCheckDateTime,
      form.gangId,
      form.operativeId1,
      form.comments,
      form.jobType,
      form.reinstatementType,
      form.supplier,
    ],
    [form],
  );

  const status = useMemo(() => computeAndGroupStatus(requiredValues), [requiredValues]);

  // AC14 — ordered list of required fields, in the same order they're
  // rendered below, so "first incomplete" scrolls/highlights the right one.
  const REQUIRED_FIELD_KEYS = [
    'exchangeArea',
    'jobDescription',
    'jobAddress',
    'contractNumber',
    'estimateNumber',
    'location',
    'jobOrderNo',
    'qCheckDateTime',
    'gangId',
    'operativeId1',
    'comments',
    'jobType',
    'reinstatementType',
    'supplier',
  ] as const;
  const incompleteFields = useMemo(
    () =>
      REQUIRED_FIELD_KEYS.map((key, i) => ({
        key,
        required: true,
        value: requiredValues[i],
      })),
    [requiredValues],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete } =
    useIncompleteFieldHighlight(incompleteFields);
  const fieldIndex = (key: (typeof REQUIRED_FIELD_KEYS)[number]) => REQUIRED_FIELD_KEYS.indexOf(key);

  const persist = useCallback(async () => {
    await saveFormStatus(childFormID, status);
    await saveFormAnswer({
      visitId: auditId,
      scheduleId: auditId,
      parentFormID,
      childFormID,
      orderNumber,
      formName: 'General Information',
      cateCode: 'GENERAL_INFO',
      answer: JSON.stringify(form),
    });
  }, [auditId, childFormID, form, orderNumber, parentFormID, status]);

  const handleBack = useCallback(() => {
    // Guard against 'GO_BACK not handled by any navigator' — fires when this
    // screen ends up as the first/only entry on the stack (e.g. a dev reload
    // while already on this screen, or any other stack-reset scenario).
    persist().finally(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('AuditForm', { auditId, orderNumber });
      }
    });
  }, [navigation, persist, auditId, orderNumber]);

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

  async function handleNext() {
    await persist();
    navigation.navigate('OnArrivalForm', {
      auditId,
      orderNumber,
      parentFormID,
      childFormID,
      formName: 'On Arrival',
    });
  }

  async function handleUseCurrentLocation() {
    const loc = await getCurrentLocationStub();
    set('location', loc.location || form.location);
  }

  const emojiError = (v: string) => (v && !hasNoEmojis(v) ? 'Emojis are not allowed.' : null);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="General Information" subtitle={`Order #${orderNumber}`} onBack={handleBack} />
      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        <TouchableOpacity onPress={handleNext} style={styles.nextTopButton}>
          <Text style={styles.nextTopButtonText}>Next →</Text>
        </TouchableOpacity>

        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>Status: {status}</Text>
          {hasIncomplete ? (
            <Text style={styles.incompleteLink} onPress={goToFirstIncomplete}>
              Go to required field
            </Text>
          ) : null}
        </Card>

        <SectionTitle title="Basic Information" />
        <TextField label="Exchange Area" required value={form.exchangeArea} onChangeText={t => set('exchangeArea', t)} error={emojiError(form.exchangeArea)} note="API auto-populated — TODO: no backend this pass, manually enterable" highlighted={highlightIndex === fieldIndex('exchangeArea')} onLayout={y => registerOffset(fieldIndex('exchangeArea'), y)} />
        <TextField label="Job Description" required value={form.jobDescription} onChangeText={t => set('jobDescription', t)} error={emojiError(form.jobDescription)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('jobDescription')} onLayout={y => registerOffset(fieldIndex('jobDescription'), y)} />
        <TextField label="Job Address" required value={form.jobAddress} onChangeText={t => set('jobAddress', t)} error={emojiError(form.jobAddress)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('jobAddress')} onLayout={y => registerOffset(fieldIndex('jobAddress'), y)} />
        <TextField label="GQTT/Template" value={form.gqttTemplate} onChangeText={t => set('gqttTemplate', t)} error={emojiError(form.gqttTemplate)} />

        <SectionTitle title="Check Sheet Information" />
        <TextField label="Contract Number" required value={form.contractNumber} onChangeText={t => set('contractNumber', t)} error={emojiError(form.contractNumber)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('contractNumber')} onLayout={y => registerOffset(fieldIndex('contractNumber'), y)} />
        <TextField label="Estimate Number" required value={form.estimateNumber} onChangeText={t => set('estimateNumber', t)} error={emojiError(form.estimateNumber)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('estimateNumber')} onLayout={y => registerOffset(fieldIndex('estimateNumber'), y)} />
        <View
          style={[styles.field, highlightIndex === fieldIndex('location') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('location'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Location" required />
          <View style={styles.rowWithButton}>
            <TextInput style={[styles.input, { flex: 1 }]} value={form.location} onChangeText={t => set('location', t)} placeholder="Device location" placeholderTextColor={colors.textSecondary} />
            <TouchableOpacity style={styles.smallButton} onPress={handleUseCurrentLocation}>
              <Text style={styles.smallButtonText}>Use GPS</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noteText}>TODO: needs native module — device GPS auto-population deferred this pass</Text>
        </View>
        <TextField label="Job/Order No" required value={form.jobOrderNo} onChangeText={() => {}} editable={false} note="Non-editable — auto-filled from the Order Number used at audit creation" highlighted={highlightIndex === fieldIndex('jobOrderNo')} onLayout={y => registerOffset(fieldIndex('jobOrderNo'), y)} />
        <TextField label="CQP Check Number" value={form.cqpCheckNumber} onChangeText={t => set('cqpCheckNumber', t)} error={emojiError(form.cqpCheckNumber)} />
        <TextField label="DP & Sub Pole/s No" value={form.dpSubPoleNo} onChangeText={t => set('dpSubPoleNo', t)} error={emojiError(form.dpSubPoleNo)} />
        <TextField label="A1024/A75 Number" value={form.a1024A75Number} onChangeText={t => set('a1024A75Number', t)} error={emojiError(form.a1024A75Number)} />
        <TextField label="Mapped GQTT Template" value={form.mappedGqttTemplate} onChangeText={t => set('mappedGqttTemplate', t)} error={emojiError(form.mappedGqttTemplate)} />
        <TextField label="Q Check Date and Time" required value={form.qCheckDateTime} onChangeText={t => set('qCheckDateTime', t)} placeholder="YYYY-MM-DD HH:mm (present/future)" highlighted={highlightIndex === fieldIndex('qCheckDateTime')} onLayout={y => registerOffset(fieldIndex('qCheckDateTime'), y)} />
        <TextField label="Gang I/D" required value={form.gangId} onChangeText={t => set('gangId', t)} error={emojiError(form.gangId)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('gangId')} onLayout={y => registerOffset(fieldIndex('gangId'), y)} />
        <TextField label="Operative ID 1" required value={form.operativeId1} onChangeText={t => set('operativeId1', t)} note="Type-ahead search; excluded from Operative ID 2-8 once selected" highlighted={highlightIndex === fieldIndex('operativeId1')} onLayout={y => registerOffset(fieldIndex('operativeId1'), y)} />
        <TextField label="Operative 2 I/D" value={form.operativeId2} onChangeText={t => set('operativeId2', t)} error={emojiError(form.operativeId2)} note="API auto-populated — TODO: no backend this pass" />
        <TextField label="Operative 3 I/D" value={form.operativeId3} onChangeText={t => set('operativeId3', t)} error={emojiError(form.operativeId3)} note="API auto-populated — TODO: no backend this pass" />
        <TextField label="Operative 4 I/D" value={form.operativeId4} onChangeText={t => set('operativeId4', t)} error={emojiError(form.operativeId4)} note="API auto-populated — TODO: no backend this pass" />

        {!form.operativeId5to8Revealed ? (
          <TouchableOpacity style={styles.revealButton} onPress={() => set('operativeId5to8Revealed', true)}>
            <Text style={styles.revealButtonText}>+ Add Operative ID 5-8</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextField label="Operative 5 I/D" value={form.operativeId5} onChangeText={t => set('operativeId5', t)} error={emojiError(form.operativeId5)} />
            <TextField label="Operative 6 I/D" value={form.operativeId6} onChangeText={t => set('operativeId6', t)} error={emojiError(form.operativeId6)} note="API auto-populated — TODO: no backend this pass" />
            <TextField label="Operative 7 I/D" value={form.operativeId7} onChangeText={t => set('operativeId7', t)} error={emojiError(form.operativeId7)} note="API auto-populated — TODO: no backend this pass" />
            <TextField label="Operative 8 I/D" value={form.operativeId8} onChangeText={t => set('operativeId8', t)} error={emojiError(form.operativeId8)} note="API auto-populated — TODO: no backend this pass" />
          </>
        )}

        <TextField label="Comments" required value={form.comments} onChangeText={t => set('comments', t)} error={emojiError(form.comments)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('comments')} onLayout={y => registerOffset(fieldIndex('comments'), y)} />
        <TextField label="Survey Date" value={form.surveyDate} onChangeText={t => set('surveyDate', t)} placeholder="YYYY-MM-DD HH:mm (present/future)" />
        <TextField label="Surveyor ID" value={form.surveyorId} onChangeText={t => set('surveyorId', t)} error={emojiError(form.surveyorId)} />
        <TextField label="Check Type" value={form.checkType} onChangeText={t => set('checkType', t)} error={emojiError(form.checkType)} />
        <TextField label="Job Type" required value={form.jobType} onChangeText={t => set('jobType', t)} error={emojiError(form.jobType)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('jobType')} onLayout={y => registerOffset(fieldIndex('jobType'), y)} />
        <TextField label="Reinstatement Type" required value={form.reinstatementType} onChangeText={t => set('reinstatementType', t)} error={emojiError(form.reinstatementType)} note="API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('reinstatementType')} onLayout={y => registerOffset(fieldIndex('reinstatementType'), y)} />
        <TextField label="Gang" value={form.gang} onChangeText={t => set('gang', t)} error={emojiError(form.gang)} />
        <TextField label="Start on" value={form.startOn} onChangeText={t => set('startOn', t)} placeholder="Auto-populated date/time" note="TODO: auto-population source not available this pass" />
        <TextField label="Supplier" required value={form.supplier} onChangeText={t => set('supplier', t)} error={emojiError(form.supplier)} note="Spinner, API auto-populated — TODO: no backend this pass" highlighted={highlightIndex === fieldIndex('supplier')} onLayout={y => registerOffset(fieldIndex('supplier'), y)} />

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Next" onPress={handleNext} />
      </ScrollView>
    </View>
  );
}

function TextField({
  label,
  required,
  value,
  onChangeText,
  error,
  note,
  editable = true,
  placeholder,
  highlighted,
  onLayout,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  error?: string | null;
  note?: string;
  editable?: boolean;
  placeholder?: string;
  /** AC14 — true while this field is the "jump to incomplete" target. */
  highlighted?: boolean;
  /** AC14 — reports this field's Y offset so scroll-to-field can find it. */
  onLayout?: (y: number) => void;
}) {
  return (
    <View
      style={[styles.field, highlighted ? styles.highlighted : undefined]}
      onLayout={onLayout ? e => onLayout(e.nativeEvent.layout.y) : undefined}
    >
      <FieldLabel label={label} required={required} />
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder ?? (editable ? undefined : undefined)}
        placeholderTextColor={colors.textSecondary}
      />
      <ErrorText message={error} />
      {note ? <Text style={styles.noteText}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  nextTopButton: { alignSelf: 'flex-end', marginBottom: spacing.md },
  nextTopButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  statusCard: { marginBottom: spacing.lg },
  statusText: { color: colors.textPrimary, fontWeight: '700' },
  incompleteLink: { color: colors.primary, marginTop: spacing.xs, fontWeight: '600' },
  field: { marginBottom: spacing.md },
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
  rowWithButton: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  smallButton: { backgroundColor: colors.primaryTint2, borderRadius: 10, paddingHorizontal: spacing.md, height: 46, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  noteText: { color: colors.textSecondary, fontSize: 11, marginTop: spacing.xs, fontStyle: 'italic' },
  revealButton: { alignSelf: 'flex-start', marginBottom: spacing.md },
  revealButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
