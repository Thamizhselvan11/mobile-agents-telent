/**
 * GenericChecklistFormScreen — the shared shell backing 19 of the 20 child
 * forms (all except Form 201-CIVILS). Handles WorkInformation header, the
 * field list via ChecklistItemWithPhoto, the one-mandatory-field completion
 * rule (AC27), and save-on-exit (AC13) on Back/hardware-back. Full coverage
 * per the agent's scope guidance — a bug here affects 19 screens at once.
 *
 * localStorage is mocked (never touches Realm in a component test, per
 * "mock fetch/storage, never hit the real thing" convention). Navigation
 * hooks (useNavigation/useFocusEffect) are mocked directly since this
 * component calls them itself rather than only receiving props.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GenericChecklistFormScreen, ChecklistFormConfig } from '../GenericChecklistFormScreen';

const mockGoBack = jest.fn();
const mockSaveFormStatus = jest.fn().mockResolvedValue(undefined);
const mockSaveFormAnswer = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-navigation/native', () => ({
  // canGoBack/replace are included alongside goBack because handleBack()
  // guards navigation.goBack() with navigation.canGoBack() (falling back
  // to navigation.replace(...) when false) — matching the real
  // @react-navigation API surface. canGoBack returns true here since, in
  // normal app use, this screen is always reached via a push from
  // AuditFormScreen's checklist, so there is always something to go back to.
  useNavigation: () => ({ goBack: mockGoBack, canGoBack: () => true, replace: jest.fn() }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    // Mirror useFocusEffect's contract closely enough for this component:
    // run the effect once (as if focused) and keep the cleanup available.
    const cleanup = callback();
    return cleanup;
  },
}));

jest.mock('../../services/localStorage', () => ({
  saveFormStatus: (...args: unknown[]) => mockSaveFormStatus(...args),
  saveFormAnswer: (...args: unknown[]) => mockSaveFormAnswer(...args),
}));

const baseConfig: ChecklistFormConfig = {
  title: 'Form 101 - UG CABLING',
  sectionName: 'UG CABLING',
  fields: ['Field One', 'Field Two', 'Field Three'],
  mandatoryIndex: 0,
};

const routeParams = {
  auditId: 'audit_1',
  orderNumber: '1234567890',
  parentFormID: 'audit_1',
  childFormID: 'cf_1',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveFormStatus.mockResolvedValue(undefined);
  mockSaveFormAnswer.mockResolvedValue(undefined);
});

/**
 * Opens the Nth field's "Select" dropdown and picks the given option.
 * The field's label Text is a sibling of the selectBox TouchableOpacity
 * (not nested inside it), so pressing the label itself does nothing —
 * this presses the "Select" placeholder text within that field's box.
 */
async function answerField(fieldIndex: number, option: 'Checked OK' | 'Below Standard' | 'Fixed at Audit') {
  const selectBoxes = screen.getAllByText('Select');
  await fireEvent.press(selectBoxes[fieldIndex]);
  await fireEvent.press(screen.getByText(option));
}

describe('GenericChecklistFormScreen', () => {
  it('renders the title, order number, section name, and every configured field', async () => {
    await render(<GenericChecklistFormScreen config={baseConfig} routeParams={routeParams} />);
    expect(screen.getByText('Form 101 - UG CABLING')).toBeTruthy();
    expect(screen.getByText('Order #1234567890')).toBeTruthy();
    expect(screen.getByText('UG CABLING')).toBeTruthy();
    // Mandatory field (index 0) is prefixed with "* "
    expect(screen.getByText('* Field One')).toBeTruthy();
    expect(screen.getByText('Field Two')).toBeTruthy();
    expect(screen.getByText('Field Three')).toBeTruthy();
  });

  it('starts as "Not Started" when nothing is answered', async () => {
    await render(<GenericChecklistFormScreen config={baseConfig} routeParams={routeParams} />);
    expect(screen.getByText('Status: Not Started')).toBeTruthy();
  });

  it('becomes "In Progress" once an optional (non-mandatory) field is answered but the mandatory one is not', async () => {
    await render(<GenericChecklistFormScreen config={baseConfig} routeParams={routeParams} />);
    // Field Two is index 1 (not the mandatory index 0).
    await answerField(1, 'Checked OK');
    expect(screen.getByText('Status: In Progress')).toBeTruthy();
  });

  it('becomes "Completed" once the ONE mandatory field (AC27) is validly answered', async () => {
    await render(<GenericChecklistFormScreen config={baseConfig} routeParams={routeParams} />);
    await answerField(0, 'Checked OK');
    expect(screen.getByText('Status: Completed')).toBeTruthy();
  });

  it('shows a "Go to required field" link only while not Completed', async () => {
    await render(<GenericChecklistFormScreen config={baseConfig} routeParams={routeParams} />);
    expect(screen.getByText('Go to required field')).toBeTruthy();

    await answerField(0, 'Checked OK');
    expect(screen.queryByText('Go to required field')).toBeNull();
  });

  it('persists FormStatus + one FormAnswer per field, then navigates back, when "Save & Back" is pressed', async () => {
    await render(<GenericChecklistFormScreen config={baseConfig} routeParams={routeParams} />);
    await fireEvent.press(screen.getByText('Save & Back'));

    expect(mockSaveFormStatus).toHaveBeenCalledWith('cf_1', 'Not Started');
    expect(mockSaveFormAnswer).toHaveBeenCalledTimes(3); // one per field
    expect(mockSaveFormAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFormID: 'audit_1',
        childFormID: 'cf_1',
        orderNumber: '1234567890',
        formName: 'Form 101 - UG CABLING',
        cateCode: 'F0',
      }),
    );
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('uses a custom mandatoryIndex when configured (not just index 0)', async () => {
    const config: ChecklistFormConfig = { ...baseConfig, mandatoryIndex: 2 };
    await render(<GenericChecklistFormScreen config={config} routeParams={routeParams} />);
    expect(screen.getByText('Field One')).toBeTruthy(); // no "* " prefix
    expect(screen.getByText('* Field Three')).toBeTruthy();

    // Answering the non-mandatory Field One (index 0) should NOT complete the form.
    await answerField(0, 'Checked OK');
    expect(screen.getByText('Status: In Progress')).toBeTruthy();
  });
});
