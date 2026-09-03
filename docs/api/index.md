---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# API

The OpenAPI specification for the extended Digital Waste Tracking API. It will eventually feed the [data model](../collections/model/README.md).

## What is here

- `openapi.yaml` — the specification. A single OpenAPI 3.0.3 file covering the new endpoints alongside the Phase 1 receipt and reference data endpoints, preserved verbatim.

## Surface area

The current draft covers fifteen paths:

| Area | Paths |
| --- | --- |
| Movement | `POST /movements`, `GET /movements/{movementId}`, `PUT /movements/{movementId}` |
| Collection | `POST /movements/{movementId}/collection`, `GET /movements/{movementId}/collection`, `PUT /movements/{movementId}/collection` |
| Delivery (drop-off) | `POST /deliveries`, `GET /deliveries/{deliveryId}`, `PUT /deliveries/{deliveryId}` |
| Receipt | `POST /deliveries/{deliveryId}/receipt`, `GET /deliveries/{deliveryId}/receipt`, `PUT /deliveries/{deliveryId}/receipt` |
| Receipt (Phase 1, deprecated) | `POST /movements/receive`, `PUT /movements/{id}/receive` |
| Producer query | `GET /movements/{movementId}/fate-of-waste` |
| Reference data (Phase 1) | `GET /reference-data/ewc-codes`, `GET /reference-data/hazardous-property-codes`, `GET /reference-data/disposal-or-recovery-codes`, `GET /reference-data/container-types`, `GET /reference-data/pop-names` |

The spec follows the Richardson Maturity Model Level 2 — URLs name resources, HTTP methods carry the verbs. Two public identifiers exist in the API contract: Movement ID and Delivery ID. The Movement is the unit of waste being moved (1:1 with its Collection event); the Delivery is the drop-off event at a receiver site (1:1 with its Receipt, but can aggregate multiple Movements). See the [resource hierarchy section in the glossary](../collections/glossary.md#resource-hierarchy) for more.

Phase 1 endpoints are kept exactly as published. The single change in their behaviour is an optional `deliveryId` field on the receipt request body, which links a receipt to an upstream drop-off when the carrier has recorded one. The Phase 1 receipt endpoints (`POST /movements/receive`, `PUT /movements/{id}/receive`) are marked `deprecated: true` in the spec — new integrations should use the Delivery-scoped endpoints above. A removal timeline is yet to be agreed (see the [decisions register](../collections/decisions.md)).

## Status

The spec is in alpha and being iterated alongside data-model work. Several schemas (waste classification, hazardous codes, POPs codes, party details) are deliberately permissive placeholders pending domain detail from the BA. A number of design points are still open and tracked in the [decisions register](../collections/decisions.md).

The vocabulary used across the spec — Movement ID, Delivery ID, the per-event IDs, what counts as a broker — is documented in the [glossary](../collections/glossary.md).

## Previewing the spec

The YAML can be previewed in any standard OpenAPI tool. Two options:

- **[Swagger Editor](https://editor.swagger.io)** — paste the contents of `openapi.yaml` to get a rendered Swagger UI on the right.
- **VS Code** — the OpenAPI (Swagger) Editor extension by 42Crunch adds a preview pane that updates live as the YAML is edited.

An inline viewer is also available on this site: [open the OpenAPI viewer](openapi.md).
