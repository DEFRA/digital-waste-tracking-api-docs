/**
 * Speculative TypeScript types for the D-041 "receipt without a prior delivery" endpoint.
 * POST /receipts
 *
 * D-041 (decisions.md#d-041) decides the endpoint and the mandatory
 * reasonForNoDeliveryId field, but leaves the exact request/response shape
 * open (open question 4). These types are a working assumption, not a
 * decided contract — revisit once the BA confirms the shape.
 */
import type { ReceiptMovement } from './receiptTypes.js'
import type { ValidationResult } from './sharedTypes.js'

export type ReceiptWithoutDeliveryRequest = ReceiptMovement & {
  /**
   * Mandatory explanation of why there is no prior Movement/Collection/
   * Delivery trail for this receipt (D-041). Modelled as free text here;
   * open question 1 may add further required fields once resolved.
   */
  reasonForNoDeliveryId: string
}

export type ReceiptWithoutDeliveryResponse = {
  /** The Delivery ID of the empty Delivery (movementIds: []) the server created. */
  deliveryId: string
  validation: {
    warnings: ValidationResult[]
  }
}
