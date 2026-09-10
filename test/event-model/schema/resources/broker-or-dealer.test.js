import { brokerSchema } from '../../../../docs/collections/data/sharedSchemas.js'

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

test('accepts a valid brokerOrDealer', () => {
  const { error } = brokerSchema.validate(brokerOrDealer)
  expect(error).toBeUndefined()
})

describe('registrationNumber', () => {
  test('is not required', () => {
    const { registrationNumber, ...withoutRegistrationNumber } = brokerOrDealer
    const { error } = brokerSchema.validate(withoutRegistrationNumber)
    expect(error).toBeUndefined()
  })
})

describe('reasonForNoRegistrationNumber', () => {
  test('is not required when registrationNumber is null or empty', () => {
    const { error } = brokerSchema.validate({
      ...brokerOrDealer,
      registrationNumber: ''
    })
    expect(error).toBeUndefined()
  })
})

describe('organisationName', () => {
  test('is required', () => {
    const { organisationName, ...withoutOrganisationName } = brokerOrDealer
    const { error } = brokerSchema.validate(withoutOrganisationName)
    expect(error).toBeDefined()
  })
})

describe('emailAddress and phoneNumber', () => {
  test('does not require at least one of the two', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } =
      brokerOrDealer
    const { error } = brokerSchema.validate(withoutContactDetails)
    expect(error).toBeUndefined()
  })
})

describe('address', () => {
  test('requires postcode when fullAddress is provided', () => {
    const { fullAddress } = brokerOrDealer.address
    const { error } = brokerSchema.validate({
      ...brokerOrDealer,
      address: { fullAddress }
    })
    expect(error).toBeDefined()
  })

  test('requires postcode even when fullAddress is not provided', () => {
    const { error } = brokerSchema.validate({ ...brokerOrDealer, address: {} })
    expect(error).toBeDefined()
  })
})
