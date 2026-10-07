---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Data model

The entities, identifiers, and state transitions underlying the extended API.

## Status

Three storage models for Phase 2 are under evaluation, and none is decided yet ([D-037](../decisions.md#d-037)). Beta-1 and beta-2 currently keep two minimal collections, `movements` and `deliveries`, holding IDs, the organisation and timestamps. The [API overview](../../api/index.md) and the decisions register remain the primary drivers; the model follows them.

## What will be here

This folder is expected to grow into:

- An entity-relationship view of the main aggregates — Movement, Collection, Delivery, Receipt — and the reference data they depend on.
- A journey state diagram showing how events move a Movement between states (planned → collected → in transit → delivered → accepted, rejected or partly accepted). The receipt outcomes depend on [D-025](../decisions.md#d-025).
- A reconciliation view of how Phase 1 receipt entities (`wasteItem`, `wasteReceiver`, etc.) map to the entities introduced by the new endpoints.

The OpenAPI spec defines the wire shapes; this workstream describes the storage and lifecycle shape that may back them.

## Current proposals

- [Phase 1 movement store](./phase1-waste-inputs.md) - what the current `waste-inputs` / `waste-inputs-history` collections store, how revisioning works, and how they may be retained during migration.
- [Mongo schema proposal](./mongo-schema-proposal.md) - Option A: proposed current-state collections, history collections, document shapes, and index list for Movements and Deliveries, including event-level organisation provenance.
- [Mongo schema proposal — Per-event-type collections](./mongo-schema-proposal-per-event.md) - Option B: one collection per business event type (movement-creations, collection-events, deliveries, receipt-events); under evaluation alongside the aggregate model above.
- [Mongo schema proposal — CQRS / Event Sourcing](./mongo-schema-proposal-CQRS.md) - Option C: append-only event store with derived projections; under evaluation, pending a spike ([D-037](../decisions.md#d-037)).

## Working assumption

The relationship between the public and internal identifiers is treated as established: the Movement ID is durable and immutable; the internal event IDs (creation, collection, delivery event, receipt) are per event and can multiply per Movement; a Delivery ID covers one or more Movements at a single handover, and a Movement can be on more than one Delivery ([D-007](../decisions.md#d-007), [D-012](../decisions.md#d-012)). How transit collection events are stored is open ([D-035](../decisions.md#d-035)).
