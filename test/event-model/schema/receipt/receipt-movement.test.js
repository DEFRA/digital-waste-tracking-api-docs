/**
 * Placeholder — receiptJoi.js's receiptMovementSchema root and its
 * validateReceiptConsignmentRules custom validator. Sub-schema field-level
 * rules are covered elsewhere: waste items (receipt/waste-item.test.js),
 * receiverSite/receipt (receipt/receipt-site.test.js), carrier
 * (common/carrier.test.js). Unlike Creation's validateCreationRules
 * (creation/create-movement.test.js), only the mutual-exclusivity half of the
 * consignment-code rule is checkable here — this endpoint's wasteItems drop
 * classification entirely (D-042), so "required when hazardous" can't be
 * determined from the request body alone; that half is enforced server-side
 * against the linked Movement's classification (see the code comment in
 * receiptJoi.js).
 */
import { receiptMovementSchema } from '../../../../docs/collections/data/receiptJoi.js'

const receiptMovement = {
  apiCode: '123e4567-e89b-12d3-a456-426614174000',
  dateTimeReceived: '2026-01-01T09:00:00Z',
  wasteItems: [
    {
      physicalForm: 'Solid',
      numberOfContainers: 2,
      typeOfContainers: 'BAG',
      weight: {
        metric: 'Tonnes',
        amount: 0.2,
        isEstimate: true
      }
    }
  ],
  receiverSite: {
    siteName: 'Test Receiver Site',
    authorisationNumber: 'HP3456XX'
  },
  receipt: {
    address: {
      fullAddress: '1 Receipt Yard, Test City',
      postcode: 'TE1 1ST'
    }
  },
  carrier: {
    meansOfTransport: 'Road',
    registrationNumber: 'CBDU123456',
    organisationName: 'Test Carrier Ltd',
    vehicleRegistration: 'AB12 CDE'
  }
}

test('accepts a valid receipt movement', () => {
  const { error } = receiptMovementSchema.validate(receiptMovement)
  expect(error).toBeUndefined()
})

describe('hazardousWasteConsignmentCode and reasonForNoConsignmentCode', () => {
  test('forbids reasonForNoConsignmentCode when hazardousWasteConsignmentCode is present', () => {
    const { error } = receiptMovementSchema.validate({
      ...receiptMovement,
      hazardousWasteConsignmentCode: 'AB1234/12345A',
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER'
    })
    expect(error).toBeDefined()
  })
})
