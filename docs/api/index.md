---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# API

The Digital Waste Tracking API is being built in steps. Each beta release is a stage on the way to the target design, and each has its own OpenAPI 3.1 specification:

| Step | Spec | What it covers | Viewer |
| --- | --- | --- | --- |
| beta-1 | `beta-1/openapi.json` | The first step: the five journey endpoints, with no data validation, so integrators can test identifiers and structure. Synced from the backend. | [beta-1](openapi-beta-1.md) |
| beta-2 | `beta-2/openapi.json` | The current step: the same endpoints, with fields and validation added a resource at a time. Synced from the backend. | [beta-2](openapi-beta-2.md) |
| beta-3 onwards | — | Updates, then reads, then final iterations, as set out in the [versioning schedule](versioning-schedule.md). | — |
| Target | `openapi.yaml` | Where the steps lead: the design at general availability, without a version prefix. Subject to change as the betas teach us more. | [target](openapi.md) |

The beta specs describe what is served today; the target spec describes where it is going. The [decisions register](../collections/decisions.md) explains why the contract is shaped the way it is, and what is still open.

## Where the shapes come from

Request and response shapes are JSON Schema files in `waste-movement-backend`, which the service validates against. This repo keeps a copy under `docs/event-model/schemas/`, together with the beta specs that refer to them, which are defined in the backend too ([D-052](../collections/decisions.md#d-052)). The target spec does the same wherever beta-2 already defines a shape, and describes the rest itself until it is built.

## Endpoints in the target spec

| Area | Paths | Served today |
| --- | --- | --- |
| Movement | `POST /movements`, `PUT /movements/{movementId}` | `POST`, under `/beta-1` and `/beta-2` |
| Collection | `POST /movements/{movementId}/collection`, `PUT /movements/{movementId}/collection` | `POST`, under `/beta-1` and `/beta-2` |
| Delivery | `POST /deliveries`, `PUT /deliveries/{deliveryId}` | `POST`, under `/beta-1` and `/beta-2` |
| Receipt | `POST /deliveries/{deliveryId}/receipt`, `PUT /deliveries/{deliveryId}/receipt` | `POST`, under `/beta-1` and `/beta-2` |
| Receipt without a prior delivery | `POST /receipts` | yes, under `/beta-1` and `/beta-2` |
| Receipt (Phase 1) | `POST /movements/receive`, `PUT /movements/{wasteTrackingId}/receive` | yes, live and unchanged |
| Producer query | `GET /movements/{movementId}/fate-of-waste` (proposal) | no |
| Reference data (Phase 1) | `GET /reference-data/ewc-codes`, `…/hazardous-property-codes`, `…/disposal-or-recovery-codes`, `…/container-types`, `…/pop-names` | yes, live |

URLs name resources and HTTP methods carry the verbs ([D-016](../collections/decisions.md#d-016)). Providers handle two identifiers: the Movement ID and the Delivery ID ([D-012](../collections/decisions.md#d-012)). Reads of individual events are deferred to beta-4 ([D-033](../collections/decisions.md#d-033)); updates (`PUT`) are planned for beta-3.

New endpoints follow the [API standards](standards.md): a `{ data, validation }` success envelope, [RFC 9457 Problem Details](../problems/index.md) for errors, and an `x-request-id` header on every response. From beta-2, every request carries the organisation's `apiCode` in an `x-api-code` header next to the bearer token ([D-053](../collections/decisions.md#d-053)).

## Phase 1 receipt endpoints

The live Receipt of Waste endpoints are unchanged, and their request and response bodies are defined by the live [Receipt of Waste API reference](https://defra.github.io/waste-tracking-service/production/apiSpecifications/). The target spec shows them as deprecated under the current proposal, but that depends on how receipts are linked to Deliveries ([D-022](../collections/decisions.md#d-022)), and nothing is decided about when or how they would be retired ([D-023](../collections/decisions.md#d-023)).

## Previewing a spec

Each spec has a viewer on this site (see the table above). The beta specs `$ref` the JSON Schema files, so standalone tools need the bundled version: run `npm run specs:bundle`, then open `docs/api/openapi-beta-N.yaml` in [Swagger Editor](https://editor.swagger.io) or an editor extension. The target spec is rendered as it is and is not bundled.
