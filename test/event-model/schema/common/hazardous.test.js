/**
 * hazardousSchema/hazardousComponentSchema — required on a wasteItem when
 * containsHazardous is true (creation, receipt only). The containsHazardous
 * wiring itself is tested alongside each event's wasteItem, not here.
 *
 * There's no separate ajv $id for hazardousComponentSchema — the JSON Schema
 * definition for a component lives inline at hazardous.schema.json's
 * #/definitions/component, since a hazardous component only ever appears
 * nested inside a hazardous object's components array (see
 * docs/event-model/schema/README.md's "resource with no variants" guidance).
 * Component-level scenarios below drive validateAjv() by wrapping the
 * component under test in a minimal, always-otherwise-valid hazardous
 * envelope (sourceOfComponents: 'GUIDANCE', hazCodes: ['HP_4'],
 * components: [component]) so only the component's own rules affect the
 * resulting boolean.
 */
import {
  hazardousSchema,
  hazardousComponentSchema
} from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = hazardousSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('hazardous.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('hazardous.schema.json') }
}

const validateComponentJoi = (component) => {
  const { error } = hazardousComponentSchema.validate(component)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateComponentAjv = (component) => {
  const wrapped = {
    sourceOfComponents: 'GUIDANCE',
    hazCodes: ['HP_4'],
    components: [component]
  }
  const valid = validate('hazardous.schema.json', wrapped)
  return { valid, errors: valid ? null : getErrors('hazardous.schema.json') }
}

describe('Feature: Hazardous details validation', () => {
  const hazardousWithGuidanceComponents = {
    sourceOfComponents: 'GUIDANCE',
    hazCodes: ['HP_4'],
    components: [{ name: 'Mercury', concentration: 5 }]
  }

  describe('Scenario: Hazardous details are submitted with a valid sourceOfComponents, hazCodes and components', () => {
    test('the payload is accepted when components are sourced from guidance', () => {
      expect(validateJoi(hazardousWithGuidanceComponents).valid).toBe(true)
      expect(validateAjv(hazardousWithGuidanceComponents).valid).toBe(true)
    })
  })

  describe('Scenario: sourceOfComponents is missing', () => {
    test('the payload is rejected', () => {
      const payload = { hazCodes: ['HP_4'] }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: hazCodes is missing or empty', () => {
    test('the payload is rejected when hazCodes is missing', () => {
      const payload = { sourceOfComponents: 'NOT_PROVIDED' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('the payload is rejected when hazCodes is an empty array', () => {
      const payload = { sourceOfComponents: 'NOT_PROVIDED', hazCodes: [] }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('the payload is rejected when hazCodes contains a code outside the hazardous property code list', () => {
      const payload = {
        sourceOfComponents: 'NOT_PROVIDED',
        hazCodes: ['HP_99']
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('the payload is accepted when hazCodes contains duplicate codes (Joi deduplicates)', () => {
      const payload = {
        sourceOfComponents: 'NOT_PROVIDED',
        hazCodes: ['HP_4', 'HP_4']
      }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })
  })

  describe('Scenario: components requiredness is driven by sourceOfComponents', () => {
    test.each(['GUIDANCE', 'OWN_TESTING'])(
      'the payload is rejected when sourceOfComponents is %s and components is missing',
      (sourceOfComponents) => {
        const payload = { sourceOfComponents, hazCodes: ['HP_4'] }
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )

    test('the payload is rejected when sourceOfComponents is NOT_PROVIDED and components is supplied', () => {
      const payload = {
        sourceOfComponents: 'NOT_PROVIDED',
        hazCodes: ['HP_4'],
        components: [{ name: 'Mercury', concentration: 5 }]
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('the payload is accepted when sourceOfComponents is NOT_PROVIDED and components is omitted', () => {
      const payload = { sourceOfComponents: 'NOT_PROVIDED', hazCodes: ['HP_4'] }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('the payload is accepted when sourceOfComponents is PROVIDED_WITH_WASTE and components is omitted', () => {
      const payload = {
        sourceOfComponents: 'PROVIDED_WITH_WASTE',
        hazCodes: ['HP_4']
      }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('the payload is accepted when sourceOfComponents is PROVIDED_WITH_WASTE and components is supplied', () => {
      const payload = {
        sourceOfComponents: 'PROVIDED_WITH_WASTE',
        hazCodes: ['HP_4'],
        components: [{ name: 'Mercury', concentration: 5 }]
      }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })
  })

  describe('Scenario: a null components value is treated the same as an absent one', () => {
    test.each([
      ['NOT_PROVIDED', true],
      ['PROVIDED_WITH_WASTE', true],
      ['GUIDANCE', false],
      ['OWN_TESTING', false]
    ])(
      'when sourceOfComponents is %s, components: null validates as %s',
      (sourceOfComponents, expectedValid) => {
        const payload = {
          sourceOfComponents,
          hazCodes: ['HP_4'],
          components: null
        }
        expect(validateJoi(payload).valid).toBe(expectedValid)
        expect(validateAjv(payload).valid).toBe(expectedValid)
      }
    )
  })

  describe('Scenario: noComponents overrides the sourceOfComponents-driven requiredness', () => {
    test.each(['GUIDANCE', 'OWN_TESTING'])(
      'allows components to be omitted when sourceOfComponents is %s and noComponents is true',
      (sourceOfComponents) => {
        const payload = {
          sourceOfComponents,
          hazCodes: ['HP_4'],
          noComponents: true
        }
        expect(validateJoi(payload).valid).toBe(true)
        expect(validateAjv(payload).valid).toBe(true)
      }
    )

    test('forbids components when noComponents is true', () => {
      const payload = {
        sourceOfComponents: 'OWN_TESTING',
        hazCodes: ['HP_4'],
        noComponents: true,
        components: [{ name: 'Mercury', concentration: 5 }]
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('does not affect requiredness when noComponents is false', () => {
      const payload = {
        sourceOfComponents: 'GUIDANCE',
        hazCodes: ['HP_4'],
        noComponents: false
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: Hazardous object includes an unknown property', () => {
    test('the payload is rejected', () => {
      const payload = {
        sourceOfComponents: 'NOT_PROVIDED',
        hazCodes: ['HP_4'],
        extra: 'not allowed'
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})

describe('Feature: Hazardous component validation', () => {
  const validComponent = { name: 'Cadmium', concentration: 5 }

  describe('Scenario: name is required', () => {
    test('the payload is rejected when name is missing', () => {
      const { name, ...component } = validComponent
      expect(validateComponentJoi(component).valid).toBe(false)
      expect(validateComponentAjv(component).valid).toBe(false)
    })

    test('the payload is rejected when name is an empty string', () => {
      const payload = { ...validComponent, name: '' }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })

    test('the payload is rejected when name is null', () => {
      const payload = { ...validComponent, name: null }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: concentration and concentrationThresholdOperator are mutually exclusive, and exactly one is required', () => {
    test('accepts concentration alone', () => {
      expect(validateComponentJoi(validComponent).valid).toBe(true)
      expect(validateComponentAjv(validComponent).valid).toBe(true)
    })

    test('accepts concentrationThresholdOperator instead of concentration', () => {
      const { concentration, ...component } = validComponent
      const payload = {
        ...component,
        concentrationThresholdOperator: 'GREATER_THAN_OR_EQUAL'
      }
      expect(validateComponentJoi(payload).valid).toBe(true)
      expect(validateComponentAjv(payload).valid).toBe(true)
    })

    test('rejects when neither concentration nor concentrationThresholdOperator is provided', () => {
      const { concentration, ...component } = validComponent
      expect(validateComponentJoi(component).valid).toBe(false)
      expect(validateComponentAjv(component).valid).toBe(false)
    })

    test('rejects concentration and concentrationThresholdOperator together', () => {
      const payload = {
        ...validComponent,
        concentrationThresholdOperator: 'EQUAL_TO'
      }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })

    test('accepts a null concentration alone (still counts as "provided" for the or() rule)', () => {
      const payload = { ...validComponent, concentration: null }
      expect(validateComponentJoi(payload).valid).toBe(true)
      expect(validateComponentAjv(payload).valid).toBe(true)
    })
  })

  describe('Scenario: concentrationThresholdOperator must be a recognised hazardous threshold value', () => {
    test('rejects an operator that is only valid on a POP component (LESS_THAN)', () => {
      const { concentration, ...component } = validComponent
      const payload = {
        ...component,
        concentrationThresholdOperator: 'LESS_THAN'
      }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: concentration must be a positive number when supplied', () => {
    test.each([0, -1])(
      'rejects a non-positive concentration (%s)',
      (concentration) => {
        const payload = { ...validComponent, concentration }
        expect(validateComponentJoi(payload).valid).toBe(false)
        expect(validateComponentAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Additional coverage: component rejects unknown properties', () => {
    test('the payload is rejected', () => {
      const payload = { ...validComponent, extra: 'not allowed' }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })
  })
})
