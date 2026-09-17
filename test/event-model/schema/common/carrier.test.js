/**
 * carrier is treated as one resource, identical across all four events —
 * this is carrierSchema (sharedSchemas.js), imported as-is by collection,
 * delivery, and receipt (D-008). meansOfTransport, organisationName and
 * registrationNumber are all required (registrationNumber may be null/'',
 * in which case reasonForNoRegistrationNumber becomes required).
 *
 * creationJoi.js does NOT import this schema yet — it still defines its own,
 * more relaxed intendedCarrierSchema (only meansOfTransport required), kept
 * around solely for Creation's current, deliberately looser rules. That
 * split is pending a schema-side change to make creationJoi.js import this
 * same carrierSchema — including a flagged inconsistency: otherMeansOfTransport
 * is unconstrained here (allowed regardless of meansOfTransport), whereas
 * intendedCarrierSchema forbids it unless meansOfTransport is 'Other'.
 */
import {
  carrierSchema,
  MEANS_OF_TRANSPORT
} from '../../../../docs/collections/data/sharedSchemas.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = carrierSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('carrier.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('carrier.schema.json') }
}

describe('Feature: Carrier payload validation', () => {
  const carrier = {
    meansOfTransport: 'Road',
    registrationNumber: 'CBDU123456',
    organisationName: 'Test Carrier Ltd',
    vehicleRegistration: 'AB12 CDE',
    emailAddress: 'carrier@example.com',
    phoneNumber: '01234567890',
    address: {
      fullAddress: '1 Carrier Way, Test City',
      postcode: 'TE1 1ST'
    }
  }

  const carrierWithoutRegistrationNumber = {
    meansOfTransport: 'Rail',
    registrationNumber: '',
    reasonForNoRegistrationNumber: 'ONE_OFF',
    organisationName: 'Test Carrier Ltd',
    emailAddress: 'carrier@example.com'
  }

  describe('Scenario: Carrier is submitted correctly', () => {
    test('accepts a fully populated valid carrier', () => {
      expect(validateJoi(carrier).valid).toBe(true)
      expect(validateAjv(carrier).valid).toBe(true)
    })

    test('accepts a carrier with no registration number and a reason', () => {
      expect(validateJoi(carrierWithoutRegistrationNumber).valid).toBe(true)
      expect(validateAjv(carrierWithoutRegistrationNumber).valid).toBe(true)
    })
  })

  describe('Scenario: Carrier is missing a required field', () => {
    test.each(['meansOfTransport', 'organisationName', 'registrationNumber'])(
      'the payload is rejected when %s is missing',
      (field) => {
        const { [field]: excluded, ...payload } = carrier
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: vehicleRegistration conditionality on meansOfTransport', () => {
    test('is required when meansOfTransport is Road', () => {
      const { vehicleRegistration, ...withoutVehicleRegistration } = carrier
      expect(validateJoi(withoutVehicleRegistration).valid).toBe(false)
      expect(validateAjv(withoutVehicleRegistration).valid).toBe(false)
    })

    test.each(MEANS_OF_TRANSPORT.filter((mode) => mode !== 'Road'))(
      'is forbidden when meansOfTransport is %s',
      (meansOfTransport) => {
        const payload = {
          ...carrierWithoutRegistrationNumber,
          meansOfTransport,
          vehicleRegistration: 'AB12 CDE'
        }
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: registrationNumber and reasonForNoRegistrationNumber are mutually exclusive', () => {
    test('reasonForNoRegistrationNumber is required when registrationNumber is null or empty', () => {
      const { reasonForNoRegistrationNumber, ...withoutReason } =
        carrierWithoutRegistrationNumber
      expect(validateJoi(withoutReason).valid).toBe(false)
      expect(validateAjv(withoutReason).valid).toBe(false)
    })

    test('reasonForNoRegistrationNumber is forbidden when a valid registrationNumber is provided', () => {
      const payload = { ...carrier, reasonForNoRegistrationNumber: 'ONE_OFF' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('accepts a null registrationNumber paired with a reason', () => {
      const payload = {
        ...carrierWithoutRegistrationNumber,
        registrationNumber: null
      }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('rejects an invalid registrationNumber format', () => {
      const payload = { ...carrier, registrationNumber: 'NOTVALID' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: address', () => {
    test('requires postcode when provided', () => {
      const payload = {
        ...carrier,
        address: { fullAddress: '1 Carrier Way, Test City' }
      }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: emailAddress and phoneNumber', () => {
    test('accepts emailAddress only', () => {
      const { phoneNumber, ...withoutPhoneNumber } = carrier
      expect(validateJoi(withoutPhoneNumber).valid).toBe(true)
      expect(validateAjv(withoutPhoneNumber).valid).toBe(true)
    })

    test('accepts phoneNumber only', () => {
      const { emailAddress, ...withoutEmailAddress } = carrier
      expect(validateJoi(withoutEmailAddress).valid).toBe(true)
      expect(validateAjv(withoutEmailAddress).valid).toBe(true)
    })

    test('requires at least one of the two', () => {
      const { emailAddress, phoneNumber, ...withoutContactDetails } = carrier
      expect(validateJoi(withoutContactDetails).valid).toBe(false)
      expect(validateAjv(withoutContactDetails).valid).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Coverage that isn't in the scenarios above, kept from the previous
  // version of this file.
  // ---------------------------------------------------------------------------
  describe('Additional coverage: unknown fields', () => {
    test('rejects a payload with an unrecognised property', () => {
      const payload = { ...carrier, extraField: 'x' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Additional coverage: otherMeansOfTransport', () => {
    test('is currently unconstrained regardless of meansOfTransport', () => {
      const payload = { ...carrier, otherMeansOfTransport: 'Something' }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test.todo(
      'documents whether otherMeansOfTransport should stay unconstrained here, ' +
        'or be forbidden-unless-Other to match intendedCarrierSchema (flagged inconsistency)'
    )
  })

  test.todo(
    'creationJoi.js imports this carrierSchema directly instead of its own ' +
      'intendedCarrierSchema, once Creation is updated to require the full carrier fields — ' +
      'delete intendedCarrierSchema at that point'
  )
})
