import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../styles/theme';
import { StatusBadge } from '../components/primitives';
import { getFormStatusesForAudit } from '../services/localStorage';
import type { FormStatus } from '../types/models';
import { CHILD_FORM_CATALOG } from '../data/childFormCatalog';
import {
  ArticleIcon,
  BlockIcon,
  ClipboardListIcon,
  HomeIcon,
  InfoIcon,
  LocationOnIcon,
  MenuIcon,
  MonitoringIcon,
} from '../components/icons';
import type { IconProps } from '../components/icons';

type Props = NativeStackScreenProps<RootStackParamList, 'AuditForm'>;

// Icon + colors verified against each icon's own downloaded Figma asset
// (get_design_context / download_assets on frame 3:5) — these 5 sub-form
// icons are each a distinct status color matching their badge/bg pill,
// not a single uniform brand purple: info=primary, location_on=success/teal,
// monitoring=orange, article=blue, block=error/pink.
const SUB_FORM_ICONS: Record<string, { bg: string; color: string; Icon: React.ComponentType<IconProps> }> = {
  'General Information': { bg: '#f0eafa', color: colors.primary, Icon: InfoIcon },
  'On Arrival': { bg: '#eaf6f4', color: colors.statusArrival.fg, Icon: LocationOnIcon },
  'Generic Performance': { bg: '#fdf5ea', color: colors.statusPerformance.fg, Icon: MonitoringIcon },
  Summary: { bg: '#eaf2fc', color: colors.statusSummary.fg, Icon: ArticleIcon },
  "Don't Walk By": { bg: '#fceaef', color: colors.statusDontWalkBy.fg, Icon: BlockIcon },
};

const SUB_FORM_ROUTE: Record<string, keyof RootStackParamList> = {
  'General Information': 'GeneralInformationForm',
  'On Arrival': 'OnArrivalForm',
  'Generic Performance': 'GenericPerformanceForm',
  Summary: 'SummaryForm',
  "Don't Walk By": 'DontWalkByForm',
};

/**
 * Audit Form screen — Figma frame 3:5 (file SLScwP1R0FXC27Rp85Jx1W).
 * Design context fetched via get_design_context this session: header
 * #6d127b with rounded scrollable body (radius 32 top corners), order-info
 * card, 5-item checklist with colored icon circles + status badges,
 * Child Form card with dashed-line title + Add button, pill Submit button,
 * bottom tab bar with floating purple FAB.
 * Covers AC6, AC7, AC8, AC9, AC12.
 */
