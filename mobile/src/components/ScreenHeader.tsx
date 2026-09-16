import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { colors, spacing } from '../styles/theme';

/**
 * Shared purple gradient-style header used across all sub-form/child-form
 * screens (not Figma-sourced individually, but built from the design tokens
 * established by the 3 Figma-sourced screens — see 03-frontend-builder
 * STEP 1b's cross-screen consistency rule).
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backIcon}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  titleBlock: { flex: 1 },
  title: { color: colors.white, fontSize: 18, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
});
