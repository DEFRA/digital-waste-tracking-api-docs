import { receiverSchema } from '../../../../docs/collections/data/creationJoi.js'

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

test('accepts a valid receiver', () => {
  const { error } = receiverSchema.validate(receiver)
  expect(error).toBeUndefined()
})

describe('siteName', () => {
  test('is not required', () => {
    const { siteName, ...withoutSiteName } = receiver
    const { error } = receiverSchema.validate(withoutSiteName)
    expect(error).toBeUndefined()
  })
})

describe('authorisationNumber', () => {
  test('is required when siteName is populated', () => {
    const { authorisationNumber, ...withoutAuthorisationNumber } = receiver
    const { error } = receiverSchema.validate(withoutAuthorisationNumber)
    expect(error).toBeDefined()
  })

  test('is not required when siteName is not populated', () => {
    const { siteName, authorisationNumber, ...withoutEither } = receiver
    const { error } = receiverSchema.validate(withoutEither)
    expect(error).toBeUndefined()
  })
})

describe('address', () => {
  test('is required when siteName is populated', () => {
    const { address, ...withoutAddress } = receiver
    const { error } = receiverSchema.validate(withoutAddress)
    expect(error).toBeDefined()
  })
})
