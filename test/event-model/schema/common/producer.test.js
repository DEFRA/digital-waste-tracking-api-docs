import { producerSchema } from '../../../../docs/collections/data/creationJoi.js'
import {
  getErrors,
  validate
} from '../../../../docs/event-model/validate/index.js'

const validateJoi = (payload) => {
  const { error } = producerSchema.validate(payload)
  return { valid: error === undefined, errors: error?.details ?? null }
}

const validateAjv = (payload) => {
  const valid = validate('producer.schema.json', payload)
  return { valid, errors: valid ? null : getErrors('producer.schema.json') }
}

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
    expect(validateJoi(producer).valid).toBe(true)
    expect(validateAjv(producer).valid).toBe(true)
  })

  test('rejects wasteSource given in lower/upper mismatched case', () => {
    const payload = {
      ...producer,
      wasteSource: 'COMMERCIAL'
    }
    expect(validateJoi(payload).valid).toBe(false)
    expect(validateAjv(payload).valid).toBe(false)
  })

  test('requires organisationName', () => {
    const { organisationName, ...withoutOrganisationName } = producer
    expect(validateJoi(withoutOrganisationName).valid).toBe(false)
    expect(validateAjv(withoutOrganisationName).valid).toBe(false)
  })

  test('does not require authorisationNumber', () => {
    const { authorisationNumber, ...withoutAuthorisationNumber } = producer
    expect(validateJoi(withoutAuthorisationNumber).valid).toBe(true)
    expect(validateAjv(withoutAuthorisationNumber).valid).toBe(true)
  })

  test('accepts emailAddress only', () => {
    const { phoneNumber, ...withoutPhoneNumber } = producer

    expect(validateJoi(withoutPhoneNumber).valid).toBe(true)
    expect(validateAjv(withoutPhoneNumber).valid).toBe(true)
  })

  test('accepts phoneNumber only', () => {
    const { emailAddress, ...withoutEmailAddress } = producer
    expect(validateJoi(withoutEmailAddress).valid).toBe(true)
    expect(validateAjv(withoutEmailAddress).valid).toBe(true)
  })

  test('requires at least one of emailAddress or phoneNumber', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } = producer
    expect(validateJoi(withoutContactDetails).valid).toBe(false)
    expect(validateAjv(withoutContactDetails).valid).toBe(false)
  })

  test('does not require fullAddress', () => {
    const { postcode } = producer.address
    const payload = {
      ...producer,
      address: { postcode }
    }
    expect(validateJoi(payload).valid).toBe(true)
    expect(validateAjv(payload).valid).toBe(true)
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
    expect(validateJoi(municipalProducer).valid).toBe(true)
    expect(validateAjv(municipalProducer).valid).toBe(true)
  })

  test('requires organisationName', () => {
    const { organisationName, ...withoutOrganisationName } = municipalProducer
    expect(validateJoi(withoutOrganisationName).valid).toBe(false)
    expect(validateAjv(withoutOrganisationName).valid).toBe(false)
  })

  test('does not require sicCode', () => {
    expect(validateJoi(municipalProducer).valid).toBe(true)
    expect(validateAjv(municipalProducer).valid).toBe(true)
  })

  test('requires at least one of emailAddress or phoneNumber', () => {
    const { emailAddress, phoneNumber, ...withoutContactDetails } =
      municipalProducer
    expect(validateJoi(withoutContactDetails).valid).toBe(false)
    expect(validateAjv(withoutContactDetails).valid).toBe(false)
  })
})

describe('wasteSource = Household', () => {
  const householdProducer = {
    wasteSource: 'Household',
    councilMovement: true
  }

  test('accepts a valid Household producer', () => {
    expect(validateJoi(householdProducer).valid).toBe(true)
    expect(validateAjv(householdProducer).valid).toBe(true)
  })

  test('rejects organisationName', () => {
    const payload = {
      ...householdProducer,
      organisationName: 'Acme'
    }
    expect(validateJoi(payload).valid).toBe(false)
    expect(validateAjv(payload).valid).toBe(false)
  })

  test('forbids authorisationNumber', () => {
    const payload = {
      ...householdProducer,
      authorisationNumber: 'EAS/P/123456'
    }
    expect(validateJoi(payload).valid).toBe(false)
    expect(validateAjv(payload).valid).toBe(false)
  })

  test('forbids an address', () => {
    const payload = {
      ...householdProducer,
      address: {
        fullAddress: '5 Elm Street, Test Town',
        postcode: 'TE2 4HH'
      }
    }
    expect(validateJoi(payload).valid).toBe(false)
    expect(validateAjv(payload).valid).toBe(false)
  })

  test('does not require emailAddress or phoneNumber, unlike Commercial and Municipal', () => {
    expect(validateJoi(householdProducer).valid).toBe(true)
    expect(validateAjv(householdProducer).valid).toBe(true)
  })
})
