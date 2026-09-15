/**
 * Placeholder — creationJoi.js's intendedCarrierSchema, exported for testing.
 * Deliberately looser than the shared carrierSchema (common/carrier.test.js)
 * — only meansOfTransport and organisationName are mandatory at Creation.
 * Covers only the emailAddress/phoneNumber "at least one required" rule;
 * other fields are exercised indirectly via creation/create-movement.test.js.
 */
import { intendedCarrierSchema } from '../../../../docs/collections/data/creationJoi.js'

const carrier = {
  meansOfTransport: 'Road',
  organisationName: 'Test Carrier Ltd',
  vehicleRegistration: 'AB12 CDE',
  emailAddress: 'carrier@example.com',
  phoneNumber: '01234567890'
}

test('accepts a fully populated valid carrier', () => {
  const { error } = intendedCarrierSchema.validate(carrier)
  expect(error).toBeUndefined()
})

describe('emailAddress and phoneNumber', () => {
  test('accepts emailAddress only', () => {
    const { phoneNumber, ...withoutPhoneNumber } = carrier
    const { error } = intendedCarrierSchema.validate(withoutPhoneNumber)
    expect(error).toBeUndefined()
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = carrier
    const { error } = intendedCarrierSchema.validate(withoutEmailAddress)
    expect(error).toBeUndefined()
  })

  test('requires at least one of the two', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } = carrier
    const { error } = intendedCarrierSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
  })
})
