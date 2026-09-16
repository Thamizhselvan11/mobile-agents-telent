/**
 * GeneralInformationForm sub-form (AC10, AC15-AC17). Full coverage per the
 * agent's scope guidance: renders all fields, computeAndGroupStatus wiring
 * (AND-logic across required fields), the emoji-rejection validation rule,
 * the GPS stub wiring (AC17 — tested as a stub call, not real GPS), and the
 * Next button's navigation + persist trigger.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import GeneralInformationForm from '../GeneralInformationForm';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSaveFormStatus = jest.fn().mockResolvedValue(undefined);
const mockSaveFormAnswer = jest.fn().mockResolvedValue(undefined);
const mockGetCurrentLocationStub = jest.fn().mockResolvedValue({ latitude: '', longitude: '', location: '' });

jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react');
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useFocusEffect: (callback: () => void) => ReactActual.useEffect(() => callback(), [callback]),
  };
});

jest.mock('../../services/localStorage', () => ({
  saveFormStatus: (...args: unknown[]) => mockSaveFormStatus(...args),
  saveFormAnswer: (...args: unknown[]) => mockSaveFormAnswer(...args),
  getCurrentLocationStub: (...args: unknown[]) => mockGetCurrentLocationStub(...args),
}));

function makeRoute() {
  return {
    key: 'r',
    name: 'GeneralInformationForm',
    params: {
      auditId: 'audit_1',
      orderNumber: '1234567890',
      parentFormID: 'audit_1',
      childFormID: 'sf_1',
      formName: 'General Information',
    },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveFormStatus.mockResolvedValue(undefined);
  mockSaveFormAnswer.mockResolvedValue(undefined);
  mockGetCurrentLocationStub.mockResolvedValue({ latitude: '', longitude: '', location: '' });
});

describe('GeneralInformationForm', () => {
  it('renders without crashing, starting as "In Progress" (Job/Order No is pre-filled from the Order Number, one required field is already answered)', async () => {
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('General Information')).toBeTruthy();
    expect(screen.getByText('Status: In Progress')).toBeTruthy();
  });

  it('Job/Order No is pre-filled from the Order Number and not editable', async () => {
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    const input = screen.getByDisplayValue('1234567890');
    expect(input.props.editable).toBe(false);
  });

  it('reveals Operative ID 5-8 fields only after pressing "+ Add Operative ID 5-8"', async () => {
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.queryByText('Operative 5 I/D')).toBeNull();
    await fireEvent.press(screen.getByText('+ Add Operative ID 5-8'));
    expect(screen.getByText('Operative 5 I/D')).toBeTruthy();
    expect(screen.getByText('Operative 8 I/D')).toBeTruthy();
  });

  /**
   * Exchange Area (the first TextField rendered) has no placeholder/label
   * association testing-library can query by directly (RN has no native
   * <label for>), so all rendered TextInput host nodes are found via the
   * low-level TestInstance.queryAll escape hatch and picked positionally.
   */
  function getAllTextInputs() {
    return screen.root!.queryAll(node => node.type === 'TextInput');
  }

  it('shows an emoji-rejection error on a free-text field containing an emoji', async () => {
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    const exchangeAreaInput = getAllTextInputs()[0];
    await fireEvent.changeText(exchangeAreaInput, 'Area 🎉');
    expect(screen.getByText('Emojis are not allowed.')).toBeTruthy();
  });

  it('computeAndGroupStatus (AND-logic): becomes Completed only once ALL required fields are filled', async () => {
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    // Fill every editable required field with a simple value (skip the
    // disabled Job/Order No input, which is already pre-filled anyway).
    for (const input of getAllTextInputs()) {
      if (input.props.editable === false) continue;
      await fireEvent.changeText(input, 'value');
    }
    expect(screen.getByText('Status: Completed')).toBeTruthy();
  });

  it('calls getCurrentLocationStub and fills Location when "Use GPS" is pressed', async () => {
    mockGetCurrentLocationStub.mockResolvedValue({ latitude: '1', longitude: '2', location: 'Somewhere' });
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Use GPS'));
    expect(mockGetCurrentLocationStub).toHaveBeenCalledTimes(1);
    expect(screen.getByDisplayValue('Somewhere')).toBeTruthy();
  });

  it('Next persists FormStatus + FormAnswer, then navigates to OnArrivalForm', async () => {
    await render(<GeneralInformationForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Next →'));

    // Job/Order No is pre-filled from the Order Number, so at least one
    // required field is already answered on first render — status is
    // "In Progress", not "Not Started".
    expect(mockSaveFormStatus).toHaveBeenCalledWith('sf_1', 'In Progress');
    expect(mockSaveFormAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFormID: 'audit_1',
        childFormID: 'sf_1',
        orderNumber: '1234567890',
        formName: 'General Information',
        cateCode: 'GENERAL_INFO',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith(
      'OnArrivalForm',
      expect.objectContaining({ auditId: 'audit_1', parentFormID: 'audit_1', childFormID: 'sf_1', formName: 'On Arrival' }),
    );
  });
});
