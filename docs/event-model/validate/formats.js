// Custom ajv `format`s for event-model rules that don't reduce to a plain
// `pattern` — reusing docs/collections/data/validators.js's existing pure,
// Joi-independent, boolean-returning functions as-is (no rewrite). See
// docs/plans/20260908-event-model-json-schema.md's "Runtime validation"
// section for the rationale.
//
// Registered here as each resource that needs one is ported — currently just
// Producer's authorisationNumber/phoneNumber. Add more as later resources
// (carrier, hazardous, receipt waste-item, …) are wired up.
import {
  isValidAuthorisationNumber,
  isValidPhoneNumber
} from '../../collections/data/validators.js'

export function registerFormats(ajv) {
  ajv.addFormat('authorisationNumber', {
    type: 'string',
    validate: isValidAuthorisationNumber
  })

  ajv.addFormat('phoneNumber', {
    type: 'string',
    validate: isValidPhoneNumber
  })

  return ajv
}
