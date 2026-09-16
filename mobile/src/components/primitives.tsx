import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, typography, shadow } from '../styles/theme';
import type { FormStatusValue } from '../types/models';

/** Shared card container, matches Figma card style (radius 16-20, border, soft shadow). */
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
      {icon}
    </TouchableOpacity>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      <View style={styles.sectionTitleUnderline} />
    </View>
  );
}

export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

export function statusColors(status: FormStatusValue) {
  switch (status) {
    case 'Completed':
      return colors.completed;
    case 'In Progress':
      return colors.inProgress;
    default:
      return colors.notStarted;
  }
}

export function StatusBadge({ status }: { status: FormStatusValue }) {
  const c = statusColors(status);
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    ...shadow.card,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.button,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.cardBorder,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    ...typography.button,
  },
  sectionTitleWrap: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitleText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionTitleUnderline: {
    backgroundColor: colors.primary,
    height: 2,
    width: 36,
  },
  fieldLabel: {
    color: colors.textPrimary,
    ...typography.label,
    marginBottom: spacing.xs,
  },
  requiredMark: {
    color: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 100,
  },
  badgeText: {
    ...typography.small,
  },
});
