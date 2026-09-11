/**
 * Placeholder — creationJoi.js's createWasteItemSchema. classification
 * (ewcCodes, wasteDescription, containsPops/pops, containsHazardous/
 * hazardous) is nested under a required classification object (D-042);
 * weight/numberOfContainers/typeOfContainers/physicalForm stay top-level.
 * intendedTreatments (renamed from disposalOrRecoveryCodes) is required here,
 * unlike receipt's actualTreatments (receipt/waste-item.test.js).
 */
import { createWasteItemSchema } from '../../../../docs/collections/data/creationJoi.js'

const wasteItemWithHazardousAndPops = {
  physicalForm: 'Solid',
  numberOfContainers: 4,
  typeOfContainers: 'SKI',
  weight: {
    metric: 'Tonnes',
    amount: 0.5,
    isEstimate: true
  },
  intendedTreatments: [
    {
      disposalOrRecoveryCode: 'R1',
      weight: {
        metric: 'Tonnes',
        amount: 0.5,
        isEstimate: true
      }
    }
  ],
  classification: {
    ewcCodes: ['200121'],
    wasteDescription: 'Fluorescent tubes and other mercury-containing waste',
    containsPops: true,
    pops: {
      sourceOfComponents: 'PROVIDED_WITH_WASTE'
    },
    containsHazardous: true,
    hazardous: {
      sourceOfComponents: 'GUIDANCE',
      hazCodes: ['HP_4'],
      components: [
        {
          name: 'Mercury',
          concentration: 5
        }
      ]
    }
  }
}

const nonHazardousWasteItem = {
  physicalForm: 'Solid',
  numberOfContainers: 2,
  typeOfContainers: 'BAG',
  weight: {
    metric: 'Tonnes',
    amount: 0.2,
    isEstimate: true
  },
  intendedTreatments: [
    {
      disposalOrRecoveryCode: 'R3',
      weight: {
        metric: 'Tonnes',
        amount: 0.2,
        isEstimate: true
      }
    }
  ],
  classification: {
    ewcCodes: ['200101'],
    wasteDescription: 'Paper and cardboard',
    containsPops: false,
    containsHazardous: false
  }
}

test('accepts a valid waste item with pops and hazardous properties', () => {
  const { error } = createWasteItemSchema.validate(
    wasteItemWithHazardousAndPops
  )
  expect(error).toBeUndefined()
})

test('accepts a valid waste item without pops or hazardous properties', () => {
  const { error } = createWasteItemSchema.validate(nonHazardousWasteItem)
  expect(error).toBeUndefined()
})

describe('classification', () => {
  test('is required', () => {
    const { classification, ...withoutClassification } =
      wasteItemWithHazardousAndPops
    const { error } = createWasteItemSchema.validate(withoutClassification)
    expect(error).toBeDefined()
  })
})

describe('pops', () => {
  test('is required when containsPops is true', () => {
    const { pops, ...classificationWithoutPops } =
      wasteItemWithHazardousAndPops.classification
    const { error } = createWasteItemSchema.validate({
      ...wasteItemWithHazardousAndPops,
      classification: classificationWithoutPops
    })
    expect(error).toBeDefined()
  })

  test('is forbidden when containsPops is false', () => {
    const { error } = createWasteItemSchema.validate({
      ...nonHazardousWasteItem,
      classification: {
        ...nonHazardousWasteItem.classification,
        pops: { sourceOfComponents: 'PROVIDED_WITH_WASTE' }
      }
    })
    expect(error).toBeDefined()
  })
})

describe('hazardous', () => {
  test('is required when containsHazardous is true', () => {
    const { hazardous, ...classificationWithoutHazardous } =
      wasteItemWithHazardousAndPops.classification
    const { error } = createWasteItemSchema.validate({
      ...wasteItemWithHazardousAndPops,
      classification: classificationWithoutHazardous
    })
    expect(error).toBeDefined()
  })

  test('is forbidden when containsHazardous is false', () => {
    const { error } = createWasteItemSchema.validate({
      ...nonHazardousWasteItem,
      classification: {
        ...nonHazardousWasteItem.classification,
        hazardous: { sourceOfComponents: 'GUIDANCE', hazCodes: ['HP_4'] }
      }
    })
    expect(error).toBeDefined()
  })
})
