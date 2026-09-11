/**
 * Placeholder — deliverySiteSchema (deliverySite), exported from
 * deliveryJoi.js for testing. Its address overlay (deliverySiteAddressSchema,
 * also exported for testing) requires fullAddress, same pattern as
 * collectionAddressSchema (collection/collection-site.test.js).
 */
import {
  deliverySiteSchema,
  deliverySiteAddressSchema
} from '../../../../docs/collections/data/deliveryJoi.js'

const deliverySite = {
  siteName: 'Test Exempt Site',
  address: {
    fullAddress: '1 Delivery Yard, Test City',
    postcode: 'TE1 1ST'
  }
}

test('accepts a valid delivery site', () => {
  const { error } = deliverySiteSchema.validate(deliverySite)
  expect(error).toBeUndefined()
})

describe('siteName', () => {
  test('is required', () => {
    const { siteName, ...withoutSiteName } = deliverySite
    const { error } = deliverySiteSchema.validate(withoutSiteName)
    expect(error).toBeDefined()
  })
})

describe('exemptionNumber', () => {
  test('is optional', () => {
    const { error } = deliverySiteSchema.validate({
      ...deliverySite,
      exemptionNumber: 'WEX123456'
    })
    expect(error).toBeUndefined()
  })
})

describe('address', () => {
  test('is required', () => {
    const { address, ...withoutAddress } = deliverySite
    const { error } = deliverySiteSchema.validate(withoutAddress)
    expect(error).toBeDefined()
  })

  test('accepts a valid address', () => {
    const { error } = deliverySiteAddressSchema.validate(deliverySite.address)
    expect(error).toBeUndefined()
  })

  test('requires fullAddress', () => {
    const { postcode } = deliverySite.address
    const { error } = deliverySiteAddressSchema.validate({ postcode })
    expect(error).toBeDefined()
  })

  test('requires postcode', () => {
    const { fullAddress } = deliverySite.address
    const { error } = deliverySiteAddressSchema.validate({ fullAddress })
    expect(error).toBeDefined()
  })
})
