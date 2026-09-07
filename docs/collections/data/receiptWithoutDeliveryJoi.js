import Joi from 'joi'

/**
 * Speculative Joi schema for the D-041 "receipt without a prior delivery" endpoint.
 * POST /receipts
 *
 * D-041 (decisions.md#d-041) decides the endpoint and the mandatory
 * reasonForNoDeliveryId field, but leaves the exact request/response shape
 * open (open question 4). This schema is a working assumption — the same
 * receipt payload as POST /deliveries/{deliveryId}/receipt, plus a mandatory
 * reasonForNoDeliveryId — not a decided contract. Revisit once the BA
 * confirms the shape, in particular whether reasonForNoDeliveryId should be
 * a constrained enum rather than free text (open question 1 may also add
 * further required fields here).
 */
import { receiptMovementSchema } from './receiptJoi.js'

export const receiptWithoutDeliverySchema = receiptMovementSchema.keys({
  reasonForNoDeliveryId: Joi.string()
    .min(1)
    .required()
    .description(
      'Mandatory explanation of why there is no prior Movement/Collection/Delivery ' +
      'trail for this receipt (D-041). Free text pending confirmation of whether ' +
      'this should instead be a constrained enum, as with carrier.reasonForNoRegistrationNumber.'
    )
})
  .description('Receipt-without-a-prior-delivery payload (D-041, proposal).')

export default receiptWithoutDeliverySchema
