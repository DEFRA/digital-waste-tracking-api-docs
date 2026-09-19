import { brokerSchema } from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = brokerSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('broker-or-dealer.schema.json', payload)
  return {
    valid,
    errors: valid ? null : getErrors('broker-or-dealer.schema.json')
  }
}

describe('Feature: Broker or dealer payload validation', () => {
  const brokerOrDealer = {
    organisationName: 'Broker Demo Ltd',
    registrationNumber: 'CBDU654321',
    address: {
      fullAddress: '2 Broker Yard, Test City',
      postcode: 'TE1 1ST'
    },
    emailAddress: 'broker@example.com',
    phoneNumber: '01112223333'
  }

  describe('Scenario: Broker or dealer is submitted correctly', () => {
    test('accepts a valid brokerOrDealer', () => {
      expect(validateJoi(brokerOrDealer).valid).toBe(true)
      expect(validateAjv(brokerOrDealer).valid).toBe(true)
    })
  })

  describe('Scenario: registrationNumber and reasonForNoRegistrationNumber are mutually exclusive', () => {
    test('registrationNumber is required', () => {
      const { registrationNumber, ...withoutRegistrationNumber } =
        brokerOrDealer
      expect(validateJoi(withoutRegistrationNumber).valid).toBe(false)
      expect(validateAjv(withoutRegistrationNumber).valid).toBe(false)
    })

    test('accepts an empty string paired with reasonForNoRegistrationNumber', () => {
      const payload = {
        ...brokerOrDealer,
        registrationNumber: '',
        reasonForNoRegistrationNumber: 'ONE_OFF'
      }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('reasonForNoRegistrationNumber is required when registrationNumber is null or empty', () => {
      const payload = { ...brokerOrDealer, registrationNumber: '' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('reasonForNoRegistrationNumber is forbidden when a valid registrationNumber is provided', () => {
      const payload = {
        ...brokerOrDealer,
        reasonForNoRegistrationNumber: 'ONE_OFF'
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: Broker or dealer is missing organisationName', () => {
    test('the payload is rejected', () => {
      const { organisationName, ...withoutOrganisationName } = brokerOrDealer
      expect(validateJoi(withoutOrganisationName).valid).toBe(false)
      expect(validateAjv(withoutOrganisationName).valid).toBe(false)
    })
  })

  describe('Scenario: emailAddress and phoneNumber', () => {
    test('accepts emailAddress only', () => {
      const { phoneNumber, ...withoutPhoneNumber } = brokerOrDealer
      expect(validateJoi(withoutPhoneNumber).valid).toBe(true)
      expect(validateAjv(withoutPhoneNumber).valid).toBe(true)
    })

    test('accepts phoneNumber only', () => {
      const { emailAddress, ...withoutEmailAddress } = brokerOrDealer
      expect(validateJoi(withoutEmailAddress).valid).toBe(true)
      expect(validateAjv(withoutEmailAddress).valid).toBe(true)
    })

    test('requires at least one of the two', () => {
      const { emailAddress, phoneNumber, ...withoutContactDetails } =
        brokerOrDealer
      expect(validateJoi(withoutContactDetails).valid).toBe(false)
      expect(validateAjv(withoutContactDetails).valid).toBe(false)
    })
  })

  describe('Scenario: address', () => {
    test('requires postcode when fullAddress is provided', () => {
      const { fullAddress } = brokerOrDealer.address
      const payload = { ...brokerOrDealer, address: { fullAddress } }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('requires postcode even when fullAddress is not provided', () => {
      const payload = { ...brokerOrDealer, address: {} }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })
})
