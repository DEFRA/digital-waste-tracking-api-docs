/**
 * otherReferenceSchema (otherReferencesForMovement items) is identical
 * across all four events.
 */
import { otherReferenceSchema } from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = otherReferenceSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('other-reference.schema.json', payload)
  return {
    valid,
    errors: valid ? null : getErrors('other-reference.schema.json')
  }
}

describe('Feature: Other Reference payload validation', () => {
  const otherReference = {
    label: 'transferNoteNumber',
    reference: 'TN-2026-000123'
  }

  describe('Scenario: Other reference is submitted correctly', () => {
    test('the reference is accepted', () => {
      expect(validateJoi(otherReference).valid).toBe(true)
      expect(validateAjv(otherReference).valid).toBe(true)
    })
  })

  describe('Scenario: Other reference is missing a required field', () => {
    test.each(['label', 'reference'])(
      'the payload is rejected when %s is missing',
      (field) => {
        const { [field]: excluded, ...payload } = otherReference
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  // ---------------------------------------------------------------------
  // Resolves the previous test.todo now that other-reference.schema.json
  // exists — reference/label both require minLength: 1 to match Joi's
  // Joi.string().min(1).required().
  // ---------------------------------------------------------------------
  describe('Additional coverage: empty-string fields', () => {
    test.each(['label', 'reference'])('rejects an empty string %s', (field) => {
      const payload = { ...otherReference, [field]: '' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})
