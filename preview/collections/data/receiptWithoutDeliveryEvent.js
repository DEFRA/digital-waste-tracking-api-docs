/**
 * Speculative example payloads for the D-041 "receipt without a prior delivery" endpoint.
 * POST /receipts
 *
 * D-041 (decisions.md#d-041) decides the endpoint and the mandatory
 * reasonForNoDeliveryId field, but leaves the exact request/response shape
 * open (open question 4). These examples are a working assumption — the
 * same receipt payload as POST /deliveries/{deliveryId}/receipt (see
 * receiptEvent.js), plus reasonForNoDeliveryId — not a decided contract.
 */
import { publicPostBody } from './receiptEvent.js'

export const requestBody = {
  ...publicPostBody,
  reasonForNoDeliveryId: 'Waste received directly with no digital record of an earlier journey.'
}

// 201 response: the receipt is recorded and an empty Delivery
// (movementIds: []) is created server-side to hold it.
export const successResponse = {
  deliveryId: '25DXZ7QK',
  validation: {
    warnings: []
  }
}

// 400 response: reasonForNoDeliveryId omitted.
export const missingReasonResponse = {
  error: {
    code: 'ValidationError',
    message: 'reasonForNoDeliveryId is required.',
    details: [
      {
        field: 'reasonForNoDeliveryId',
        errorType: 'Required'
      }
    ]
  },
  requestId: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'
}
