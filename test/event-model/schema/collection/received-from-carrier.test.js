/**
 * Placeholder — receivedFromCarrier only carries meaning as part of the
 * recordCollectionSchema root, in relation to collectionType. Per
 * phase2-payload-resource-analysis.md §4, api/openapi.yaml and this file's
 * own header comment in collectionJoi.js describe:
 *   collectionType === 'TRANSIT' -> receivedFromCarrier required
 *   collectionType === 'STATIC'  -> receivedFromCarrier forbidden
 * but collectionJoi.js does not actually enforce this today — receivedFromCarrier
 * is plain, optional carrierSchema with no `.when()` tying it to collectionType.
 * The tests below assert today's real (unenforced) behaviour; the test.todo
 * entries capture the documented-but-missing rule so this file gets updated,
 * not silently left behind, once that gap is resolved one way or the other.
 */
import { recordCollectionSchema } from '../../../../docs/collections/data/collectionJoi.js'

const baseCollection = {
  apiCode: '123e4567-e89b-12d3-a456-426614174000',
  actualDateTimeCollected: '2026-01-01T09:00:00Z',
  carrier: {
    meansOfTransport: 'Road',
    registrationNumber: 'CBDU123456',
    organisationName: 'Test Carrier Ltd',
    vehicleRegistration: 'AB12 CDE'
  },
  collection: {
    address: {
      fullAddress: '1 Collection Yard, Test City',
      postcode: 'TE1 1ST'
    }
  }
}

test('accepts collectionType TRANSIT without receivedFromCarrier (documented rule not yet enforced)', () => {
  const { error } = recordCollectionSchema.validate({
    ...baseCollection,
    collectionType: 'TRANSIT'
  })
  expect(error).toBeUndefined()
})

test('accepts collectionType STATIC with receivedFromCarrier present (documented rule not yet enforced)', () => {
  const { error } = recordCollectionSchema.validate({
    ...baseCollection,
    collectionType: 'STATIC',
    receivedFromCarrier: baseCollection.carrier
  })
  expect(error).toBeUndefined()
})

test.todo(
  'rejects collectionType TRANSIT without receivedFromCarrier, once the D-029 rule is enforced in collectionJoi.js'
)

test.todo(
  'rejects collectionType STATIC with receivedFromCarrier present, once the D-029 rule is enforced in collectionJoi.js'
)
