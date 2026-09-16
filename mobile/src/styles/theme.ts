/**
 * Shared design tokens extracted from Figma (file SLScwP1R0FXC27Rp85Jx1W).
 * Sourced via get_design_context on frames:
 *   2:4 create-audit, 3:5 audit-form, 4:4 add-child-form
 * All non-Figma screens (sub-forms, child forms) reuse these tokens so the
 * whole app reads as one product (per 03-frontend-builder STEP 1b).
 */

export const colors = {
  // Brand / primary
  primary: '#6d127b',
  primaryDark: '#5c096d',
  primaryTint: 'rgba(109,18,123,0.06)',
  primaryTint2: '#f4edf6',
  primaryTint3: '#f6eff9',
  primaryBorder: '#6d127b',

  // Backgrounds
  background: '#f8f7fa',
  backgroundAlt: '#faf9fc',
  cardBackground: '#ffffff',

  // Borders
  cardBorder: '#e5dee6',
  cardBorderLight: '#efeaf2',

  // Text
  textPrimary: '#1a0f22',
  textSecondary: '#786e7e',
  textOnPrimary: '#ffffff',

  // Status badge palette (from audit-form checklist, 3:5)
  statusInfo: { fg: '#6d127b', bg: '#f0eafa' }, // General Information
  statusArrival: { fg: '#129b7b', bg: '#eaf6f4' }, // On Arrival
  statusPerformance: { fg: '#d97b12', bg: '#fdf5ea' }, // Generic Performance
  statusSummary: { fg: '#127bd9', bg: '#eaf2fc' }, // Summary
  statusDontWalkBy: { fg: '#d9125c', bg: '#fceaef' }, // Don't Walk By

  // Semantic status colors (derived, consistent with badge family)
  notStarted: { fg: '#786e7e', bg: '#f0eafa' },
  inProgress: { fg: '#d97b12', bg: '#fdf5ea' },
  completed: { fg: '#129b7b', bg: '#eaf6f4' },

  error: '#d9125c',
  errorBg: '#fceaef',
  success: '#129b7b',
  successBg: '#eaf6f4',

  divider: '#f8f8f8',
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 27,
  circleSm: 18,
  circleMd: 20,
};

export const typography = {
  h1: { fontSize: 22, fontWeight: '800' as const },
  h2: { fontSize: 20, fontWeight: '800' as const },
  h3: { fontSize: 18, fontWeight: '800' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '500' as const },
  bodySemibold: { fontSize: 14, fontWeight: '600' as const },
  label: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '700' as const },
  button: { fontSize: 16, fontWeight: '700' as const },
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  floating: {
    shadowColor: '#4a0654',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#6d127b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.19,
    shadowRadius: 8,
    elevation: 6,
  },
};

const theme = { colors, spacing, radii, typography, shadow };
export default theme;
