import { producerSchema } from '../../../../docs/collections/data/creationJoi.js'
import { validate } from '../../../../docs/event-model/validate/index.js'

const ajvValidate = (payload) => validate('producer.schema.json', payload)

describe('wasteSource = Commercial', () => {
  const producer = {
    wasteSource: 'Commercial',
    organisationName: 'ACME Waste Producers Ltd',
    authorisationNumber: 'EAS/P/123456',
    address: {
      fullAddress: '10 Industrial Way, Test City',
      postcode: 'TE1 2PQ'
    },
    emailAddress: 'producer@example.com',
    phoneNumber: '01234567890',
    sicCode: '38110',
    councilMovement: false
  }

  test('accepts a valid Commercial producer', () => {
    const { error } = producerSchema.validate(producer)
    expect(error).toBeUndefined()
    expect(ajvValidate(producer)).toBe(true)
  })

  test('rejects wasteSource given in lower/upper mismatched case', () => {
    const payload = {
      ...producer,
      wasteSource: 'COMMERCIAL'
    }
    const { error } = producerSchema.validate(payload)
    expect(error).toBeDefined()
    expect(ajvValidate(payload)).toBe(false)
  })

  test('requires organisationName', () => {
    const { organisationName, ...withoutOrganisationName } = producer
    const { error } = producerSchema.validate(withoutOrganisationName)
    expect(error).toBeDefined()
    expect(ajvValidate(withoutOrganisationName)).toBe(false)
  })

  test('does not require authorisationNumber', () => {
    const { authorisationNumber, ...withoutAuthorisationNumber } = producer
    const { error } = producerSchema.validate(withoutAuthorisationNumber)
    expect(error).toBeUndefined()
    expect(ajvValidate(withoutAuthorisationNumber)).toBe(true)
  })

  test('does not require emailAddress or phoneNumber', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } = producer
    const { error } = producerSchema.validate(withoutContactDetails)
    expect(error).toBeUndefined()
    expect(ajvValidate(withoutContactDetails)).toBe(true)
  })

  test('does not require fullAddress', () => {
    const { postcode } = producer.address
    const payload = {
      ...producer,
      address: { postcode }
    }
    const { error } = producerSchema.validate(payload)
    expect(error).toBeUndefined()
    expect(ajvValidate(payload)).toBe(true)
  })
})

describe('wasteSource = Municipal', () => {
  const municipalProducer = {
    wasteSource: 'Municipal',
    organisationName: 'Test Council',
    address: {
      fullAddress: 'Council Depot, Test City',
      postcode: 'TE1 5CD'
    },
    emailAddress: 'waste.services@example.gov.uk',
    phoneNumber: '01234567890',
    councilMovement: true
  }

  test('accepts a valid Municipal producer', () => {
    const { error } = producerSchema.validate(municipalProducer)
    expect(error).toBeUndefined()
    expect(ajvValidate(municipalProducer)).toBe(true)
  })

  test('requires organisationName', () => {
    const { organisationName, ...withoutOrganisationName } = municipalProducer
    const { error } = producerSchema.validate(withoutOrganisationName)
    expect(error).toBeDefined()
    expect(ajvValidate(withoutOrganisationName)).toBe(false)
  })

  test('does not require sicCode', () => {
    const { error } = producerSchema.validate(municipalProducer)
    expect(error).toBeUndefined()
    expect(ajvValidate(municipalProducer)).toBe(true)
  })
})

describe('wasteSource = Household', () => {
  const householdProducer = {
    wasteSource: 'Household',
    councilMovement: true
  }

  test('accepts a valid Household producer', () => {
    const { error } = producerSchema.validate(householdProducer)
    expect(error).toBeUndefined()
    expect(ajvValidate(householdProducer)).toBe(true)
  })

  test('rejects organisationName', () => {
    const payload = {
      ...householdProducer,
      organisationName: 'Acme'
    }
    const { error } = producerSchema.validate(payload)
    expect(error).toBeDefined()
    expect(ajvValidate(payload)).toBe(false)
  })

  test('forbids authorisationNumber', () => {
    const payload = {
      ...householdProducer,
      authorisationNumber: 'EAS/P/123456'
    }
    const { error } = producerSchema.validate(payload)
    expect(error).toBeDefined()
    expect(ajvValidate(payload)).toBe(false)
  })

  test('forbids an address', () => {
    const payload = {
      ...householdProducer,
      address: {
        fullAddress: '5 Elm Street, Test Town',
        postcode: 'TE2 4HH'
      }
    }
    const { error } = producerSchema.validate(payload)
    expect(error).toBeDefined()
    expect(ajvValidate(payload)).toBe(false)
  })
})
