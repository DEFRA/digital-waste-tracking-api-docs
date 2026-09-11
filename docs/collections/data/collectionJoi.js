/**
 * Joi validation schema for the Record Collection event.
 * POST /movements/{movementId}/collection → 201 (validation envelope only)
 *
 * The movementId is validated as a path parameter by the route — not
 * included in this request body schema.
 *
 * Key behaviours (DWTC-153):
 * - apiCode is mandatory, matching the registered submitting organisation.
 * - actualDateTimeCollected must be the actual collection time, not submission time.
 * - collectionType is optional; defaults to STATIC. TRANSIT records a driver-to-driver handover (D-029).
 * - receivedFromCarrier is required when collectionType is TRANSIT; forbidden when STATIC. Enforced server-side.
 * - carrier is mandatory at collection time.
 * - dutyOfCareConfirmed is mandatory — carrier confirms they have inspected the waste, that it is as
 *   described, and that they are content to transport it.
 * - collectionSite (renamed from collection) is mandatory. collectionSite.address is mandatory and
 *   contains postcode and fullAddress; collectionSite.emailAddress and .phoneNumber are optional.
 * - brokerOrDealer reuses the shared brokerSchema from sharedSchemas.js — same shape as Creation and
 *   Receipt, including registrationNumber (required whenever brokerOrDealer is supplied) and
 *   reasonForNoRegistrationNumber.
 */

import Joi from 'joi'
import { isValidPhoneNumber } from './validators.js'
import {
  siteAddressSchema,
  otherReferenceSchema,
  carrierSchema,
  brokerSchema,
  validateWithBooleanHelper
} from './sharedSchemas.js'

// ---------------------------------------------------------------------------
// Collection site
// ---------------------------------------------------------------------------

// Exported for testing (see test/event-model/schema/collection/). Alias of the
// shared siteAddressSchema (sharedSchemas.js) — kept under this name since
// existing tests/consumers import it as collectionAddressSchema.
export const collectionAddressSchema = siteAddressSchema
  .required()
  .description(
    'Collection address. Both postcode and fullAddress are required.'
  )

export const collectionSiteSchema = Joi.object({
  address: collectionAddressSchema
    .required()
    .description('Address where the waste was physically collected.'),

  emailAddress: Joi.string()
    .email()
    .description(
      'Email address of the site where the waste was physically collected.'
    ),

  phoneNumber: Joi.string()
    .custom(
      validateWithBooleanHelper(
        isValidPhoneNumber,
        'collectionSite.phoneNumber must be a valid UK or international phone number.'
      )
    )
    .description(
      'Phone number of the site where the waste was physically collected.'
    )
})
  .required()
  .description('Collection site details.')

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export const recordCollectionSchema = Joi.object({
  apiCode: Joi.string()
    .uuid()
    .required()
    .description(
      'Unique identifier of the submitting organisation produced by the Waste Tracking Service registration process.'
    ),

  actualDateTimeCollected: Joi.date()
    .iso()
    .required()
    .description(
      'Actual date and time waste was collected. ' +
        'For deferred or retrospective recording, use the real collection time — ' +
        'not the time this request is submitted.'
    ),

  collectionType: Joi.string()
    .valid('STATIC', 'TRANSIT')
    .default('STATIC')
    .description(
      'Whether this event is a STATIC producer-to-driver pickup or a TRANSIT driver-to-driver handover (D-029). ' +
        'Optional; defaults to STATIC when omitted. ' +
        'Server enforces ordering: the first active event must be STATIC; every subsequent active event must be TRANSIT.'
    ),

  yourUniqueReference: Joi.string().description(
    "Caller's own reference for this collection event. " +
      'For example, a weighbridge ticket number or trip sheet reference.'
  ),

  otherReferencesForMovement: Joi.array()
    .items(otherReferenceSchema)
    .description('Additional label/reference pairs for this collection event.'),

  specialHandlingRequirements: Joi.string()
    .max(5000)
    .description(
      'Special handling instructions (e.g. fragile, hazardous, temperature-sensitive).'
    ),

  isDeleted: Joi.boolean()
    .strict()
    .default(false)
    .description(
      'Soft-delete flag (D-009). Defaults to false on creation. ' +
        'May be set to true only via PUT to soft-delete the collection, subject to downstream constraints. ' +
        'Supplying true on a POST is not permitted — the service layer returns a validation warning and treats the value as false. ' +
        'A collection cannot be deleted once its parent Movement has been referenced in a Delivery.'
    ),

  carrier: carrierSchema
    .required()
    .description(
      'Carrier details confirmed at collection. ' +
        'Required even if unchanged from creation (D-008). ' +
        'Provides the authoritative carrier record for this event.'
    ),

  dutyOfCareConfirmed: Joi.boolean()
    .strict()
    .required()
    .description(
      'Carrier confirms they have inspected the waste, that it is as described, ' +
        'and that they are content to transport it.'
    ),

  receivedFromCarrier: carrierSchema.description(
    'The carrier this Movement was received from on a TRANSIT handover (D-029). ' +
      'Same shape as carrier. ' +
      'Required when collectionType is TRANSIT; must not be provided when collectionType is STATIC. ' +
      'Enforced server-side. Captured for the record only — not cross-checked against the preceding event.'
  ),

  brokerOrDealer: brokerSchema
    .optional()
    .description(
      'Optional broker/dealer details, matching the Creation and Receipt shape (D-008).'
    ),

  collectionSite: collectionSiteSchema
}).description(
  'Record Collection request payload. ' +
    'POST /movements/{movementId}/collection → 201 with optional validation warnings.'
)

export default recordCollectionSchema
