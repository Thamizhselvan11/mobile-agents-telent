/**
 * AuditFormScreen — Figma frame 3:5, covers AC6-AC9, AC12. Full coverage per
 * the agent's scope guidance: rendering the 5 sub-form checklist with
 * status badges, the Add-Child-Form gate (AC9: locked until all 5 sub-forms
 * Completed), and navigation triggers (opening a sub-form, opening
 * AddChildForm, Submit only enabled once everything is Completed).
 *
 * useFocusEffect is mocked via a real useEffect so its callback runs after
 * render/commit (like the real hook does on focus) rather than during
 * render, which would otherwise race the async act() cycle inside
 * @testing-library/react-native's render().
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AuditFormScreen from '../AuditFormScreen';
import type { FormStatus } from '../../types/models';

const mockGetFormStatusesForAudit = jest.fn();

jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react');
  return {
    // Route it through a real effect hook so it runs after render/commit
    // (like the real useFocusEffect does on focus) instead of during render.
    useFocusEffect: (callback: () => void) => ReactActual.useEffect(() => callback(), [callback]),
  };
});

jest.mock('../../services/localStorage', () => ({
  getFormStatusesForAudit: (...args: unknown[]) => mockGetFormStatusesForAudit(...args),
}));

function makeSubForm(formName: string, status: FormStatus['status'], id = formName): FormStatus {
  return {
    id,
    visitId: 'audit_1',
    scheduleId: 'audit_1',
    parentFormID: 'audit_1',
    childFormID: id,
    orderNumber: '1234567890',
    formName,
    formType: 'sub-form',
    createdBy: 'local-user',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    status,
    formSynced: false,
    reason: '',
  };
}

function makeChildForm(formName: string, status: FormStatus['status'], id = formName): FormStatus {
  return { ...makeSubForm(formName, status, id), formType: 'child-form' };
}

function makeNavigation() {
  // canGoBack/replace are included alongside navigate/goBack because
  // AuditFormScreen's handleBack() guards navigation.goBack() with
  // navigation.canGoBack() (falling back to navigation.replace(...) when
  // false) — matching the real @react-navigation API surface. canGoBack
  // returns true here since, in normal app use, this screen is always
  // reached via a push from CreateAuditScreen, so there is always
  // something to go back to.
  return { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true, replace: jest.fn() } as any;
}

function makeRoute() {
  return { key: 'r', name: 'AuditForm', params: { auditId: 'audit_1', orderNumber: '1234567890' } } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

const ALL_NOT_STARTED = [
  makeSubForm('General Information', 'Not Started'),
  makeSubForm('On Arrival', 'Not Started'),
  makeSubForm('Generic Performance', 'Not Started'),
  makeSubForm('Summary', 'Not Started'),
  makeSubForm("Don't Walk By", 'Not Started'),
];

const ALL_COMPLETED = ALL_NOT_STARTED.map(f => ({ ...f, status: 'Completed' as const }));

describe('AuditFormScreen', () => {
  it('renders the order number and all 5 sub-forms with their status badges', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue(ALL_NOT_STARTED);
    await render(<AuditFormScreen navigation={makeNavigation()} route={makeRoute()} />);
    expect(screen.getByText('# 1234567890')).toBeTruthy();
    expect(screen.getByText('1.General Information')).toBeTruthy();
    expect(screen.getByText('2.On Arrival')).toBeTruthy();
    expect(screen.getByText('3.Generic Performance')).toBeTruthy();
    expect(screen.getByText('4.Summary')).toBeTruthy();
    expect(screen.getByText("5.Don't Walk By")).toBeTruthy();
    expect(screen.getAllByText('Not Started')).toHaveLength(5);
  });

  it('gates Add Child Form (AC9): disabled with the locked hint until all 5 sub-forms are Completed', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue(ALL_NOT_STARTED);
    const navigation = makeNavigation();
    await render(<AuditFormScreen navigation={navigation} route={makeRoute()} />);
    expect(screen.getByText('Complete all 5 sub-forms above to unlock adding a child form.')).toBeTruthy();
    await fireEvent.press(screen.getByText('+ Add'));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('unlocks Add Child Form once all 5 sub-forms are Completed and navigates to AddChildForm', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue(ALL_COMPLETED);
    const navigation = makeNavigation();
    await render(<AuditFormScreen navigation={navigation} route={makeRoute()} />);
    expect(screen.getByText('Please complete the child form to submit your audit.')).toBeTruthy();
    await fireEvent.press(screen.getByText('+ Add'));
    expect(navigation.navigate).toHaveBeenCalledWith('AddChildForm', { auditId: 'audit_1', orderNumber: '1234567890' });
  });

  it('navigates to the matching sub-form screen when a checklist row is pressed', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue(ALL_NOT_STARTED);
    const navigation = makeNavigation();
    await render(<AuditFormScreen navigation={navigation} route={makeRoute()} />);
    await fireEvent.press(screen.getByText('1.General Information'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      'GeneralInformationForm',
      expect.objectContaining({ auditId: 'audit_1', orderNumber: '1234567890', parentFormID: 'audit_1' }),
    );
  });

  it('renders any added child forms below the sub-form checklist', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue([
      ...ALL_COMPLETED,
      makeChildForm('Form 101 - UG CABLING', 'In Progress', 'cf_1'),
    ]);
    await render(<AuditFormScreen navigation={makeNavigation()} route={makeRoute()} />);
    expect(screen.getByText('Form 101 - UG CABLING')).toBeTruthy();
    expect(screen.getByText('In Progress')).toBeTruthy();
  });

  it('Submit is disabled until every sub-form AND every child form is Completed (AC12)', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue([
      ...ALL_COMPLETED,
      makeChildForm('Form 101 - UG CABLING', 'In Progress', 'cf_1'),
    ]);
    const navigation = makeNavigation();
    await render(<AuditFormScreen navigation={navigation} route={makeRoute()} />);
    await fireEvent.press(screen.getByText('Submit'));
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('Submit navigates back once everything (sub-forms + child forms) is Completed (AC12)', async () => {
    mockGetFormStatusesForAudit.mockResolvedValue([
      ...ALL_COMPLETED,
      makeChildForm('Form 101 - UG CABLING', 'Completed', 'cf_1'),
    ]);
    const navigation = makeNavigation();
    await render(<AuditFormScreen navigation={navigation} route={makeRoute()} />);
    await fireEvent.press(screen.getByText('Submit'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
