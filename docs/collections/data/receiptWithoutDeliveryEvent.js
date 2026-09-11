/**
 * Example payloads for the "receipt without a prior delivery" endpoint (D-041).
 * POST /receipts
 *
 * D-041 (decisions.md#d-041) decides the endpoint and the mandatory
 * reasonForNoDeliveryId field. D-042 (decisions.md#d-042) resolves D-041's
 * open question 4: this is the same shape as receiptEvent.js's payloads
 * (POST /deliveries/{deliveryId}/receipt), except wasteItems carries full
 * classification instead of the light shape — this endpoint has no prior
 * Creation/Delivery to source classification from. Both are decided, not
 * speculative.
 *
 * carrier, brokerOrDealer and receipt are reused from receiptEvent.js —
 * unaffected by the classification/receiverSite changes. wasteItems is
 * defined fresh here, mirroring a Creation wasteItem example's nested
 * classification shape (creationEvent.js), since receiptEvent.js's own
 * wasteItems now uses the light, classification-free shape (D-042).
 */
import {
  carrier,
  brokerOrDealer,
  receipt,
  receiverSite
} from './receiptEvent.js'

export const wasteItems = [
  {
    weight: {
      metric: 'Tonnes',
      amount: 0.5,
      isEstimate: false
    },
    numberOfContainers: 4,
    typeOfContainers: 'SKI',
    physicalForm: 'Solid',
    classification: {
      ewcCodes: ['200121'],
      wasteDescription: 'Fluorescent tubes and other mercury-containing waste',
      containsPops: true,
      pops: {
        sourceOfComponents: 'PROVIDED_WITH_WASTE'
        // components omitted — source is PROVIDED_WITH_WASTE so list is optional
      },
      containsHazardous: true,
      hazardous: {
        sourceOfComponents: 'GUIDANCE',
        hazCodes: ['HP_4'],
        components: [
          {
            name: 'Mercury',
            concentration: 5
          }
        ]
      }
    },
    // Actual Treatment (D-031 amended, D-042) — optional; disposalOrRecoveryCode
    // is itself optional per entry, confirmed here since the receiving site has
    // already inspected and weighed the waste.
    actualTreatments: [
      {
        disposalOrRecoveryCode: 'R1',
        weight: {
          metric: 'Tonnes',
          amount: 0.5,
          isEstimate: false
        }
      }
    ]
  }
]

export const requestBody = {
  apiCode: '25b14080-5e77-4f91-9957-2482a0cb8775',
  dateTimeReceived: '2025-08-29T15:24:00Z',
  hazardousWasteConsignmentCode: 'CJ123E/A0001',
  yourUniqueReference: 'CLIENT-REF-001',
  otherReferencesForMovement: [
    {
      label: 'transferNoteNumber',
      reference: 'TN-12345'
    }
  ],
  wasteItems,
  carrier,
  brokerOrDealer,
  receiverSite,
  receipt,
  reasonForNoDeliveryId:
    'Waste received directly with no digital record of an earlier journey.'
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
