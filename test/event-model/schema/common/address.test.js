/**
 * address is treated as one resource across all events — this is
 * addressSchema, the base of the address family (postcode required,
 * fullAddress optional; UK or Irish postcode accepted).
 *
 * Every event layers a straightforward "fullAddress required" overlay on top
 * of this same base via requiredFullAddressSchema (collection.address,
 * deliverySite.address, creation's receiver.address when siteName is set,
 * and Receipt's receiverSite.address) — those are consistent extensions of
 * this schema, not a divergent shape, and are tested alongside their owning
 * event, not here. receiptJoi.js's former standalone UK-only address schema
 * has converged onto this same base.
 */
import { addressSchema } from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = addressSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('address.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('address.schema.json') }
}

describe('Feature: Address payload validation', () => {
  const address = {
    fullAddress: '1 Example Way, Test City',
    postcode: 'TE1 1ST'
  }

  describe('Scenario: A valid address is submitted', () => {
    test('the address is accepted', () => {
      expect(validateJoi(address).valid).toBe(true)
      expect(validateAjv(address).valid).toBe(true)
    })
  })

  describe('Scenario: postcode is missing', () => {
    test('the address is rejected', () => {
      const { postcode, ...withoutPostcode } = address
      expect(validateJoi(withoutPostcode).valid).toBe(false)
      expect(validateAjv(withoutPostcode).valid).toBe(false)
    })
  })

  describe('Scenario: postcode is an Irish Eircode', () => {
    test('the address is accepted', () => {
      const payload = { ...address, postcode: 'D6W 1234' }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })
  })

  describe('Scenario: postcode matches neither UK nor Irish format', () => {
    test('the address is rejected', () => {
      const payload = { ...address, postcode: 'NOTAPOSTCODE' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: fullAddress is omitted from the base address', () => {
    test('the address is still accepted — fullAddress is not required on the base schema', () => {
      const { fullAddress, ...withoutFullAddress } = address
      expect(validateJoi(withoutFullAddress).valid).toBe(true)
      expect(validateAjv(withoutFullAddress).valid).toBe(true)
    })
  })

  // ---------------------------------------------------------------------
  // Additional coverage: not called out by a scenario above, but kept from
  // the previous version of this file / added to match the Producer
  // resource's own free-text minLength coverage.
  // ---------------------------------------------------------------------
  describe('Additional coverage', () => {
    test('rejects an empty fullAddress', () => {
      const payload = { ...address, fullAddress: '' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects an unknown property', () => {
      const payload = { ...address, extra: 'not allowed' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})
