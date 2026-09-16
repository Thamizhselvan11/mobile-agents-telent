/**
 * AddChildFormScreen — Figma frame 4:4, covers AC8, AC26. Full coverage per
 * the agent's scope guidance: renders all 20 child-form catalog entries,
 * and selecting one seeds a FormStatus row then navigates to that form's
 * own screen with the right route params.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AddChildFormScreen from '../AddChildFormScreen';
import { CHILD_FORM_CATALOG } from '../../data/childFormCatalog';

const mockGenerateId = jest.fn((..._args: unknown[]) => 'cf_new');
const mockSeedFormStatus = jest.fn((..._args: unknown[]) => Promise.resolve({}));

jest.mock('../../services/localStorage', () => ({
  generateId: (...args: unknown[]) => mockGenerateId(...args),
  seedFormStatus: (...args: unknown[]) => mockSeedFormStatus(...args),
}));

function makeNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() } as any;
}

function makeRoute() {
  return { key: 'r', name: 'AddChildForm', params: { auditId: 'audit_1', orderNumber: '1234567890' } } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSeedFormStatus.mockResolvedValue({});
});

describe('AddChildFormScreen', () => {
  it('renders the order number and all 20 child-form catalog entries (AC26)', async () => {
    await render(<AddChildFormScreen navigation={makeNavigation()} route={makeRoute()} />);
    expect(CHILD_FORM_CATALOG).toHaveLength(20);
    expect(screen.getByText('Order# 1234567890')).toBeTruthy();
    for (const entry of CHILD_FORM_CATALOG) {
      expect(screen.getByText(entry.title)).toBeTruthy();
    }
  });

  it('seeds a new FormStatus row and navigates to the matching form screen when an entry is selected', async () => {
    const navigation = makeNavigation();
    await render(<AddChildFormScreen navigation={navigation} route={makeRoute()} />);

    const entry = CHILD_FORM_CATALOG.find(e => e.code === '101')!;
    await fireEvent.press(screen.getByText(entry.title));

    expect(mockSeedFormStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        visitId: 'audit_1',
        parentFormID: 'audit_1',
        orderNumber: '1234567890',
        formName: entry.title,
        formType: 'child-form',
      }),
    );
    expect(navigation.navigate).toHaveBeenCalledWith(
      entry.screen,
      expect.objectContaining({
        auditId: 'audit_1',
        orderNumber: '1234567890',
        parentFormID: 'audit_1',
        childFormID: 'cf_new',
        formName: entry.title,
        isChildForm: true,
      }),
    );
  });

  it('selecting the largest catalog form (Form 560) still navigates correctly', async () => {
    const navigation = makeNavigation();
    await render(<AddChildFormScreen navigation={navigation} route={makeRoute()} />);
    const entry = CHILD_FORM_CATALOG.find(e => e.code === '560')!;
    await fireEvent.press(screen.getByText(entry.title));
    expect(navigation.navigate).toHaveBeenCalledWith(entry.screen, expect.objectContaining({ formName: entry.title }));
  });
});
