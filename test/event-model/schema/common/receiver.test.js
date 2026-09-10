/**
 * receiver is treated as one resource, identical across all events that use
 * it (creation, receipt) — this is creationJoi.js's receiverSchema: siteName
 * optional; authorisationNumber and the nested address both become required
 * only when siteName is populated.
 *
 * receiptJoi.js does NOT import this schema yet — it still defines its own
 * receiverSchema, a genuinely different shape: siteName and
 * authorisationNumber are unconditionally required, it adds
 * regulatoryPositionStatements, and it has no nested address at all (address
 * lives separately on receipt.address / receiptSiteSchema). That split is
 * pending a schema-side change to make receiptJoi.js import this same
 * receiverSchema instead. See phase2-payload-resource-analysis.md §2.
 */
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

test.todo(
  'receiptJoi.js imports this receiverSchema directly instead of its own ' +
    'receiverSchema, once Receipt is updated to match this shape (unconditional ' +
    'siteName/authorisationNumber, regulatoryPositionStatements, no nested address) — ' +
    'reconcile the two and delete whichever definition loses out'
)
