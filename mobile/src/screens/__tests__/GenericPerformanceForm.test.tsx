/**
 * GenericPerformanceForm sub-form (AC20, AC21, AC23) — 10 internal
 * sub-sections with OR-logic (AC11: Completed once ANY ONE of the 9
 * checklist sub-sections is itself Completed via AND-logic across its own
 * fields; Work Information is a header, not part of the OR group). Full
 * coverage per the agent's scope guidance.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import GenericPerformanceForm from '../GenericPerformanceForm';
import { GENERIC_PERFORMANCE_SUBSECTIONS } from '../../data/genericPerformanceFields';

const mockGoBack = jest.fn();
const mockSaveFormStatus = jest.fn().mockResolvedValue(undefined);
const mockSaveFormAnswer = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react');
  return {
    useNavigation: () => ({ goBack: mockGoBack }),
    useFocusEffect: (callback: () => void) => ReactActual.useEffect(() => callback(), [callback]),
  };
});

jest.mock('../../services/localStorage', () => ({
  saveFormStatus: (...args: unknown[]) => mockSaveFormStatus(...args),
  saveFormAnswer: (...args: unknown[]) => mockSaveFormAnswer(...args),
}));

function makeRoute() {
  return {
    key: 'r',
    name: 'GenericPerformanceForm',
    params: {
      auditId: 'audit_1',
      orderNumber: '1234567890',
      parentFormID: 'audit_1',
      childFormID: 'sf_3',
      formName: 'Generic Performance',
    },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveFormStatus.mockResolvedValue(undefined);
  mockSaveFormAnswer.mockResolvedValue(undefined);
});

describe('GenericPerformanceForm', () => {
  it('renders all sub-section tabs (9, per genericPerformanceFields.ts — the "10 internal sub-sections" doc comment counts Work Information as a 10th, handled separately by the shared WorkInformation component) and starts Not Started', async () => {
    await render(<GenericPerformanceForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('Generic Performance')).toBeTruthy();
    expect(GENERIC_PERFORMANCE_SUBSECTIONS).toHaveLength(9);
    // "General" (first sub-section) renders twice: tab label + section heading.
    expect(screen.getAllByText('General').length).toBe(2);
    expect(screen.getByText('Overall Status: Not Started')).toBeTruthy();
  });

  it('shows the Work Address required hint while Work Information is incomplete', async () => {
    await render(<GenericPerformanceForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('Work Address is required (Work Information).')).toBeTruthy();
  });

  it('OR-logic (AC11): becomes Completed once ALL fields within ONE sub-section are answered, without touching the others', async () => {
    await render(<GenericPerformanceForm route={makeRoute()} navigation={{} as any} />);
    // "General" sub-section has 3 fields — answer all 3 to complete it via
    // AND-logic. After each selection the field's own box also displays
    // "Checked OK", so once inside the dialog the LAST "Checked OK" match
    // is always the freshly-opened dialog's own option (the dialog renders
    // after, i.e. later in the tree, than any already-answered field boxes).
    const generalFields = GENERIC_PERFORMANCE_SUBSECTIONS[0].fields;
    for (let i = 0; i < generalFields.length; i++) {
      const selectBoxes = screen.getAllByText('Select');
      await fireEvent.press(selectBoxes[0]);
      const dialogOptions = screen.getAllByText('Checked OK');
      await fireEvent.press(dialogOptions[dialogOptions.length - 1]);
    }
    expect(screen.getByText('Overall Status: Completed')).toBeTruthy();
  });

  it('answering only SOME fields in a sub-section leaves overall status In Progress', async () => {
    await render(<GenericPerformanceForm route={makeRoute()} navigation={{} as any} />);
    const selectBoxes = screen.getAllByText('Select');
    await fireEvent.press(selectBoxes[0]);
    await fireEvent.press(screen.getByText('Checked OK'));
    expect(screen.getByText('Overall Status: In Progress')).toBeTruthy();
  });

  it('switches sub-section fields when a different tab is pressed', async () => {
    await render(<GenericPerformanceForm route={makeRoute()} navigation={{} as any} />);
    const secondSection = GENERIC_PERFORMANCE_SUBSECTIONS[1]; // "Roadworks Guarding"
    await fireEvent.press(screen.getByText(secondSection.name));
    expect(screen.getByText(secondSection.fields[0])).toBeTruthy();
  });

  it('Save & Back persists an overall FormStatus + Work Information + one FormAnswer per field across all sub-sections, then navigates back', async () => {
    await render(<GenericPerformanceForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Save & Back'));

    expect(mockSaveFormStatus).toHaveBeenCalledWith('sf_3', 'Not Started');
    expect(mockSaveFormAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ cateCode: 'WORK_INFO', formName: 'Generic Performance / Work Information' }),
    );
    const totalFields = GENERIC_PERFORMANCE_SUBSECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
    expect(mockSaveFormAnswer).toHaveBeenCalledTimes(totalFields + 1); // +1 for Work Information
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
