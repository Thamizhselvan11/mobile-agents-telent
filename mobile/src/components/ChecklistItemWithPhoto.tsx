import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../styles/theme';
import { ErrorText } from './primitives';
import { ImageGalleryStrip, CameraButton, makePlaceholderImage } from './ImageGalleryStrip';
import type { ChecklistAnswer, ChecklistOption, ImageModel } from '../types/models';

/**
 * Shared "Checked OK / Below Standard / Fixed at Audit" pattern (AC22, AC28).
 * Reused ~500+ times across Generic Performance and all 22 child forms.
 *
 * Rules:
 *  - Checked OK: Before/After photos both optional
 *  - Below Standard: at least one of Before/After mandatory
 *  - Fixed at Audit: both Before and After mandatory
 *
 * Bottom DialogBox is modeled as a bottom-sheet-style Modal offering exactly
 * 3 options. Before/After buttons open camera/gallery (stubbed — TODO: needs
 * native module) and show picked images in a horizontal scroll gallery with
 * delete support; the gallery hides entirely when empty.
 */
export function ChecklistItemWithPhoto({
  label,
  value,
  onChange,
  currentUserId = 'local-user',
}: {
  label: string;
  value: ChecklistAnswer;
  onChange: (next: ChecklistAnswer) => void;
  currentUserId?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const validationError = getValidationError(value);

  function selectOption(option: ChecklistOption) {
    onChange({ ...value, option });
    setDialogOpen(false);
  }

  function addBeforePhoto() {
    onChange({ ...value, beforePhotos: [...value.beforePhotos, makePlaceholderImage(currentUserId)] });
  }
  function addAfterPhoto() {
    onChange({ ...value, afterPhotos: [...value.afterPhotos, makePlaceholderImage(currentUserId)] });
  }
  function deleteBeforePhoto(index: number) {
    onChange({ ...value, beforePhotos: value.beforePhotos.filter((_, i) => i !== index) });
  }
  function deleteAfterPhoto(index: number) {
    onChange({ ...value, afterPhotos: value.afterPhotos.filter((_, i) => i !== index) });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selectBox}
        onPress={() => setDialogOpen(true)}
        accessibilityRole="button"
      >
        <Text style={value.option ? styles.selectValueText : styles.selectPlaceholderText}>
          {value.option ?? 'Select'}
        </Text>
      </TouchableOpacity>

      {value.option ? (
        <View style={styles.photosRow}>
          <View style={styles.photoCol}>
            <CameraButton label="Before" onCapture={addBeforePhoto} />
            <ImageGalleryStrip images={value.beforePhotos} onDelete={deleteBeforePhoto} />
          </View>
          <View style={styles.photoCol}>
            <CameraButton label="After" onCapture={addAfterPhoto} />
            <ImageGalleryStrip images={value.afterPhotos} onDelete={deleteAfterPhoto} />
          </View>
        </View>
      ) : null}

      <ErrorText message={validationError} />

      <Modal visible={dialogOpen} transparent animationType="slide" onRequestClose={() => setDialogOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setDialogOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {(['Checked OK', 'Below Standard', 'Fixed at Audit'] as ChecklistOption[]).map(opt => (
              <TouchableOpacity key={opt} style={styles.sheetOption} onPress={() => selectOption(opt)}>
                <Text style={styles.sheetOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export function emptyChecklistAnswer(): ChecklistAnswer {
  return { option: null, beforePhotos: [], afterPhotos: [] };
}

export function isChecklistAnswerValid(value: ChecklistAnswer): boolean {
  return getValidationError(value) === null;
}

function getValidationError(value: ChecklistAnswer): string | null {
  if (!value.option) return null; // not answered yet — not an error state, just incomplete
  const before: ImageModel[] = value.beforePhotos;
  const after: ImageModel[] = value.afterPhotos;
  if (value.option === 'Fixed at Audit') {
    if (before.length === 0 || after.length === 0) {
      return 'Both Before and After photos are required for Fixed at Audit.';
    }
  }
  if (value.option === 'Below Standard') {
    if (before.length === 0 && after.length === 0) {
      return 'At least one of Before or After photo is required for Below Standard.';
    }
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    width: '100%',
  },
  label: {
    color: colors.textPrimary,
    ...typography.bodyMedium,
    marginBottom: spacing.sm,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  selectValueText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  selectPlaceholderText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  photosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  photoCol: {
    flex: 1,
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
    gap: spacing.sm,
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
  sheetOptionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
});
