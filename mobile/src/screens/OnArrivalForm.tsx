import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, PrimaryButton, FieldLabel } from '../components/primitives';
import { ImageGalleryStrip, CameraButton, makePlaceholderImage } from '../components/ImageGalleryStrip';
import type { ImageModel } from '../types/models';
import { colors, spacing } from '../styles/theme';
import { computeAndGroupStatus } from '../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getFormAnswers } from '../services/localStorage';
import { useSaveOnBackground } from '../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../hooks/useIncompleteFieldHighlight';

type Props = NativeStackScreenProps<RootStackParamList, 'OnArrivalForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * On Arrival sub-form (AC18, AC19) — single multi-image capture field.
 * Camera/gallery native wiring stubbed — TODO: needs native module.
 */
export default function OnArrivalForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  const navigation = useNavigation<NavProp>();
  const [photos, setPhotos] = useState<ImageModel[]>([]);

  // Read-back (bug fix): on mount, load any previously-saved photo gallery
  // for this exact form (matched by parentFormID + childFormID + cateCode,
  // same keys persist() below writes with) so a revisit shows the photos
  // already captured instead of always starting empty. `typeof
  // getFormAnswers === 'function'` guards call sites (e.g. existing unit
  // tests) whose localStorage mock doesn't stub this function — the real
  // service module always exports it, so production behavior is
  // unaffected; this only avoids crashing an incomplete test mock.
  useEffect(() => {
    let cancelled = false;
    if (typeof getFormAnswers === 'function') {
      getFormAnswers(parentFormID, childFormID)
        .then(rows => {
          if (cancelled) return;
          const saved = rows.find(r => r.cateCode === 'MULTI_PHOTO');
          if (saved) {
            try {
              setPhotos(JSON.parse(saved.answer));
            } catch {
              // Corrupt/unexpected stored JSON — keep the empty state.
            }
          }
        })
        .catch(() => {
          // No saved answer yet (or read failed) — keep the empty state.
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentFormID, childFormID]);

  const status = useMemo(() => computeAndGroupStatus([photos.length > 0 ? 'yes' : '']), [photos]);

  // AC14 — only one required field on this screen (the photo gallery).
  const incompleteFields = useMemo(
    () => [{ key: 'photos', required: true, value: photos.length > 0 ? 'yes' : '' }],
    [photos],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete } =
    useIncompleteFieldHighlight(incompleteFields);

  const persist = useCallback(async () => {
    await saveFormStatus(childFormID, status);
    await saveFormAnswer({
      visitId: auditId,
      scheduleId: auditId,
      parentFormID,
      childFormID,
      orderNumber,
      formName: 'On Arrival',
      cateCode: 'MULTI_PHOTO',
      answer: JSON.stringify(photos),
    });
  }, [auditId, childFormID, orderNumber, parentFormID, photos, status]);

  const handleBack = useCallback(() => {
    persist().finally(() => navigation.goBack());
  }, [navigation, persist]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });
      return () => sub.remove();
    }, [handleBack]),
  );

  // AC13 — save on app minimize (backgrounding), same trigger as
  // Back/Next/hardware-Back above.
  useSaveOnBackground(persist);

  function addPhoto() {
    setPhotos(prev => [...prev, makePlaceholderImage('local-user')]);
  }
  function deletePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="On Arrival" subtitle={`Order #${orderNumber}`} onBack={handleBack} />
      <ScrollView ref={scrollRef} style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>Status: {status}</Text>
          {hasIncomplete ? (
            <Text style={styles.incompleteLink} onPress={goToFirstIncomplete}>
              Go to required field
            </Text>
          ) : null}
        </Card>

        <View
          style={[styles.field, highlightIndex === 0 ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(0, e.nativeEvent.layout.y)}
        >
          <FieldLabel label="We Can able to take Multiple photo" />
          <CameraButton label="Camera" onCapture={addPhoto} />
          <ImageGalleryStrip images={photos} onDelete={deletePhoto} />
        </View>

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Save & Back" onPress={handleBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  statusCard: { marginBottom: spacing.lg },
  statusText: { color: colors.textPrimary, fontWeight: '700' },
  incompleteLink: { color: colors.primary, marginTop: spacing.xs, fontWeight: '600' },
  field: { marginBottom: spacing.lg },
  highlighted: { backgroundColor: colors.primaryTint3, borderRadius: 8 },
});
