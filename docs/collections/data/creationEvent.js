/**
 * Example payloads for the Create Movement event.
 * POST /movements
 *
 * Mirrors the structure of receiptEvent.js — individual named exports for each
 * sub-object so tests can compose or override parts independently.
 *
 * Creation-specific alignment notes:
 * - apiCode is present as per Receipt.
 * - plannedCollectionTime (renamed from estimatedDateTimeCollected) follows the Receipt date/time naming style.
 * - Object names are producer, carrier, brokerOrDealer and receiver.
 * - wasteItems use Creation's own shape (D-042): classification is nested; weight, numberOfContainers,
 *   typeOfContainers and physicalForm stay top-level. intendedTreatments is mandatory at Creation
 *   (min 1) — the Intended Treatment. The receiver confirms actualTreatments (Actual Treatment) at
 *   Receipt (D-031 amended).
 * - carrier follows the Receipt carrier structure, but Creation requires only meansOfTransport and
 *   organisationName. Optional carrier fields still retain integrity rules when supplied.
 *   This example includes extra carrier details.
 * - producer.organisationName/address are required for Commercial and Municipal, forbidden for
 *   Household; producer.authorisationNumber is optional for Commercial and Municipal.
 * - brokerOrDealer.registrationNumber is required whenever brokerOrDealer is supplied, with
 *   reasonForNoRegistrationNumber required in its place when null/empty.
 * - receiver.siteName is mandatory whenever receiver is supplied.
 * - collectionAddressDifferentFromProducer / collectionSite: planning-time fields for where the
 *   waste will be collected from, if not the producer's address.
 */

// ---------------------------------------------------------------------------
// Sub-objects
// ---------------------------------------------------------------------------

export const producer = {
  wasteSource: 'Commercial',
  organisationName: 'ACME Waste Producers Ltd',
  authorisationNumber: 'EAS/P/123456',
  address: {
    fullAddress: '10 Industrial Way, Test City',
    postcode: 'TE1 2PQ'
  },
  emailAddress: 'producer@example.com',
  phoneNumber: '01234567890',
  sicCode: '38110', // Collection of non-hazardous waste
  councilMovement: false
}

export const municipalProducer = {
  wasteSource: 'Municipal',
  organisationName: 'Test Council',
  address: {
    fullAddress: 'Council Depot, Test City',
    postcode: 'TE1 5CD'
  },
  emailAddress: 'waste.services@example.gov.uk',
  phoneNumber: '01234567890',
  councilMovement: true
}

export const carrier = {
  registrationNumber: 'CBDU123456',
  organisationName: 'Test Carrier Ltd',
  address: {
    fullAddress: '1 Carrier Way, Test City',
    postcode: 'TE1 1ST'
  },
  emailAddress: 'carrier@example.com',
  phoneNumber: '01234567890',
  meansOfTransport: 'Road',
  vehicleRegistration: 'AB12 CDE'
}

// Minimal valid carrier at Creation — meansOfTransport and organisationName are the
// only mandatory carrier fields.
// vehicleRegistration is optional for Road at Creation, but if provided it is only valid for Road.
export const minimalCreationCarrier = {
  meansOfTransport: 'Road',
  organisationName: 'Test Carrier Ltd'
}

// reasonForNoRegistrationNumber is optional at Creation, but must not be supplied
// together with a valid registrationNumber.
// otherMeansOfTransport is optional, but only valid when meansOfTransport is Other.
export const carrierWithoutRegistrationNumber = {
  meansOfTransport: 'Other',
  organisationName: 'Test Carrier Ltd',
  reasonForNoRegistrationNumber: 'ONE_OFF',
  otherMeansOfTransport: 'Trailer moved by site equipment'
}

// registrationNumber is required whenever brokerOrDealer is supplied.
export const brokerOrDealer = {
  organisationName: 'Broker Demo Ltd',
  registrationNumber: 'CBDU654321',
  address: {
    fullAddress: '2 Broker Yard, Test City',
    postcode: 'TE1 1ST'
  },
  emailAddress: 'broker@example.com',
  phoneNumber: '01112223333'
}

// The other side of registrationNumber/reasonForNoRegistrationNumber mutual exclusivity:
// registrationNumber must still be supplied (as the key), but null or empty, with
// reasonForNoRegistrationNumber required in its place.
export const brokerOrDealerWithoutRegistrationNumber = {
  organisationName: 'Broker Demo Ltd',
  registrationNumber: null,
  reasonForNoRegistrationNumber: 'ONE_OFF',
  address: {
    fullAddress: '2 Broker Yard, Test City',
    postcode: 'TE1 1ST'
  },
  emailAddress: 'broker@example.com',
  phoneNumber: '01112223333'
}

// Required at Creation only for hazardous waste. siteName is mandatory whenever
// receiver is supplied, which makes authorisationNumber and address mandatory too.
export const receiver = {
  siteName: 'Test Receiver Site',
  authorisationNumber: 'HP3456XX',
  emailAddress: 'receiver@example.com',
  phoneNumber: '01234567890',
  address: {
    fullAddress: '99 Receiver Road, Test City',
    postcode: 'TE1 3RX'
  }
}

// Planning-time collection address, when different from producer.address.
// Same shape as Collection's own collectionSite.address — both fullAddress and postcode required.
export const collectionSite = {
  fullAddress: '77 Alternative Collection Yard, Test City',
  postcode: 'TE3 9XZ'
}

