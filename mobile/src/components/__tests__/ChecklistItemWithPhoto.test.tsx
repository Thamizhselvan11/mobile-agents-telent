/**
 * ChecklistItemWithPhoto — the shared "Checked OK / Below Standard / Fixed
 * at Audit" + photo-mandatory pattern reused ~500+ times across Generic
 * Performance and all 22 child forms (AC22, AC28). High-impact: a bug here
 * affects every reuse site, so this gets full coverage per the agent's scope
 * guidance.
 *
 * Note: @testing-library/react-native v14's `render`/`fireEvent` APIs are
 * async (they wrap async `act` internally) — every render/interaction below
 * is awaited, per this version's own docs.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  ChecklistItemWithPhoto,
  emptyChecklistAnswer,
  isChecklistAnswerValid,
} from '../ChecklistItemWithPhoto';
import type { ChecklistAnswer } from '../../types/models';

function Wrapper({ initial }: { initial: ChecklistAnswer }) {
  const [value, setValue] = React.useState<ChecklistAnswer>(initial);
  return <ChecklistItemWithPhoto label="Test Field" value={value} onChange={setValue} />;
}

describe('ChecklistItemWithPhoto', () => {
  it('renders without crashing, showing the label and a "Select" placeholder when unanswered', async () => {
    await render(<ChecklistItemWithPhoto label="Test Field" value={emptyChecklistAnswer()} onChange={jest.fn()} />);
    expect(screen.getByText('Test Field')).toBeTruthy();
    expect(screen.getByText('Select')).toBeTruthy();
  });

  it('opens the bottom-sheet dialog with all 3 options when the select box is pressed', async () => {
    await render(<ChecklistItemWithPhoto label="Test Field" value={emptyChecklistAnswer()} onChange={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Select' }));
    expect(screen.getByText('Checked OK')).toBeTruthy();
    expect(screen.getByText('Below Standard')).toBeTruthy();
    expect(screen.getByText('Fixed at Audit')).toBeTruthy();
  });

  it('calls onChange with the selected option and closes the dialog', async () => {
    const onChange = jest.fn();
    await render(<ChecklistItemWithPhoto label="Test Field" value={emptyChecklistAnswer()} onChange={onChange} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Select' }));
    await fireEvent.press(screen.getByText('Checked OK'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ option: 'Checked OK', beforePhotos: [], afterPhotos: [] }),
    );
  });

  it('reveals Before/After camera buttons + galleries only once an option is selected', async () => {
    await render(<ChecklistItemWithPhoto label="Test Field" value={emptyChecklistAnswer()} onChange={jest.fn()} />);
    expect(screen.queryByText('Before')).toBeNull();
    expect(screen.queryByText('After')).toBeNull();

    await screen.rerender(
      <ChecklistItemWithPhoto
        label="Test Field"
        value={{ option: 'Checked OK', beforePhotos: [], afterPhotos: [] }}
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByText('Before')).toBeTruthy();
    expect(screen.getByText('After')).toBeTruthy();
  });

  it('adds a placeholder photo to beforePhotos when the Before camera button is pressed', async () => {
    await render(<Wrapper initial={{ option: 'Checked OK', beforePhotos: [], afterPhotos: [] }} />);
    await fireEvent.press(screen.getByText('Before'));
    // A delete button appears once a photo is present in the gallery strip.
    expect(screen.getByLabelText('Delete photo')).toBeTruthy();
  });

  describe('validation rules (AC22/AC28)', () => {
    it('Checked OK is valid with zero photos (both before/after optional)', () => {
      const value: ChecklistAnswer = { option: 'Checked OK', beforePhotos: [], afterPhotos: [] };
      expect(isChecklistAnswerValid(value)).toBe(true);
    });

    it('Below Standard requires at least one of before/after — invalid with zero photos', () => {
      const value: ChecklistAnswer = { option: 'Below Standard', beforePhotos: [], afterPhotos: [] };
      expect(isChecklistAnswerValid(value)).toBe(false);
    });

    it('Below Standard is valid with only a before photo', () => {
      const photo = { latitude: '', longitude: '', location: '', photoTakenBy: '', photoTakenAt: '', values: '', localPath: 'x' };
      const value: ChecklistAnswer = { option: 'Below Standard', beforePhotos: [photo], afterPhotos: [] };
      expect(isChecklistAnswerValid(value)).toBe(true);
    });

    it('Below Standard is valid with only an after photo', () => {
      const photo = { latitude: '', longitude: '', location: '', photoTakenBy: '', photoTakenAt: '', values: '', localPath: 'x' };
      const value: ChecklistAnswer = { option: 'Below Standard', beforePhotos: [], afterPhotos: [photo] };
      expect(isChecklistAnswerValid(value)).toBe(true);
    });

    it('Fixed at Audit requires BOTH before and after — invalid with only one', () => {
      const photo = { latitude: '', longitude: '', location: '', photoTakenBy: '', photoTakenAt: '', values: '', localPath: 'x' };
      const onlyBefore: ChecklistAnswer = { option: 'Fixed at Audit', beforePhotos: [photo], afterPhotos: [] };
      const onlyAfter: ChecklistAnswer = { option: 'Fixed at Audit', beforePhotos: [], afterPhotos: [photo] };
      expect(isChecklistAnswerValid(onlyBefore)).toBe(false);
      expect(isChecklistAnswerValid(onlyAfter)).toBe(false);
    });

    it('Fixed at Audit is valid once both before and after have a photo', () => {
      const photo = { latitude: '', longitude: '', location: '', photoTakenBy: '', photoTakenAt: '', values: '', localPath: 'x' };
      const value: ChecklistAnswer = { option: 'Fixed at Audit', beforePhotos: [photo], afterPhotos: [photo] };
      expect(isChecklistAnswerValid(value)).toBe(true);
    });

    it('an unanswered field (option: null) is treated as valid (not-yet-answered, not an error state)', () => {
      expect(isChecklistAnswerValid(emptyChecklistAnswer())).toBe(true);
    });

    it('renders an inline error message for an invalid Below Standard answer', async () => {
      await render(
        <ChecklistItemWithPhoto
          label="Test Field"
          value={{ option: 'Below Standard', beforePhotos: [], afterPhotos: [] }}
          onChange={jest.fn()}
        />,
      );
      expect(screen.getByText(/At least one of Before or After photo is required/)).toBeTruthy();
    });

    it('renders an inline error message for an invalid Fixed at Audit answer', async () => {
      await render(
        <ChecklistItemWithPhoto
          label="Test Field"
          value={{ option: 'Fixed at Audit', beforePhotos: [], afterPhotos: [] }}
          onChange={jest.fn()}
        />,
      );
      expect(screen.getByText(/Both Before and After photos are required/)).toBeTruthy();
    });

    it('renders no error message for a valid Checked OK answer', async () => {
      await render(
        <ChecklistItemWithPhoto
          label="Test Field"
          value={{ option: 'Checked OK', beforePhotos: [], afterPhotos: [] }}
          onChange={jest.fn()}
        />,
      );
      expect(screen.queryByText(/required/)).toBeNull();
    });
  });

  it('deleting a before photo removes only that photo (by index)', async () => {
    const photoA = { latitude: '', longitude: '', location: '', photoTakenBy: '', photoTakenAt: '', values: '', localPath: 'a' };
    const photoB = { latitude: '', longitude: '', location: '', photoTakenBy: '', photoTakenAt: '', values: '', localPath: 'b' };
    await render(<Wrapper initial={{ option: 'Checked OK', beforePhotos: [photoA, photoB], afterPhotos: [] }} />);
    const deleteButtons = screen.getAllByLabelText('Delete photo');
    expect(deleteButtons).toHaveLength(2);
    await fireEvent.press(deleteButtons[0]);
    expect(screen.getAllByLabelText('Delete photo')).toHaveLength(1);
  });
});
