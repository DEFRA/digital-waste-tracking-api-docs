---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Collections

This section documents Phase 2 of Digital Waste Tracking: extending the service from receipt only to the whole waste movement journey. It supports user research with carriers, receivers, drivers, brokers and producers, and gives the software providers building on the API one place to follow the design as it evolves.

Phase 2 is being built and tested in beta releases (`/beta-1`, `/beta-2`, …) alongside the live service. Pages here describe work in progress; where something is unsettled, it is flagged as such.

## What we are designing

The live service — the [Receipt of Waste API](https://defra.github.io/waste-tracking-service/production/api-landing-page/) — records waste when it arrives at a receiving site. Phase 2 covers the journey from creation to receipt, around four business events:

- **Create a movement** — a producer, broker or carrier records a planned waste movement and gets a Movement ID.
- **Record a collection** — the carrier records that the waste has been picked up. A driver-to-driver handover is recorded as a further collection event on the same movement ([D-029](decisions.md#d-029)).
- **Record a delivery** — the carrier records that the waste has been handed over at a site, and gets a Delivery ID covering one or more movements delivered together ([D-007](decisions.md#d-007)).
- **Record a receipt** — the receiver records what arrived, against the Delivery ID (`POST /deliveries/{deliveryId}/receipt`). Where no delivery was recorded at all, `POST /receipts` records the receipt and creates an empty Delivery to give it a reference ([D-041](decisions.md#d-041)). Whether the live Phase 1 receipt is extended instead is still open ([D-022](decisions.md#d-022)).

A separate read-only query will let a producer see what happened to their waste ([D-019](decisions.md#d-019)).

## How this section is organised

[**Decisions.**](decisions.md) The register of design decisions, open questions and parked items, grouped into waste business rules and technical design. The fastest way in for anyone joining.

[**API.**](../api/index.md) The API built in steps: the beta-1 and beta-2 specs as served today, and the target design they lead towards.

[**Glossary.**](glossary.md) The vocabulary for identifiers and actors: Movement ID, Delivery ID, `wasteTrackingId`, what counts as a broker, and so on.

[**Data model.**](model/README.md) The storage proposals for Phase 2 events, still being evaluated ([D-037](decisions.md#d-037)).

[**Scenarios.**](scenarios/beta-1/index.md) The behaviour each beta-1 endpoint is expected to show, written as Gherkin features.

[**Assessment feedback.**](phase2/assessment-feedback.md) Advice from the GDS alpha assessment and how each point maps to current findings and decisions.

## Where to start

If you are a software provider or developer integrating with the API, start with the [API overview](../api/index.md). If you are joining the project, start with the [decisions register](decisions.md).

## Status

| Area | Status |
| --- | --- |
| beta-1 | Served on integration: all five journey endpoints, no data validation. |
| beta-2 | Served on integration and being extended: fields and validation added a resource at a time. |
| Target design | `openapi.yaml`, subject to change. Updates (`PUT`) are planned for beta-3 and reads for beta-4 ([versioning schedule](../api/versioning-schedule.md)). |
| Phase 1 receipt | Live and unchanged until a migration to Phase 2 is documented ([D-023](decisions.md#d-023)). |
| Data model | Three storage options under evaluation ([D-037](decisions.md#d-037)). |
