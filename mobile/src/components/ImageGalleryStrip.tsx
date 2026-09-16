import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../styles/theme';
import type { ImageModel } from '../types/models';

/**
 * Horizontal scroll gallery for captured/picked images (AC18, AC22, AC25).
 * Hidden entirely when there are no images. Supports delete per image.
 *
 * Camera/gallery capture itself is stubbed — see CameraButton below.
 */
export function ImageGalleryStrip({
  images,
  onDelete,
}: {
  images: ImageModel[];
  onDelete: (index: number) => void;
}) {
  if (images.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.stripContent}
    >
      {images.map((img, index) => (
        <View key={`${img.localPath}-${index}`} style={styles.thumbWrap}>
          {img.localPath ? (
            <Image source={{ uri: img.localPath }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Delete photo"
            style={styles.deleteBtn}
            onPress={() => onDelete(index)}
          >
            <Text style={styles.deleteBtnText}>x</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Camera/gallery trigger button.
 * TODO: needs native module — see 03-frontend-builder log.
 * Real wiring (e.g. react-native-image-picker) is stubbed this pass;
 * calling this currently adds a placeholder ImageModel so the UI/gallery/
 * delete flow is fully exercisable standalone.
 */
export function CameraButton({
  label,
  onCapture,
}: {
  label: string;
  onCapture: () => void;
}) {
  return (
    <TouchableOpacity style={styles.cameraBtn} onPress={onCapture} accessibilityRole="button">
      <Text style={styles.cameraBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function makePlaceholderImage(takenBy: string): ImageModel {
  // TODO: needs native module — real camera/gallery picker deferred this pass.
  return {
    latitude: '',
    longitude: '',
    location: '',
    photoTakenBy: takenBy,
    photoTakenAt: new Date().toISOString(),
    values: '',
    localPath: '',
  };
}

const styles = StyleSheet.create({
  strip: {
    marginTop: spacing.sm,
  },
  stripContent: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.cardBorderLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
  },
  deleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  cameraBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  cameraBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
