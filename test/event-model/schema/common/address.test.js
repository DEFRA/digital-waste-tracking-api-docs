/**
 * address is treated as one resource across all events — this is
 * addressSchema, the base of the address family (postcode required,
 * fullAddress optional; UK or Irish postcode accepted).
 *
 * Every event layers a straightforward "fullAddress required" overlay on top
 * of this same base via requiredFullAddressSchema (collection.address,
 * deliverySite.address, creation's receiver.address when siteName is set,
 * and Receipt's receiverSite.address) — those are consistent extensions of
 * this schema, not a divergent shape, and are tested alongside their owning
 * event, not here. receiptJoi.js's former standalone UK-only address schema
 * has converged onto this same base.
 */
import { addressSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const address = {
  fullAddress: '1 Example Way, Test City',
  postcode: 'TE1 1ST'
}

test('accepts a valid address', () => {
  const { error } = addressSchema.validate(address)
  expect(error).toBeUndefined()
})

describe('postcode', () => {
  test('is required', () => {
    const { postcode, ...withoutPostcode } = address
    const { error } = addressSchema.validate(withoutPostcode)
    expect(error).toBeDefined()
  })

  test('accepts an Irish Eircode', () => {
    const { error } = addressSchema.validate({
      ...address,
      postcode: 'D6W 1234'
    })
    expect(error).toBeUndefined()
  })

  test.todo('rejects a postcode that matches neither UK nor Irish format')
})

describe('fullAddress', () => {
  test('is not required on the base address', () => {
    const { fullAddress, ...withoutFullAddress } = address
    const { error } = addressSchema.validate(withoutFullAddress)
    expect(error).toBeUndefined()
  })
})
