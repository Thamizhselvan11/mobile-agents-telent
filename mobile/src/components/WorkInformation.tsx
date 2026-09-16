import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';
import { FieldLabel, ErrorText, SectionTitle } from './primitives';
import { isAlphabeticOnly } from '../utils/formStatus';

export interface WorkInformationValue {
  workPoint: string | null; // dropdown 0-25, optional
  workAddress: string; // required, alphabetic only
}

export function emptyWorkInformation(): WorkInformationValue {
  return { workPoint: null, workAddress: '' };
}

const WORK_POINTS = Array.from({ length: 26 }, (_, i) => String(i));

/**
 * Shared header (Work Point + Work Address) reused at the top of Generic
 * Performance and every one of the 22 child forms (AC21, AC29).
 *
 * `excludedWorkPoints` implements the cross-form exclusion rule: a Work
 * Point number already selected in the parent form is excluded from the
 * same dropdown in any Child Form.
 */
export function WorkInformation({
  value,
  onChange,
  excludedWorkPoints = [],
  showSectionTitle = true,
}: {
  value: WorkInformationValue;
  onChange: (next: WorkInformationValue) => void;
  excludedWorkPoints?: string[];
  showSectionTitle?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const addressError =
    value.workAddress.length > 0 && !isAlphabeticOnly(value.workAddress)
      ? 'Work Address must be alphabetic only (no numbers/emojis).'
      : null;

  const availablePoints = WORK_POINTS.filter(p => !excludedWorkPoints.includes(p));

  return (
    <View style={styles.container}>
      {showSectionTitle ? <SectionTitle title="Work Information" /> : null}

      <View style={styles.field}>
        <FieldLabel label="Work Point" />
        <TouchableOpacity style={styles.selectBox} onPress={() => setPickerOpen(true)}>
          <Text style={value.workPoint ? styles.valueText : styles.placeholderText}>
            {value.workPoint ?? 'Select (optional)'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <FieldLabel label="Work Address" required />
        <TextInput
          style={styles.input}
          value={value.workAddress}
          onChangeText={t => onChange({ ...value, workAddress: t })}
          placeholder="Enter work address"
          placeholderTextColor={colors.textSecondary}
        />
        <ErrorText message={addressError} />
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Work Point</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {availablePoints.map(p => (
                <TouchableOpacity
                  key={p}
                  style={styles.sheetOption}
                  onPress={() => {
                    onChange({ ...value, workPoint: p });
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.sheetOptionText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  valueText: { color: colors.textPrimary, fontSize: 15 },
  placeholderText: { color: colors.textSecondary, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    height: 46,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,15,34,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  sheetOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetOptionText: { color: colors.textPrimary, fontSize: 15 },
});
