/**
 * Joi validation schema for the Create Movement event.
 * POST /movements → 201 with movementId
 *
 * This documentation-side schema is aligned to the BA Creation spreadsheet and
 * to the Receipt event naming/style where applicable.
 *
 * Creation-specific rules reflected here:
 * - apiCode is required, as per Receipt.
 * - plannedCollectionTime (renamed from estimatedDateTimeCollected) follows the same DateTime naming style as dateTimeReceived.
 * - Root objects are producer, carrier, brokerOrDealer and receiver.
 * - Creation wasteItems extend the shared wasteItemBaseSchema (sharedSchemas.js, D-042): weight,
 *   numberOfContainers, typeOfContainers and physicalForm are top-level; classification (ewcCodes,
 *   wasteDescription, containsPops/pops, containsHazardous/hazardous) is nested. intendedTreatments
 *   (Treatment[], mandatory, min 1) is Creation's own addition on top of the shared base, carrying the
 *   Intended Treatment planned at Creation. The receiver confirms actualTreatments (Actual Treatment) at
 *   Receipt (D-031 amended). POST /receipts shares the same wasteItemBaseSchema; the ordinary Receipt
 *   endpoint (POST /deliveries/{deliveryId}/receipt) does not — its wasteItem drops classification (D-042).
 * - Municipal is an accepted wasteSource.
 * - producer.organisationName and producer.address are required for Commercial and Municipal, forbidden
 *   for Household; producer.authorisationNumber is optional for Commercial and Municipal.
 * - receiver is required only when the movement contains hazardous waste; receiver.siteName is mandatory
 *   whenever the receiver object is supplied, which makes authorisationNumber and address mandatory too.
 * - brokerOrDealer is optional, but registrationNumber is required whenever it is supplied (null/empty
 *   requires reasonForNoRegistrationNumber instead, mirroring carrier's mutual-exclusivity rule).
 * - carrier follows the Receipt carrier structure, but only carrier.meansOfTransport and
 *   carrier.organisationName are mandatory at Creation. Optional carrier fields still keep
 *   integrity rules when supplied: registrationNumber and reasonForNoRegistrationNumber are mutually
 *   exclusive; vehicleRegistration is only allowed for Road; otherMeansOfTransport is only allowed for Other.
 * - producer.councilMovement uses the BA spreadsheet name.
 * - collectionAddressDifferentFromProducer / collectionSite: planning-time fields for where the waste will
 *   be collected from, if not the producer's address. Distinct from the Collection event's own
 *   collectionSite, which records the actual collection.
 */

import Joi from 'joi'
import {
  isValidAuthorisationNumber,
  isHazardousEwcCode,
  isValidHazardousWasteConsignmentCode,
  isValidPhoneNumber
} from './validators.js'
import {
  MEANS_OF_TRANSPORT,
  REASONS_FOR_NO_REGISTRATION_NUMBER,
  NO_CONSIGNMENT_REASONS,
  businessAddressSchema,
  otherReferenceSchema,
  brokerSchema,
  carrierRegistrationNumberSchema,
  intendedTreatmentSchema,
  wasteItemBaseSchema,
  validateWithBooleanHelper,
  isProvided
} from './sharedSchemas.js'

// ---------------------------------------------------------------------------
// Business rules
// ---------------------------------------------------------------------------

const hasHazardousEwcCode = (movement) =>
  movement.wasteItems?.some((item) =>
    item.classification?.ewcCodes?.some((code) => isHazardousEwcCode(code))
  )

const validateCreationRules = (movement, helpers) => {
  const containsHazardousEwcCode = hasHazardousEwcCode(movement)
  const hasConsignmentCode = isProvided(movement.hazardousWasteConsignmentCode)
  const hasReasonForNoConsignmentCode = isProvided(movement.reasonForNoConsignmentCode)

  if (hasConsignmentCode && hasReasonForNoConsignmentCode) {
    return helpers.message(
      'reasonForNoConsignmentCode must not be provided when hazardousWasteConsignmentCode is present.'
    )
  }

  if (containsHazardousEwcCode && !hasConsignmentCode && !hasReasonForNoConsignmentCode) {
    return helpers.message(
      'reasonForNoConsignmentCode is required when the movement contains hazardous waste and no hazardousWasteConsignmentCode is provided.'
    )
  }

  if (containsHazardousEwcCode && !isProvided(movement.receiver)) {
    return helpers.message('receiver is required when the movement contains hazardous waste.')
  }

  return movement
}

