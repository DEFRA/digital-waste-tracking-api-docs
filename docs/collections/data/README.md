---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Draft schemas (planning reference)

The Joi schemas and worked examples in this folder are a **planning reference** for the resources still to be built in beta-2 and later releases. They are not a contract and no service runs them: the beta endpoints validate against JSON Schema in `waste-movement-backend` ([D-052](../decisions.md#d-052)), and Joi is used only by the live Phase 1 receipt endpoints.

## What is here

| Files | Holds |
| --- | --- |
| `creationJoi.js`, `collectionJoi.js`, `deliveryJoi.js`, `receiptJoi.js`, `receiptWithoutDeliveryJoi.js` | Draft request shapes and rules per event: required fields, either/or pairs, conditional rules |
| `sharedSchemas.js` | Draft shapes shared across events: carrier, receiver site, waste item, weight, treatments, POPs and hazardous components |
| `validators.js` | Format checks (postcodes, registration and permit numbers, consignment codes) and the event-chain rules (soft-delete blocks) used by the drafts |
| `*Event.js` | Worked example payloads for each event |

## How it differs from the target

The drafts stopped being updated when the backend schemas became the source of truth, so they lag the [target spec](../../api/openapi.md) and the [decisions register](../decisions.md). Known differences:

| In the drafts | In the target |
| --- | --- |
| Flat `emailAddress` / `phoneNumber` on each party | A `contactDetails` object, required on every party except a household producer ([D-008](../decisions.md#d-008)) |
| `otherReferencesForMovement` | `supportingReferences`, with a fixed list of labels ([D-048](../decisions.md#d-048)) |
| `brokerOrDealer` as a single object | `brokerOrDealer: { isPresent, items[] }` ([D-008](../decisions.md#d-008)) |
| `intendedReceivers` required only for hazardous waste, each with an `address` | `intendedReceivers` always required, each with a `receiptAddress` ([D-043](../decisions.md#d-043)) |
| Intended carriers with only `meansOfTransport`, `organisationName` and contact details required | The full carrier rules from creation: a registration number or a reason, and a vehicle registration for Road ([D-045](../decisions.md#d-045)) |
| `producer.councilMovement` | Not on the producer; parked as an open question ([D-049](../decisions.md#d-049)) |
| Producer with flat fields (already marked `@deprecated`) | The beta-2 producer schema, by waste source ([D-047](../decisions.md#d-047)) |
| Transit collection editing and soft-delete rules (tail only) | Still open ([D-035](../decisions.md#d-035)) |

Where the drafts and the target disagree, the target wins. The precise rules for a field live in the target spec's descriptions, the decisions register, and — for formats — `waste-movement-utils` (`src/constants/regexes.js`), which the live service uses.

## Using it

When a resource is picked up for a beta release, read its draft here for the rules to carry over, check each against the target spec and the register, then write the rules into the backend JSON Schema. Once the resource has landed in the backend schemas, delete its draft from this folder — the goal is for this folder to disappear.

There are no tests for these files: a test would only check that a draft nobody runs agrees with itself.
