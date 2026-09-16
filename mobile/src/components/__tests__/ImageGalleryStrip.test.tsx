/**
 * ImageGalleryStrip + CameraButton + makePlaceholderImage.
 * Camera/gallery native capture is intentionally stubbed this pass
 * (`makePlaceholderImage` — see 03-frontend-builder hand-off); we test the
 * UI/gallery/delete flow the stub is designed to exercise, not the (absent)
 * native camera integration itself.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ImageGalleryStrip, CameraButton, makePlaceholderImage } from '../ImageGalleryStrip';
import type { ImageModel } from '../../types/models';

const photo1: ImageModel = {
  latitude: '',
  longitude: '',
  location: '',
  photoTakenBy: 'local-user',
  photoTakenAt: '2024-01-01T00:00:00.000Z',
  values: '',
  localPath: '',
};

describe('ImageGalleryStrip', () => {
  it('renders nothing (hides entirely) when images is empty', async () => {
    const { toJSON } = await render(<ImageGalleryStrip images={[]} onDelete={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('renders one thumbnail + delete button per image', async () => {
    await render(<ImageGalleryStrip images={[photo1, photo1]} onDelete={jest.fn()} />);
    expect(screen.getAllByLabelText('Delete photo')).toHaveLength(2);
  });

  it('calls onDelete with the pressed thumbnail\'s index', async () => {
    const onDelete = jest.fn();
    await render(<ImageGalleryStrip images={[photo1, photo1, photo1]} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByLabelText('Delete photo');
    await fireEvent.press(deleteButtons[1]);
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});

describe('CameraButton', () => {
  it('renders the given label and calls onCapture when pressed', async () => {
    const onCapture = jest.fn();
    await render(<CameraButton label="Before" onCapture={onCapture} />);
    await fireEvent.press(screen.getByText('Before'));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });
});

describe('makePlaceholderImage', () => {
  it('returns an ImageModel with the given takenBy and empty location/path fields (native capture stubbed)', () => {
    const before = Date.now();
    const img = makePlaceholderImage('user-42');
    const after = Date.now();

    expect(img.photoTakenBy).toBe('user-42');
    expect(img.latitude).toBe('');
    expect(img.longitude).toBe('');
    expect(img.location).toBe('');
    expect(img.values).toBe('');
    expect(img.localPath).toBe('');

    const takenAt = new Date(img.photoTakenAt).getTime();
    expect(takenAt).toBeGreaterThanOrEqual(before);
    expect(takenAt).toBeLessThanOrEqual(after);
  });
});
