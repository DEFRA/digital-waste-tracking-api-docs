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

// ---------------------------------------------------------------------------
// Structured after the "Producer payload validation for the create endpoint"
// Gherkin feature — one describe per Scenario, test names following the
// When/Then wording. Coverage that isn't called out by that feature file is
// kept below under "Additional coverage", so nothing from the previous
// wasteSource-grouped version of this file is lost.
// ---------------------------------------------------------------------------
describe('Feature: Producer payload validation for the create endpoint', () => {
  const commercialProducer = {
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

  const municipalProducer = {
    wasteSource: 'Municipal',
    organisationName: 'Test Council',
    reasonForNoAuthorisationNumber: 'TBC',
    address: {
      fullAddress: 'Council Depot, Test City',
      postcode: 'TE1 5CD'
    },
    emailAddress: 'waste.services@example.gov.uk',
    phoneNumber: '01234567890',
    councilMovement: true
  }

  const householdProducer = {
    wasteSource: 'Household',
    councilMovement: true
  }

  describe('Scenario: Household producer is submitted correctly', () => {
    test('the Movement is created successfully when only wasteSource and councilMovement are provided', () => {
      expect(validateJoi(householdProducer).valid).toBe(true)
      expect(validateAjv(householdProducer).valid).toBe(true)
    })
  })

  describe('Scenario: Household producer includes a forbidden field', () => {
    test.each([
      ['organisationName', 'Acme'],
      ['authorisationNumber', 'EAS/P/123456'],
      ['reasonForNoAuthorisationNumber', 'TBC'],
      ['sicCode', '38110'],
      ['emailAddress', 'producer@example.com'],
      ['phoneNumber', '01234567890'],
      [
        'address',
        { fullAddress: '5 Elm Street, Test Town', postcode: 'TE2 4HH' }
      ]
    ])('the payload is rejected when %s is also provided', (field, value) => {
      const payload = { ...householdProducer, [field]: value }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: Commercial producer is missing a required field', () => {
    test.each(['organisationName', 'sicCode', 'address'])(
      'the payload is rejected when %s is missing',
      (field) => {
        const { [field]: excluded, ...payload } = commercialProducer
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: Municipal producer is missing a required field', () => {
    test.each(['organisationName', 'address'])(
      'the payload is rejected when %s is missing',
      (field) => {
        const { [field]: excluded, ...payload } = municipalProducer
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: Commercial or Municipal producer provides neither contact method', () => {
    test.each(['Commercial', 'Municipal'])(
      'the payload is rejected for a %s producer when neither emailAddress nor phoneNumber is provided',
      (wasteSource) => {
        const base =
          wasteSource === 'Commercial' ? commercialProducer : municipalProducer
        const { emailAddress, phoneNumber, ...payload } = base
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: Commercial or Municipal producer provides neither authorisationNumber nor a reason', () => {
    test.each(['Commercial', 'Municipal'])(
      'the payload is rejected for a %s producer when neither authorisationNumber nor reasonForNoAuthorisationNumber is provided',
      (wasteSource) => {
        const base =
          wasteSource === 'Commercial' ? commercialProducer : municipalProducer
        const {
          authorisationNumber,
          reasonForNoAuthorisationNumber,
          ...payload
        } = base
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: Commercial or Municipal producer provides both authorisationNumber and a reason', () => {
    test.each(['Commercial', 'Municipal'])(
      'the payload is rejected for a %s producer when both authorisationNumber and reasonForNoAuthorisationNumber are provided',
      (wasteSource) => {
        const base =
          wasteSource === 'Commercial' ? commercialProducer : municipalProducer
        const payload = {
          ...base,
          authorisationNumber: 'EAS/P/123456',
          reasonForNoAuthorisationNumber: 'TBC'
        }
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  describe('Scenario: Producer address postcode is malformed', () => {
    const payload = {
      ...commercialProducer,
      address: { ...commercialProducer.address, postcode: 'NOTAPOSTCODE' }
    }

    test('the payload is rejected', () => {
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })
  })

  describe('Scenario: sicCode is not five digits', () => {
    test.each(['Commercial', 'Municipal'])(
      'the payload is rejected for a %s producer with a malformed sicCode',
      (wasteSource) => {
        const base =
          wasteSource === 'Commercial' ? commercialProducer : municipalProducer
        const payload = { ...base, sicCode: '123' }
        expect(validateJoi(payload).valid).toBe(false)
        expect(validateAjv(payload).valid).toBe(false)
      }
    )
  })

  // -------------------------------------------------------------------------
  // Coverage below isn't called out by any scenario in the feature file
  // above, but existed in the previous version of this test file — kept so
  // nothing is lost in the rewrite.
  // -------------------------------------------------------------------------
  describe('Additional coverage: Commercial producer', () => {
    test('accepts a valid Commercial producer', () => {
      expect(validateJoi(commercialProducer).valid).toBe(true)
      expect(validateAjv(commercialProducer).valid).toBe(true)
    })

    test('rejects wasteSource given in lower/upper mismatched case', () => {
      const payload = { ...commercialProducer, wasteSource: 'COMMERCIAL' }
      expect(validateJoi(payload).valid).toBe(false)
      expect(validateAjv(payload).valid).toBe(false)
    })

    test('accepts reasonForNoAuthorisationNumber instead of authorisationNumber', () => {
      const { authorisationNumber, ...payload } = commercialProducer
      const withReason = {
        ...payload,
        reasonForNoAuthorisationNumber: 'TBC'
      }
      expect(validateJoi(withReason).valid).toBe(true)
      expect(validateAjv(withReason).valid).toBe(true)
    })

    test('accepts emailAddress only', () => {
      const { phoneNumber, ...payload } = commercialProducer
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('accepts phoneNumber only', () => {
      const { emailAddress, ...payload } = commercialProducer
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })

    test('does not require fullAddress', () => {
      const { postcode } = commercialProducer.address
      const payload = { ...commercialProducer, address: { postcode } }
      expect(validateJoi(payload).valid).toBe(true)
      expect(validateAjv(payload).valid).toBe(true)
    })
  })

  describe('Additional coverage: Municipal producer', () => {
    test('accepts a valid Municipal producer', () => {
      expect(validateJoi(municipalProducer).valid).toBe(true)
      expect(validateAjv(municipalProducer).valid).toBe(true)
    })

    test('does not require sicCode', () => {
      expect(validateJoi(municipalProducer).valid).toBe(true)
      expect(validateAjv(municipalProducer).valid).toBe(true)
    })

    test('accepts authorisationNumber instead of reasonForNoAuthorisationNumber', () => {
      const { reasonForNoAuthorisationNumber, ...payload } = municipalProducer
      const withAuthorisationNumber = {
        ...payload,
        authorisationNumber: 'EAS/P/123456'
      }
      expect(validateJoi(withAuthorisationNumber).valid).toBe(true)
      expect(validateAjv(withAuthorisationNumber).valid).toBe(true)
    })
  })
})
