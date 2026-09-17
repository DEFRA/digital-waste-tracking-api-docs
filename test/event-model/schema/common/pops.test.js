/**
 * popsSchema/popComponentSchema — required on a wasteItem when containsPops
 * is true (creation, receipt only). The containsPops wiring itself is tested
 * alongside each event's wasteItem, not here.
 *
 * There's no separate ajv $id for popComponentSchema — the JSON Schema
 * definition for a component lives inline at pops.schema.json's
 * #/definitions/component, since a POP component only ever appears nested
 * inside a pops object's components array (see docs/event-model/schema/
 * README.md's "resource with no variants" guidance). Component-level
 * scenarios below drive validateAjv() by wrapping the component under test
 * in a minimal, always-otherwise-valid pops envelope
 * (sourceOfComponents: 'GUIDANCE', components: [component]) so only the
 * component's own rules affect the resulting boolean.
 */
import {
  popsSchema,
  popComponentSchema
} from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = popsSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('pops.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('pops.schema.json') }
}

const validateComponentJoi = (component) => {
  const { error } = popComponentSchema.validate(component)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateComponentAjv = (component) => {
  const wrapped = { sourceOfComponents: 'GUIDANCE', components: [component] }
  const valid = validate('pops.schema.json', wrapped)
  return { valid, errors: valid ? null : getErrors('pops.schema.json') }
}

describe('Feature: POPs details validation', () => {
  const popsWithGuidanceComponents = {
    sourceOfComponents: 'GUIDANCE',
    components: [{ code: 'PFOS', concentration: 12 }]
  }

  describe('Scenario: POPs details are submitted with a valid sourceOfComponents and components', () => {
    test('the payload is accepted when components are sourced from guidance', () => {
      expect(validateJoi(popsWithGuidanceComponents).valid).toBe(true)
      expect(validateAjv(popsWithGuidanceComponents).valid).toBe(true)
    })
  })

  describe('Scenario: sourceOfComponents is missing', () => {
    test('the payload is rejected', () => {
      expect(validateJoi({}).valid).toBe(false)
      expect(validateAjv({}).valid).toBe(false)
    })
  })

  describe('Scenario: sourceOfComponents is given in the wrong case', () => {
    test('the payload is rejected', () => {
      const payload = { sourceOfComponents: 'guidance' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: components requiredness is driven by sourceOfComponents', () => {
    test.each(['GUIDANCE', 'OWN_TESTING'])(
      'the payload is rejected when sourceOfComponents is %s and components is missing',
      (sourceOfComponents) => {
        const payload = { sourceOfComponents }
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )

    test('the payload is rejected when sourceOfComponents is NOT_PROVIDED and components is supplied', () => {
      const payload = {
        sourceOfComponents: 'NOT_PROVIDED',
        components: [{ code: 'PFOS' }]
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('the payload is accepted when sourceOfComponents is NOT_PROVIDED and components is omitted', () => {
      const payload = { sourceOfComponents: 'NOT_PROVIDED' }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('the payload is accepted when sourceOfComponents is PROVIDED_WITH_WASTE and components is omitted', () => {
      const payload = { sourceOfComponents: 'PROVIDED_WITH_WASTE' }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('the payload is accepted when sourceOfComponents is PROVIDED_WITH_WASTE and components is supplied', () => {
      const payload = {
        sourceOfComponents: 'PROVIDED_WITH_WASTE',
        components: [{ code: 'PFOS' }]
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
        const payload = { sourceOfComponents, components: null }
        expect(validateJoi(payload).valid).toBe(expectedValid)
        expect(validateAjv(payload).valid).toBe(expectedValid)
      }
    )
  })

  describe('Scenario: POPs object includes an unknown property', () => {
    test('the payload is rejected', () => {
      const payload = {
        sourceOfComponents: 'NOT_PROVIDED',
        extra: 'not allowed'
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})

describe('Feature: POP component validation', () => {
  const validComponent = { code: 'PFOS', concentration: 12 }

  describe('Scenario: concentration and concentrationThresholdOperator are mutually exclusive, and neither is required', () => {
    test('accepts a component with code only', () => {
      const { concentration, ...component } = validComponent
      expect(validateComponentJoi(component).valid).toBe(true)
      expect(validateComponentAjv(component).valid).toBe(true)
    })

    test('accepts concentration alone', () => {
      expect(validateComponentJoi(validComponent).valid).toBe(true)
      expect(validateComponentAjv(validComponent).valid).toBe(true)
    })

    test('accepts concentrationThresholdOperator instead of concentration', () => {
      const { concentration, ...component } = validComponent
      const payload = {
        ...component,
        concentrationThresholdOperator: 'LESS_THAN'
      }
      expect(validateComponentJoi(payload).valid).toBe(true)
      expect(validateComponentAjv(payload).valid).toBe(true)
    })

    test('accepts neither concentration nor concentrationThresholdOperator', () => {
      const { concentration, ...component } = validComponent
      expect(validateComponentJoi(component).valid).toBe(true)
      expect(validateComponentAjv(component).valid).toBe(true)
    })

    test('rejects concentration and concentrationThresholdOperator together', () => {
      const payload = {
        ...validComponent,
        concentrationThresholdOperator: 'LESS_THAN'
      }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: code must be a valid POP reference code when supplied', () => {
    test('accepts a valid code from the POP reference list', () => {
      expect(validateComponentJoi(validComponent).valid).toBe(true)
      expect(validateComponentAjv(validComponent).valid).toBe(true)
    })

    test('rejects a code that is not on the POP reference list', () => {
      const payload = { ...validComponent, code: 'NOTACODE' }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })

    test('accepts a null code, treated the same as omitting it', () => {
      const payload = { ...validComponent, code: null }
      expect(validateComponentJoi(payload).valid).toBe(true)
      expect(validateComponentAjv(payload).valid).toBe(true)
    })

    // Known, accepted gap in the Joi schema itself (not a Joi/ajv drift): code
    // chains .empty('').empty(null) — the second .empty() call overwrites the
    // first rather than adding to it, so only null (not '') ends up treated
    // as absent. An empty string is therefore rejected as an ordinary blank
    // string by both Joi and the JSON Schema, which deliberately mirrors this
    // rather than the (probably intended) "either '' or null is absent"
    // behaviour. See docs/collections/data/sharedSchemas.js's popComponentSchema.
    test('rejects an empty string code the same way as a normal blank string', () => {
      const payload = { ...validComponent, code: '' }
      expect(validateComponentJoi(payload).valid).toBe(false)
      expect(validateComponentAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: concentration must be a positive number when supplied', () => {
    test('accepts a null concentration', () => {
      const { concentration, ...component } = validComponent
      const payload = { ...component, concentration: null }
      expect(validateComponentJoi(payload).valid).toBe(true)
      expect(validateComponentAjv(payload).valid).toBe(true)
    })

    test.each([0, -1])(
      'rejects a non-positive concentration (%s)',
      (concentration) => {
        const { concentration: _omit, ...component } = validComponent
        const payload = { ...component, concentration }
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
