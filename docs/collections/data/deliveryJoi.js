/**
 * Joi validation schema for the Record Delivery event.
 * POST /deliveries → 201 with deliveryId
 *
 * Key behaviours:
 * - apiCode is mandatory, matching the registered submitting organisation.
 * - movementIds array: minimum 1; server validates hazardous constraint (D-010).
 * - actualDateTimeDelivery must be the actual drop-off time, not submission time.
 * - carrier is mandatory and uses the same required/optional carrier schema as Collection/Receipt.
 * - deliverySite contains the carrier-declared site/place name, optional exemption number, and mandatory address.
 * - The drop-off place is a lighter site model than the receipt receiver.
 * - No driverDetails — driver is not part of the Delivery payload.
 * - No receiver details — receiver is identified at receipt time, not here.
 * - A receipt event may not always follow a delivery, for example when waste is left at an exempt place.
 * - A recorded delivery is immutable except for soft-delete
 *
 * The hazardous-waste single-Movement constraint (D-010) is data-dependent
 * (requires knowing whether any referenced Movement carries hazardous waste)
 * and cannot be expressed in this schema. It is assessed server-side and
 * may be returned as a BusinessRuleViolation validation warning for now.
 */

import Joi from "joi";
import {
  MOVEMENT_ID_REGEX,
  businessAddressSchema,
  otherReferenceSchema,
  carrierSchema,
} from "./sharedSchemas.js";

// ---------------------------------------------------------------------------
// Delivery site
// ---------------------------------------------------------------------------

const deliverySiteAddressSchema = businessAddressSchema
  .keys({
    fullAddress: Joi.string()
      .required()
      .description("Full address where the waste was physically dropped off."),
  })
  .required()
  .description("Delivery address. Both postcode and fullAddress are required.");

const deliverySiteSchema = Joi.object({
  siteName: Joi.string()
    .required()
    .description(
      "Name of the carrier-declared site/place where the waste is dropped off or left.",
    ),

  exemptionNumber: Joi.string()
    .optional()
    .description(
      "Optional exemption number for exempt places that store, treat, use or dispose of waste. " +
        "For example, a WEX number. This is distinct from receiver.authorisationNumber.",
    ),

  address: deliverySiteAddressSchema
    .required()
    .description(
      "Mandatory physical address where the waste was dropped off. Both fullAddress and postcode are required.",
    ),
})
  .required()
  .description(
    "Delivery place declared by the carrier. " +
      "This is not necessarily an official receiver site and does not require a receiver authorisation number. " +
      "Some drop-offs may be to exempt places that store, treat, use or dispose of waste, in which case exemptionNumber may be supplied. " +
      "A receipt event may not always follow a delivery.",
  );

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export const recordDeliverySchema = Joi.object({
  apiCode: Joi.string()
    .uuid()
    .required()
    .description(
      "Unique identifier of the submitting organisation produced by the Waste Tracking Service registration process.",
    ),

  movementIds: Joi.array()
    .items(
      Joi.string()
        .pattern(MOVEMENT_ID_REGEX)
        .description("Movement ID — 8-character year-prefixed sqid (D-013)."),
    )
    .min(1)
    .required()
    .description(
      "One or more Movement IDs delivered together at the same drop-off site. " +
        "Single-collection runs supply an array of one. " +
        "Multi-collection runs (non-hazardous only) supply all Movement IDs delivered together. " +
        "Hazardous waste constraint (D-010): if any referenced Movement carries hazardous waste, " +
        "exactly one Movement ID is permitted — validated server-side.",
    ),

  actualDateTimeDelivery: Joi.date()
    .iso()
    .required()
    .description(
      "Actual date and time the delivery occurred. " +
        "For deferred recording, use the real drop-off time — not the submission time.",
    ),

  yourUniqueReference: Joi.string().description(
    "Caller's own reference for this delivery event. " +
      "For example, a route sheet number or driver trip reference.",
  ),

  otherReferencesForMovement: Joi.array()
    .items(otherReferenceSchema)
    .description("Additional label/reference pairs for this delivery event."),

  isDeleted: Joi.boolean()
    .strict()
    .default(false)
    .description(
      "Soft-delete flag (D-009). Defaults to false on creation. " +
        "May be set to true only via PUT to soft-delete the delivery, subject to downstream constraints. " +
        "Supplying true on a POST is not permitted — the service layer returns a validation warning and treats the value as false. " +
        "A delivery cannot be deleted once a Receipt has been recorded against it.",
    ),

  carrier: carrierSchema
    .required()
    .description(
      "Carrier details confirmed at delivery. " +
        "Required even if unchanged from creation or collection. " +
        "Uses the same required/optional carrier schema as Collection and Receipt.",
    ),

  deliverySite: deliverySiteSchema,
}).description(
  "Record Delivery request payload. " +
    "POST /deliveries → 201 with deliveryId. " +
    "The Delivery ID may be passed by the driver to the receiver to enable " +
    "POST /deliveries/{deliveryId}/receipt, where applicable. " +
    "A receipt event may not always follow a delivery.",
);

export const updateDeliverySchema = Joi.object({
  apiCode: Joi.string()
    .uuid()
    .required()
    .description(
      "Unique identifier of the submitting organisation produced by the Waste Tracking Service registration process. " +
        "Caller identity only — not a mutable property of the delivery record (D-017).",
    ),

  isDeleted: Joi.boolean()
    .strict()
    .required()
    .description(
      "Soft-delete flag (D-009) — the only property that may be changed on a recorded delivery (D-017). " +
        "true soft-deletes the delivery; false restores it. " +
        "Cannot be set to true once a Receipt has been recorded against this Delivery — rejected server-side as a BusinessRuleViolation.",
    ),
})
  .unknown(false)
  .required()
  .description(
    "Restricted delivery update body (D-017). PUT /deliveries/{deliveryId}. " +
      "A recorded delivery is immutable except for the isDeleted soft-delete flag; " +
      "any field other than apiCode and isDeleted is rejected as NotAllowed.",
  );

export default recordDeliverySchema;
