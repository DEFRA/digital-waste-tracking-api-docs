---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Glossary

A reference for terms used across this section. Identifier vocabulary in particular is worth establishing up front, because several IDs look similar and refer to different things. Decision IDs (D-nnn) link to the [decisions register](decisions.md).

## Identifiers

All public identifiers share one format and one pool ([D-013](decisions.md#d-013)): a two-digit year followed by a sqids code (sqids.org), for example `25HRA0B2`. IDs are eight characters today; the format allows nine if the yearly counter needs it, so accept both. Treat every ID as opaque: never parse it for meaning. Because they come from one sequence, two different IDs are never the same string, except where a hazardous Delivery reuses its Movement ID by design.

### Movement ID

The identifier of a waste movement, minted by `POST /movements`. It is the handle for the whole journey — creation, every collection event, delivery, receipt and fate-of-waste — so software providers store it and pass it between organisations ([D-012](decisions.md#d-012)).

### Delivery ID

The identifier of one handover of waste at a site, minted by `POST /deliveries`. One Delivery ID covers one or more Movements delivered together ([D-007](decisions.md#d-007)). The driver passes it to the receiver — on paper or digitally — and the receiver records the receipt against it with `POST /deliveries/{deliveryId}/receipt`.

`POST /receipts` also mints a Delivery ID: for waste received with no earlier movement, collection or delivery recorded, the server creates an empty Delivery and returns its ID, so the receipt still has a handle ([D-041](decisions.md#d-041)).

### `wasteTrackingId`

The Phase 1 identifier, minted when waste is received through `POST /movements/receive`. Phase 1 had no creation event, so this was the only handle on a received load. It is not a Movement ID ([D-004](decisions.md#d-004)). Whether and how a Phase 1 record maps to a Phase 2 Movement is part of the migration ([D-024](decisions.md#d-024)).

### WT-ID

A term from early Phase 1 documentation for the `wasteTrackingId`. Mentioned so readers of older documents recognise it. It is **not** another name for the Movement ID.

### Event IDs (internal)

Each event — creation, every collection event, delivery, receipt — also has an internal ID used for storage and audit. These are never returned by the API ([D-012](decisions.md#d-012)). Whether collection events need a public ID of their own is open ([D-035](decisions.md#d-035)). To avoid a clash with the public Delivery ID, the delivery event's internal ID is called the **Delivery Event ID** here.

## Resource hierarchy

The API has two top-level resources, Movements and Deliveries, each with an event recorded under it ([D-016](decisions.md#d-016)):

```
/movements/{movementId}               ← the movement, created once
/movements/{movementId}/collection    ← one or more collection events, in order
/deliveries/{deliveryId}              ← one handover, listing its Movement IDs
/deliveries/{deliveryId}/receipt      ← exactly one receipt per Delivery
```

How they relate ([D-015](decisions.md#d-015)):

- **Several pickups are several Movements.** A driver collecting from three producers in one run creates three Movements, each with its own collection event.
- **A handover adds a collection event.** A driver-to-driver handover is a further `TRANSIT` collection event on the same Movement, not a new Movement ([D-029](decisions.md#d-029)).
- **A Delivery can cover several Movements, and a Movement can be on several Deliveries** — for example one collection with several waste streams going to different receivers ([D-007](decisions.md#d-007)).
- **Hazardous Movements are delivered on their own.** The server splits a mixed request: each hazardous Movement becomes its own Delivery, whose Delivery ID is the Movement ID ([D-010](decisions.md#d-010)).
- **A Delivery can have no Movements** — the empty Delivery created by `POST /receipts` ([D-041](decisions.md#d-041)).
- **One receipt per Delivery.** Whether the load is accepted, rejected or partly accepted, the outcome is recorded on that one receipt; the Movement is not split. How the outcome is recorded is open ([D-025](decisions.md#d-025)).

A recorded delivery cannot be edited, only soft-deleted; to correct one, soft-delete it and record a new one ([D-017](decisions.md#d-017)).

## Actors and roles

### Producer

The party the waste comes from, recorded on the movement at creation. What is recorded depends on the **waste source** ([D-047](decisions.md#d-047)):

- **Household** — no producer details at all.
- **Commercial** — organisation name, SIC code, address, contact details, and an authorisation number or a reason for not having one.
- **Municipal** — as commercial, with the SIC code optional.

Whether a movement made by or for a local council needs flagging is open ([D-049](decisions.md#d-049)).

### Carrier

The party physically moving the waste. At creation the movement declares one or more **intended carriers** ([D-045](decisions.md#d-045)); every later event — collection, delivery, receipt — records the actual `carrier` ([D-008](decisions.md#d-008)). Carriers hold a waste carrier registration, such as a CBDU number in England and Wales, or give a reason for not having one.

### Broker or dealer

A party who arranges a movement without handling the waste. Optional at creation, collection and receipt, and not captured at delivery ([D-008](decisions.md#d-008)). Recorded as `brokerOrDealer`: `isPresent` says whether one was involved, and `items` lists them — more than one can be declared.

### Driver

The person operating the vehicle for a carrier. Treated as part of the carrier, not as a separate party; the API records no driver details.

### Receiver

The party operating the site where waste is received. Holds an environmental permit or equivalent authorisation that determines which waste it may accept. Records the receipt and the actual treatment. At creation, every movement declares its **intended receivers** ([D-043](decisions.md#d-043)); the site that actually received the waste is recorded on the receipt as `receiver`.

### Submitting organisation

The organisation a request is made for, identified by its `apiCode` — sent in the `x-api-code` header from beta-2, in the body on beta-1 and the Phase 1 receipt ([D-053](decisions.md#d-053)). Every record is attributed to it, whatever role it is playing ([D-027](decisions.md#d-027)); only the organisation that recorded an event may change it ([D-036](decisions.md#d-036)).

## Journey terms

### Collection event

The record of waste passing into a carrier's care, under `POST /movements/{movementId}/collection`. The first event on a Movement is a `STATIC` pickup from the producer; each later event is a `TRANSIT` handover from one carrier to another, naming the carrier it came from in `receivedFromCarrier` ([D-029](decisions.md#d-029)). Collection events carry no waste details ([D-032](decisions.md#d-032)).

### Delivery

The record of waste handed over at a site, under `POST /deliveries`. It names the Movements delivered, the carrier, when, and the site with its address ([D-018](decisions.md#d-018)).

### Receipt

The record of waste arriving at a receiving site, under `POST /deliveries/{deliveryId}/receipt` — or `POST /receipts` when there is no prior delivery, in which case a `reasonForNoDeliveryId` is required ([D-041](decisions.md#d-041)). The receipt records actual weights and treatments. Whether the live Phase 1 receipt is extended instead of these endpoints is open ([D-022](decisions.md#d-022)).

### Cross-check

The comparison of a receipt with what was declared earlier: its waste against the movements' creation records, and its carrier against the carrier recorded earlier in the journey ([D-006](decisions.md#d-006)). A mismatch does not stop the receipt being recorded. What counts as a mismatch ([D-021](decisions.md#d-021)), and whether mismatches are returned as warnings or must be confirmed ([D-046](decisions.md#d-046)), is open.

### Fate of waste

A read-only view for the producer of what happened to their waste, through `GET /movements/{movementId}/fate-of-waste`. What it shows, and who may read it, is open ([D-019](decisions.md#d-019)).

### Intended Treatment

The disposal or recovery treatment planned for a waste item at creation, in `wasteItems[].intendedTreatments` — a code and the weight treated under it. Required ([D-031](decisions.md#d-031)).

### Actual Treatment

The disposal or recovery treatment confirmed at receipt, in `wasteItems[].actualTreatments`. Optional — a site may need to inspect the waste before confirming — and authoritative: it may differ from the intended treatment ([D-031](decisions.md#d-031)).

### Supporting references

The provider's own references for a movement — purchase order, weighbridge ticket, invoice and so on — as `{ label, reference }` pairs, accepted on every write endpoint ([D-048](decisions.md#d-048)).

### Contact details

Every party except a household producer carries a `contactDetails` object with an email address, a phone number, or both ([D-008](decisions.md#d-008)).

### Soft-delete

Withdrawing an event recorded in error by setting `isDeleted: true` through its `PUT`. Nothing is ever hard-deleted; movements, collections, deliveries and receipts can all be soft-deleted ([D-009](decisions.md#d-009)).
