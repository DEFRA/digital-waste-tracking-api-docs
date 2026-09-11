/**
 * Shared types used across all DWT event schemas (Creation, Collection,
 * Delivery, Receipt). Import from here rather than from individual event
 * files to avoid duplication.
 *
 * Receipt-specific types (ReceiptAddress, Receipt, Receiver) remain in
 * receiptTypes.ts to avoid disturbing the Phase 1 contract.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type WeightMetric = 'Grams' | 'Kilograms' | 'Tonnes'

export type PhysicalForm = 'Gas' | 'Liquid' | 'Solid' | 'Powder' | 'Sludge' | 'Mixed'

export type ComponentSource =
  | 'NOT_PROVIDED'
  | 'PROVIDED_WITH_WASTE'
  | 'GUIDANCE'
  | 'OWN_TESTING'

export type MeansOfTransport =
  | 'Road'
  | 'Rail'
  | 'Air'
  | 'Sea'
  | 'Inland Waterway'
  | 'Piped'
  | 'Other'

export type CarrierReasonForNoRegistrationNumber =
  | 'ON_SITE'
  | 'ONE_OFF'
  | 'MARINE'

export type ReasonForNoConsignmentCode =
  | 'NON_HAZ_WASTE_TRANSFER'
  | 'NO_DOC_WITH_WASTE'
  | 'HWRC_RECEIPT'

// ---------------------------------------------------------------------------
// Common value objects
// ---------------------------------------------------------------------------

export type Weight = {
  metric: WeightMetric
  isEstimate: boolean
  amount: number
}

/**
 * Intended Treatment entry — replaces the old DisposalOrRecoveryCode shape
 * (D-031 amended). Renamed field: code → disposalOrRecoveryCode; same
 * validation. Used as intendedTreatments (Creation, mandatory, min 1) — both
 * fields always required. Distinct from ActualTreatment (Receipt, optional),
 * where disposalOrRecoveryCode itself is optional and weight is conditional
 * on the code being present — a receiving site may need to inspect or weigh
 * before confirming the code (D-031 amended).
 */
export type IntendedTreatment = {
  /** Valid code from GET /reference-data/disposal-or-recovery-codes. */
  disposalOrRecoveryCode: string
  /** Weight of waste being disposed of or recovered under this code. */
  weight: Weight
}

/**
 * Actual Treatment entry (D-031 amended) — used as actualTreatments at
 * Receipt (POST /deliveries/{deliveryId}/receipt and POST /receipts), where
 * the confirmed outcome may not be known yet at the point of receipt.
 * disposalOrRecoveryCode is optional (omitting it produces a warning, not a
 * rejection); weight is required only when disposalOrRecoveryCode is
 * supplied. Distinct from IntendedTreatment (Creation, mandatory), where
 * both fields are always required.
 */
export type ActualTreatment = {
  /** Valid code from GET /reference-data/disposal-or-recovery-codes. Optional — omitting it produces a warning, not a rejection. */
  disposalOrRecoveryCode?: string
  /** Weight of waste being disposed of or recovered under this code. Required when disposalOrRecoveryCode is supplied. */
  weight?: Weight
}

/**
 * Business address used by carrier, broker, producer and receiver parties.
 * fullAddress is optional by default; postcode is always required.
 * Event-specific schemas can tighten this, for example Creation receiver
 * requires both fullAddress and postcode when receiver.siteName is populated.
 */
export type BusinessAddress = {
  fullAddress?: string
  postcode: string
}

export type OtherReferenceForMovement = {
  /** Label identifying the reference type, e.g. "transferNoteNumber" */
  label: string
  /** The reference value. */
  reference: string
}

export type ValidationResult = {
  key: string
  errorType: string
  message: string
}

// ---------------------------------------------------------------------------
// Waste classification sub-types
// ---------------------------------------------------------------------------

export type PopConcentrationThresholdOperator =
  | 'LESS_THAN'
  | 'EQUAL_TO'
  | 'GREATER_THAN_OR_EQUAL'

/** Concentration expressed as a threshold rather than an exact value. */
export type PopConcentrationThreshold = {
  operator: PopConcentrationThresholdOperator
  /** Threshold value. Same units as concentration (%). */
  value: number
}

export type PopComponent = {
  /** Must be a valid code from GET /reference-data/pop-names */
  code?: string
  /** Mutually exclusive with concentrationThreshold — a component may state one or neither, never both. */
  concentration?: number | null
  /** Mutually exclusive with concentration — a component may state one or neither, never both. */
  concentrationThreshold?: PopConcentrationThreshold
}

