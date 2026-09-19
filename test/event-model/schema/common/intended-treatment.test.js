/**
 * intendedTreatmentSchema (sharedSchemas.js) — used only at creation
 * (createWasteItemSchema.intendedTreatments, creation/waste-item.test.js).
 * Both disposalOrRecoveryCode and weight are unconditionally required here,
 * unlike receipt's actualTreatmentSchema (common/actual-treatment.test.js),
 * where disposalOrRecoveryCode is optional and weight is conditional on it.
 */
import { intendedTreatmentSchema } from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = intendedTreatmentSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('intended-treatment.schema.json', payload)
  return {
    valid,
    errors: valid ? null : getErrors('intended-treatment.schema.json')
  }
}

describe('Feature: Intended Treatment payload validation', () => {
  const intendedTreatment = {
    disposalOrRecoveryCode: 'R1',
    weight: {
      metric: 'Tonnes',
      amount: 0.5,
      isEstimate: true
    }
  }

  describe('Scenario: Intended treatment is submitted correctly', () => {
    test('the treatment is accepted', () => {
      expect(validateJoi(intendedTreatment).valid).toBe(true)
      expect(validateAjv(intendedTreatment).valid).toBe(true)
    })
  })

  describe('Scenario: Intended treatment is missing a required field', () => {
    test.each(['disposalOrRecoveryCode', 'weight'])(
      'the payload is rejected when %s is missing',
      (field) => {
        const { [field]: excluded, ...payload } = intendedTreatment
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  // ---------------------------------------------------------------------
  // Resolves the previous test.todo now that intended-treatment.schema.json
  // registers the disposalOrRecoveryCode format.
  // ---------------------------------------------------------------------
  describe('Additional coverage: disposalOrRecoveryCode format', () => {
    test('rejects a disposalOrRecoveryCode not on the R1-R13/D1-D15 reference list', () => {
      const payload = { ...intendedTreatment, disposalOrRecoveryCode: 'X99' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})
