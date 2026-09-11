/**
 * Example payloads for the Record Delivery event.
 * POST /deliveries → 201 with an array of delivery entries (D-010)
 *
 * A single request's movementIds may mix hazardous and non-hazardous Movement
 * IDs. The server splits them: non-hazardous Movements aggregate under one
 * newly-minted deliveryId; each hazardous Movement becomes its own entry,
 * whose deliveryId equals that Movement ID. Each entry's deliveryId may be
 * passed to an official receiver so the receipt can be recorded via
 * POST /deliveries/{deliveryId}/receipt, where applicable.
 *
 * Receiver details are NOT on this payload. The drop-off place is a lighter
 * carrier-declared site model than the receipt receiver. A receipt event may
 * not always follow a delivery, for example when waste is left at an exempt place.
 */

export { carrier } from "./creationEvent.js";

import { carrier } from "./creationEvent.js";

// ---------------------------------------------------------------------------
// Sub-objects
// ---------------------------------------------------------------------------

export const deliverySite = {
  siteName: "Test Delivery Site",
  // Optional; include when the place operates under an exemption, e.g. a WEX number.
  // This is distinct from receiver.authorisationNumber.
  exemptionNumber: "WEX123456",
  address: {
    fullAddress: "99 Receiver Road, Test City",
    postcode: "TE1 3RX",
  },
};

// ---------------------------------------------------------------------------
// Single-collection delivery (one Movement ID)
// ---------------------------------------------------------------------------

export const singleMovementPostBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  movementIds: ["25HRA0B2"],
  actualDateTimeDelivered: "2025-09-15T11:15:00Z",
  isDeleted: false,
  carrier,
  deliverySite,
  // receiver details not present — receipt may not always follow a delivery
};

// ---------------------------------------------------------------------------
// Multi-collection delivery (multiple non-hazardous Movement IDs)
// Only permitted when all listed Movements carry non-hazardous waste (D-010)
// ---------------------------------------------------------------------------

export const multiMovementPostBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  movementIds: ["25HRA0B2", "25TKP3C9", "25ZWQ7D1"],
  actualDateTimeDelivered: "2025-09-15T11:15:00Z",
  yourUniqueReference: "DRIVER-RUN-AM-001",
  otherReferencesForMovement: [
    {
      label: "routeSheetNumber",
      reference: "RS-20250915-01",
    },
  ],
  isDeleted: false,
  carrier,
  deliverySite,
};

// ---------------------------------------------------------------------------
// Hazardous single-movement delivery
// A hazardous Movement always becomes its own delivery entry, never
// aggregated with any other Movement (D-010).
// ---------------------------------------------------------------------------

export const hazardousSingleMovementPostBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  movementIds: ["25HRA0B2"], // Hazardous Movement — becomes its own delivery entry (D-010)
  actualDateTimeDelivered: "2025-09-15T11:15:00Z",
  isDeleted: false,
  carrier,
  deliverySite: {
    siteName: "Hazardous Waste Delivery Site",
    address: {
      fullAddress: "99 Receiver Road, Test City",
      postcode: "TE1 3RX",
    },
  },
};

// ---------------------------------------------------------------------------
// Mixed hazardous / non-hazardous delivery (single request, D-010)
// Server splits: each hazardous Movement becomes its own delivery entry;
// non-hazardous Movements are aggregated under one newly-minted deliveryId.
// ---------------------------------------------------------------------------

export const mixedMovementPostBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  movementIds: ["25HAZ0A1", "25NHZ0B2", "25HAZ0C3", "25NHZ0D4", "25NHZ0E5"],
  actualDateTimeDelivered: "2025-09-15T11:15:00Z",
  isDeleted: false,
  carrier,
  deliverySite,
};

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

