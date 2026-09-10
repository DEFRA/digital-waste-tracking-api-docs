import Joi from 'joi'

/**
 * Single-file Receipt Joi schema.
 * POST /deliveries/{deliveryId}/receipt
 *
 * deliveryId is a path parameter and is not included in this request body schema.
 * This file validates only the receipt details recorded by the receiver.
 *
 * This file keeps the Receipt schema, nested schemas, allowed values and field descriptions together.
 * Replace the import path below with the location of your existing shared validators/reference-data helpers.
 *
 * Shared sub-schemas (weight, address, references, POPs, hazardous, carrier, broker/dealer, etc.)
 * are imported from sharedSchemas.js, like the other three event files. Only genuinely
 * Receipt-specific shapes — wasteItem, receiver, the receipt site/address, and the
 * disposal/recovery code entry — are defined locally here, and exported for testing.
 */
import {
  UK_POSTCODE_REGEX,
  isValidAuthorisationNumber,
  isValidContainerType,
  isValidDisposalOrRecoveryCode,
  isValidEwcCode,
  isHazardousEwcCode,
  isValidHazardousWasteConsignmentCode,
  isValidPhoneNumber
} from './validators.js'
import {
  PHYSICAL_FORMS,
  NO_CONSIGNMENT_REASONS,
  weightSchema,
  otherReferenceSchema,
  popsSchema,
  hazardousSchema,
  carrierSchema,
  brokerSchema,
  validateWithBooleanHelper,
  isProvided
} from './sharedSchemas.js'

const validateReceiptConsignmentRules = (movement, helpers) => {
  const hasHazardousEwcCode = movement.wasteItems?.some((wasteItem) =>
    wasteItem.ewcCodes?.some((ewcCode) => isHazardousEwcCode(ewcCode))
  )

  const hasConsignmentCode = isProvided(movement.hazardousWasteConsignmentCode)
  const hasReasonForNoConsignmentCode = isProvided(movement.reasonForNoConsignmentCode)

  if (hasConsignmentCode && hasReasonForNoConsignmentCode) {
    return helpers.message(
      'reasonForNoConsignmentCode must not be provided when hazardousWasteConsignmentCode is present.'
    )
  }

  if (hasHazardousEwcCode && !hasConsignmentCode && !hasReasonForNoConsignmentCode) {
    return helpers.message(
      'reasonForNoConsignmentCode is required when the movement contains hazardous waste and no hazardousWasteConsignmentCode is provided.'
    )
  }

  return movement
}

export const receiptAddressSchema = Joi.object({
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

export const disposalOrRecoveryCodeSchema = Joi.object({
  weight: weightSchema
    .required()
    .description(
      'Represents the weight of waste being disposed of or recovered for final treatment under this specific code.'
    ),

  code: Joi.string()
    .required()
    .custom(
      validateWithBooleanHelper(
        isValidDisposalOrRecoveryCode,
        'disposalOrRecoveryCode.code must be a valid disposal or recovery code.'
      )
    )
    .description(
      'Must be a valid code from GET /reference-data/disposal-or-recovery-codes.'
    )
}).description(
  'Each disposal or recovery code entry must include both a valid code and a weight.'
)

export const wasteItemSchema = Joi.object({
  weight: weightSchema
    .required()
    .description('Total weight of the waste item received.'),

  wasteDescription: Joi.string()
    .required()
    .description('Detailed description of the specific waste material.'),

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

  physicalForm: Joi.string()
    .valid(...PHYSICAL_FORMS)
    .required()
    .description(
      'Must be exactly one of the six permitted values. Case-sensitive; use exact case shown.'
    ),

  numberOfContainers: Joi.number()
    .strict()
    .integer()
    .min(0)
    .required()
    .description(
      'Must be 0 or greater. Represents the number of containers for storing, transporting, or disposing of the waste.'
    ),

  ewcCodes: Joi.array()
    .items(
      Joi.string().custom(
        validateWithBooleanHelper(
          isValidEwcCode,
          'ewcCodes must contain valid EWC codes from the official reference list.'
        )
      )
    )
    .min(1)
    .max(5)
    .required()
    .description(
      'Must be valid codes from the official EWC catalogue. Use GET /reference-data/ewc-codes for the full reference list. POPs can exist in both hazardous and non-hazardous waste.'
    ),

  disposalOrRecoveryCodes: Joi.array()
    .items(disposalOrRecoveryCodeSchema)
    .description(
      'Actual Treatment (D-031). The confirmed treatment, as determined by the receiver — ' +
      'the authoritative treatment outcome. Optional, unchanged from Phase 1. ' +
      'Each disposal or recovery code entry must include both a valid code and a weight.'
    ),

  containsPops: Joi.boolean()
    .strict()
    .required()
    .description(
      'Flags whether the waste contains Persistent Organic Pollutants. Drives conditionality of the entire pops sub-object.'
    ),

  pops: Joi.when('containsPops', {
    is: true,
    then: popsSchema.required(),
    otherwise: Joi.forbidden()
  }).description(
    'Required when containsPops is true. Must not be provided when containsPops is false.'
  ),

  containsHazardous: Joi.boolean()
    .strict()
    .required()
    .description(
      'Flags whether the waste contains hazardous properties. Drives conditionality of the entire hazardous sub-object.'
    ),

  hazardous: Joi.when('containsHazardous', {
    is: true,
    then: hazardousSchema.required(),
    otherwise: Joi.forbidden()
  }).description(
    'Required when containsHazardous is true. Must not be provided when containsHazardous is false.'
  )
}).description('Waste item received as part of the receipt movement.')

export const receiverSchema = Joi.object({
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
        'receiver.phoneNumber must be a valid UK or Irish phone number.'
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

export const receiptSiteSchema = Joi.object({
  address: receiptAddressSchema
    .required()
    .description('Address where the waste is physically received.')
}).description('Physical receipt site details.')

export const receiptMovementSchema = Joi.object({
  yourUniqueReference: Joi.string()
    .description(
      "No specific business rules. For operator's own reference purposes."
    ),

  specialHandlingRequirements: Joi.string()
    .max(5000)
    .description(
      'Required for abnormal hazardous waste or non-hazardous waste with harmful chemical, biological or physical characteristics.'
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
    .items(wasteItemSchema)
    .min(1)
    .required()
    .description('At least one waste item is required.'),

  receiver: receiverSchema.required(),

  receipt: receiptSiteSchema.required(),

  carrier: carrierSchema.required(),

  brokerOrDealer: brokerSchema.optional()
})
  .custom(validateReceiptConsignmentRules, 'receipt movement consignment business rules')
  .description('Receipt movement event payload.')

// Alias retained for projects that currently import receiptJoi.
export const receiptJoi = receiptMovementSchema

export default receiptMovementSchema