// ---------------------------------------------------------------------------
// Waste item at creation (D-042: classification separated from logistics,
// shared with POST /receipts via wasteItemBaseSchema; does not affect the
// ordinary Receipt endpoint's wasteItem, which drops classification entirely).
// ---------------------------------------------------------------------------

const createWasteItemSchema = wasteItemBaseSchema.keys({
  intendedTreatments: Joi.array()
    .items(intendedTreatmentSchema)
    .min(1)
    .required()
    .description(
      'Intended Treatment (D-031 amended). Mandatory at Creation, min 1 — the treatment(s) planned for ' +
      'this waste item. The receiver confirms the authoritative Actual Treatment (actualTreatments) at Receipt. ' +
      'Each treatment entry must include both a valid disposalOrRecoveryCode and a weight.'
    )
}).description('Waste item declared as part of the created movement (D-042 Creation-specific shape).')

// ---------------------------------------------------------------------------
// Receiver at creation
// ---------------------------------------------------------------------------

const receiverAddressSchema = businessAddressSchema.keys({
  fullAddress: Joi.string()
    .required()
    .description('Full receiver site address.'),

  postcode: businessAddressSchema.extract('postcode')
    .required()
    .description('Receiver site postcode.')
}).description('Receiver site address. Required with fullAddress and postcode when receiver.siteName is populated.')

/**
 * Collection site address — same shape as Collection's own collectionSite.address
 * (both fullAddress and postcode required), reused here so Creation's planned
 * collection address matches what the Collection event itself records.
 */
const collectionSiteSchema = businessAddressSchema.keys({
  fullAddress: Joi.string()
    .required()
    .description('Full collection site address.'),

  postcode: businessAddressSchema.extract('postcode')
    .required()
    .description('Collection site postcode.')
}).description('Address where the waste is planned to be collected, when different from producer.address. Both fullAddress and postcode are required.')

const receiverSchema = Joi.object({
  siteName: Joi.string()
    .required()
    .description('Name of the intended receiving site. Required whenever the receiver object is supplied.'),

  authorisationNumber: Joi.when('siteName', {
    is: Joi.exist(),
    then: Joi.string()
      .custom(
        validateWithBooleanHelper(
          isValidAuthorisationNumber,
          'receiver.authorisationNumber must be in a valid UK format.'
        )
      )
      .required(),
    otherwise: Joi.string()
      .custom(
        validateWithBooleanHelper(
          isValidAuthorisationNumber,
          'receiver.authorisationNumber must be in a valid UK format.'
        )
      )
      .optional()
  }).description('Required when receiver.siteName is populated. Must be a valid site authorisation number.'),

  emailAddress: Joi.string()
    .email()
    .description('Receiver site contact email address.'),

  phoneNumber: Joi.string()
    .custom(
      validateWithBooleanHelper(
        isValidPhoneNumber,
        'receiver.phoneNumber must be a valid phone number.'
      )
    )
    .description('Receiver site contact phone number.'),

  address: Joi.when('siteName', {
    is: Joi.exist(),
    then: receiverAddressSchema.required(),
    otherwise: receiverAddressSchema.optional()
  }).description('Required when receiver.siteName is populated. Must include postcode and fullAddress.')
}).description(
  'Receiver details at Creation. Required only when the movement contains hazardous waste. ' +
  'siteName is mandatory whenever this object is supplied, which in turn makes authorisationNumber ' +
  'and address mandatory too (both are conditional on siteName being populated).'
)

// ---------------------------------------------------------------------------
// Producer
// ---------------------------------------------------------------------------

const SIC_CODE_REGEX = /^\d{5}$/

