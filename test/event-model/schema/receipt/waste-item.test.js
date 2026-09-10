/**
 * Placeholder — receiptJoi.js's wasteItemSchema. Same shared shape as
 * creation's createWasteItemSchema (creation/waste-item.test.js), except
 * disposalOrRecoveryCodes is optional here ("Actual Treatment", confirmed
 * by the receiver) rather than required ("Intended Treatment"). See
 * phase2-payload-resource-analysis.md §5.
 */
import { wasteItemSchema } from '../../../../docs/collections/data/receiptJoi.js'

const nonHazardousWasteItem = {
  ewcCodes: ['200101'],
  wasteDescription: 'Paper and cardboard',
  physicalForm: 'Solid',
  numberOfContainers: 2,
  typeOfContainers: 'BAG',
  weight: {
    metric: 'Tonnes',
    amount: 0.2,
    isEstimate: true
  },
  containsPops: false,
  containsHazardous: false
}

test('accepts a valid waste item with no disposalOrRecoveryCodes', () => {
  const { error } = wasteItemSchema.validate(nonHazardousWasteItem)
  expect(error).toBeUndefined()
})

test('accepts a valid waste item with disposalOrRecoveryCodes', () => {
  const { error } = wasteItemSchema.validate({
    ...nonHazardousWasteItem,
    disposalOrRecoveryCodes: [
      {
        code: 'R3',
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

describe('disposalOrRecoveryCodes', () => {
  test('is optional, unlike at creation', () => {
    const { error } = wasteItemSchema.validate(nonHazardousWasteItem)
    expect(error).toBeUndefined()
  })
})

describe('pops', () => {
  test.todo(
    'is required when containsPops is true (see common/pops.test.js for the sub-schema itself)'
  )
})

describe('hazardous', () => {
  test.todo(
    'is required when containsHazardous is true (see common/hazardous.test.js for the sub-schema itself)'
  )
})
