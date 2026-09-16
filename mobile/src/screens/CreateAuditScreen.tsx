import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../styles/theme';
import { ErrorText } from '../components/primitives';
import { ClipboardListIcon, FileTextIcon, PlusIcon, SearchIcon, ShieldIcon } from '../components/icons';
import { AUDIT_TYPE_OPTIONS, FIXED_SUB_FORMS, getPrimaryAuditTypeOptions } from '../data/auditTypes';
import { generateCqpNumber, generateId, saveAudit, seedFormStatus } from '../services/localStorage';
import { isExactDigits } from '../utils/formStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAudit'>;

/**
 * Create Audit screen — Figma frame 2:4 (file SLScwP1R0FXC27Rp85Jx1W).
 * Design context fetched via get_design_context this session:
 *   header #6d127b with wave-mask, floating clipboard badge, field cards
 *   with icon-bg circles, pill Create button with arrow-right icon.
 * Covers AC1, AC2, AC3, AC4, AC5.
 */
export default function CreateAuditScreen({ navigation }: Props) {
  // Guard against 'GO_BACK not handled by any navigator' — this is the
  // navigator's initialRouteName, so there is normally nothing to go back to;
  // only pop when a real previous screen exists on the stack.
  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  const [auditType, setAuditType] = useState<string | null>(null);
  const [primaryAuditType, setPrimaryAuditType] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [auditTypePickerOpen, setAuditTypePickerOpen] = useState(false);
  const [primaryPickerOpen, setPrimaryPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ auditType?: string; primaryAuditType?: string; orderNumber?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // AC3 — Primary Audit Type is a nested list filtered by the selected
  // Audit Type category; it has no valid options until a category is chosen.
  const primaryAuditTypeOptions = getPrimaryAuditTypeOptions(auditType);

  function handleAuditTypeChange(nextAuditType: string) {
    setAuditType(nextAuditType);
    // The parent category changed — if the previously-picked Primary Audit
    // Type is no longer a valid nested option under the new category, it is
    // now an inconsistent child selection and must be cleared.
    const validOptions = getPrimaryAuditTypeOptions(nextAuditType);
    setPrimaryAuditType(prev => (prev && validOptions.includes(prev) ? prev : null));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!auditType) next.auditType = 'Audit Type is required.';
    if (!primaryAuditType) next.primaryAuditType = 'Primary Audit Type is required.';
    if (!orderNumber) next.orderNumber = 'Order Number is required.';
    else if (!isExactDigits(orderNumber, 10)) next.orderNumber = 'Order Number must be exactly 10 digits.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreate() {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const auditId = generateId('audit');
      const cqpNumber = generateCqpNumber();
      await saveAudit({
        id: auditId,
        auditType: auditType!,
        primaryAuditType: primaryAuditType!,
        orderNumber,
        cqpNumber,
        createdAt: new Date().toISOString(),
      });
      // AC4 — seed FormStatus rows for the 5 fixed sub-forms, all "Not Started"
      await Promise.all(
        FIXED_SUB_FORMS.map(formName =>
          seedFormStatus({
            visitId: auditId,
            scheduleId: auditId,
            parentFormID: auditId,
            childFormID: generateId('sf'),
            orderNumber,
            formName,
            formType: 'sub-form',
            createdBy: 'local-user',
          }),
        ),
      );
      navigation.replace('AuditForm', { auditId, orderNumber });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityRole="button">
            <Text style={styles.backIcon}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Audit</Text>
        </View>
        <View style={styles.floatingBadge}>
          <View style={styles.clipboardIllustration}>
            <ClipboardListIcon height={28} color={colors.primary} />
            <View style={styles.plusBadge}>
              <PlusIcon size={8} color={colors.white} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.titleGroup}>
          <Text style={styles.formTitle}>Create New Audit Form</Text>
          <Text style={styles.formSubtitle}>Enter your audit form information.</Text>
        </View>

        <View style={styles.fieldsStack}>
          <View style={styles.fieldCard}>
            <View style={styles.iconBg}>
              <FileTextIcon size={18} color={colors.primary} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Audit Type</Text>
              <TouchableOpacity style={styles.inputBox} onPress={() => setAuditTypePickerOpen(true)}>
                <Text style={auditType ? styles.inputValueText : styles.inputPlaceholderText}>
                  {auditType ?? 'Select'}
                </Text>
                <Text style={styles.chevron}>{'▼'}</Text>
              </TouchableOpacity>
              <ErrorText message={errors.auditType} />
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.iconBg}>
              <ShieldIcon size={18} color={colors.primary} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Primary Audit Type</Text>
              <TouchableOpacity
                style={[styles.inputBox, !auditType && styles.inputBoxDisabled]}
                onPress={() => auditType && setPrimaryPickerOpen(true)}
                disabled={!auditType}
              >
                <Text style={primaryAuditType ? styles.inputValueText : styles.inputPlaceholderText}>
                  {primaryAuditType ?? 'Select'}
                </Text>
                <Text style={styles.chevron}>{'▼'}</Text>
              </TouchableOpacity>
              {!auditType ? (
                <Text style={styles.noteText}>Select Audit Type first</Text>
              ) : null}
              <ErrorText message={errors.primaryAuditType} />
            </View>
          </View>

          <View style={styles.fieldCard}>
            <View style={styles.iconBg}>
              <SearchIcon size={18} color={colors.primary} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.fieldLabel}>Order Number</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Search Order Number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={orderNumber}
                  onChangeText={t => setOrderNumber(t.replace(/[^0-9]/g, ''))}
                />
                <SearchIcon size={16} color={colors.primary} />
              </View>
              <ErrorText message={errors.orderNumber} />
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />

        <TouchableOpacity
          style={[styles.createButton, submitting && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={submitting}
        >
          <View style={{ width: 20 }} />
          <Text style={styles.createButtonText}>Create</Text>
          <Text style={styles.createButtonArrow}>{'→'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <OptionPickerModal
        visible={auditTypePickerOpen}
        title="Audit Type"
        options={AUDIT_TYPE_OPTIONS.map(o => o.label)}
        onSelect={v => {
          handleAuditTypeChange(v);
          setAuditTypePickerOpen(false);
        }}
        onClose={() => setAuditTypePickerOpen(false)}
      />
      <OptionPickerModal
        visible={primaryPickerOpen}
        title="Primary Audit Type"
        options={primaryAuditTypeOptions}
        onSelect={v => {
          setPrimaryAuditType(v);
          setPrimaryPickerOpen(false);
        }}
        onClose={() => setPrimaryPickerOpen(false)}
      />
    </View>
  );
}

function OptionPickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map(opt => (
            <TouchableOpacity key={opt} style={styles.sheetOption} onPress={() => onSelect(opt)}>
              <Text style={styles.sheetOptionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    height: 210,
    overflow: 'hidden',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 18, fontWeight: '700' },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: '700' },
  floatingBadge: {
    position: 'absolute',
    right: spacing.xxl,
    top: 112,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#eae5ec',
    borderRadius: radii.xxl,
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipboardIllustration: { alignItems: 'center', justifyContent: 'center' },
  clipboardEmoji: { fontSize: 28 },
  plusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  body: { flex: 1, marginTop: -20 },
  bodyContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  titleGroup: { gap: spacing.xs, marginTop: spacing.xl },
  formTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  formSubtitle: { color: colors.textSecondary, fontSize: 14 },
  fieldsStack: { gap: spacing.lg },
  fieldCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  iconBg: {
    backgroundColor: colors.primaryTint,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: { fontSize: 18 },
  inputContainer: { flex: 1, gap: spacing.sm },
  fieldLabel: { color: colors.textPrimary, ...typography.label },
  inputBox: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    height: 46,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBoxDisabled: { backgroundColor: colors.background, opacity: 0.6 },
  inputText: { flex: 1, color: colors.textPrimary, fontSize: 15, padding: 0 },
  inputValueText: { color: colors.textPrimary, fontSize: 15 },
  inputPlaceholderText: { color: colors.textSecondary, fontSize: 15 },
  noteText: { color: colors.textSecondary, fontSize: 11, marginTop: spacing.xs, fontStyle: 'italic' },
  chevron: { color: colors.primary, fontSize: 12 },
  bottomSpacer: { height: 20 },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  createButtonArrow: { color: colors.white, fontSize: 18 },
  backdrop: { flex: 1, backgroundColor: 'rgba(26,15,34,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl },
  sheetTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: spacing.sm },
  sheetOption: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  sheetOptionText: { color: colors.textPrimary, fontSize: 15 },
});
