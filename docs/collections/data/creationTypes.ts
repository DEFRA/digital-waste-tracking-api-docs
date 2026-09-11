/**
 * TypeScript types for the Create Movement event.
 * POST /movements → returns movementId
 *
 * The creation record is the starting point of the waste journey. It captures
 * who is producing the waste, the planned collection date/time, the carrier
 * transport method, and the declared waste items, each with its Intended
 * Treatment (intendedTreatments), confirmed by the receiver as Actual
 * Treatment (actualTreatments) at Receipt (D-031 amended).
 *
 * Creation-specific business rules reflected here:
 * - apiCode is required, as per the Receipt event.
 * - Date/time field renamed from estimatedDateTimeCollected to plannedCollectionTime.
 * - Object names align with the spreadsheet / Receipt shape: producer, carrier, brokerOrDealer, receivers.
 * - producer.organisationName and producer.address are required for Commercial and Municipal, forbidden
 *   for Household; producer.authorisationNumber is optional for Commercial and Municipal.
 * - carrier follows the Receipt carrier structure, but carrier.meansOfTransport and
 *   carrier.organisationName are mandatory at Creation. Optional carrier fields still keep
 *   integrity rules when supplied: registrationNumber and reasonForNoRegistrationNumber are mutually
 *   exclusive; vehicleRegistration is only for Road; otherMeansOfTransport is only for Other.
 * - producer.councilMovement uses the BA spreadsheet name.
 * - receivers (D-043; array, renamed from receiver) requires at least one entry only when the movement
 *   contains hazardous waste — a producer may declare waste heading to more than one receiving site.
 *   Each entry's siteName is mandatory whenever that entry is supplied, which makes authorisationNumber
 *   and address mandatory too.
 * - brokerOrDealer is optional, but registrationNumber is required whenever it is supplied — null/empty
 *   requires reasonForNoRegistrationNumber instead, mirroring carrier's mutual-exclusivity rule.
 * - collectionAddressDifferentFromProducer / collectionSite: planning-time fields for where the waste
 *   will be collected from, if not the producer's address. Distinct from the Collection event's
 *   own collectionSite, which records the actual collection.
 * - CreateWasteItem extends the shared WasteItemBase (sharedTypes.ts, D-042): classification
 *   (ewcCodes, wasteDescription, containsPops/pops, containsHazardous/hazardous) is nested; weight,
 *   numberOfContainers, typeOfContainers and physicalForm stay top-level. POST /receipts shares the
 *   same WasteItemBase; the ordinary Receipt endpoint's wasteItem does not extend it and drops
 *   classification entirely.
 */

export type {
  WeightMetric,
  PhysicalForm,
  ComponentSource,
  MeansOfTransport,
  CarrierReasonForNoRegistrationNumber,
  ReasonForNoConsignmentCode,
  OtherReferenceForMovement,
  Weight,
  IntendedTreatment,
  BusinessAddress,
  Pops,
  PopComponent,
  PopConcentrationThresholdOperator,
  Hazardous,
  HazardousComponent,
  HazardousConcentrationThresholdOperator,
  WasteItemClassification,
  WasteItemBase,
  CarrierDetails,
  BrokerDetails,
  ValidationResult
} from './sharedTypes.js'

import type {
  MeansOfTransport,
  CarrierReasonForNoRegistrationNumber,
  ReasonForNoConsignmentCode,
  OtherReferenceForMovement,
  IntendedTreatment,
  BusinessAddress,
  WasteItemBase,
  BrokerDetails,
  ValidationResult
} from './sharedTypes.js'

// ---------------------------------------------------------------------------
// Producer
// ---------------------------------------------------------------------------

export type WasteSource = 'Household' | 'Commercial' | 'Municipal'

/**
 * Producer information.
 *
 * Commercial waste requires organisationName, address and sicCode; authorisationNumber
 * is optional. Household waste must not provide any of the business-only fields
 * (organisationName, authorisationNumber, sicCode, emailAddress, phoneNumber) or address.
 * Municipal waste requires organisationName and address; authorisationNumber and sicCode
 * stay optional.
 */
export type Producer = {
  wasteSource: WasteSource

  /** Required for Commercial and Municipal; forbidden for Household. */
  organisationName?: string
  /** Environmental permit or exemption number the producer operates under. Optional for Commercial and Municipal; forbidden for Household. */
  authorisationNumber?: string
  emailAddress?: string
  phoneNumber?: string
  /** Five-digit Standard Industrial Classification code for the process that created this waste. */
  sicCode?: string

  /** Required for Commercial and Municipal; forbidden for Household. */
  address?: BusinessAddress
  /** Whether this movement is carried out by, or on behalf of, a council. */
  councilMovement: boolean
}

// ---------------------------------------------------------------------------
// Creation-specific carrier
// ---------------------------------------------------------------------------

