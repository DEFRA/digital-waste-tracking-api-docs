/**
 * weightSchema (sharedSchemas.js) is used identically by wasteItem (creation,
 * receipt) and by intended/actual treatments (intended-treatment.test.js,
 * actual-treatment.test.js).
 */
import { weightSchema } from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = weightSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('weight.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('weight.schema.json') }
}

describe('Feature: Weight payload validation', () => {
  const weight = {
    metric: 'Tonnes',
    amount: 0.5,
    isEstimate: true
  }

  describe('Scenario: Weight is submitted correctly', () => {
    test('the weight is accepted', () => {
      expect(validateJoi(weight).valid).toBe(true)
      expect(validateAjv(weight).valid).toBe(true)
    })
  })

  describe('Scenario: Weight is missing a required field', () => {
    test.each(['metric', 'amount', 'isEstimate'])(
      'the payload is rejected when %s is missing',
      (field) => {
        const { [field]: excluded, ...payload } = weight
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  // ---------------------------------------------------------------------
  // Coverage below isn't tied to a "missing field" scenario above, but
  // existed (as test.todo placeholders) in the previous version of this
  // file — now implementable for real since weight.schema.json exists.
  // ---------------------------------------------------------------------
  describe('Additional coverage: field-level format rules', () => {
    test('rejects a metric outside Grams/Kilograms/Tonnes', () => {
      const payload = { ...weight, metric: 'Pounds' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects a zero amount', () => {
      const payload = { ...weight, amount: 0 }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects a negative amount', () => {
      const payload = { ...weight, amount: -1 }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects a non-boolean isEstimate (strict mode)', () => {
      const payload = { ...weight, isEstimate: 'true' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})