export type Pops = {
  sourceOfComponents: ComponentSource
  /**
   * Required when sourceOfComponents is GUIDANCE or OWN_TESTING.
   * Forbidden when sourceOfComponents is NOT_PROVIDED.
   * Optional when sourceOfComponents is PROVIDED_WITH_WASTE.
   */
  components?: PopComponent[]
}

export type HazardousConcentrationThresholdOperator =
  | 'EQUAL_TO'
  | 'GREATER_THAN_OR_EQUAL'

/** Concentration expressed as a threshold rather than an exact value. */
export type HazardousConcentrationThreshold = {
  operator: HazardousConcentrationThresholdOperator
  /** Threshold value. Same units as concentration (%). */
  value: number
}

export type HazardousComponent = {
  name?: string
  /**
   * Required when name is supplied. Mutually exclusive with
   * concentrationThreshold — a component may state one or neither, never both.
   */
  concentration?: number | null
  /** Mutually exclusive with concentration — a component may state one or neither, never both. */
  concentrationThreshold?: HazardousConcentrationThreshold
}

export type Hazardous = {
  sourceOfComponents: ComponentSource
  /** Valid codes from GET /reference-data/hazardous-property-codes. Duplicates removed. */
  hazCodes: string[]
  /**
   * Required when sourceOfComponents is GUIDANCE or OWN_TESTING.
   * Forbidden when sourceOfComponents is NOT_PROVIDED.
   */
  components?: HazardousComponent[]
}

// ---------------------------------------------------------------------------
// Waste item classification and base (D-042)
//
// Shared by Creation and POST /receipts (the no-prior-delivery Receipt
// endpoint) — both need the full classification since neither can source it
// from elsewhere. POST /deliveries/{deliveryId}/receipt (the ordinary
// Receipt endpoint) does NOT extend WasteItemBase — a Creation record
// already exists, so it drops classification and defines its own light
// waste item (logistics fields + actualTreatments only).
// ---------------------------------------------------------------------------

export type WasteItemClassification = {
  ewcCodes: string[]
  wasteDescription: string
  containsPops: boolean
  pops?: Pops
  containsHazardous: boolean
  hazardous?: Hazardous
}

/**
 * Field order matches the live createWasteItemSchema/CreateWasteItem
 * (weight, numberOfContainers, typeOfContainers, physicalForm), not the
 * order in decisions.md's D-042 prose.
 */
export type WasteItemBase = {
  classification: WasteItemClassification
  weight: Weight
  numberOfContainers: number
  typeOfContainers: string
  physicalForm: PhysicalForm
}

// ---------------------------------------------------------------------------
// Party types shared across events
// ---------------------------------------------------------------------------

/**
 * Carrier organisation and transport details.
 *
 * Some events tighten this shape. For Creation, only meansOfTransport is
 * mandatory, so creationTypes.ts defines a Creation-specific Carrier type.
 */
export type CarrierDetails = {
  /**
   * May be null or empty string when a reason is supplied instead.
   * Must match a valid England / SEPA / NRW / NI carrier registration format
   * when a value is provided.
   */
  registrationNumber?: string | null
  /**
   * Required when registrationNumber is null or empty on events that need a
   * full carrier record. Creation treats this as optional.
   */
  reasonForNoRegistrationNumber?: CarrierReasonForNoRegistrationNumber
  organisationName: string
  meansOfTransport: MeansOfTransport
  /** Required when meansOfTransport is Road on events that need vehicle detail. */
  vehicleRegistration?: string
  /** Description when meansOfTransport is Other. */
  otherMeansOfTransport?: string
  emailAddress?: string
  phoneNumber?: string
  address?: BusinessAddress
}

/**
 * Broker or dealer who arranged the movement.
 * Required only when the movement is broker/dealer initiated.
 *
 * registrationNumber is required whenever this object is supplied (may be
 * null or empty, in which case reasonForNoRegistrationNumber is required in
 * its place — mutually exclusive with a valid registrationNumber, same
 * pattern as CarrierDetails).
 */
export type BrokerDetails = {
  organisationName: string
  registrationNumber: string | null
  reasonForNoRegistrationNumber?: CarrierReasonForNoRegistrationNumber
  emailAddress?: string
  phoneNumber?: string
  address?: BusinessAddress
}

/**
 * Driver performing a collection or delivery event.
 * Distinct from the carrier organisation. Currently carries name only —
 * full driver model to be defined as the spec matures.
 */
export type DriverDetails = {
  name?: string
}
