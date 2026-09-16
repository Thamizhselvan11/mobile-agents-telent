/**
 * CreateAuditScreen — Figma frame 2:4, covers AC1-AC5. Full coverage per
 * the agent's scope guidance (one of the 3 Figma-sourced core screens):
 * rendering, field validation (required + exactly-10-digits Order Number),
 * and the Create button's navigation trigger.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CreateAuditScreen from '../CreateAuditScreen';

const mockReplace = jest.fn();
const mockGoBack = jest.fn();

const mockGenerateId = jest.fn((..._args: unknown[]) => 'audit_123');
const mockGenerateCqpNumber = jest.fn((..._args: unknown[]) => 'CQP/NA/2024-01/01 00:00:00');
const mockSaveAudit = jest.fn((..._args: unknown[]) => Promise.resolve(undefined));
const mockSeedFormStatus = jest.fn((..._args: unknown[]) => Promise.resolve({}));

jest.mock('../../services/localStorage', () => ({
  generateId: (...args: unknown[]) => mockGenerateId(...args),
  generateCqpNumber: (...args: unknown[]) => mockGenerateCqpNumber(...args),
  saveAudit: (...args: unknown[]) => mockSaveAudit(...args),
  seedFormStatus: (...args: unknown[]) => mockSeedFormStatus(...args),
}));

function makeNavigation() {
  return { replace: mockReplace, goBack: mockGoBack, navigate: jest.fn() } as any;
}

/**
 * Selects a real, valid Audit Type + Primary Audit Type pair the way an
 * actual user would under the corrected (AC3) nested-filtering behavior:
 * Primary Audit Type has no options at all until an Audit Type is chosen,
 * and its options are then the nested form-set for that category — never
 * the same flat 3-category list. Defaults to "Agent Gate Check" ->
 * "Form 701-Civil" (distinct labels, so no ambiguous duplicate-text
 * matches like the old "Retrospective"/"Retrospective" pairing had).
 */
async function selectAuditTypeAndPrimaryAuditType(
  auditType: string = 'Agent Gate Check',
  primaryAuditType: string = 'Form 701-Civil',
) {
  await fireEvent.press(screen.getAllByText('Select')[0]);
  await fireEvent.press(screen.getByText(auditType));
  await fireEvent.press(screen.getAllByText('Select')[0]);
  await fireEvent.press(screen.getByText(primaryAuditType));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveAudit.mockResolvedValue(undefined);
  mockSeedFormStatus.mockResolvedValue({});
});

