import Joi from 'joi'

/**
 * Single-file Receipt Joi schema.
 * POST /deliveries/{deliveryId}/receipt
 *
 * deliveryId is a path parameter and is not included in this request body schema.
 * This file validates only the receipt details recorded by the receiver.
 *
 * This file keeps the Receipt schema, nested schemas, allowed values and field descriptions together.
 * Shared sub-schemas (weight, other-reference, carrier, broker/dealer, treatments, receiverSite, etc.)
 * are imported from sharedSchemas.js, like the other three event files. Only genuinely Receipt-specific
 * shapes — receiptWasteItem — are defined locally here, and exported for testing
 * (see test/event-model/schema/receipt/).
 *
 * carrier and brokerOrDealer use the shared carrierSchema/brokerSchema (sharedSchemas.js) rather than
 * local duplicates, so this endpoint picks up the same registrationNumber/reasonForNoRegistrationNumber
 * rules and reduced ON_SITE/ONE_OFF/MARINE enum as Creation and Collection.
 *
 * wasteItems drops classification entirely (D-042) — a prior Creation record already carries ewcCodes,
 * wasteDescription, pops and hazardous detail; only weight/physicalForm/typeOfContainers/
 * numberOfContainers plus actualTreatments (renamed from disposalOrRecoveryCodes, D-031 amended)
 * remain. POST /receipts (the no-prior-delivery endpoint, D-041/D-042) keeps the full classification,
 * since it has no Creation record to source it from.
 *
 * receiverSite (renamed from receiver, pure rename — no shape change) is the receiving organisation
 * and site details, shared with receiptWithoutDeliveryJoi.js (sharedSchemas.js) since the two event
 * files' copies were confirmed byte-identical. Its address (physical receipt site, formerly the
 * separate receiptSite object) is merged directly onto it, built from the shared addressSchema via
 * requiredFullAddressSchema.
 */
import {
  isValidContainerType,
  isValidHazardousWasteConsignmentCode
} from './validators.js'
import {
  PHYSICAL_FORMS,
  NO_CONSIGNMENT_REASONS,
  weightSchema,
  otherReferenceSchema,
  carrierSchema,
  brokerSchema,
  actualTreatmentSchema,
  receiverSiteSchema,
  validateWithBooleanHelper,
  isProvided
} from './sharedSchemas.js'

/**
 * D-042 note: wasteItems on this endpoint no longer carry ewcCodes (classification
 * is dropped — a prior Creation record already has it), so "reasonForNoConsignmentCode
 * required when hazardous" can no longer be checked from the request body alone.
 * That half of the rule is now enforced server-side against the linked Movement's
 * classification. Only the mutual-exclusivity half is checkable here.
 */
const validateReceiptConsignmentRules = (movement, helpers) => {
  const hasConsignmentCode = isProvided(movement.hazardousWasteConsignmentCode)
  const hasReasonForNoConsignmentCode = isProvided(
    movement.reasonForNoConsignmentCode
  )

  if (hasConsignmentCode && hasReasonForNoConsignmentCode) {
    return helpers.message(
      'reasonForNoConsignmentCode must not be provided when hazardousWasteConsignmentCode is present.'
    )
  }

  return movement
}

/**
 * Waste item received (D-042) — classification dropped entirely; a prior
 * Creation record already carries ewcCodes, wasteDescription, pops and
 * hazardous detail. Only the logistics fields plus actualTreatments remain.
 */
// Exported for testing (see test/event-model/schema/receipt/).
export const receiptWasteItemSchema = Joi.object({
  weight: weightSchema
    .required()
    .description('Total weight of the waste item received.'),

  physicalForm: Joi.string()
    .valid(...PHYSICAL_FORMS)
    .required()
    .description(
      'Must be exactly one of the six permitted values. Case-sensitive; use exact case shown.'
    ),

  typeOfContainers: Joi.string()
    .required()
    .custom(
      validateWithBooleanHelper(
        isValidContainerType,
        'typeOfContainers must match a valid container type code from reference data.'
      )
    )
    .description(
      'Must match a valid code from GET /reference-data/container-types. Use exact case returned by the GET method.'
    ),

  numberOfContainers: Joi.number()
    .strict()
    .integer()
    .min(0)
    .required()
    .description(
      'Must be 0 or greater. Represents the number of containers for storing, transporting, or disposing of the waste.'
    ),

  actualTreatments: Joi.array()
    .items(actualTreatmentSchema)
    .description(
      "Actual Treatment (D-031 amended, D-042). Optional. Each entry's disposalOrRecoveryCode is itself " +
        'optional — a receiving site may need to inspect or weigh before confirming the code. Omitting it ' +
        'produces a warning, not a rejection; weight is required only when the code is supplied.'
    )
}).description(
  'Waste item received as part of the receipt movement (D-042 — classification dropped).'
)

// carrier and brokerOrDealer use the shared carrierSchema/brokerSchema (sharedSchemas.js)
// rather than local duplicates, so this endpoint picks up the same
// registrationNumber/reasonForNoRegistrationNumber rules and reduced
// ON_SITE/ONE_OFF/MARINE enum as Creation and Collection. receiverSiteSchema
// (also sharedSchemas.js) is shared with receiptWithoutDeliveryJoi.js — the
// two event files' copies were confirmed byte-identical before merging.

export const receiptMovementSchema = Joi.object({
  yourUniqueReference: Joi.string().description(
    "No specific business rules. For operator's own reference purposes."
  ),

  otherReferencesForMovement: Joi.array()
    .items(otherReferenceSchema)
    .description(
      'Optional array of label/reference pairs. If an object is included, both label and reference are required together.'
    ),

  hazardousWasteConsignmentCode: Joi.string()
    .empty('')
    .empty(null)
    .custom(
      validateWithBooleanHelper(
        isValidHazardousWasteConsignmentCode,
        'hazardousWasteConsignmentCode must match one of the accepted region-specific consignment code formats.'
      )
    )
    .description(
      'Mandatory if any EWC code in the movement is hazardous. Must match any of the region-specific formats exactly. Not required if all EWC codes are non-hazardous.'
    ),

  reasonForNoConsignmentCode: Joi.string()
    .valid(...NO_CONSIGNMENT_REASONS)
    .empty('')
    .empty(null)
    .description(
      'Required if waste is hazardous and no hazardousWasteConsignmentCode is provided. Must not be provided if a consignment code is present. The two fields are mutually exclusive.'
    ),

  dateTimeReceived: Joi.date()
    .iso()
    .required()
    .description(
      'Date and exact time waste was received at site. UTC is the global standard; BST is UTC+1 from late March to late October. Both formats accepted.'
    ),

  apiCode: Joi.string()
    .uuid()
    .required()
    .description(
      'Unique identifier of the receiving organisation produced by the Waste Tracking Service registration process.'
    ),

  wasteItems: Joi.array()
    .items(receiptWasteItemSchema)
    .min(1)
    .required()
    .description('At least one waste item is required.'),

  receiverSite: receiverSiteSchema.required(),

  carrier: carrierSchema.required(),

  brokerOrDealer: brokerSchema.optional()
})
  .custom(
    validateReceiptConsignmentRules,
    'receipt movement consignment business rules'
  )
  .description('Receipt movement event payload.')

// Alias retained for projects that currently import receiptJoi.
export const receiptJoi = receiptMovementSchema

export default receiptMovementSchema
