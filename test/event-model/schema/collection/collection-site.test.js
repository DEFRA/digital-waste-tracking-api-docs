/**
 * Placeholder — collectionSiteSchema (collectionSite), exported from
 * collectionJoi.js for testing. Its address overlay (collectionAddressSchema,
 * also exported for testing) requires fullAddress, unlike the base
 * addressSchema (common/address.test.js).
 */
import {
  collectionSiteSchema,
  collectionAddressSchema
} from '../../../../docs/collections/data/collectionJoi.js'

const collectionSite = {
  address: {
    fullAddress: '1 Collection Yard, Test City',
    postcode: 'TE1 1ST'
  },
  emailAddress: 'siteoffice@example.com'
}

test('accepts a valid collection site', () => {
  const { error } = collectionSiteSchema.validate(collectionSite)
  expect(error).toBeUndefined()
})

describe('address', () => {
  test('is required', () => {
    const { error } = collectionSiteSchema.validate({})
    expect(error).toBeDefined()
  })

  test('accepts a valid address', () => {
    const { error } = collectionAddressSchema.validate(collectionSite.address)
    expect(error).toBeUndefined()
  })

  test('requires fullAddress, unlike the base business address', () => {
    const { postcode } = collectionSite.address
    const { error } = collectionAddressSchema.validate({ postcode })
    expect(error).toBeDefined()
  })

  test('requires postcode', () => {
    const { fullAddress } = collectionSite.address
    const { error } = collectionAddressSchema.validate({ fullAddress })
    expect(error).toBeDefined()
  })
})

describe('emailAddress and phoneNumber', () => {
  test('accepts emailAddress only', () => {
    const { error } = collectionSiteSchema.validate(collectionSite)
    expect(error).toBeUndefined()
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = collectionSite
    const { error } = collectionSiteSchema.validate({
      ...withoutEmailAddress,
      phoneNumber: '01234567890'
    })
    expect(error).toBeUndefined()
  })

  test('requires at least one of the two', () => {
    const { emailAddress, ...withoutContactDetails } = collectionSite
    const { error } = collectionSiteSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
  })
})
