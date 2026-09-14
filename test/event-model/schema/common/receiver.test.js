/**
 * receiver is treated as one resource, identical across all events that use
 * it (creation, receipt) — this is creationJoi.js's intendedReceiverSchema:
 * siteName is unconditionally required, and authorisationNumber and the
 * nested address are required as a result.
 *
 * receiptJoi.js does NOT import this schema yet — it still defines its own
 * receiverSiteSchema, a genuinely different shape: siteName and
 * authorisationNumber are unconditionally required, and it adds
 * regulatoryPositionStatements. It now also carries a nested address (merged
 * in from the former receiptSite object), built from the same shared
 * addressSchema as this one, but unconditionally required rather than only
 * when siteName is populated. That split is pending a schema-side change to
 * make receiptJoi.js import this same intendedReceiverSchema instead.
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

test.todo(
  'receiptJoi.js imports this intendedReceiverSchema directly instead of its own ' +
    'receiverSiteSchema, once Receipt is updated to match this shape (unconditional ' +
    'siteName/authorisationNumber, regulatoryPositionStatements, no nested address) — ' +
    'reconcile the two and delete whichever definition loses out'
)
