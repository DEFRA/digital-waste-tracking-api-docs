/**
 * Placeholder — receiptWithoutDeliveryJoi.js's receiptWithoutDeliverySchema
 * (D-041, D-042). Only the root schema is exported — its address/site/
 * receiver sub-shapes are private local duplicates identical to receiptJoi.js's
 * already-tested receiptAddressSchema/receiptSiteSchema/receiverSiteSchema, so
 * they're exercised only indirectly through the fixture here, not re-tested
 * under a different name. Unlike the ordinary Receipt endpoint
 * (receipt/waste-item.test.js), wasteItems on this endpoint carry full
 * classification (D-042) — there is no prior Creation record to source it
 * from. reasonForNoDeliveryId is the field unique to this endpoint (D-041).
 */
import { receiptWithoutDeliverySchema } from '../../../../docs/collections/data/receiptWithoutDeliveryJoi.js'

const wasteItem = {
  physicalForm: 'Solid',
  numberOfContainers: 2,
  typeOfContainers: 'BAG',
  weight: {
    metric: 'Tonnes',
    amount: 0.2,
    isEstimate: true
  },
  classification: {
    ewcCodes: ['200101'],
    wasteDescription: 'Paper and cardboard',
    containsPops: false,
    containsHazardous: false
  }
}

const receiverSite = {
  siteName: 'Test Receiver Site',
  authorisationNumber: 'HP3456XX'
}

const receipt = {
  address: {
    fullAddress: '1 Receipt Yard, Test City',
    postcode: 'TE1 1ST'
  }
}

const carrier = {
  meansOfTransport: 'Road',
  registrationNumber: 'CBDU123456',
  organisationName: 'Test Carrier Ltd',
  vehicleRegistration: 'AB12 CDE'
}

const receiptWithoutDelivery = {
  apiCode: '123e4567-e89b-12d3-a456-426614174000',
  dateTimeReceived: '2026-01-01T09:00:00Z',
  wasteItems: [wasteItem],
  receiverSite,
  receipt,
  carrier,
  reasonForNoDeliveryId:
    'Waste collected directly from an exempt site with no prior delivery record.'
}

test('accepts a valid receipt without a prior delivery', () => {
  const { error } = receiptWithoutDeliverySchema.validate(
    receiptWithoutDelivery
  )
  expect(error).toBeUndefined()
})

describe('wasteItems', () => {
  test('classification is required, unlike the ordinary Receipt endpoint', () => {
    const { classification, ...wasteItemWithoutClassification } = wasteItem
    const { error } = receiptWithoutDeliverySchema.validate({
      ...receiptWithoutDelivery,
      wasteItems: [wasteItemWithoutClassification]
    })
    expect(error).toBeDefined()
  })
})

describe('reasonForNoDeliveryId', () => {
  test('is required', () => {
    const { reasonForNoDeliveryId, ...withoutReason } = receiptWithoutDelivery
    const { error } = receiptWithoutDeliverySchema.validate(withoutReason)
    expect(error).toBeDefined()
  })
})

describe('hazardousWasteConsignmentCode and reasonForNoConsignmentCode', () => {
  test('forbids reasonForNoConsignmentCode when hazardousWasteConsignmentCode is present', () => {
    const { error } = receiptWithoutDeliverySchema.validate({
      ...receiptWithoutDelivery,
      hazardousWasteConsignmentCode: 'AB1234/12345A',
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER'
    })
    expect(error).toBeDefined()
  })
})
