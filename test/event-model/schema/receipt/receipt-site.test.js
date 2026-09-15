/**
 * Placeholder — receiverSiteSchema, exported from sharedSchemas.js and
 * shared by both receipt endpoints (POST /deliveries/{deliveryId}/receipt
 * and POST /receipts) — the two event files' copies were confirmed
 * byte-identical before merging into one. The former standalone
 * physical-receipt-site schema and its own UK-only address schema are now
 * merged directly onto receiverSiteSchema as its required address field,
 * built from the shared addressSchema — address is treated as one resource
 * across events (common/address.test.js).
 */
import { receiverSiteSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const receiverSite = {
  siteName: 'Test Receiver',
  authorisationNumber: 'HP3456XX',
  address: {
    fullAddress: '1 Receipt Site Road, Test City',
    postcode: 'TE1 1ST'
  },
  emailAddress: 'receiver@example.com'
}

test('accepts a valid receiver site', () => {
  const { error } = receiverSiteSchema.validate(receiverSite)
  expect(error).toBeUndefined()
})

describe('address', () => {
  test('is required', () => {
    const { address, ...withoutAddress } = receiverSite
    const { error } = receiverSiteSchema.validate(withoutAddress)
    expect(error).toBeDefined()
  })

  test('requires fullAddress, unlike the base address', () => {
    const { postcode } = receiverSite.address
    const { error } = receiverSiteSchema.validate({
      ...receiverSite,
      address: { postcode }
    })
    expect(error).toBeDefined()
  })
})

describe('emailAddress and phoneNumber', () => {
  test('accepts emailAddress only', () => {
    const { error } = receiverSiteSchema.validate(receiverSite)
    expect(error).toBeUndefined()
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = receiverSite
    const { error } = receiverSiteSchema.validate({
      ...withoutEmailAddress,
      phoneNumber: '01234567890'
    })
    expect(error).toBeUndefined()
  })

  test('requires at least one of the two', () => {
    const { emailAddress, ...withoutContactDetails } = receiverSite
    const { error } = receiverSiteSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
  })
})
