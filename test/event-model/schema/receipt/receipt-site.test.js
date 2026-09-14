/**
 * Placeholder — receiverSiteSchema, exported from receiptJoi.js for testing.
 * The former standalone physical-receipt-site schema and its own UK-only
 * address schema are now merged directly onto receiverSiteSchema as its
 * required address field, built from the shared addressSchema — address is
 * treated as one resource across events (common/address.test.js).
 */
import { receiverSiteSchema } from '../../../../docs/collections/data/receiptJoi.js'

const receiverSite = {
  siteName: 'Test Receiver',
  authorisationNumber: 'HP3456XX',
  address: {
    fullAddress: '1 Receipt Site Road, Test City',
    postcode: 'TE1 1ST'
  }
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
