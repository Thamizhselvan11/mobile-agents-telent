import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../styles/theme';
import { CHILD_FORM_CATALOG } from '../data/childFormCatalog';
import { generateId, seedFormStatus } from '../services/localStorage';
import {
  AccountBalanceIcon,
  ClipboardListIcon,
  DatabaseIcon,
  ElectricalServicesIcon,
  FileTextIcon,
  Graph2Icon,
  HandymanIcon,
  HomeIcon,
  MenuIcon,
  PowerIcon,
  ServerIcon,
  TargetIcon,
  UserIcon,
} from '../components/icons';
import type { IconProps } from '../components/icons';

type Props = NativeStackScreenProps<RootStackParamList, 'AddChildForm'>;

// Real vector icons fetched via get_design_context/download_assets on Figma
// frame 4:4 (file SLScwP1R0FXC27Rp85Jx1W), replacing the emoji glyphs
// previously used. Figma's frame explicitly shows only the first 11 rows'
// icons (101, 201, 401, 403, 405, 407, 409, 411, 417, 501, 503); for the
// remaining 9 codes it never depicted, the closest visually-appropriate
// icon from that same fetched set is reused (not an invented new design),
// matching the reasoning this pass's brief specifies:
//   505 POLING IP                -> electrical_services (overhead line work, like 503)
//   524 FND SPIN quality check   -> target (precision/quality check, like 411)
//   560 FTTP Planning & build UG -> handyman (build/construction, like 405)
//   561 FTTP & B OH & R          -> electrical_services (overhead)
//   570 OFN FTTP                 -> server (network/fibre infrastructure)
//   578 FTTP Connectorized OH    -> electrical_services (overhead)
//   579 FTTP Connectorized UG    -> database (underground, like 407)
//   589 FBC quality audit check  -> target (audit/quality)
//   590 FBC quality audit list   -> file-text (checklist/list document)
const CATALOG_ICONS: Record<string, React.ComponentType<IconProps>> = {
  '101': PowerIcon,
  '201': AccountBalanceIcon,
  '401': Graph2Icon,
  '403': Graph2Icon,
  '405': HandymanIcon,
  '407': DatabaseIcon,
  '409': ServerIcon,
  '411': TargetIcon,
  '417': UserIcon,
  '501': HandymanIcon,
  '503': ElectricalServicesIcon,
  '505': ElectricalServicesIcon,
  '524': TargetIcon,
  '560': HandymanIcon,
  '561': ElectricalServicesIcon,
  '570': ServerIcon,
  '578': ElectricalServicesIcon,
  '579': DatabaseIcon,
  '589': TargetIcon,
  '590': FileTextIcon,
};

/**
 * Add Child Form picker screen — Figma frame 4:4 (file SLScwP1R0FXC27Rp85Jx1W).
 * Design context fetched via get_design_context this session: header
 * #5c096d with rounded bottom corners, order header card, scrollable list
 * of rows (icon-bg, title, chevron), bottom nav with centered purple FAB.
 * Covers AC8, AC26 — lists all 20 child-form categories (Figma frame shows
 * the first 10; the remaining 10 are reached by scrolling, same row style).
 */
export default function AddChildFormScreen({ route, navigation }: Props) {
  const { auditId, orderNumber } = route.params;

  // Guard against 'GO_BACK not handled by any navigator' — fires when this
  // screen ends up as the first/only entry on the stack (e.g. a dev reload
  // while already on this screen, or any other stack-reset scenario).
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('AuditForm', { auditId, orderNumber });
    }
  }, [navigation, auditId, orderNumber]);

  const handleSelect = useCallback(
    async (entry: (typeof CHILD_FORM_CATALOG)[number]) => {
      const childFormID = generateId('cf');
      await seedFormStatus({
        visitId: auditId,
        scheduleId: auditId,
        parentFormID: auditId,
        childFormID,
        orderNumber,
        formName: entry.title,
        formType: 'child-form',
        createdBy: 'local-user',
      });
      navigation.navigate(entry.screen as any, {
        auditId,
        orderNumber,
        parentFormID: auditId,
        childFormID,
        formName: entry.title,
        isChildForm: true,
      });
    },
    [auditId, navigation, orderNumber],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.navRow}>
          <View style={styles.leftGroup}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backIcon}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Child Form</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.orderCard}>
          <View style={styles.orderIconBg}>
            <FileTextIcon size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.orderLabel}>Order# {orderNumber}</Text>
            <Text style={styles.orderTitle}>Add Child Form</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {CHILD_FORM_CATALOG.map((entry, i) => {
            const RowIcon = CATALOG_ICONS[entry.code] ?? FileTextIcon;
            return (
              <TouchableOpacity
                key={entry.code}
                style={[styles.row, i === CHILD_FORM_CATALOG.length - 1 && styles.rowLast]}
                onPress={() => handleSelect(entry)}
              >
                <View style={styles.rowIconBg}>
                  <RowIcon size={18} color={colors.primary} />
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {entry.title}
                </Text>
                <Text style={styles.chevron}>{'>'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <View style={styles.fab}>
          <Text style={styles.fabIcon}>+</Text>
        </View>
        <View style={styles.tabsRow}>
          <View style={styles.tab}>
            <HomeIcon size={16} color={colors.primary} />
            <Text style={styles.tabLabel}>Home</Text>
          </View>
          <View style={{ width: 56 }} />
          <View style={styles.tab}>
            <MenuIcon size={16} color={colors.textSecondary} />
            <Text style={styles.tabLabelMuted}>Menu</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundAlt },
  header: {
    backgroundColor: colors.primaryDark,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    paddingBottom: spacing.xl,
  },
  navRow: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.lg },
  leftGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 18, fontWeight: '700' },
  title: { color: colors.white, fontSize: 18, fontWeight: '700' },
  body: { flex: 1 },
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
    backgroundColor: colors.primaryTint3,
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  orderTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  listCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorderLight,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderLight,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIconBg: {
    backgroundColor: colors.primaryTint3,
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  chevron: { color: colors.textSecondary, fontSize: 14 },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
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
    top: -29,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { color: colors.white, fontSize: 24, fontWeight: '700' },
  tabsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
  tab: { alignItems: 'center', gap: 4, width: 60 },
  tabLabel: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  tabLabelMuted: { color: colors.textSecondary, fontSize: 10, fontWeight: '600' },
});
