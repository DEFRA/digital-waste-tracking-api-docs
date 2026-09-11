/**
 * Placeholder — receiptJoi.js's receiptWasteItemSchema. Unlike creation's
 * createWasteItemSchema (creation/waste-item.test.js), this schema carries no
 * classification at all (D-042) — a prior Creation record already has
 * ewcCodes, wasteDescription, pops and hazardous detail, so pops/hazardous
 * conditionality is covered there and in common/pops.test.js and
 * common/hazardous.test.js, not here. actualTreatments (renamed from
 * disposalOrRecoveryCodes, D-031 amended) is optional here, and each entry's
 * disposalOrRecoveryCode is itself optional — a receiving site may need to
 * inspect or weigh before confirming the code (see
 * common/actual-treatment.test.js for the sub-schema itself).
 */
import { receiptWasteItemSchema } from '../../../../docs/collections/data/receiptJoi.js'

const nonHazardousWasteItem = {
  physicalForm: 'Solid',
  numberOfContainers: 2,
  typeOfContainers: 'BAG',
  weight: {
    metric: 'Tonnes',
    amount: 0.2,
    isEstimate: true
  }
}

test('accepts a valid waste item with no actualTreatments', () => {
  const { error } = receiptWasteItemSchema.validate(nonHazardousWasteItem)
  expect(error).toBeUndefined()
})

test('accepts a valid waste item with actualTreatments', () => {
  const { error } = receiptWasteItemSchema.validate({
    ...nonHazardousWasteItem,
    actualTreatments: [
      {
        disposalOrRecoveryCode: 'R3',
        weight: {
          metric: 'Tonnes',
          amount: 0.2,
          isEstimate: true
        }
      }
    ]
  })
  expect(error).toBeUndefined()
})

describe('actualTreatments', () => {
  test('is optional, unlike intendedTreatments at creation', () => {
    const { error } = receiptWasteItemSchema.validate(nonHazardousWasteItem)
    expect(error).toBeUndefined()
  })
})
