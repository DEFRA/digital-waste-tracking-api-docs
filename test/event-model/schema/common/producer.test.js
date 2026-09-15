import { producerSchema } from '../../../../docs/collections/data/creationJoi.js'

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
  })

  test('rejects wasteSource given in lower/upper mismatched case', () => {
    const { error } = producerSchema.validate({
      ...producer,
      wasteSource: 'COMMERCIAL'
    })
    expect(error).toBeDefined()
  })

  test('requires organisationName', () => {
    const { organisationName, ...withoutOrganisationName } = producer
    const { error } = producerSchema.validate(withoutOrganisationName)
    expect(error).toBeDefined()
  })

  test('does not require authorisationNumber', () => {
    const { authorisationNumber, ...withoutAuthorisationNumber } = producer
    const { error } = producerSchema.validate(withoutAuthorisationNumber)
    expect(error).toBeUndefined()
  })

  test('accepts emailAddress only', () => {
    const { phoneNumber, ...withoutPhoneNumber } = producer
    const { error } = producerSchema.validate(withoutPhoneNumber)
    expect(error).toBeUndefined()
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = producer
    const { error } = producerSchema.validate(withoutEmailAddress)
    expect(error).toBeUndefined()
  })

  test('requires at least one of emailAddress or phoneNumber', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } = producer
    const { error } = producerSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
  })

  test('does not require fullAddress', () => {
    const { postcode } = producer.address
    const { error } = producerSchema.validate({
      ...producer,
      address: { postcode }
    })
    expect(error).toBeUndefined()
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
  })

  test('requires organisationName', () => {
    const { organisationName, ...withoutOrganisationName } = municipalProducer
    const { error } = producerSchema.validate(withoutOrganisationName)
    expect(error).toBeDefined()
  })

  test('does not require sicCode', () => {
    const { error } = producerSchema.validate(municipalProducer)
    expect(error).toBeUndefined()
  })

  test('requires at least one of emailAddress or phoneNumber', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } =
      municipalProducer
    const { error } = producerSchema.validate(withoutContactDetails)
    expect(error).toBeDefined()
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
  })

  test('rejects organisationName', () => {
    const { error } = producerSchema.validate({
      ...householdProducer,
      organisationName: 'Acme'
    })
    expect(error).toBeDefined()
  })

  test('forbids authorisationNumber', () => {
    const { error } = producerSchema.validate({
      ...householdProducer,
      authorisationNumber: 'EAS/P/123456'
    })
    expect(error).toBeDefined()
  })

  test('forbids an address', () => {
    const { error } = producerSchema.validate({
      ...householdProducer,
      address: {
        fullAddress: '5 Elm Street, Test Town',
        postcode: 'TE2 4HH'
      }
    })
    expect(error).toBeDefined()
  })

  test('does not require emailAddress or phoneNumber, unlike Commercial and Municipal', () => {
    const { error } = producerSchema.validate(householdProducer)
    expect(error).toBeUndefined()
  })
})
