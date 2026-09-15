/**
 * Placeholder — creationJoi.js's createMovementSchema root and its
 * validateCreationRules custom validator, the only place these cross-field
 * rules can be exercised (they're not reachable through any sub-schema
 * test). Sub-schema field-level rules are covered elsewhere: producer
 * (common/producer.test.js), receiver (common/receiver.test.js), waste items
 * (creation/waste-item.test.js). Uses ewcCode 200121, the one hazardous code
 * in the doc-side reference subset (see validators.js), to drive the
 * hazardous-EWC branches.
 */
import { createMovementSchema } from '../../../../docs/collections/data/creationJoi.js'

const producer = {
  wasteSource: 'Commercial',
  organisationName: 'ACME Waste Producers Ltd',
  address: {
    fullAddress: '10 Industrial Way, Test City',
    postcode: 'TE1 2PQ'
  },
  sicCode: '38110',
  councilMovement: false,
  emailAddress: 'producer@example.com'
}

const carrier = {
  meansOfTransport: 'Road',
  organisationName: 'Test Carrier Ltd',
  vehicleRegistration: 'AB12 CDE',
  emailAddress: 'carrier@example.com'
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

const hazardousWasteItem = {
  ...nonHazardousWasteItem,
  classification: {
    ...nonHazardousWasteItem.classification,
    ewcCodes: ['200121']
  }
}

const receiver = {
  siteName: 'Test Receiver Site',
  authorisationNumber: 'HP3456XX',
  address: {
    fullAddress: '99 Receiver Road, Test City',
    postcode: 'TE1 3RX'
  },
  emailAddress: 'receiver@example.com'
}

const baseMovement = {
  apiCode: '123e4567-e89b-12d3-a456-426614174000',
  plannedCollectionTime: '2026-01-01T09:00:00Z',
  producer,
  intendedCarriers: [carrier],
  wasteItems: [nonHazardousWasteItem]
}

const hazardousMovement = {
  ...baseMovement,
  wasteItems: [hazardousWasteItem]
}

test('accepts a valid non-hazardous movement with no intendedReceivers or consignment code', () => {
  const { error } = createMovementSchema.validate(baseMovement)
  expect(error).toBeUndefined()
})

describe('intendedCarriers', () => {
  test('is required', () => {
    const { intendedCarriers, ...withoutIntendedCarriers } = baseMovement
    const { error } = createMovementSchema.validate(withoutIntendedCarriers)
    expect(error).toBeDefined()
  })

  test('rejects an empty array', () => {
    const { error } = createMovementSchema.validate({
      ...baseMovement,
      intendedCarriers: []
    })
    expect(error).toBeDefined()
  })

  test('rejects intendedCarriers supplied as a bare object instead of an array', () => {
    const { error } = createMovementSchema.validate({
      ...baseMovement,
      intendedCarriers: carrier
    })
    expect(error).toBeDefined()
  })

  test('accepts more than one prospective carrier', () => {
    const { error } = createMovementSchema.validate({
      ...baseMovement,
      intendedCarriers: [
        carrier,
        { ...carrier, organisationName: 'Second Carrier Ltd' }
      ]
    })
    expect(error).toBeUndefined()
  })
})

describe('hazardousWasteConsignmentCode and reasonForNoConsignmentCode', () => {
  test('forbids reasonForNoConsignmentCode when hazardousWasteConsignmentCode is present', () => {
    const { error } = createMovementSchema.validate({
      ...baseMovement,
      hazardousWasteConsignmentCode: 'AB1234/12345A',
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER'
    })
    expect(error).toBeDefined()
  })

  test('requires reasonForNoConsignmentCode when the movement contains a hazardous EWC code and no consignment code is provided', () => {
    const { error } = createMovementSchema.validate(hazardousMovement)
    expect(error).toBeDefined()
  })
})

describe('intendedReceivers', () => {
  test('is required when the movement contains a hazardous EWC code', () => {
    const { error } = createMovementSchema.validate({
      ...hazardousMovement,
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER'
    })
    expect(error).toBeDefined()
  })

  test('rejects an empty intendedReceivers array on a hazardous movement', () => {
    const { error } = createMovementSchema.validate({
      ...hazardousMovement,
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER',
      intendedReceivers: []
    })
    expect(error).toBeDefined()
  })

  test('rejects intendedReceivers supplied as a bare object instead of an array', () => {
    const { error } = createMovementSchema.validate({
      ...hazardousMovement,
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER',
      intendedReceivers: receiver
    })
    expect(error).toBeDefined()
  })

  test('accepts a hazardous movement when reasonForNoConsignmentCode and intendedReceivers are both provided', () => {
    const { error } = createMovementSchema.validate({
      ...hazardousMovement,
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER',
      intendedReceivers: [receiver]
    })
    expect(error).toBeUndefined()
  })

  test('accepts more than one receiving site', () => {
    const { error } = createMovementSchema.validate({
      ...hazardousMovement,
      reasonForNoConsignmentCode: 'NON_HAZ_WASTE_TRANSFER',
      intendedReceivers: [
        receiver,
        { ...receiver, siteName: 'Second Receiver Site' }
      ]
    })
    expect(error).toBeUndefined()
  })
})
