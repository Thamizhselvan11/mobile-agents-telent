import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, FieldLabel, ErrorText, PrimaryButton } from '../components/primitives';
import { ImageGalleryStrip, CameraButton, makePlaceholderImage } from '../components/ImageGalleryStrip';
import type { ImageModel } from '../types/models';
import { colors, spacing } from '../styles/theme';
import {
  computeAndGroupStatus,
  isAlphabeticOnly,
  isAlphanumeric,
  isNumericOnly,
  isValidEmail,
} from '../utils/formStatus';
import { saveFormAnswer, saveFormStatus, getCurrentLocationStub, getFormAnswers } from '../services/localStorage';
import { useSaveOnBackground } from '../hooks/useSaveOnBackground';
import { useIncompleteFieldHighlight } from '../hooks/useIncompleteFieldHighlight';

type Props = NativeStackScreenProps<RootStackParamList, 'DontWalkByForm'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

type YesNo = 'Yes' | 'No' | null;
type Severity = 'Minor' | 'Major' | null;
type Category = 'HSE' | 'Quality' | 'Other' | null;

/**
 * Don't Walk By sub-form (AC25). Fields sourced "from local database" are
 * modeled with local placeholder/lookup data — TODO: 06-local-storage-agent
 * wires the real Realm-backed lookups (Parent Company autocomplete, Region,
 * Location, Post Code, Type, Reference Number).
 */
