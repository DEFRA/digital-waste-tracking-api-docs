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
 * unconditionally required, and it adds regulatoryPositionStatements. It
 * also carries a nested address (merged in from the former receiptSite
 * object), built from the same shared addressSchema as this one, but
 * unconditionally required rather than only when siteName is populated.
 * That split is pending a schema-side change to make Receipt import this
 * same intendedReceiverSchema instead.
 */
import { intendedReceiverSchema } from '../../../../docs/collections/data/creationJoi.js'

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
  const { error } = intendedReceiverSchema.validate(receiver)
  expect(error).toBeUndefined()
})

describe('siteName', () => {
  test('is required', () => {
    const { siteName, ...withoutSiteName } = receiver
    const { error } = intendedReceiverSchema.validate(withoutSiteName)
    expect(error).toBeDefined()
  })
})

describe('authorisationNumber', () => {
  test('is required when siteName is populated', () => {
    const { authorisationNumber, ...withoutAuthorisationNumber } = receiver
    const { error } = intendedReceiverSchema.validate(
      withoutAuthorisationNumber
    )
    expect(error).toBeDefined()
  })
})

describe('address', () => {
  test('is required when siteName is populated', () => {
    const { address, ...withoutAddress } = receiver
    const { error } = intendedReceiverSchema.validate(withoutAddress)
    expect(error).toBeDefined()
  })
})

describe('emailAddress and phoneNumber', () => {
  test('accepts emailAddress only', () => {
    const { phoneNumber, ...withoutPhoneNumber } = receiver
    const { error } = intendedReceiverSchema.validate(withoutPhoneNumber)
    expect(error).toBeUndefined()
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = receiver
    const { error } = intendedReceiverSchema.validate(withoutEmailAddress)
    expect(error).toBeUndefined()
  })

  test('requires at least one of the two', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } = receiver
    const { error } = intendedReceiverSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
  })
})

test.todo(
  'Receipt imports this intendedReceiverSchema directly instead of the shared ' +
    'receiverSiteSchema, once Receipt is updated to match this shape (unconditional ' +
    'siteName/authorisationNumber, regulatoryPositionStatements, no nested address) — ' +
    'reconcile the two and delete whichever definition loses out'
)
