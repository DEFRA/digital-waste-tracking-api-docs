/**
 * Placeholder — collectionSchema (collection.address), exported from
 * collectionJoi.js for testing. Its address overlay requires fullAddress,
 * unlike the base businessAddressSchema (common/address.test.js). See
 * phase2-payload-resource-analysis.md §2.
 */
import { collectionSchema } from '../../../../docs/collections/data/collectionJoi.js'

const collection = {
  address: {
    fullAddress: '1 Collection Yard, Test City',
    postcode: 'TE1 1ST'
  }
}

test('accepts a valid collection site', () => {
  const { error } = collectionSchema.validate(collection)
  expect(error).toBeUndefined()
})

describe('address', () => {
  test('is required', () => {
    const { error } = collectionSchema.validate({})
    expect(error).toBeDefined()
  })

  test('requires fullAddress, unlike the base business address', () => {
    const { postcode } = collection.address
    const { error } = collectionSchema.validate({ address: { postcode } })
    expect(error).toBeDefined()
  })

  test('requires postcode', () => {
    const { fullAddress } = collection.address
    const { error } = collectionSchema.validate({ address: { fullAddress } })
    expect(error).toBeDefined()
  })
})