export default function AuditFormScreen({ route, navigation }: Props) {
  const { auditId, orderNumber } = route.params;
  const [subForms, setSubForms] = useState<FormStatus[]>([]);
  const [childForms, setChildForms] = useState<FormStatus[]>([]);

  const load = useCallback(async () => {
    const all = await getFormStatusesForAudit(orderNumber);
    setSubForms(all.filter(f => f.formType === 'sub-form'));
    setChildForms(all.filter(f => f.formType === 'child-form'));
  }, [orderNumber]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const allSubFormsCompleted = subForms.length > 0 && subForms.every(f => f.status === 'Completed');
  const allCompleted =
    subForms.length > 0 &&
    subForms.every(f => f.status === 'Completed') &&
    childForms.every(f => f.status === 'Completed');

  function openSubForm(form: FormStatus) {
    const routeName = SUB_FORM_ROUTE[form.formName];
    if (!routeName) return;
    navigation.navigate(routeName as any, {
      auditId,
      orderNumber,
      parentFormID: auditId,
      childFormID: form.id,
      formName: form.formName,
    });
  }

  function handleAddChildForm() {
    if (!allSubFormsCompleted) return; // AC9 — gated until all 5 sub-forms Completed
    navigation.navigate('AddChildForm', { auditId, orderNumber });
  }

  function handleBack() {
    // Guard against 'GO_BACK not handled by any navigator' — fires when this
    // screen is the first/only entry on the stack (e.g. a dev reload while
    // already on AuditForm, or any other stack-reset scenario), since
    // RootNavigator's initialRouteName is 'CreateAudit', not this screen.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('CreateAudit');
    }
  }

  function handleSubmit() {
    // AC12 — audit only marked Completed once every required question across
    // every form has been answered; this is a local status aggregate only
    // (no backend/sync — see Sync Behavior in acs.md).
    if (allCompleted) {
      handleBack();
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.navRow}>
          <View style={styles.leftGroup}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backIcon}>{'<'}</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Audit Form</Text>
              <Text style={styles.subtitle}>Complete your audit</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.orderCard}>
          <View style={styles.orderIconBg}>
            <ClipboardListIcon height={22} color={colors.primary} />
          </View>
          <View style={styles.orderTextStack}>
            <Text style={styles.orderLabel}>ORDER</Text>
            <Text style={styles.orderNumber}># {orderNumber}</Text>
            <Text style={styles.orderHint}>Please complete your audit</Text>
          </View>
        </View>

        <View style={styles.checklistCard}>
          {subForms.map((form, i) => {
            const iconStyle = SUB_FORM_ICONS[form.formName] ?? {
              bg: colors.primaryTint3,
              color: colors.textSecondary,
              Icon: InfoIcon,
            };
            const SubFormIcon = iconStyle.Icon;
            return (
              <TouchableOpacity
                key={form.id}
                style={[styles.checklistItem, i === subForms.length - 1 && styles.checklistItemLast]}
                onPress={() => openSubForm(form)}
              >
                <View style={[styles.itemIconBg, { backgroundColor: iconStyle.bg }]}>
                  <SubFormIcon size={16} color={iconStyle.color} />
                </View>
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {i + 1}.{form.formName}
                </Text>
                <StatusBadge status={form.status} />
                <Text style={styles.chevron}>{'>'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.childFormCard}>
          <View style={styles.childFormHeaderRow}>
            <View>
              <Text style={styles.childFormTitle}>Child Form</Text>
              <View style={styles.childFormUnderline} />
            </View>
            <TouchableOpacity
              style={[styles.addButton, !allSubFormsCompleted && styles.addButtonDisabled]}
              onPress={handleAddChildForm}
              disabled={!allSubFormsCompleted}
            >
              <Text style={[styles.addButtonText, !allSubFormsCompleted && styles.addButtonTextDisabled]}>
                + Add
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.childFormDescription}>
            {allSubFormsCompleted
              ? 'Please complete the child form to submit your audit.'
              : 'Complete all 5 sub-forms above to unlock adding a child form.'}
          </Text>

          {childForms.map(cf => {
            const catalogEntry = CHILD_FORM_CATALOG.find(c => cf.formName.includes(c.title) || c.title.includes(cf.formName));
            return (
              <TouchableOpacity
                key={cf.id}
                style={styles.childFormRow}
                onPress={() => {
                  if (!catalogEntry) return;
                  navigation.navigate(catalogEntry.screen as any, {
                    auditId,
                    orderNumber,
                    parentFormID: auditId,
                    childFormID: cf.id,
                    formName: cf.formName,
                    isChildForm: true,
                  });
                }}
              >
                <Text style={styles.itemLabel} numberOfLines={1}>
                  {cf.formName}
                </Text>
                <StatusBadge status={cf.status} />
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !allCompleted && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!allCompleted}
        >
          <Text style={[styles.submitButtonText, !allCompleted && styles.submitButtonTextDisabled]}>Submit</Text>
          <View style={styles.submitArrowCircle}>
            <Text style={styles.submitArrowText}>{'→'}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.fab}>
          <TouchableOpacity onPress={handleAddChildForm} disabled={!allSubFormsCompleted}>
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabsRow}>
          <View style={styles.tab}>
            <HomeIcon size={18} color={colors.textSecondary} />
            <Text style={styles.tabLabel}>Home</Text>
          </View>
          <View style={{ width: 56 }} />
          <View style={styles.tab}>
            <MenuIcon size={18} color={colors.textSecondary} />
            <Text style={styles.tabLabel}>More</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, height: 120, overflow: 'hidden' },
  navRow: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.lg },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 18, fontWeight: '700' },
  title: { color: colors.white, fontSize: 20, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  body: { flex: 1, marginTop: -24, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.background },
  bodyContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.lg },
  orderCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorderLight,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  orderIconBg: {
    backgroundColor: colors.primaryTint2,
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTextStack: { flex: 1, gap: 4 },
  orderLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  orderNumber: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  orderHint: { color: colors.textSecondary, fontSize: 13 },
  checklistCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorderLight,
    borderRadius: radii.xxl,
    padding: spacing.lg,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checklistItemLast: { borderBottomWidth: 0 },
  itemIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  chevron: { color: colors.textSecondary, fontSize: 14 },
  childFormCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorderLight,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  childFormHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  childFormTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  childFormUnderline: { backgroundColor: colors.primary, height: 2, width: 36, marginTop: 4 },
  addButton: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 6 },
  addButtonDisabled: { borderColor: colors.cardBorder },
  addButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  addButtonTextDisabled: { color: colors.textSecondary },
  childFormDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  childFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  submitButton: {
    backgroundColor: colors.primaryTint2,
    borderRadius: radii.lg,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.xxl,
    paddingRight: spacing.md,
  },
  submitButtonDisabled: {},
  submitButtonText: { color: '#7d6e8b', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  submitButtonTextDisabled: { color: '#7d6e8b' },
  submitArrowCircle: { backgroundColor: '#e2d4eb', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  submitArrowText: { color: colors.primary, fontSize: 16 },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
    top: -25,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { color: colors.white, fontSize: 24, fontWeight: '700' },
  tabsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
  tab: { alignItems: 'center', gap: 2, width: 60 },
  tabLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
});
