/**
 * TypeScript types for the "receipt without a prior delivery" endpoint (D-041).
 * POST /receipts
 *
 * D-041 (decisions.md#d-041) decides the endpoint and the mandatory
 * reasonForNoDeliveryId field. D-042 (decisions.md#d-042) resolves D-041's
 * open question 4: this is the same shape as ReceiptMovement
 * (POST /deliveries/{deliveryId}/receipt, receiptTypes.ts), except wasteItems
 * uses the full WasteItemBase-derived shape instead of the light one — this
 * endpoint has no prior Creation/Delivery to source classification from,
 * unlike the ordinary Receipt endpoint. Both are decided, not speculative.
 *
 * Field list intersected/duplicated from ReceiptMovement (receiptTypes.ts) is
 * duplicated explicitly rather than inherited, so this type doesn't silently
 * pick up ReceiptMovement's light wasteItems whenever that shape changes.
 */
import type { OtherReferenceForMovement, ReasonForNoConsignmentCode, ReceiverSite, Receipt } from './receiptTypes.js'
import type { ActualTreatment, CarrierDetails, BrokerDetails, WasteItemBase, ValidationResult } from './sharedTypes.js'

export type ReceiptWithoutDeliveryWasteItem = WasteItemBase & {
  /** Actual Treatment (D-031 amended, D-042). Optional. */
  actualTreatments?: ActualTreatment[]
}

export type ReceiptWithoutDeliveryRequest = {
  yourUniqueReference?: string
  specialHandlingRequirements?: string
  otherReferencesForMovement?: OtherReferenceForMovement[]

  hazardousWasteConsignmentCode?: string
  reasonForNoConsignmentCode?: ReasonForNoConsignmentCode

  dateTimeReceived: string
  apiCode: string

  wasteItems: ReceiptWithoutDeliveryWasteItem[]
  receiverSite: ReceiverSite
  receipt: Receipt
  carrier: CarrierDetails
  brokerOrDealer?: BrokerDetails

  /**
   * Mandatory explanation of why there is no prior Movement/Collection/
   * Delivery trail for this receipt (D-041). Modelled as free text here;
   * D-041 open question 1 (now resolved by D-042) confirmed no further
   * required fields beyond the full waste classification.
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
