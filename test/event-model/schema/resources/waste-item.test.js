import { createWasteItemSchema } from '../../../../docs/collections/data/creationJoi.js'

const wasteItemWithHazardousAndPops = {
  ewcCodes: ['200121'],
  wasteDescription: 'Fluorescent tubes and other mercury-containing waste',
  physicalForm: 'Solid',
  numberOfContainers: 4,
  typeOfContainers: 'SKI',
  weight: {
    metric: 'Tonnes',
    amount: 0.5,
    isEstimate: true
  },
  disposalOrRecoveryCodes: [
    {
      code: 'R1',
      weight: {
        metric: 'Tonnes',
        amount: 0.5,
        isEstimate: true
      }
    }
  ],
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
  disposalOrRecoveryCodes: [
    {
      code: 'R3',
      weight: {
        metric: 'Tonnes',
        amount: 0.2,
        isEstimate: true
      }
    }
  ],
  containsPops: false,
  containsHazardous: false
}

test('accepts a valid waste item with pops and hazardous properties', () => {
  const { error } = createWasteItemSchema.validate(wasteItemWithHazardousAndPops)
  expect(error).toBeUndefined()
})

test('accepts a valid waste item without pops or hazardous properties', () => {
  const { error } = createWasteItemSchema.validate(nonHazardousWasteItem)
  expect(error).toBeUndefined()
})

describe('pops', () => {
  test('is required when containsPops is true', () => {
    const { pops, ...withoutPops } = wasteItemWithHazardousAndPops
    const { error } = createWasteItemSchema.validate(withoutPops)
    expect(error).toBeDefined()
  })

  test('is forbidden when containsPops is false', () => {
    const { error } = createWasteItemSchema.validate({
      ...nonHazardousWasteItem,
      pops: { sourceOfComponents: 'PROVIDED_WITH_WASTE' }
    })
    expect(error).toBeDefined()
  })
})

describe('hazardous', () => {
  test('is required when containsHazardous is true', () => {
    const { hazardous, ...withoutHazardous } = wasteItemWithHazardousAndPops
    const { error } = createWasteItemSchema.validate(withoutHazardous)
    expect(error).toBeDefined()
  })

  test('is forbidden when containsHazardous is false', () => {
    const { error } = createWasteItemSchema.validate({
      ...nonHazardousWasteItem,
      hazardous: { sourceOfComponents: 'GUIDANCE', hazCodes: ['HP_4'] }
    })
    expect(error).toBeDefined()
  })
})
