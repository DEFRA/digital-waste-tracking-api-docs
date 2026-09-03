/**
 * TypeScript types for the Record Delivery event.
 * POST /deliveries → 201 with deliveryId
 *
 * The delivery event records the carrier-declared place where one or more
 * Movements are dropped off or left. It mints a Delivery ID that may be used
 * by an official receiver to record a receipt, but a receipt event may not
 * always follow — for example, when waste is dropped at an exempt place.
 *
 * Key design decisions:
 *   D-007 — delivery aggregates one or more Movement IDs (movementIds array)
 *   D-010 — hazardous waste: exactly one Movement ID per delivery
 *   D-012 — Delivery ID is the only public identifier minted here
 *   D-013 — Delivery ID is an 8-character year-prefixed sqid
 *
 * Note: receiver details are NOT on the delivery. The drop-off place is a
 * lighter site model declared by the carrier and is distinct from the official
 * receiver site used by POST /deliveries/{deliveryId}/receipt. A receipt may
 * not always follow a delivery.
 */

export type {
  MeansOfTransport,
  CarrierReasonForNoRegistrationNumber,
  OtherReferenceForMovement,
  CarrierDetails,
  ValidationResult,
} from "./sharedTypes.js";

import type {
  OtherReferenceForMovement,
  CarrierDetails,
  ValidationResult,
} from "./sharedTypes.js";

// ---------------------------------------------------------------------------
// Delivery site
// ---------------------------------------------------------------------------

export type DeliverySiteAddress = {
  postcode: string;
  fullAddress: string;
};

/**
 * Delivery place declared by the carrier.
 *
 * This is not necessarily an official receiver site and does not require a
 * receiver authorisation number. Some drop-offs may be to exempt places that
 * store, treat, use or dispose of waste, in which case exemptionNumber may be
 * supplied. A receipt event may not always follow a delivery.
 */
export type DeliverySite = {
  /** Name of the carrier-declared site/place where the waste is dropped off or left. */
  siteName: string;

  /**
   * Optional exemption number for exempt places that store, treat, use or dispose of waste.
   * For example, a WEX number. Distinct from receiver.authorisationNumber.
   */
  exemptionNumber?: string;

  /** Mandatory physical address where the waste was dropped off. Both fullAddress and postcode are required. */
  address: DeliverySiteAddress;
};

// ---------------------------------------------------------------------------
// Record Delivery request / response
// ---------------------------------------------------------------------------

export type RecordDelivery = {
  /** Unique identifier of the submitting organisation produced by registration. */
  apiCode: string;

  /**
   * One or more Movement IDs delivered in this delivery.
   * - Single-collection runs: array of one.
   * - Multi-collection runs: all Movement IDs delivered together at the same site.
   * - Hazardous waste (D-010): exactly one Movement ID is allowed per delivery.
   */
  movementIds: string[];

  /** Actual date and time of the delivery. ISO 8601. */
  actualDateTimeDelivery: string;

  yourUniqueReference?: string;
  otherReferencesForMovement?: OtherReferenceForMovement[];

  /**
   * Soft-delete flag (D-009). Defaults to false on creation.
   * May be set to true only via PUT. Supplying true on a POST returns a validation
   * warning and the value is treated as false by the service layer.
   * Cannot be set to true once a Receipt has been recorded against this Delivery.
   */
  isDeleted?: boolean;

  /** Carrier performing the delivery. Required and aligned to Collection/Receipt carrier rules. */
  carrier: CarrierDetails;

  /** Carrier-declared drop-off place details. This is a lighter site model than the receipt receiver. */
  deliverySite: DeliverySite;
};

export type RecordDeliveryResponse = {
  /**
   * The Delivery ID minted by the server.
   * 8-character year-prefixed sqid (D-013).
   * The driver may pass this value to the receiver so they can record
   * the receipt via POST /deliveries/{deliveryId}/receipt, where applicable.
   */
  deliveryId: string;
  /**
   * Optional validation warnings. For now, server-side business-rule checks
   * such as hazardous aggregation may be surfaced as BusinessRuleViolation warnings.
   */
  validation?: {
    warnings?: ValidationResult[];
  };
};

// ---------------------------------------------------------------------------
// Update Delivery — PUT /deliveries/{deliveryId}
//
// A recorded delivery is immutable except for soft-delete (D-017). The PUT body
// is restricted to apiCode (caller identity) and isDeleted (D-009); any other
// field is rejected (NotAllowed). To correct a delivery, soft-delete it and
// record a fresh one via POST /deliveries.
// ---------------------------------------------------------------------------

export type UpdateDelivery = {
  /** Unique identifier of the submitting organisation produced by registration. Caller identity only. */
  apiCode: string;

  /**
   * Soft-delete flag (D-009) — the only property that may change on a recorded
   * delivery (D-017). true soft-deletes the delivery; false restores it. Cannot
   * be set to true once a Receipt has been recorded against this Delivery.
   */
  isDeleted: boolean;
};

export type UpdateDeliveryResponse = {
  /** Validation envelope only — the updated record is not echoed (the identifier is in the path). */
  validation?: {
    warnings?: ValidationResult[];
  };
};