const producerSchema = Joi.object({
  wasteSource: Joi.string()
    .valid('Household', 'Commercial', 'Municipal')
    .required()
    .description('Whether the waste originates from household, commercial or municipal sources.'),

  organisationName: Joi.when('wasteSource', {
    is: 'Household',
    then: Joi.forbidden(),
    otherwise: Joi.string().required()
  }).description('Producer organisation name. Required for Commercial and Municipal waste; not applicable for Household.'),

  authorisationNumber: Joi.when('wasteSource', {
    is: 'Household',
    then: Joi.forbidden(),
    otherwise: Joi.string()
      .custom(
        validateWithBooleanHelper(
          isValidAuthorisationNumber,
          'producer.authorisationNumber must be in a valid UK format.'
        )
      )
      .optional()
  }).description('Producer environmental permit or exemption number. Optional for Commercial and Municipal, not applicable for Household.'),

  sicCode: Joi.when('wasteSource', {
    switch: [
      { is: 'Commercial', then: Joi.string().pattern(SIC_CODE_REGEX).required() },
      { is: 'Household', then: Joi.forbidden() }
    ],
    otherwise: Joi.string().pattern(SIC_CODE_REGEX).optional()
  }).description('Five-digit Standard Industrial Classification code. Required for Commercial, optional for Municipal, not applicable for Household.'),

  emailAddress: Joi.when('wasteSource', {
    is: 'Household',
    then: Joi.forbidden(),
    otherwise: Joi.string().email().optional()
  }).description('Producer contact email address. Not applicable for Household waste.'),

  phoneNumber: Joi.when('wasteSource', {
    is: 'Household',
    then: Joi.forbidden(),
    otherwise: Joi.string()
      .custom(
        validateWithBooleanHelper(
          isValidPhoneNumber,
          'producer.phoneNumber must be a valid phone number.'
        )
      )
      .optional()
  }).description('Producer contact phone number. Not applicable for Household waste.'),

  address: Joi.when('wasteSource', {
    is: 'Household',
    then: Joi.forbidden(),
    otherwise: businessAddressSchema.required()
  }).description('Producer site address. Required for Commercial and Municipal; not applicable for Household.'),

  councilMovement: Joi.boolean()
    .strict()
    .required()
    .description('Whether this movement is carried out by, or on behalf of, a council.')
}).description('Producer organisation details.')

// ---------------------------------------------------------------------------
// Carrier at creation
// ---------------------------------------------------------------------------

