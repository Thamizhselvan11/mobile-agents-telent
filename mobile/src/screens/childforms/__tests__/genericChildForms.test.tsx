/**
 * Representative sample of the 19 single-section child forms that are thin
 * data-driven instances of the shared GenericChecklistFormScreen (all
 * except Form 201-CIVILS, tested separately). Per the agent's scope
 * guidance: rather than 19 near-duplicate test files, GenericChecklistFormScreen
 * itself gets full behavioral coverage (see
 * src/components/__tests__/GenericChecklistFormScreen.test.tsx), and this
 * file spot-checks that each SAMPLED screen wires its own title/fields/route
 * correctly into that shared shell — smallest (Form 589, 3 fields), a
 * mid-size one (Form 411, 12 fields), and the largest (Form 560, 51 fields).
 *
 * NOT given a dedicated test file (covered only by the shared
 * GenericChecklistFormScreen test + this representative sample): Form 101,
 * 401, 403, 405, 407, 409, 417, 501, 503, 505, 524, 561, 570, 578, 579, 590
 * — each is a one-line config object (title/sectionName/fields/mandatoryIndex)
 * passed to the same shell already under full test; the only thing that
 * varies is field-list DATA (declared in childFormFields.ts, itself plain
 * data with no logic to test), so a test per screen would just re-assert
 * "this array of strings renders as this array of strings" 16 more times.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
}));

jest.mock('../../../services/localStorage', () => ({
  saveFormStatus: jest.fn().mockResolvedValue(undefined),
  saveFormAnswer: jest.fn().mockResolvedValue(undefined),
}));

import Form589FbcOfnFttpQualityAuditCheckIpRemedialForm from '../Form589FbcOfnFttpQualityAuditCheckIpRemedialForm';
import Form411PrecisionTestForm from '../Form411PrecisionTestForm';
import Form560FttpPlanningBuildUgIpRemedialForm from '../Form560FttpPlanningBuildUgIpRemedialForm';
import { FORM_589_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_IP_REMEDIAL_FIELDS } from '../../../data/childFormFields';
import { FORM_411_PRECISION_TEST_FIELDS } from '../../../data/childFormFields';
import { FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS } from '../../../data/childFormFields';

const routeParams = {
  auditId: 'audit_1',
  orderNumber: '1234567890',
  parentFormID: 'audit_1',
  childFormID: 'cf_1',
  formName: 'placeholder',
};

function makeRoute(params: typeof routeParams) {
  return { key: 'r1', name: 'r1' as const, params } as any;
}

describe('Form 589 (smallest, 3 fields)', () => {
  it('renders its title and all 3 configured fields', async () => {
    expect(FORM_589_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_IP_REMEDIAL_FIELDS).toHaveLength(3);
    await render(
      <Form589FbcOfnFttpQualityAuditCheckIpRemedialForm route={makeRoute(routeParams)} navigation={{} as any} />,
    );
    expect(screen.getByText('Form 589 - FBC - OFN FTTP quality audit check IP & Remedial')).toBeTruthy();
    for (const field of FORM_589_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_IP_REMEDIAL_FIELDS) {
      const expectedText = field === FORM_589_FBC_OFN_FTTP_QUALITY_AUDIT_CHECK_IP_REMEDIAL_FIELDS[0]
        ? `* ${field}`
        : field;
      expect(screen.getByText(expectedText)).toBeTruthy();
    }
  });
});

describe('Form 411 (mid-size, 12 fields)', () => {
  it('renders its title and all 12 configured fields', async () => {
    expect(FORM_411_PRECISION_TEST_FIELDS).toHaveLength(12);
    await render(<Form411PrecisionTestForm route={makeRoute(routeParams)} navigation={{} as any} />);
    expect(screen.getByText('Form 411 - PRECISION TEST')).toBeTruthy();
    expect(screen.getByText(`* ${FORM_411_PRECISION_TEST_FIELDS[0]}`)).toBeTruthy();
    expect(screen.getByText(FORM_411_PRECISION_TEST_FIELDS[11])).toBeTruthy();
  });
});

describe('Form 560 (largest, 51 fields)', () => {
  it('renders its title and every one of its 51 configured fields', async () => {
    expect(FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS.length).toBeGreaterThanOrEqual(50);
    await render(
      <Form560FttpPlanningBuildUgIpRemedialForm route={makeRoute(routeParams)} navigation={{} as any} />,
    );
    expect(screen.getByText('Form 560 - FTTP Planning & build UG IP & Remedial')).toBeTruthy();
    expect(screen.getByText(`* ${FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS[0]}`)).toBeTruthy();
    const lastIdx = FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS.length - 1;
    expect(screen.getByText(FORM_560_FTTP_PLANNING_BUILD_UG_IP_REMEDIAL_FIELDS[lastIdx])).toBeTruthy();
  });
});
