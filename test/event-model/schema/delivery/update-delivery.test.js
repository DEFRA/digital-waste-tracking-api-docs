/**
 * Placeholder — deliveryJoi.js's updateDeliverySchema (D-017). PUT
 * /deliveries/{deliveryId}. A recorded delivery is immutable except for the
 * isDeleted soft-delete flag — .unknown(false) rejects any other field.
 */
import { updateDeliverySchema } from '../../../../docs/collections/data/deliveryJoi.js'

const updateDelivery = {
  apiCode: '123e4567-e89b-12d3-a456-426614174000',
  isDeleted: true
}

test('accepts a valid delivery update', () => {
  const { error } = updateDeliverySchema.validate(updateDelivery)
  expect(error).toBeUndefined()
})

describe('apiCode', () => {
  test('is required', () => {
    const { apiCode, ...withoutApiCode } = updateDelivery
    const { error } = updateDeliverySchema.validate(withoutApiCode)
    expect(error).toBeDefined()
  })
})

describe('isDeleted', () => {
  test('is required', () => {
    const { isDeleted, ...withoutIsDeleted } = updateDelivery
    const { error } = updateDeliverySchema.validate(withoutIsDeleted)
    expect(error).toBeDefined()
  })
})

test('rejects any field other than apiCode and isDeleted', () => {
  const { error } = updateDeliverySchema.validate({
    ...updateDelivery,
    actualDateTimeDelivered: '2026-01-01T09:00:00Z'
  })
  expect(error).toBeDefined()
})