const creationCarrierSchema = Joi.object({
  meansOfTransport: Joi.string()
    .valid(...MEANS_OF_TRANSPORT)
    .required()
    .description('Only mandatory carrier field at Creation. Use exact case.'),

  registrationNumber: carrierRegistrationNumberSchema
    .optional()
    .description(
      'Optional at Creation. If provided, must be in a valid carrier registration number format. ' +
      'Must not be supplied together with carrier.reasonForNoRegistrationNumber.'
    ),

  reasonForNoRegistrationNumber: Joi.string()
    .valid(...REASONS_FOR_NO_REGISTRATION_NUMBER)
    .empty('')
    .empty(null)
    .when('registrationNumber', {
      not: Joi.valid(null, '').optional(),
      then: Joi.forbidden(),
      otherwise: Joi.optional()
    })
    .description(
      'Optional at Creation when carrier.registrationNumber is not supplied, null, or empty. ' +
      'Must not be supplied when a valid registrationNumber is provided.'
    ),

  organisationName: Joi.string()
    .required()
    .description('Carrier organisation name. Required at Creation.'),

  vehicleRegistration: Joi.when('meansOfTransport', {
    is: 'Road',
    then: Joi.string().max(10).optional(),
    otherwise: Joi.forbidden()
  }).description(
    "Optional at Creation when meansOfTransport is 'Road'. " +
    'Must not be provided when meansOfTransport is any other value.'
  ),

  otherMeansOfTransport: Joi.when('meansOfTransport', {
    is: 'Other',
    then: Joi.string().optional(),
    otherwise: Joi.forbidden()
  }).description(
    "Optional description when meansOfTransport is 'Other'. " +
    'Must not be provided for any other transport method.'
  ),

  emailAddress: Joi.string()
    .email()
    .optional()
    .description('Carrier contact email address. Optional at Creation.'),

  phoneNumber: Joi.string()
    .custom(
      validateWithBooleanHelper(
        isValidPhoneNumber,
        'carrier.phoneNumber must be a valid UK or international phone number.'
      )
    )
    .optional()
    .description('Carrier contact phone number. Optional at Creation.'),

  address: businessAddressSchema
    .optional()
    .description('Carrier business address. Optional at Creation.')
})
  .description(
    'Carrier details at Creation. Same field structure as Receipt carrier, with meansOfTransport and ' +
    'organisationName mandatory. Optional fields retain integrity rules when supplied.'
  )

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export const createMovementSchema = Joi.object({
  apiCode: Joi.string()
    .uuid()
    .required()
    .description('Unique identifier of the submitting organisation produced by the Waste Tracking Service registration process.'),

  plannedCollectionTime: Joi.date()
    .iso()
    .required()
    .description('Planned date and time the waste will be collected. Actual time is recorded by the Collection event and may differ.'),

  hazardousWasteConsignmentCode: Joi.string()
    .empty('')
    .empty(null)
    .custom(
      validateWithBooleanHelper(
        isValidHazardousWasteConsignmentCode,
        'hazardousWasteConsignmentCode must match one of the accepted region-specific consignment code formats.'
      )
    )
    .description('Required when any waste item carries a hazardous EWC code. Must not be provided alongside reasonForNoConsignmentCode.'),

  reasonForNoConsignmentCode: Joi.string()
    .valid(...NO_CONSIGNMENT_REASONS)
    .empty('')
    .empty(null)
    .description('Required when waste is hazardous and no hazardousWasteConsignmentCode is provided. Must not be provided alongside hazardousWasteConsignmentCode.'),

  yourUniqueReference: Joi.string()
    .description("Caller's own reference — no format rules enforced."),

  otherReferencesForMovement: Joi.array()
    .items(otherReferenceSchema)
    .description('Additional label/reference pairs for this movement.'),

  specialHandlingRequirements: Joi.string()
    .max(5000)
    .description('Special handling instructions, e.g. fragile, hazardous, temperature-sensitive or other operational notes.'),

  isDeleted: Joi.boolean()
    .strict()
    .default(false)
    .description(
      'Soft-delete flag (D-009). Defaults to false on creation. ' +
      'May be set to true only via PUT to soft-delete the movement, subject to downstream constraints. ' +
      'Supplying true on a POST is not permitted — the service layer returns a validation warning and treats the value as false.'
    ),

  producer: producerSchema
    .required(),

  carrier: creationCarrierSchema
    .required()
    .description('Carrier details. Required object at Creation, using the Receipt carrier field structure with meansOfTransport as the only mandatory carrier field.'),

  brokerOrDealer: brokerSchema
    .optional()
    .description('Optional broker/dealer details.'),

  receiver: receiverSchema
    .optional(),

  collectionAddressDifferentFromProducer: Joi.boolean()
    .strict()
    .default(false)
    .description(
      'Whether the waste will be collected from an address other than producer.address. ' +
      'Defaults to false — false or absent means collection is planned at the producer address. ' +
      'When true, collectionSite is required.'
    ),

  collectionSite: Joi.when('collectionAddressDifferentFromProducer', {
    is: true,
    then: collectionSiteSchema.required(),
    otherwise: Joi.forbidden()
  }).description(
    'Address where the waste is planned to be collected. Required when ' +
    'collectionAddressDifferentFromProducer is true; must not be provided otherwise.'
  ),

  wasteItems: Joi.array()
    .items(createWasteItemSchema)
    .min(1)
    .required()
    .description('At least one waste item is required. Creation uses its own waste item shape with a nested classification object (D-042).')
})
  .custom(validateCreationRules, 'creation movement business rules')
  .description('Create Movement request payload. POST /movements → 201 with movementId.')

// Alias retained for projects that currently import creationJoi.
export const creationJoi = createMovementSchema

export default createMovementSchema
