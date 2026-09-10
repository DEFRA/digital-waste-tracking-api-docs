/**
 * Placeholder — receiptSiteSchema, exported from receiptJoi.js for testing.
 * Thin wrapper: a single required address, using receiptAddressSchema —
 * address is treated as one resource across events (common/address.test.js),
 * which flags receiptAddressSchema as the pending outlier still to converge.
 */
import { receiptSiteSchema } from '../../../../docs/collections/data/receiptJoi.js'

const receiptSite = {
  address: {
    fullAddress: '1 Receipt Site Road, Test City',
    postcode: 'TE1 1ST'
  }
}

test('accepts a valid receipt site', () => {
  const { error } = receiptSiteSchema.validate(receiptSite)
  expect(error).toBeUndefined()
})

describe('address', () => {
  test('is required', () => {
    const { error } = receiptSiteSchema.validate({})
    expect(error).toBeDefined()
  })
})