describe('CreateAuditScreen', () => {
  it('renders without crashing, showing the title and all 3 fields', async () => {
    await render(<CreateAuditScreen navigation={makeNavigation()} route={{ key: 'r', name: 'CreateAudit', params: undefined } as any} />);
    expect(screen.getByText('Create New Audit Form')).toBeTruthy();
    expect(screen.getByText('Audit Type')).toBeTruthy();
    expect(screen.getByText('Primary Audit Type')).toBeTruthy();
    expect(screen.getByText('Order Number')).toBeTruthy();
    expect(screen.getByText('Create')).toBeTruthy();
  });

  it('shows required-field errors when Create is pressed with everything empty', async () => {
    await render(<CreateAuditScreen navigation={makeNavigation()} route={{ key: 'r', name: 'CreateAudit', params: undefined } as any} />);
    await fireEvent.press(screen.getByText('Create'));
    expect(screen.getByText('Audit Type is required.')).toBeTruthy();
    expect(screen.getByText('Primary Audit Type is required.')).toBeTruthy();
    expect(screen.getByText('Order Number is required.')).toBeTruthy();
    expect(mockSaveAudit).not.toHaveBeenCalled();
  });

  it('rejects an Order Number that is not exactly 10 digits', async () => {
    await render(<CreateAuditScreen navigation={makeNavigation()} route={{ key: 'r', name: 'CreateAudit', params: undefined } as any} />);
    await selectAuditTypeAndPrimaryAuditType();
    await fireEvent.changeText(screen.getByPlaceholderText('Search Order Number'), '123');
    await fireEvent.press(screen.getByText('Create'));
    expect(screen.getByText('Order Number must be exactly 10 digits.')).toBeTruthy();
    expect(mockSaveAudit).not.toHaveBeenCalled();
  });

  it('strips non-digit characters as the user types the Order Number', async () => {
    await render(<CreateAuditScreen navigation={makeNavigation()} route={{ key: 'r', name: 'CreateAudit', params: undefined } as any} />);
    const input = screen.getByPlaceholderText('Search Order Number');
    await fireEvent.changeText(input, 'a1b2c3');
    expect(input.props.value).toBe('123');
  });

  it('on valid submit: saves the audit, seeds all 5 fixed sub-forms, and navigates to AuditForm (AC4)', async () => {
    const navigation = makeNavigation();
    await render(<CreateAuditScreen navigation={navigation} route={{ key: 'r', name: 'CreateAudit', params: undefined } as any} />);

    await selectAuditTypeAndPrimaryAuditType();
    await fireEvent.changeText(screen.getByPlaceholderText('Search Order Number'), '1234567890');
    await fireEvent.press(screen.getByText('Create'));

    expect(mockSaveAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'audit_123',
        auditType: 'Agent Gate Check',
        primaryAuditType: 'Form 701-Civil',
        orderNumber: '1234567890',
        cqpNumber: 'CQP/NA/2024-01/01 00:00:00',
      }),
    );
    expect(mockSeedFormStatus).toHaveBeenCalledTimes(5); // 5 fixed sub-forms
    expect(mockSeedFormStatus).toHaveBeenCalledWith(
      expect.objectContaining({ formName: 'General Information', formType: 'sub-form' }),
    );
    expect(navigation.replace).toHaveBeenCalledWith('AuditForm', { auditId: 'audit_123', orderNumber: '1234567890' });
  });

  it('Primary Audit Type is a nested list filtered by Audit Type, and resets when the selection no longer fits (AC3)', async () => {
    await render(<CreateAuditScreen navigation={makeNavigation()} route={{ key: 'r', name: 'CreateAudit', params: undefined } as any} />);

    // Before any Audit Type is chosen, Primary Audit Type has a disabled hint and no real options to pick.
    expect(screen.getByText('Select Audit Type first')).toBeTruthy();

    // Pick "Agent Gate Check" for Audit Type, then "Form 701-Civil" as its nested Primary Audit Type.
    await fireEvent.press(screen.getAllByText('Select')[0]);
    await fireEvent.press(screen.getByText('Agent Gate Check'));
    await fireEvent.press(screen.getAllByText('Select')[0]);
    expect(screen.getByText('Form 701-Civil')).toBeTruthy();
    expect(screen.getByText('Form 711-Cable')).toBeTruthy();
    expect(screen.getByText('Form 731-Asset')).toBeTruthy();
    // "Retrospective"'s nested option must NOT leak into this category's list.
    expect(screen.queryByText('Form 700-Job Validation')).toBeNull();
    await fireEvent.press(screen.getByText('Form 701-Civil'));
    expect(screen.getByText('Form 701-Civil')).toBeTruthy();

    // Switching Audit Type to "Retrospective" invalidates the previously-picked
    // "Form 701-Civil" (not a nested option there), so it must reset to empty,
    // and the picker must now offer only "Form 700-Job Validation".
    // Reopen the Audit Type picker via its own box, which now displays "Agent Gate Check" instead of "Select".
    await fireEvent.press(screen.getByText('Agent Gate Check'));
    await fireEvent.press(screen.getByText('Retrospective'));
    expect(screen.getAllByText('Select').length).toBeGreaterThan(0); // Primary Audit Type box fell back to its placeholder
    await fireEvent.press(screen.getAllByText('Select')[0]);
    expect(screen.getByText('Form 700-Job Validation')).toBeTruthy();
    expect(screen.queryByText('Form 701-Civil')).toBeNull();
  });
});
