import Joi from 'joi'

/**
 * Joi schema for the "receipt without a prior delivery" endpoint (D-041).
 * POST /receipts
 *
 * D-041 (decisions.md#d-041) decides the endpoint and the mandatory
 * reasonForNoDeliveryId field. D-042 (decisions.md#d-042) resolves D-041's
 * open question 4: this is the same shape as receiptMovementSchema
 * (POST /deliveries/{deliveryId}/receipt, receiptJoi.js), except wasteItems
 * uses the full wasteItemBaseSchema-derived shape instead of the light one —
 * this endpoint has no prior Creation/Delivery to source classification
 * from, unlike the ordinary Receipt endpoint. Both are decided, not
 * speculative.
 *
 * This schema no longer extends receiptMovementSchema by .keys() — that
 * schema's wasteItems is the light, classification-free shape (D-042), which
 * is wrong for this endpoint. Built independently instead: wasteItems from
 * the shared wasteItemBaseSchema/actualTreatmentSchema; carrier/brokerOrDealer
 * from the shared carrierSchema/brokerSchema (same as receiptJoi.js, D-042);
 * the remaining root fields (otherReferenceSchema, receiptAddressSchema,
 * receiptSiteSchema, receiverSiteSchema, the consignment-code mutual-
 * exclusivity rule) are duplicated from receiptJoi.js rather than imported,
 * since that file doesn't currently export them — matching receiptJoi.js's
 * own historical self-contained-file convention for Receipt-specific pieces.
 */
import {
  UK_POSTCODE_REGEX,
  isValidPhoneNumber,
  isValidAuthorisationNumber,
  isValidHazardousWasteConsignmentCode
} from './validators.js'
import {
  carrierSchema,
  brokerSchema,
  wasteItemBaseSchema,
  actualTreatmentSchema
} from './sharedSchemas.js'

const NO_CONSIGNMENT_REASONS = [
  'NON_HAZ_WASTE_TRANSFER',
  'NO_DOC_WITH_WASTE',
  'HWRC_RECEIPT'
]

const validateWithBooleanHelper = (predicate, message) => (value, helpers) => {
  if (!predicate(value)) {
    return helpers.message(message)
  }

  return value
}

const isProvided = (value) =>
  value !== undefined && value !== null && value !== ''

/**
 * Same mutual-exclusivity rule as receiptJoi.js's validateReceiptConsignmentRules
 * (D-042 note there applies here too — wasteItems carries full classification
 * on this endpoint, but the "required when hazardous" half of the rule still
 * can't be checked from the request body alone without cross-referencing
 * reference data, so only the mutual-exclusivity half is checkable here).
 */
const validateConsignmentRules = (movement, helpers) => {
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

const otherReferenceSchema = Joi.object({
  reference: Joi.string()
    .min(1)
    .required()
    .description(
      'Both label and reference must be provided together as a pair.'
    ),

  label: Joi.string()
    .min(1)
    .required()
    .description(
      'Array of label/reference pairs. If the object is included, both label and reference are required together.'
    )
}).description('Additional movement reference label/reference pair.')

const receiptAddressSchema = Joi.object({
  postcode: Joi.string()
    .pattern(UK_POSTCODE_REGEX)
    .required()
    .description(
      'Unlike carrier and broker addresses, the receipt address accepts UK postcodes only. Must be in valid UK postcode format.'
    ),

  fullAddress: Joi.string()
    .required()
    .description('The address where the waste is physically received.')
}).description('Address where the waste is physically received.')

const receiptSiteSchema = Joi.object({
  address: receiptAddressSchema
    .required()
    .description('Address where the waste is physically received.')
}).description('Physical receipt site details.')

const receiverSiteSchema = Joi.object({
  siteName: Joi.string()
    .required()
    .description('Name of the site receiving the waste.'),

  regulatoryPositionStatements: Joi.array()
    .items(Joi.number().strict().integer().positive())
    .description(
      'RPS numbers where the regulator does not require a permit for certain activities. Each must be a positive integer.'
    ),

  phoneNumber: Joi.string()
    .custom(
      validateWithBooleanHelper(
        isValidPhoneNumber,
        'receiverSite.phoneNumber must be a valid UK or Irish phone number.'
      )
    )
    .description('Phone number of the receiving organisation.'),

  emailAddress: Joi.string()
    .email()
    .description('Email address of the receiving organisation.'),

  authorisationNumber: Joi.string()
    .strict()
    .custom(
      validateWithBooleanHelper(
        isValidAuthorisationNumber,
        'Site authorisation number must be in a valid UK format.'
      )
    )
    .required()
    .description(
      "One authorisation number per receipt. Must match a valid UK format pattern. Invalid format returns: 'Site authorisation number must be in a valid UK format'."
    )
}).description('Receiving organisation and site details.')

/**
 * Waste item for this endpoint (D-042) — extends the shared wasteItemBaseSchema
 * (classification + logistics fields), unlike the ordinary Receipt endpoint's
 * light wasteItem, since there is no prior Creation record to source
 * classification from.
 */
const receiptWithoutDeliveryWasteItemSchema = wasteItemBaseSchema
  .keys({
    actualTreatments: Joi.array()
      .items(actualTreatmentSchema)
      .description(
        "Actual Treatment (D-031 amended, D-042). Optional. Each entry's disposalOrRecoveryCode is itself " +
          'optional — a receiving site may need to inspect or weigh before confirming the code. Omitting it ' +
          'produces a warning, not a rejection; weight is required only when the code is supplied.'
      )
  })
  .description(
    'Waste item received as part of a no-prior-delivery receipt (D-042 — full classification carried, unlike the ordinary Receipt endpoint).'
  )

export const receiptWithoutDeliverySchema = Joi.object({
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
    .items(receiptWithoutDeliveryWasteItemSchema)
    .min(1)
    .required()
    .description(
      'At least one waste item is required. Carries full classification (D-042) — this endpoint has no prior Creation record to source it from.'
    ),

  receiverSite: receiverSiteSchema.required(),

  receipt: receiptSiteSchema.required(),

  carrier: carrierSchema.required(),

  brokerOrDealer: brokerSchema.optional(),

  reasonForNoDeliveryId: Joi.string()
    .min(1)
    .required()
    .description(
      'Mandatory explanation of why there is no prior Movement/Collection/Delivery trail for this receipt (D-041).'
    )
})
  .custom(
    validateConsignmentRules,
    'receipt-without-delivery consignment business rules'
  )
  .description('Receipt-without-a-prior-delivery payload (D-041, D-042).')

export default receiptWithoutDeliverySchema
