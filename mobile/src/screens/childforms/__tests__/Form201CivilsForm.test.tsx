/**
 * Form201CivilsForm — the one child form with genuinely different
 * multi-section/sub-title logic (AC30: 10 sub-titles, each independently
 * tracked; AC27/AC11-style OR-logic: only ONE sub-title needs to be
 * Completed for the whole form to be Completed). Full coverage per the
 * agent's scope guidance.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Form201CivilsForm from '../Form201CivilsForm';
import { FORM_201_CIVILS_SUBTITLES } from '../../../data/form201CivilsFields';

const mockGoBack = jest.fn();
const mockSaveFormStatus = jest.fn().mockResolvedValue(undefined);
const mockSaveFormAnswer = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
}));

jest.mock('../../../services/localStorage', () => ({
  saveFormStatus: (...args: unknown[]) => mockSaveFormStatus(...args),
  saveFormAnswer: (...args: unknown[]) => mockSaveFormAnswer(...args),
}));

const routeParams = {
  auditId: 'audit_1',
  orderNumber: '1234567890',
  parentFormID: 'audit_1',
  childFormID: 'cf_201',
  formName: 'Form 201 - CIVILS',
};

function makeRoute() {
  return { key: 'r1', name: 'r1' as const, params: routeParams } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveFormStatus.mockResolvedValue(undefined);
  mockSaveFormAnswer.mockResolvedValue(undefined);
});

async function answerFirstFieldOfActiveSubTitle(option: 'Checked OK' | 'Below Standard' | 'Fixed at Audit') {
  // The active sub-title's fields render below Work Information; its first
  // field is the "Select" box at index 0 among ALL "Select" boxes rendered
  // (Work Point's picker uses different text, "Select (optional)").
  const selectBoxes = screen.getAllByText('Select');
  await fireEvent.press(selectBoxes[0]);
  await fireEvent.press(screen.getByText(option));
}

describe('Form201CivilsForm', () => {
  it('renders the title, all 10 sub-title tabs, and the first sub-title\'s fields by default', async () => {
    await render(<Form201CivilsForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('Form 201 - CIVILS')).toBeTruthy();
    expect(FORM_201_CIVILS_SUBTITLES).toHaveLength(10);
    for (const subtitle of FORM_201_CIVILS_SUBTITLES) {
      // The active tab's name ("Duct Laying") renders twice — once as the
      // tab label, once as the current section heading — every other tab
      // name renders once.
      expect(screen.getAllByText(subtitle.name).length).toBeGreaterThanOrEqual(1);
    }
    // First sub-title ("Duct Laying") is active by default: its section
    // heading + first field are shown.
    expect(screen.getAllByText('Duct Laying').length).toBe(2);
    expect(screen.getByText(`* ${FORM_201_CIVILS_SUBTITLES[0].fields[0]}`)).toBeTruthy();
  });

  it('starts as "Not Started" with the hint that only one sub-title needs completing', async () => {
    await render(<Form201CivilsForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('Overall Status: Not Started')).toBeTruthy();
    expect(screen.getByText('Only one sub-title needs to be completed.')).toBeTruthy();
  });

  it('switches the displayed fields when a different sub-title tab is pressed', async () => {
    await render(<Form201CivilsForm route={makeRoute()} navigation={{} as any} />);
    const secondSubTitle = FORM_201_CIVILS_SUBTITLES[1]; // "Duct Seal/Lead In/Termination"
    await fireEvent.press(screen.getByText(secondSubTitle.name));
    expect(screen.getByText(`* ${secondSubTitle.fields[0]}`)).toBeTruthy();
    // First sub-title's fields should no longer be rendered.
    expect(screen.queryByText(`* ${FORM_201_CIVILS_SUBTITLES[0].fields[0]}`)).toBeNull();
  });

  it('OR-logic (AC27/AC11-style): completing ONLY the active sub-title\'s mandatory field marks the whole form Completed', async () => {
    await render(<Form201CivilsForm route={makeRoute()} navigation={{} as any} />);
    await answerFirstFieldOfActiveSubTitle('Checked OK');
    expect(screen.getByText('Overall Status: Completed')).toBeTruthy();
  });

  it('leaves overall status as In Progress when only a non-mandatory field is answered', async () => {
    await render(<Form201CivilsForm route={makeRoute()} navigation={{} as any} />);
    // Field index 1 within the active sub-title (not the mandatory index 0).
    const selectBoxes = screen.getAllByText('Select');
    await fireEvent.press(selectBoxes[1]);
    await fireEvent.press(screen.getByText('Checked OK'));
    expect(screen.getByText('Overall Status: In Progress')).toBeTruthy();
  });

  it('persists an overall FormStatus + one FormAnswer per sub-title-field, then navigates back, on Save & Back', async () => {
    await render(<Form201CivilsForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Save & Back'));

    expect(mockSaveFormStatus).toHaveBeenCalledWith('cf_201', 'Not Started');
    const totalFields = FORM_201_CIVILS_SUBTITLES.reduce((sum, st) => sum + st.fields.length, 0);
    expect(mockSaveFormAnswer).toHaveBeenCalledTimes(totalFields);
    expect(mockSaveFormAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFormID: 'audit_1',
        childFormID: 'cf_201',
        formName: `Form 201 - CIVILS / ${FORM_201_CIVILS_SUBTITLES[0].name}`,
        cateCode: 'S0F0',
      }),
    );
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
