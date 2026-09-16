/**
 * SummaryForm sub-form (AC24). Full coverage per the agent's scope
 * guidance: renders pre-filled local-DB placeholder IDs, email validation,
 * and save-on-back persistence. Inspector I/D / BT CMG Auditor I/D are
 * "retrieved from local database" per the AC but modeled with a local
 * placeholder value (see impl-frontend.md's known gap) — tested as-built,
 * not against a real lookup table that doesn't exist yet.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SummaryForm from '../SummaryForm';

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
    name: 'SummaryForm',
    params: {
      auditId: 'audit_1',
      orderNumber: '1234567890',
      parentFormID: 'audit_1',
      childFormID: 'sf_4',
      formName: 'Summary',
    },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveFormStatus.mockResolvedValue(undefined);
  mockSaveFormAnswer.mockResolvedValue(undefined);
});

describe('SummaryForm', () => {
  it('renders pre-filled Inspector I/D and BT CMG Auditor I/D, and starts Completed (both required fields pre-filled)', async () => {
    await render(<SummaryForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(screen.getByDisplayValue('INSP-LOCAL-0001')).toBeTruthy();
    expect(screen.getByDisplayValue('AUD-LOCAL-0001')).toBeTruthy();
    expect(screen.getByText('Status: Completed')).toBeTruthy();
  });

  it('Inspector I/D is not editable; BT CMG Auditor I/D is editable', async () => {
    await render(<SummaryForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByDisplayValue('INSP-LOCAL-0001').props.editable).toBe(false);
    expect(screen.getByDisplayValue('AUD-LOCAL-0001').props.editable).not.toBe(false);
  });

  it('shows a validation error for an invalid Auditor Email', async () => {
    await render(<SummaryForm route={makeRoute()} navigation={{} as any} />);
    const emailInput = screen.getByDisplayValue('');
    await fireEvent.changeText(emailInput, 'not-an-email');
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  });

  it('shows no validation error for a valid Auditor Email', async () => {
    await render(<SummaryForm route={makeRoute()} navigation={{} as any} />);
    const emailInput = screen.getByDisplayValue('');
    await fireEvent.changeText(emailInput, 'auditor@example.com');
    expect(screen.queryByText('Enter a valid email address.')).toBeNull();
  });

  it('Save & Back persists FormStatus + FormAnswer, then navigates back', async () => {
    await render(<SummaryForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Save & Back'));

    expect(mockSaveFormStatus).toHaveBeenCalledWith('sf_4', 'Completed');
    expect(mockSaveFormAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFormID: 'audit_1',
        childFormID: 'sf_4',
        formName: 'Summary',
        cateCode: 'SUMMARY',
      }),
    );
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
