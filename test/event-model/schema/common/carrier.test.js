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
import { carrierSchema } from '../../../../docs/collections/data/sharedSchemas.js'

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

test('accepts a fully populated valid carrier', () => {
  const { error } = carrierSchema.validate(carrier)
  expect(error).toBeUndefined()
})

test('accepts a carrier with no registration number and a reason', () => {
  const { error } = carrierSchema.validate(carrierWithoutRegistrationNumber)
  expect(error).toBeUndefined()
})

describe('meansOfTransport', () => {
  test('is required', () => {
    const { meansOfTransport, ...withoutMeansOfTransport } = carrier
    const { error } = carrierSchema.validate(withoutMeansOfTransport)
    expect(error).toBeDefined()
  })
})

describe('organisationName', () => {
  test('is required', () => {
    const { organisationName, ...withoutOrganisationName } = carrier
    const { error } = carrierSchema.validate(withoutOrganisationName)
    expect(error).toBeDefined()
  })
})

describe('vehicleRegistration', () => {
  test('is required when meansOfTransport is Road', () => {
    const { vehicleRegistration, ...withoutVehicleRegistration } = carrier
    const { error } = carrierSchema.validate(withoutVehicleRegistration)
    expect(error).toBeDefined()
  })

  test('is forbidden when meansOfTransport is not Road', () => {
    const { error } = carrierSchema.validate({
      ...carrierWithoutRegistrationNumber,
      vehicleRegistration: 'AB12 CDE'
    })
    expect(error).toBeDefined()
  })
})

describe('registrationNumber and reasonForNoRegistrationNumber', () => {
  test('registrationNumber is required', () => {
    const { registrationNumber, ...withoutRegistrationNumber } = carrier
    const { error } = carrierSchema.validate(withoutRegistrationNumber)
    expect(error).toBeDefined()
  })

  test('reasonForNoRegistrationNumber is required when registrationNumber is null or empty', () => {
    const { reasonForNoRegistrationNumber, ...withoutReason } =
      carrierWithoutRegistrationNumber
    const { error } = carrierSchema.validate(withoutReason)
    expect(error).toBeDefined()
  })

  test('reasonForNoRegistrationNumber is forbidden when a valid registrationNumber is provided', () => {
    const { error } = carrierSchema.validate({
      ...carrier,
      reasonForNoRegistrationNumber: 'ONE_OFF'
    })
    expect(error).toBeDefined()
  })
})

describe('otherMeansOfTransport', () => {
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

describe('address', () => {
  test('requires postcode when provided', () => {
    const { error } = carrierSchema.validate({
      ...carrier,
      address: { fullAddress: '1 Carrier Way, Test City' }
    })
    expect(error).toBeDefined()
  })
})

describe('emailAddress and phoneNumber', () => {
  test('accepts emailAddress only', () => {
    const { phoneNumber, ...withoutPhoneNumber } = carrier
    const { error } = carrierSchema.validate(withoutPhoneNumber)
    expect(error).toBeUndefined()
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = carrier
    const { error } = carrierSchema.validate(withoutEmailAddress)
    expect(error).toBeUndefined()
  })

  test('requires at least one of the two', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } = carrier
    const { error } = carrierSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
  })
})
