/**
 * TypeScript types for the Record Receipt event.
 * POST /deliveries/{deliveryId}/receipt
 *
 * The deliveryId is a path parameter and is not included in the request body.
 * The request body below contains only the receipt details recorded by the receiver.
 *
 * carrier and brokerOrDealer use the shared CarrierDetails/BrokerDetails types
 * (sharedTypes.ts) rather than local duplicates, so this endpoint picks up the
 * same registrationNumber/reasonForNoRegistrationNumber rules and reduced
 * ON_SITE/ONE_OFF/MARINE enum as Creation and Collection. wasteItems drops
 * classification entirely (D-042) — POST /receipts, which has no prior
 * Creation to source classification from, is the one that keeps it.
 */

import type { ActualTreatment, CarrierDetails, BrokerDetails } from './sharedTypes.js'

export type WeightMetric =
  | 'Grams'
  | 'Kilograms'
  | 'Tonnes'

export type PhysicalForm =
  | 'Gas'
  | 'Liquid'
  | 'Solid'
  | 'Powder'
  | 'Sludge'
  | 'Mixed'

export type ComponentSource =
  | 'NOT_PROVIDED'
  | 'PROVIDED_WITH_WASTE'
  | 'GUIDANCE'
  | 'OWN_TESTING'

export type ReasonForNoConsignmentCode =
  | 'NON_HAZ_WASTE_TRANSFER'
  | 'NO_DOC_WITH_WASTE'
  | 'HWRC_RECEIPT'

export type ReceiptMovement = {
  // Request root
  yourUniqueReference?: string
  otherReferencesForMovement?: OtherReferenceForMovement[]

  hazardousWasteConsignmentCode?: string
  reasonForNoConsignmentCode?: ReasonForNoConsignmentCode

  dateTimeReceived: string
  apiCode: string

  // Main objects
  wasteItems: ReceiptWasteItem[]
  receiverSite: ReceiverSite
  receipt: Receipt
  carrier: CarrierDetails
  brokerOrDealer?: BrokerDetails
}

export type OtherReferenceForMovement = {
  reference: string
  label: string
}

export type Weight = {
  metric: WeightMetric
  isEstimate: boolean
  amount: number
}

export type ReceiptWasteItem = {
  weight: Weight
  physicalForm: PhysicalForm
  typeOfContainers: string
  numberOfContainers: number
  /** Actual Treatment (D-031, D-042). Optional. */
  actualTreatments?: ActualTreatment[]
}

export type DisposalOrRecoveryCode = {
  weight: Weight
  code: string
}

export type Pops = {
  sourceOfComponents: ComponentSource
  components?: PopComponent[]
}

export type PopComponent = {
  concentration?: number
  code?: string
}

export type Hazardous = {
  sourceOfComponents: ComponentSource
  hazCodes: string[]
  components?: HazardousComponent[]
}

export type HazardousComponent = {
  name?: string
  concentration?: number
}

export type ReceiverSite = {
  siteName: string
  regulatoryPositionStatements?: number[]
  phoneNumber?: string
  emailAddress?: string
  authorisationNumber: string
}

export type Receipt = {
  address: ReceiptAddress
}

export type ReceiptAddress = {
  postcode: string
  fullAddress: string
}