// Non-hazardous delivery (paired with singleMovementPostBody above): one
// aggregated entry, freshly minted deliveryId (D-012, D-013). The driver may
// pass deliveryId to the receiver to enable POST /deliveries/{deliveryId}/receipt,
// where applicable.
export const recordDeliveryResponse = {
  deliveries: [
    {
      deliveryId: "25XMN4F7",
      movementIds: ["25HRA0B2"],
      wasteType: "NON_HAZARDOUS",
    },
  ],
};

// Hazardous delivery (paired with hazardousSingleMovementPostBody above): the
// Delivery ID is the sole Movement ID, not a freshly minted value (D-010).
export const hazardousDeliveryResponse = {
  deliveries: [
    {
      deliveryId: "25HRA0B2",
      movementIds: ["25HRA0B2"],
      wasteType: "HAZARDOUS",
    },
  ],
};

// Mixed delivery (paired with mixedMovementPostBody above): each hazardous
// Movement gets its own entry; non-hazardous Movements aggregate under one
// newly-minted entry (D-010).
export const mixedMovementResponse = {
  deliveries: [
    { deliveryId: "25HAZ0A1", movementIds: ["25HAZ0A1"], wasteType: "HAZARDOUS" },
    { deliveryId: "25HAZ0C3", movementIds: ["25HAZ0C3"], wasteType: "HAZARDOUS" },
    {
      deliveryId: "25XMN9K2",
      movementIds: ["25NHZ0B2", "25NHZ0D4", "25NHZ0E5"],
      wasteType: "NON_HAZARDOUS",
    },
  ],
};

// 400 — a Movement named in movementIds (paired with multiMovementPostBody above)
// is currently isDeleted: true (D-009). Rejected outright; no delivery is
// recorded. Message shape matches deletedMovementBlocksDeliveryError in
// validators.js. deletedCollectionBlocksDeliveryError covers the sibling case
// where the Movement's Collection (rather than the Movement itself) is deleted.
export const deletedMovementInDeliveryError = {
  validation: {
    errors: [
      {
        key: "movementIds",
        errorType: "BusinessRuleViolation",
        message:
          "Cannot include movementId 25TKP3C9 in this delivery: it is marked as deleted.",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// 404 shape — Delivery ID not found
// ---------------------------------------------------------------------------

export const deliveryNotFoundError = {
  code: "DELIVERY_NOT_FOUND",
  message: "No delivery found for the provided deliveryId.",
};

// ---------------------------------------------------------------------------
// Update Delivery — PUT /deliveries/{deliveryId}
//
// A recorded delivery is immutable except for soft-delete (D-017). The update
// body carries ONLY apiCode and isDeleted; every other field is rejected as
// NotAllowed. To correct a recorded delivery, soft-delete it and record a fresh
// one via POST /deliveries.
// ---------------------------------------------------------------------------

// Soft-delete an existing delivery
export const updateDeliverySoftDeleteBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  isDeleted: true,
};

// Restore a previously soft-deleted delivery
export const updateDeliveryRestoreBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  isDeleted: false,
};

// Rejected: a PUT carrying any field other than apiCode/isDeleted (here
// movementIds and deliverySite) is not allowed — the delivery is immutable except
// for soft-delete (D-017).
export const updateDeliveryForbiddenFieldBody = {
  apiCode: "25b14080-5e77-4f91-9957-2482a0cb8775",
  isDeleted: false,
  movementIds: ["25HRA0B2"],
  deliverySite,
};

export const updateDeliveryForbiddenFieldError = {
  validation: {
    errors: [
      {
        key: "movementIds",
        errorType: "NotAllowed",
        message:
          "Field is not permitted on a delivery update — a recorded delivery is immutable except for isDeleted (D-017).",
      },
      {
        key: "deliverySite",
        errorType: "NotAllowed",
        message:
          "Field is not permitted on a delivery update — a recorded delivery is immutable except for isDeleted (D-017).",
      },
    ],
  },
};

// 200 — validation envelope only, no identifier (it is in the path)
export const updateDeliveryResponse = {
  validation: {
    warnings: [],
  },
};
