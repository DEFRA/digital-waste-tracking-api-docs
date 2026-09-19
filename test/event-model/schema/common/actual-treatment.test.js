/**
 * actualTreatmentSchema (sharedSchemas.js) — used at receipt
 * (receiptWasteItemSchema.actualTreatments, receipt/waste-item.test.js, and
 * receiptWithoutDeliveryJoi.js's waste item). disposalOrRecoveryCode is
 * optional here (D-031 amended) — a receiving site may need to inspect or
 * weigh before confirming the code — unlike creation's intendedTreatmentSchema
 * (common/intended-treatment.test.js), where it's unconditionally required.
 * weight is required only when disposalOrRecoveryCode is supplied.
 */
import { actualTreatmentSchema } from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = actualTreatmentSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('actual-treatment.schema.json', payload)
  return {
    valid,
    errors: valid ? null : getErrors('actual-treatment.schema.json')
  }
}

describe('Feature: Actual Treatment payload validation', () => {
  const actualTreatment = {
    disposalOrRecoveryCode: 'R1',
    weight: {
      metric: 'Tonnes',
      amount: 0.5,
      isEstimate: true
    }
  }

  describe('Scenario: Actual treatment is submitted with a disposalOrRecoveryCode', () => {
    test('the treatment is accepted', () => {
      expect(validateJoi(actualTreatment).valid).toBe(true)
      expect(validateAjv(actualTreatment).valid).toBe(true)
    })
  })

  describe('Scenario: Actual treatment is submitted with neither disposalOrRecoveryCode nor weight', () => {
    test('the treatment is accepted', () => {
      expect(validateJoi({}).valid).toBe(true)
      expect(validateAjv({}).valid).toBe(true)
    })
  })

  describe('Scenario: disposalOrRecoveryCode is optional', () => {
    test('the payload is accepted when disposalOrRecoveryCode is omitted but weight is present', () => {
      const { disposalOrRecoveryCode, ...payload } = actualTreatment
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })
  })

  describe('Scenario: weight is required when disposalOrRecoveryCode is present', () => {
    test('the payload is rejected when weight is omitted', () => {
      const { weight, ...payload } = actualTreatment
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: weight is optional when disposalOrRecoveryCode is absent', () => {
    test('the payload is accepted when both are omitted', () => {
      const { disposalOrRecoveryCode, weight, ...payload } = actualTreatment
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })
  })

  // ---------------------------------------------------------------------
  // Resolves the previous test.todo now that actual-treatment.schema.json
  // registers the disposalOrRecoveryCode format.
  // ---------------------------------------------------------------------
  describe('Additional coverage: disposalOrRecoveryCode format', () => {
    test('rejects a disposalOrRecoveryCode not on the R1-R13/D1-D15 reference list', () => {
      const payload = { ...actualTreatment, disposalOrRecoveryCode: 'X99' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})
