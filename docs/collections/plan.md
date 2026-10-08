---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Phase 2 — Cross-Team Plan

How the teams deliver the waste movement journey, and what is blocking what. For what is being designed, start with the [collections overview](index.md); for the contract, the [API overview](../api/index.md); for the reasoning, the [decisions register](decisions.md).

---

## The four events

| Event | Actor | Endpoint |
| --- | --- | --- |
| **Create a movement** | Producer, broker or carrier | `POST /movements` |
| **Record a collection** | Carrier — driver in real time, or recorded afterwards | `POST /movements/{movementId}/collection` |
| **Record a delivery** | Carrier | `POST /deliveries` |
| **Record a receipt** | Receiver | `POST /deliveries/{deliveryId}/receipt`, or `POST /receipts` when there is no prior delivery |

During beta every endpoint is served under a version prefix — `/beta-1/movements`, `/beta-2/movements` — and the prefix is dropped at general availability ([D-038](decisions.md#d-038)).

---

## Team ownership

| Repo | Phase 2 work | Team |
| --- | --- | --- |
| `waste-movement-external-api` | Public beta routes: authentication, `apiCode` → organisation lookup, forwarding to the backend. No payload validation of its own. | **Team A/C** |
| `waste-movement-backend` | JSON Schemas for every request and response ([D-052](decisions.md#d-052)), validation, business rules, persistence | **Team A/C** |
| `waste-tracking-id-backend` | Movement and Delivery IDs, from the same sequence as the Phase 1 `wasteTrackingId` ([D-013](decisions.md#d-013)) | **Team A/C** |
| `waste-organisation-backend` | `apiCode` issuance and lookup for every actor type ([D-027](decisions.md#d-027)) | **Team B** |
| `waste-organisation-frontend` | Self-service API code management, already open to every actor type | **Team B** |
| `digital-waste-tracking-api-docs` | Target spec, synced beta specs and schemas, decisions register | **Team C** |

---

## Release plan

Releases follow the [versioning schedule](../api/versioning-schedule.md). The decisions each one depends on:

| Release | Scope | Status | Depends on |
| --- | --- | --- | --- |
| beta-1 | All five journey endpoints, no data validation — tests identifiers and structure | Served on integration | — |
| beta-2 | Fields and full validation, a resource at a time, plus rejection | In progress: producer, broker or dealer, references and handling requirements built | Hazardous split ([D-010](decisions.md#d-010)); rejection model ([D-025](decisions.md#d-025)); warnings vs confirmation ([D-046](decisions.md#d-046)); cross-check rules ([D-021](decisions.md#d-021)) |
| beta-3 | Updates and soft-delete (`PUT`) | Not started | [D-009](decisions.md#d-009), [D-017](decisions.md#d-017), [D-034](decisions.md#d-034), [D-036](decisions.md#d-036); transit collection editing ([D-035](decisions.md#d-035)); storage model ([D-037](decisions.md#d-037)); specific 404 types ([D-014](decisions.md#d-014)) |
| beta-4 | Reads (`GET`) | Not started | [D-033](decisions.md#d-033); fate-of-waste content and access ([D-019](decisions.md#d-019)) |
| beta-5 | Final iterations from provider feedback | Not started | — |

Alongside the releases: how receipts link to Deliveries — new endpoints or an extended Phase 1 receipt ([D-022](decisions.md#d-022)) — and when and how the Phase 1 receipt endpoints are retired ([D-023](decisions.md#d-023)). The live Receipt of Waste endpoints are not changed until that migration is documented.

---

## Decisions status

### Settled and built

| Decision | Summary |
| --- | --- |
| [D-027](decisions.md#d-027) | One set of credentials per organisation — a Cognito app client plus an `apiCode` — whatever role it plays. |
| [D-036](decisions.md#d-036) | Anyone may record an event; only its author may change it. Every write is attributed to its organisation. |
| [D-013](decisions.md#d-013) | IDs are a two-digit year plus a sqids code, with no fixed length, from one shared sequence. |
| [D-016](decisions.md#d-016) | Resource-shaped URLs with HTTP methods as the verbs. |
| [D-038](decisions.md#d-038) | Versioned in the path during beta, unversioned at general availability. |
| [D-039](decisions.md#d-039) | API standards: `{ data, validation }` success envelope, RFC 9457 Problem Details for errors, `x-request-id` on every response. Source: [standards.md](../api/standards.md). |
| [D-052](decisions.md#d-052) | JSON Schemas in `waste-movement-backend` are the source of truth for every shape. |

### Settled, not yet built

| Decision | Summary | Release |
| --- | --- | --- |
| [D-010](decisions.md#d-010) | Hazardous Movements split into their own Delivery by the server. | beta-2 |
| [D-009](decisions.md#d-009) | Soft-delete with `isDeleted`, set only through `PUT`, for movements, collections, deliveries and receipts. | beta-3 |
| [D-017](decisions.md#d-017) | A recorded delivery can only be soft-deleted, not edited. | beta-3 |
| [D-034](decisions.md#d-034) | Every update keeps the previous version and guards against concurrent changes. | beta-3 |

### Open — resolve before building what they block

| Decision | Blocks | Owner |
| --- | --- | --- |
| [D-025](decisions.md#d-025) | Rejection, which the schedule puts in beta-2. | BA + policy |
| [D-022](decisions.md#d-022) | Phase 1 migration: measure the impact of new endpoints vs extending the live receipt, from a provider's point of view. | Tech lead + BA |
| [D-046](decisions.md#d-046) | The first soft data-quality check on a beta endpoint. Free to decide now, breaking later. | Tech lead + BA |
| [D-037](decisions.md#d-037) | Persistence beyond the current minimal collections — needed before beta-3. | Team C + architects |
| [D-035](decisions.md#d-035) | Storing, editing and soft-deleting transit collection events. | Team C + BA |
| [D-028](decisions.md#d-028) | Pre-reserved Delivery IDs for drivers without signal. See [proposed design](phase2/option-a-pre-reserved-delivery-IDs.md). | Team C |
| [D-019](decisions.md#d-019) | Fate-of-waste response and who may read it. | BA + policy |

The full list, including smaller open questions, is in the [decisions register index](decisions.md#index).

---

## Key cross-team interface: `apiCode` and organisation identity

Every request carries an `apiCode`: in the `x-api-code` header from beta-2, in the body on beta-1 and the Phase 1 receipt ([D-053](decisions.md#d-053)). On beta routes the gateway (`waste-movement-external-api`) looks it up in `waste-organisation-backend` and forwards only the organisation to `waste-movement-backend`, which attributes the record to it. A missing or unknown code is rejected — `401` on beta-2, `400` on beta-1; an organisation whose service charge has lapsed gets `402` ([D-027](decisions.md#d-027)).

`apiCode` issuance is not tied to the receiver role: the authentication plugin does not check `isWasteReceiver`, and `ensureAtLeastOneApiCodeExists` runs for any organisation. Carriers, brokers and producers get codes the same way receivers do. Details and test provisioning options are in [registration.md](registration.md). Cognito app clients are still provisioned manually per integrating system, using the [onboarding process](https://github.com/DEFRA/waste-tracking-service/blob/alpha_collections/docs/api-software-developer-onboarding-process.md).

---

## Next actions

| # | Action | Team |
| --- | --- | --- |
| 1 | Decide the rejection model ([D-025](decisions.md#d-025)) before beta-2 is complete | BA + policy |
| 2 | Implement the hazardous split in beta-2 ([D-010](decisions.md#d-010)) | Team C |
| 3 | Rename `reason` to `reasonForNoDeliveryId` on `POST /receipts`, and store it ([D-041](decisions.md#d-041)) | Team C |
| 4 | Decide warnings vs confirmation ([D-046](decisions.md#d-046)) before any soft check is built | Tech lead + BA |
| 5 | Compare the live receipt with the beta receipt from a provider's point of view, to measure the impact of each option in [D-022](decisions.md#d-022) | Team C + BA |
| 6 | Decide the storage model ([D-037](decisions.md#d-037)) before beta-3 | Team C + architects |
| 7 | Return the specific 404 problem types ([D-014](decisions.md#d-014)) when `PUT` is built | Team C |
| 8 | Build the `Deprecation` header ([D-038](decisions.md#d-038)) before the first beta version is retired | Team C |
