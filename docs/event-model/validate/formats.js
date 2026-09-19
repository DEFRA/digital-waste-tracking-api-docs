// Custom ajv `format`s for event-model rules that don't reduce to a plain
// `pattern` — reusing docs/collections/data/validators.js's existing pure,
// Joi-independent, boolean-returning functions as-is (no rewrite).
//
// Registered here as each resource that needs one is ported — currently
// Producer's authorisationNumber/phoneNumber, carrier/broker-or-dealer's
// carrierRegistrationNumber, intended-treatment/actual-treatment's
// disposalOrRecoveryCode, and pops' popCode.
import {
  isValidAuthorisationNumber,
  isValidCarrierRegistrationNumber,
  isValidDisposalOrRecoveryCode,
  isValidPhoneNumber,
  isValidPopCode,
  isValidPostcode
} from '../../collections/data/validators.js'

export function registerFormats(ajv) {
  ajv.addFormat('authorisationNumber', {
    type: 'string',
    validate: isValidAuthorisationNumber
  })

  ajv.addFormat('carrierRegistrationNumber', {
    type: 'string',
    validate: isValidCarrierRegistrationNumber
  })

  ajv.addFormat('disposalOrRecoveryCode', {
    type: 'string',
    validate: isValidDisposalOrRecoveryCode
  })

  ajv.addFormat('phoneNumber', {
    type: 'string',
    validate: isValidPhoneNumber
  })

  ajv.addFormat('popCode', {
    type: 'string',
    validate: isValidPopCode
  })

  ajv.addFormat('postcode', {
    type: 'string',
    validate: isValidPostcode
  })

  return ajv
}