/**
 * Carrier details at Creation.
 *
 * Same field structure as Receipt carrier, with relaxed Creation requiredness.
 * meansOfTransport and organisationName are mandatory at Creation; other
 * carrier fields can be supplied when known and are validated when present.
 *
 * Integrity rules still apply:
 * - registrationNumber and reasonForNoRegistrationNumber are mutually exclusive.
 * - vehicleRegistration may be supplied only when meansOfTransport is 'Road'.
 * - otherMeansOfTransport may be supplied only when meansOfTransport is 'Other'.
 */
export type Carrier = {
  meansOfTransport: MeansOfTransport
  registrationNumber?: string | null
  reasonForNoRegistrationNumber?: CarrierReasonForNoRegistrationNumber
  organisationName: string
  vehicleRegistration?: string
  otherMeansOfTransport?: string
  emailAddress?: string
  phoneNumber?: string
  address?: BusinessAddress
}

// ---------------------------------------------------------------------------
// Broker / dealer
// ---------------------------------------------------------------------------

export type BrokerOrDealer = BrokerDetails

// ---------------------------------------------------------------------------
// Waste items at creation
// ---------------------------------------------------------------------------

/**
 * A waste item declared at movement creation.
 *
 * Extends the shared WasteItemBase (sharedTypes.ts, D-042) — classification
 * nested, weight/numberOfContainers/typeOfContainers/physicalForm top-level —
 * with Creation's own intendedTreatments. POST /receipts shares the same
 * WasteItemBase; the ordinary Receipt endpoint's wasteItem does not extend it
 * and drops classification entirely.
 */
export type CreateWasteItem = WasteItemBase & {
  /** Intended Treatment (D-031, D-042). Mandatory at Creation, min 1 — the receiver confirms the authoritative Actual Treatment (actualTreatments) at Receipt. */
  intendedTreatments: IntendedTreatment[]
}

// ---------------------------------------------------------------------------
// Receiver at creation
// ---------------------------------------------------------------------------

export type ReceiverAddress = {
  postcode: string
  fullAddress: string
}

/**
 * A single receiving site entry within receivers (D-043).
 *
 * siteName is mandatory whenever an entry is supplied; authorisationNumber
 * and full address are conditional on siteName being populated, which — now
 * that siteName is always populated when an entry is present — makes them
 * mandatory too.
 */
export type Receiver = {
  siteName: string
  authorisationNumber?: string
  emailAddress?: string
  phoneNumber?: string
  address?: ReceiverAddress
}

// ---------------------------------------------------------------------------
// Collection fields at creation
// ---------------------------------------------------------------------------

/**
 * Collection site address — same shape as Collection's own collectionSite.address
 * (both fullAddress and postcode required), reused here so Creation's planned
 * collection address matches what the Collection event itself records.
 */
export type CollectionSiteAddress = {
  fullAddress: string
  postcode: string
}

// ---------------------------------------------------------------------------
// Create Movement request / response
// ---------------------------------------------------------------------------

export type CreateMovement = {
  /** Unique identifier for the submitting organisation, as per the Receipt event. */
  apiCode: string

  /** Planned date and time the waste will be collected. ISO 8601. Renamed from estimatedDateTimeCollected. */
  plannedCollectionTime: string

  /** Required when any waste item carries a hazardous EWC code. Mutually exclusive with reasonForNoConsignmentCode. */
  hazardousWasteConsignmentCode?: string
  /** Required when waste is hazardous and no consignment code is provided. Mutually exclusive with hazardousWasteConsignmentCode. */
  reasonForNoConsignmentCode?: ReasonForNoConsignmentCode

  yourUniqueReference?: string
  otherReferencesForMovement?: OtherReferenceForMovement[]
  specialHandlingRequirements?: string

  /**
   * Soft-delete flag (D-009). Defaults to false on creation.
   * May be set to true only via PUT. Supplying true on a POST returns a validation
   * warning and the value is treated as false by the service layer.
   */
  isDeleted?: boolean

  producer: Producer
  /** Required object at Creation; follows Receipt carrier fields, with meansOfTransport and organisationName mandatory. */
  carrier: Carrier
  /** Optional broker/dealer details. registrationNumber is required whenever this object is supplied. */
  brokerOrDealer?: BrokerOrDealer
  /**
   * Intended receiving site(s) (D-043). Required (min 1) only when the movement
   * contains hazardous waste — a producer may declare waste heading to more
   * than one receiving site.
   */
  receivers?: Receiver[]

  /**
   * Whether the waste will be collected from an address other than producer.address.
   * Defaults to false — false or absent means collection is planned at the producer address.
   * When true, collectionSite is required.
   */
  collectionAddressDifferentFromProducer?: boolean
  /** Required when collectionAddressDifferentFromProducer is true; must not be provided otherwise. */
  collectionSite?: CollectionSiteAddress

  /** At least one waste item required. */
  wasteItems: CreateWasteItem[]
}

export type CreateMovementResponse = {
  /** The Movement ID minted by the server. 8-character year-prefixed sqid. */
  movementId: string
  validation?: {
    warnings?: ValidationResult[]
  }
}
