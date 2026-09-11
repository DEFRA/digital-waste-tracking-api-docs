/**
 * Placeholder — deliveryJoi.js's recordDeliverySchema root (D-010 amended).
 * carrier reuses the shared carrierSchema (common/carrier.test.js);
 * deliverySite is deliverySiteSchema (delivery/delivery-site.test.js). No
 * receiver, no driverDetails at delivery — deliveryJoi.js's own header
 * comment states the receiver is identified at receipt time, not here.
 */
import { recordDeliverySchema } from '../../../../docs/collections/data/deliveryJoi.js'

const carrier = {
  meansOfTransport: 'Road',
  registrationNumber: 'CBDU123456',
  organisationName: 'Test Carrier Ltd',
  vehicleRegistration: 'AB12 CDE'
}

const deliverySite = {
  siteName: 'Test Exempt Site',
  address: {
    fullAddress: '1 Delivery Yard, Test City',
    postcode: 'TE1 1ST'
  }
}

const recordDelivery = {
  apiCode: '123e4567-e89b-12d3-a456-426614174000',
  movementIds: ['25HRA0B2'],
  actualDateTimeDelivered: '2026-01-01T09:00:00Z',
  carrier,
  deliverySite
}

test('accepts a valid delivery', () => {
  const { error } = recordDeliverySchema.validate(recordDelivery)
  expect(error).toBeUndefined()
})

describe('apiCode', () => {
  test('is required', () => {
    const { apiCode, ...withoutApiCode } = recordDelivery
    const { error } = recordDeliverySchema.validate(withoutApiCode)
    expect(error).toBeDefined()
  })
})

describe('movementIds', () => {
  test('is required', () => {
    const { movementIds, ...withoutMovementIds } = recordDelivery
    const { error } = recordDeliverySchema.validate(withoutMovementIds)
    expect(error).toBeDefined()
  })

  test('requires at least one Movement ID', () => {
    const { error } = recordDeliverySchema.validate({
      ...recordDelivery,
      movementIds: []
    })
    expect(error).toBeDefined()
  })

  test('accepts more than one Movement ID (multi-collection run, D-010)', () => {
    const { error } = recordDeliverySchema.validate({
      ...recordDelivery,
      movementIds: ['25HRA0B2', '25HRA0B3']
    })
    expect(error).toBeUndefined()
  })
})

describe('actualDateTimeDelivered', () => {
  test('is required', () => {
    const { actualDateTimeDelivered, ...withoutDate } = recordDelivery
    const { error } = recordDeliverySchema.validate(withoutDate)
    expect(error).toBeDefined()
  })
})

describe('carrier', () => {
  test('is required', () => {
    const { carrier: _carrier, ...withoutCarrier } = recordDelivery
    const { error } = recordDeliverySchema.validate(withoutCarrier)
    expect(error).toBeDefined()
  })
})

describe('deliverySite', () => {
  test('is required', () => {
    const { deliverySite: _deliverySite, ...withoutDeliverySite } =
      recordDelivery
    const { error } = recordDeliverySchema.validate(withoutDeliverySite)
    expect(error).toBeDefined()
  })
})

describe('isDeleted', () => {
  test('defaults to false when omitted', () => {
    const { error, value } = recordDeliverySchema.validate(recordDelivery)
    expect(error).toBeUndefined()
    expect(value.isDeleted).toBe(false)
  })
})
