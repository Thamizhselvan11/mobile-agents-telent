/**
 * WorkInformation — shared header (Work Point + Work Address) reused at the
 * top of Generic Performance and every one of the 22 child forms (AC21,
 * AC29). Tests the alphabetic-only validation rule and the cross-form
 * Work Point exclusion list (`excludedWorkPoints`).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkInformation, emptyWorkInformation, WorkInformationValue } from '../WorkInformation';

function Wrapper({ initial, excludedWorkPoints }: { initial: WorkInformationValue; excludedWorkPoints?: string[] }) {
  const [value, setValue] = React.useState(initial);
  return <WorkInformation value={value} onChange={setValue} excludedWorkPoints={excludedWorkPoints} />;
}

describe('WorkInformation', () => {
  it('renders the Work Point and Work Address fields', async () => {
    await render(<WorkInformation value={emptyWorkInformation()} onChange={jest.fn()} />);
    expect(screen.getByText('Work Point')).toBeTruthy();
    // "Work Address" renders with a nested required-asterisk Text node, so
    // the full text content of the label is "Work Address *".
    expect(screen.getByText(/^Work Address/)).toBeTruthy();
    expect(screen.getByText('Select (optional)')).toBeTruthy();
  });

  it('shows the section title by default and hides it when showSectionTitle=false', async () => {
    await render(<WorkInformation value={emptyWorkInformation()} onChange={jest.fn()} />);
    expect(screen.getByText('Work Information')).toBeTruthy();

    await screen.rerender(
      <WorkInformation value={emptyWorkInformation()} onChange={jest.fn()} showSectionTitle={false} />,
    );
    expect(screen.queryByText('Work Information')).toBeNull();
  });

  it('calls onChange with the updated workAddress as the user types', async () => {
    const onChange = jest.fn();
    await render(<WorkInformation value={emptyWorkInformation()} onChange={onChange} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Enter work address'), 'Main Street');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ workAddress: 'Main Street' }));
  });

  it('shows a validation error for a non-alphabetic Work Address (digits/emoji not allowed)', async () => {
    await render(<Wrapper initial={{ workPoint: null, workAddress: '123 Main St' }} />);
    expect(screen.getByText(/Work Address must be alphabetic only/)).toBeTruthy();
  });

  it('shows no validation error for a purely alphabetic Work Address', async () => {
    await render(<Wrapper initial={{ workPoint: null, workAddress: 'Main Street' }} />);
    expect(screen.queryByText(/must be alphabetic only/)).toBeNull();
  });

  it('shows no validation error while Work Address is still empty (optional-until-typed)', async () => {
    await render(<WorkInformation value={emptyWorkInformation()} onChange={jest.fn()} />);
    expect(screen.queryByText(/must be alphabetic only/)).toBeNull();
  });

  it('opens the Work Point picker and selects a value, invoking onChange', async () => {
    const onChange = jest.fn();
    await render(<WorkInformation value={emptyWorkInformation()} onChange={onChange} />);
    await fireEvent.press(screen.getByText('Select (optional)'));
    // Work Points render 0-25; press option "5".
    await fireEvent.press(screen.getByText('5'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ workPoint: '5' }));
  });

  it('excludes work points already selected in the parent form from the picker list', async () => {
    await render(
      <WorkInformation value={emptyWorkInformation()} onChange={jest.fn()} excludedWorkPoints={['0', '1', '2']} />,
    );
    await fireEvent.press(screen.getByText('Select (optional)'));
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.getByText('3')).toBeTruthy();
  });
});
