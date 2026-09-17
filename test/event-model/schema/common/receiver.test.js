/**
 * receiver is treated as one resource, identical across all events that use
 * it (creation, receipt) — this is creationJoi.js's intendedReceiverSchema:
 * siteName is unconditionally required, and authorisationNumber and the
 * nested address are required as a result.
 *
 * Receipt does NOT use this schema — it uses the separate, shared
 * receiverSiteSchema (sharedSchemas.js, common to both receipt endpoints
 * since their two copies were confirmed byte-identical and merged), a
 * genuinely different shape: siteName and authorisationNumber are
 * unconditionally required. It also carries a nested address (merged in
 * from the former receiptSite object), built from the same shared
 * addressSchema as this one, but unconditionally required rather than only
 * when siteName is populated. That split is pending a schema-side change to
 * make Receipt import this same intendedReceiverSchema instead.
 *
 * regulatoryPositionStatements was removed from receiverSiteSchema and moved
 * to Delivery's deliverySiteSchema — it's a delivery-site property, not a
 * receiver one.
 */
import { intendedReceiverSchema } from '../../../../docs/collections/data/creationJoi.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = intendedReceiverSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('receiver.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('receiver.schema.json') }
}

describe('Feature: Receiver payload validation', () => {
  const receiver = {
    siteName: 'Test Receiver Site',
    authorisationNumber: 'HP3456XX',
    emailAddress: 'receiver@example.com',
    phoneNumber: '01234567890',
    address: {
      fullAddress: '99 Receiver Road, Test City',
      postcode: 'TE1 3RX'
    }
  }

  describe('Scenario: A valid receiver is submitted', () => {
    test('the receiver is accepted', () => {
      expect(validateJoi(receiver).valid).toBe(true)
      expect(validateAjv(receiver).valid).toBe(true)
    })
  })

  describe('Scenario: siteName is missing', () => {
    test('the receiver is rejected', () => {
      const { siteName, ...withoutSiteName } = receiver
      expect(validateJoi(withoutSiteName).valid).toBe(false)
      expect(validateAjv(withoutSiteName).valid).toBe(false)
    })
  })

  describe('Scenario: authorisationNumber is missing while siteName is populated', () => {
    test('the receiver is rejected', () => {
      const { authorisationNumber, ...withoutAuthorisationNumber } = receiver
      expect(validateJoi(withoutAuthorisationNumber).valid).toBe(false)
      expect(validateAjv(withoutAuthorisationNumber).valid).toBe(false)
    })
  })

  describe('Scenario: address is missing while siteName is populated', () => {
    test('the receiver is rejected', () => {
      const { address, ...withoutAddress } = receiver
      expect(validateJoi(withoutAddress).valid).toBe(false)
      expect(validateAjv(withoutAddress).valid).toBe(false)
    })
  })

  describe('Scenario: emailAddress and phoneNumber', () => {
    test('accepts emailAddress only', () => {
      const { phoneNumber, ...withoutPhoneNumber } = receiver
      expect(validateJoi(withoutPhoneNumber).valid).toBe(true)
      expect(validateAjv(withoutPhoneNumber).valid).toBe(true)
    })

    test('accepts phoneNumber only', () => {
      const { emailAddress, ...withoutEmailAddress } = receiver
      expect(validateJoi(withoutEmailAddress).valid).toBe(true)
      expect(validateAjv(withoutEmailAddress).valid).toBe(true)
    })

    test('requires at least one of the two', () => {
      const { emailAddress, phoneNumber, ...withoutContactDetails } = receiver
      expect(validateJoi(withoutContactDetails).valid).toBe(false)
      expect(validateAjv(withoutContactDetails).valid).toBe(false)
    })
  })

  // ---------------------------------------------------------------------
  // Additional coverage: not called out by a scenario above, but added to
  // match the Producer resource's own coverage of free-text minLength and
  // format-checked fields.
  // ---------------------------------------------------------------------
  describe('Additional coverage', () => {
    test('rejects an empty siteName', () => {
      const payload = { ...receiver, siteName: '' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects a malformed authorisationNumber', () => {
      const payload = { ...receiver, authorisationNumber: 'NOTVALID' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects an address missing fullAddress', () => {
      const { fullAddress, ...addressWithoutFullAddress } = receiver.address
      const payload = { ...receiver, address: addressWithoutFullAddress }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects an address with a malformed postcode', () => {
      const payload = {
        ...receiver,
        address: { ...receiver.address, postcode: 'NOTAPOSTCODE' }
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('rejects an unknown property', () => {
      const payload = { ...receiver, extra: 'not allowed' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})

test.todo(
  'Receipt imports this intendedReceiverSchema directly instead of the shared ' +
    'receiverSiteSchema, once Receipt is updated to match this shape (unconditional ' +
    'siteName/authorisationNumber, regulatoryPositionStatements, no nested address) — ' +
    'reconcile the two and delete whichever definition loses out'
)
