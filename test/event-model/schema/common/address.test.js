/**
 * address is treated as one resource across all events — this is
 * businessAddressSchema, the base of the address family (postcode required,
 * fullAddress optional; UK or Irish postcode accepted).
 *
 * Several events layer a straightforward "fullAddress required" overlay on
 * top of this same base via `.keys()` (collection.address,
 * deliverySite.address, creation's receiver.address when siteName is set) —
 * those are consistent extensions of this schema, not a divergent shape, and
 * are tested alongside their owning event, not here.
 *
 * receiptJoi.js's receiptAddressSchema is the genuine outlier: a standalone
 * reimplementation, not built on this base, which also drops Irish Eircode
 * support (UK postcodes only). That's pending a schema-side change to build
 * receiptAddressSchema from this same businessAddressSchema instead. See
 * phase2-payload-resource-analysis.md §2.
 */
import { businessAddressSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const address = {
  fullAddress: '1 Example Way, Test City',
  postcode: 'TE1 1ST'
}

test('accepts a valid address', () => {
  const { error } = businessAddressSchema.validate(address)
  expect(error).toBeUndefined()
})

describe('postcode', () => {
  test('is required', () => {
    const { postcode, ...withoutPostcode } = address
    const { error } = businessAddressSchema.validate(withoutPostcode)
    expect(error).toBeDefined()
  })

  test('accepts an Irish Eircode', () => {
    const { error } = businessAddressSchema.validate({
      ...address,
      postcode: 'D6W 1234'
    })
    expect(error).toBeUndefined()
  })

  test.todo('rejects a postcode that matches neither UK nor Irish format')
})

describe('fullAddress', () => {
  test('is not required on the base business address', () => {
    const { fullAddress, ...withoutFullAddress } = address
    const { error } = businessAddressSchema.validate(withoutFullAddress)
    expect(error).toBeUndefined()
  })
})

test.todo(
  'receiptJoi.js builds receiptAddressSchema from this businessAddressSchema ' +
    'instead of a standalone copy, once Receipt address rules are reconciled — ' +
    'including whether Irish Eircodes should be accepted there too'
)