export default function DontWalkByForm({ route }: Props) {
  const { auditId, orderNumber, parentFormID, childFormID } = route.params;
  const navigation = useNavigation<NavProp>();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [parentCompany, setParentCompany] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [postCode] = useState(''); // TODO: 06-local-storage-agent — sourced from local DB, not editable
  const [tellUs, setTellUs] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [furtherAction, setFurtherAction] = useState<YesNo>(null);
  const [photos, setPhotos] = useState<ImageModel[]>([]);
  const [severity, setSeverity] = useState<Severity>(null);
  const [category, setCategory] = useState<Category>(null);
  const [type, setType] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [referenceNumber] = useState(''); // TODO: 06-local-storage-agent — sourced from local DB, not editable

  // Read-back (bug fix): on mount, load any previously-saved answer for this
  // exact form (matched by parentFormID + childFormID + cateCode, same keys
  // persist() below writes with) so a revisit shows the fields the user
  // already entered instead of always starting blank. `typeof
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
          const saved = rows.find(r => r.cateCode === 'DONT_WALK_BY');
          if (!saved) return;
          try {
            const parsed = JSON.parse(saved.answer);
            if (typeof parsed.name === 'string') setName(parsed.name);
            if (typeof parsed.mobileNumber === 'string') setMobileNumber(parsed.mobileNumber);
            if (typeof parsed.parentCompany === 'string') setParentCompany(parsed.parentCompany);
            if ('region' in parsed) setRegion(parsed.region);
            if (typeof parsed.location === 'string') setLocation(parsed.location);
            if (typeof parsed.tellUs === 'string') setTellUs(parsed.tellUs);
            if (typeof parsed.actionTaken === 'string') setActionTaken(parsed.actionTaken);
            if ('furtherAction' in parsed) setFurtherAction(parsed.furtherAction);
            if (Array.isArray(parsed.photos)) setPhotos(parsed.photos);
            if ('severity' in parsed) setSeverity(parsed.severity);
            if ('category' in parsed) setCategory(parsed.category);
            if ('type' in parsed) setType(parsed.type);
            if (typeof parsed.emailAddress === 'string') setEmailAddress(parsed.emailAddress);
          } catch {
            // Corrupt/unexpected stored JSON — keep the blank state.
          }
        })
        .catch(() => {
          // No saved answer yet (or read failed) — keep the blank state.
        });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentFormID, childFormID]);

  const REGION_OPTIONS = ['North', 'South', 'East', 'West']; // TODO: 06-local-storage-agent — filtered from local DB
  const TYPE_OPTIONS = ['Type A', 'Type B', 'Type C']; // TODO: 06-local-storage-agent — sourced from local DB

  const nameError = name && !isAlphabeticOnly(name) ? 'Alphabetic only, no emojis.' : null;
  const mobileError = mobileNumber && !isNumericOnly(mobileNumber) ? 'Numeric only, no emojis.' : null;
  const tellUsError = tellUs && !isAlphanumeric(tellUs) ? 'Alphanumeric only, no emojis.' : null;
  const actionError = actionTaken && !isAlphanumeric(actionTaken) ? 'Alphanumeric only, no emojis.' : null;
  const emailError = emailAddress && !isValidEmail(emailAddress) ? 'Enter a valid email address.' : null;

  const requiredValues = useMemo(
    () => [
      name,
      mobileNumber,
      parentCompany,
      region ?? '',
      location,
      tellUs,
      actionTaken,
      furtherAction ?? '',
      severity ?? '',
      category ?? '',
      type ?? '',
    ],
    [actionTaken, category, furtherAction, location, mobileNumber, name, parentCompany, region, severity, tellUs, type],
  );

  const status = useMemo(() => computeAndGroupStatus(requiredValues), [requiredValues]);

  // AC14 — ordered list of required fields, same order as `requiredValues`
  // and as rendered below, so "first incomplete" targets the right field.
  const REQUIRED_FIELD_KEYS = [
    'name',
    'mobileNumber',
    'parentCompany',
    'region',
    'location',
    'tellUs',
    'actionTaken',
    'furtherAction',
    'severity',
    'category',
    'type',
  ] as const;
  const incompleteFields = useMemo(
    () =>
      REQUIRED_FIELD_KEYS.map((key, i) => ({
        key,
        required: true,
        value: requiredValues[i],
      })),
    [requiredValues],
  );
  const { scrollRef, highlightIndex, hasIncomplete, registerOffset, goToFirstIncomplete } =
    useIncompleteFieldHighlight(incompleteFields);
  const fieldIndex = (key: (typeof REQUIRED_FIELD_KEYS)[number]) => REQUIRED_FIELD_KEYS.indexOf(key);

  const persist = useCallback(async () => {
    await saveFormStatus(childFormID, status);
    await saveFormAnswer({
      visitId: auditId,
      scheduleId: auditId,
      parentFormID,
      childFormID,
      orderNumber,
      formName: "Don't Walk By",
      cateCode: 'DONT_WALK_BY',
      answer: JSON.stringify({
        name,
        mobileNumber,
        parentCompany,
        region,
        location,
        postCode,
        tellUs,
        actionTaken,
        furtherAction,
        photos,
        severity,
        category,
        type,
        emailAddress,
        referenceNumber,
      }),
    });
  }, [
    actionTaken,
    auditId,
    category,
    childFormID,
    emailAddress,
    furtherAction,
    location,
    mobileNumber,
    name,
    orderNumber,
    parentCompany,
    parentFormID,
    photos,
    postCode,
    referenceNumber,
    region,
    severity,
    status,
    tellUs,
    type,
  ]);

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

  async function handleUseCurrentLocation() {
    const loc = await getCurrentLocationStub();
    setLocation(loc.location || location);
  }

  function addPhoto() {
    setPhotos(prev => [...prev, makePlaceholderImage('local-user')]);
  }
  function deletePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Don't Walk By" subtitle={`Order #${orderNumber}`} onBack={handleBack} />
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
          style={[styles.field, highlightIndex === fieldIndex('name') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('name'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Name of Person Completing form" required />
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <ErrorText message={nameError} />
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('mobileNumber') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('mobileNumber'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="MobileNumber" required />
          <TextInput style={styles.input} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="number-pad" />
          <ErrorText message={mobileError} />
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('parentCompany') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('parentCompany'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Parent Company" required />
          <TextInput
            style={styles.input}
            value={parentCompany}
            onChangeText={setParentCompany}
            placeholder="Start typing..."
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.noteText}>TODO: 06-local-storage-agent — filtered live from local database</Text>
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('region') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('region'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Region" required />
          <TouchableOpacity style={styles.input} onPress={() => setRegionPickerOpen(true)}>
            <Text style={region ? styles.valueText : styles.placeholderText}>{region ?? 'Select'}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('location') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('location'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Location" required />
          <View style={styles.rowWithButton}>
            <TextInput style={[styles.input, { flex: 1 }]} value={location} onChangeText={setLocation} />
            <TouchableOpacity style={styles.smallButton} onPress={handleUseCurrentLocation}>
              <Text style={styles.smallButtonText}>Use GPS</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.noteText}>TODO: needs native module — auto-detect on first detection, then filtered from local DB</Text>
        </View>

        <View style={styles.field}>
          <FieldLabel label="Post Code" />
          <TextInput style={[styles.input, styles.inputDisabled]} value={postCode} editable={false} />
          <Text style={styles.noteText}>Not editable — sourced from local database</Text>
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('tellUs') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('tellUs'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="What do you want to tell us?" required />
          <TextInput style={[styles.input, styles.multiline]} value={tellUs} onChangeText={setTellUs} multiline />
          <ErrorText message={tellUsError} />
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('actionTaken') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('actionTaken'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Describe the action you have taken" required />
          <TextInput style={[styles.input, styles.multiline]} value={actionTaken} onChangeText={setActionTaken} multiline />
          <ErrorText message={actionError} />
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('furtherAction') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('furtherAction'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Does this require further action" required />
          <View style={styles.radioRow}>
            {(['Yes', 'No'] as YesNo[]).map(opt => (
              <TouchableOpacity key={opt} style={styles.radioOption} onPress={() => setFurtherAction(opt)}>
                <View style={[styles.radioCircle, furtherAction === opt && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <FieldLabel label="Photos" />
          <CameraButton label="Add Photo" onCapture={addPhoto} />
          <ImageGalleryStrip images={photos} onDelete={deletePhoto} />
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('severity') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('severity'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Severity" required />
          <View style={styles.radioRow}>
            {(['Minor', 'Major'] as Severity[]).map(opt => (
              <TouchableOpacity key={opt} style={styles.radioOption} onPress={() => setSeverity(opt)}>
                <View style={[styles.radioCircle, severity === opt && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('category') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('category'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Category" required />
          <View style={styles.radioRow}>
            {(['HSE', 'Quality', 'Other'] as Category[]).map(opt => (
              <TouchableOpacity key={opt} style={styles.radioOption} onPress={() => setCategory(opt)}>
                <View style={[styles.radioCircle, category === opt && styles.radioCircleSelected]} />
                <Text style={styles.radioLabel}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View
          style={[styles.field, highlightIndex === fieldIndex('type') ? styles.highlighted : undefined]}
          onLayout={e => registerOffset(fieldIndex('type'), e.nativeEvent.layout.y)}
        >
          <FieldLabel label="Type" required />
          <TouchableOpacity style={styles.input} onPress={() => setTypePickerOpen(true)}>
            <Text style={type ? styles.valueText : styles.placeholderText}>{type ?? 'Select'}</Text>
          </TouchableOpacity>
          <Text style={styles.noteText}>TODO: 06-local-storage-agent — sourced from local database</Text>
        </View>

        <View style={styles.field}>
          <FieldLabel label="Email Address" />
          <TextInput style={styles.input} value={emailAddress} onChangeText={setEmailAddress} keyboardType="email-address" autoCapitalize="none" />
          <ErrorText message={emailError} />
        </View>

        <View style={styles.field}>
          <FieldLabel label="Reference Number" />
          <TextInput style={[styles.input, styles.inputDisabled]} value={referenceNumber} editable={false} />
          <Text style={styles.noteText}>Not editable — sourced from local database</Text>
        </View>

        <View style={{ height: spacing.xxl }} />
        <PrimaryButton label="Save & Back" onPress={handleBack} />
      </ScrollView>

      <PickerModal
        visible={regionPickerOpen}
        title="Region"
        options={REGION_OPTIONS}
        onSelect={v => {
          setRegion(v);
          setRegionPickerOpen(false);
        }}
        onClose={() => setRegionPickerOpen(false)}
      />
      <PickerModal
        visible={typePickerOpen}
        title="Type"
        options={TYPE_OPTIONS}
        onSelect={v => {
          setType(v);
          setTypePickerOpen(false);
        }}
        onClose={() => setTypePickerOpen(false)}
      />
    </View>
  );
}

function PickerModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map(opt => (
            <TouchableOpacity key={opt} style={styles.sheetOption} onPress={() => onSelect(opt)}>
              <Text style={styles.sheetOptionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
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
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
    justifyContent: 'center',
  },
  inputDisabled: { backgroundColor: colors.cardBorderLight, color: colors.textSecondary },
  multiline: { minHeight: 90, paddingVertical: spacing.md, textAlignVertical: 'top' },
  valueText: { color: colors.textPrimary, fontSize: 15 },
  placeholderText: { color: colors.textSecondary, fontSize: 15 },
  rowWithButton: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  smallButton: { backgroundColor: colors.primaryTint2, borderRadius: 10, paddingHorizontal: spacing.md, height: 46, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  noteText: { color: colors.textSecondary, fontSize: 11, marginTop: spacing.xs, fontStyle: 'italic' },
  radioRow: { flexDirection: 'row', gap: spacing.xl },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.cardBorder },
  radioCircleSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioLabel: { color: colors.textPrimary, fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(26,15,34,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.xl },
  sheetTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: spacing.sm },
  sheetOption: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  sheetOptionText: { color: colors.textPrimary, fontSize: 15 },
});
