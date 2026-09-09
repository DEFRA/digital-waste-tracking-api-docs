import { creationCarrierSchema } from '../../../../docs/collections/data/creationJoi.js'

const minimalCarrier = {
  meansOfTransport: 'Road'
}

const fullCarrier = {
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
  meansOfTransport: 'Other',
  reasonForNoRegistrationNumber: 'ONE_OFF',
  otherMeansOfTransport: 'Trailer moved by site equipment'
}

test('accepts a minimal valid carrier', () => {
  const { error } = creationCarrierSchema.validate(minimalCarrier)
  expect(error).toBeUndefined()
})

test('accepts a fully populated valid carrier', () => {
  const { error } = creationCarrierSchema.validate(fullCarrier)
  expect(error).toBeUndefined()
})

test('accepts a carrier without a registration number', () => {
  const { error } = creationCarrierSchema.validate(carrierWithoutRegistrationNumber)
  expect(error).toBeUndefined()
})

describe('meansOfTransport', () => {
  test('is required', () => {
    const { meansOfTransport, ...withoutMeansOfTransport } = minimalCarrier
    const { error } = creationCarrierSchema.validate(withoutMeansOfTransport)
    expect(error).toBeDefined()
  })
})

describe('vehicleRegistration', () => {
  test('is forbidden when meansOfTransport is not Road', () => {
    const { error } = creationCarrierSchema.validate({
      meansOfTransport: 'Rail',
      vehicleRegistration: 'AB12 CDE'
    })
    expect(error).toBeDefined()
  })
})

describe('otherMeansOfTransport', () => {
  test('is forbidden when meansOfTransport is not Other', () => {
    const { error } = creationCarrierSchema.validate({
      ...minimalCarrier,
      otherMeansOfTransport: 'Trailer moved by site equipment'
    })
    expect(error).toBeDefined()
  })
})

describe('registrationNumber and reasonForNoRegistrationNumber', () => {
  test('reasonForNoRegistrationNumber is forbidden when a valid registrationNumber is provided', () => {
    const { error } = creationCarrierSchema.validate({
      ...minimalCarrier,
      registrationNumber: 'CBDU123456',
      reasonForNoRegistrationNumber: 'ONE_OFF'
    })
    expect(error).toBeDefined()
  })
})

describe('address', () => {
  test('requires postcode when provided', () => {
    const { error } = creationCarrierSchema.validate({
      ...minimalCarrier,
      address: { fullAddress: '1 Carrier Way, Test City' }
    })
    expect(error).toBeDefined()
  })
})