export const wasteItems = [
  {
    weight: {
      metric: 'Tonnes',
      amount: 0.5,
      isEstimate: true
    },
    numberOfContainers: 4,
    typeOfContainers: 'SKI',
    physicalForm: 'Solid',
    // Waste classification (D-042) — nested, distinct from the top-level logistics fields above.
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
            // Plain concentration value (mutually exclusive with concentrationThreshold).
            name: 'Mercury',
            concentration: 5
          }
        ]
      }
    },
    // Intended Treatment (D-031 amended) — mandatory at Creation, min 1.
    // The receiver confirms the authoritative Actual Treatment (actualTreatments) at Receipt.
    intendedTreatments: [
      {
        disposalOrRecoveryCode: 'R1',
        weight: {
          metric: 'Tonnes',
          amount: 0.5,
          isEstimate: true
        }
      }
    ]
  },
  {
    weight: {
      metric: 'Kilograms',
      amount: 250,
      isEstimate: false
    },
    numberOfContainers: 10,
    typeOfContainers: 'DRU',
    physicalForm: 'Solid',
    classification: {
      ewcCodes: ['170504'],
      wasteDescription: 'Soil and stones from a contaminated site',
      containsPops: true,
      pops: {
        sourceOfComponents: 'OWN_TESTING',
        components: [
          {
            code: 'PFOA',
            // Concentration expressed as a threshold instead of a plain value
            // (mutually exclusive with concentration) — a different item to
            // the plain-concentration example above.
            concentrationThreshold: {
              operator: 'LESS_THAN',
              value: 0.001
            }
          }
        ]
      },
      containsHazardous: true,
      hazardous: {
        sourceOfComponents: 'OWN_TESTING',
        hazCodes: ['HP_8'],
        components: [
          {
            // name omitted — concentrationThreshold is only usable when name is
            // absent, since concentration (not concentrationThreshold) is the
            // field required when name is supplied.
            concentrationThreshold: {
              operator: 'GREATER_THAN_OR_EQUAL',
              value: 0.5
            }
          }
        ]
      }
    },
    intendedTreatments: [
      {
        disposalOrRecoveryCode: 'R4',
        weight: {
          metric: 'Kilograms',
          amount: 250,
          isEstimate: false
        }
      }
    ]
  }
]

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

// Carrier-initiated movement (no brokerOrDealer). collectionAddressDifferentFromProducer
// omitted — defaults to false, meaning collection is planned at producer.address.
export const publicPostBody = {
  apiCode: '25b14080-5e77-4f91-9957-2482a0cb8775',
  plannedCollectionTime: '2025-09-15T08:00:00Z',
  hazardousWasteConsignmentCode: 'CJ123E/A0001',
  yourUniqueReference: 'CARRIER-JOB-001',
  otherReferencesForMovement: [
    {
      label: 'purchaseOrderNumber',
      reference: 'PO-98765'
    }
  ],
  specialHandlingRequirements: 'Handle with care and keep upright.',
  isDeleted: false,
  producer,
  carrier,
  receiver,
  wasteItems
  // brokerOrDealer omitted — optional
}

// Broker/dealer-initiated movement
export const brokerInitiatedPostBody = {
  ...publicPostBody,
  brokerOrDealer
}

// Minimal Creation carrier example inside an otherwise valid hazardous movement.
export const minimalCarrierPostBody = {
  ...publicPostBody,
  carrier: minimalCreationCarrier
}

// collectionAddressDifferentFromProducer true — collectionSite is then required.
export const postBodyWithDifferentCollectionAddress = {
  ...publicPostBody,
  collectionAddressDifferentFromProducer: true,
  collectionSite
}

// ---------------------------------------------------------------------------
// Variant: household waste (simpler producer, no org/permit/SIC fields)
// ---------------------------------------------------------------------------

export const householdProducer = {
  wasteSource: 'Household',
  councilMovement: true
  // organisationName, authorisationNumber, sicCode, emailAddress, phoneNumber, address — all forbidden for Household
}

// ---------------------------------------------------------------------------
// Variant: non-hazardous movement — receiver optional
// ---------------------------------------------------------------------------

export const nonHazardousWasteItems = [
  {
    weight: {
      metric: 'Tonnes',
      amount: 0.2,
      isEstimate: true
    },
    numberOfContainers: 2,
    typeOfContainers: 'BAG',
    physicalForm: 'Solid',
    classification: {
      ewcCodes: ['200101'],
      wasteDescription: 'Paper and cardboard',
      containsPops: false,
      containsHazardous: false
    },
    // Intended Treatment (D-031 amended) — mandatory at Creation, min 1.
    intendedTreatments: [
      {
        disposalOrRecoveryCode: 'R3',
        weight: {
          metric: 'Tonnes',
          amount: 0.2,
          isEstimate: true
        }
      }
    ]
  }
]

export const nonHazardousPostBodyWithoutReceiver = {
  apiCode: '25b14080-5e77-4f91-9957-2482a0cb8775',
  plannedCollectionTime: '2025-09-15T08:00:00Z',
  yourUniqueReference: 'CARRIER-JOB-002',
  isDeleted: false,
  producer,
  carrier: minimalCreationCarrier,
  wasteItems: nonHazardousWasteItems
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

// Server mints and returns the Movement ID
export const createMovementResponse = {
  movementId: '25HRA0B2'
}

export const createMovementResponseWithWarnings = {
  movementId: '25HRA0B2',
  validation: {
    warnings: [
      {
        key: 'receiver.authorisationNumber',
        errorType: 'NotProvided',
        message: 'Receiver authorisation number was not provided at creation.'
      }
    ]
  }
}
