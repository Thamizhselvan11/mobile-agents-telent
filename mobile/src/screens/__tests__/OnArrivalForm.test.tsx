/**
 * OnArrivalForm sub-form (AC18, AC19) — single multi-image capture field.
 * Full coverage per the agent's scope guidance: status wiring (Completed
 * once at least one photo is added), add/delete photo flow, and
 * save-on-back persistence. Camera/gallery native capture is stubbed
 * (makePlaceholderImage) — this is UI/state coverage, not native-module
 * coverage, per the agent's excluded-stubs rule.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import OnArrivalForm from '../OnArrivalForm';

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
    name: 'OnArrivalForm',
    params: {
      auditId: 'audit_1',
      orderNumber: '1234567890',
      parentFormID: 'audit_1',
      childFormID: 'sf_2',
      formName: 'On Arrival',
    },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveFormStatus.mockResolvedValue(undefined);
  mockSaveFormAnswer.mockResolvedValue(undefined);
});

describe('OnArrivalForm', () => {
  it('renders without crashing and starts as Not Started with no photos', async () => {
    await render(<OnArrivalForm route={makeRoute()} navigation={{} as any} />);
    expect(screen.getByText('On Arrival')).toBeTruthy();
    expect(screen.getByText('Status: Not Started')).toBeTruthy();
    expect(screen.queryByLabelText('Delete photo')).toBeNull();
  });

  it('becomes Completed once at least one photo is added', async () => {
    await render(<OnArrivalForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Camera'));
    expect(screen.getByText('Status: Completed')).toBeTruthy();
    expect(screen.getByLabelText('Delete photo')).toBeTruthy();
  });

  it('deleting the only photo returns status to Not Started', async () => {
    await render(<OnArrivalForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Camera'));
    await fireEvent.press(screen.getByLabelText('Delete photo'));
    expect(screen.getByText('Status: Not Started')).toBeTruthy();
  });

  it('Save & Back persists FormStatus + FormAnswer with the photos JSON, then navigates back', async () => {
    await render(<OnArrivalForm route={makeRoute()} navigation={{} as any} />);
    await fireEvent.press(screen.getByText('Camera'));
    await fireEvent.press(screen.getByText('Save & Back'));

    expect(mockSaveFormStatus).toHaveBeenCalledWith('sf_2', 'Completed');
    expect(mockSaveFormAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFormID: 'audit_1',
        childFormID: 'sf_2',
        formName: 'On Arrival',
        cateCode: 'MULTI_PHOTO',
      }),
    );
    const call = mockSaveFormAnswer.mock.calls[0][0];
    expect(JSON.parse(call.answer)).toHaveLength(1);
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
