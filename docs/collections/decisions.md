---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Decisions

A register of design decisions for Phase 2 of Digital Waste Tracking — the waste movement journey from creation through collection and delivery to receipt — together with the open questions and parked items that go with them. Anyone joining the work should be able to read this page and know what is settled, what is still being worked through, and what has been deliberately deferred.

## How to read this register

Entries are grouped in two parts:

- **Part A — Waste business rules.** What the service records about a waste movement and the rules a movement must follow. These are the decisions to check with the BA and policy team.
- **Part B — Technical and API design.** How the API exposes those rules: specs, URLs, identifiers, conventions, versioning, identity and storage.

Each entry has a short context, the decision, and its consequences. The line under each title carries:

- **ID** — `D-001`, `D-002`, … assigned in the order the decision was first recorded, never reused or renumbered, so it is safe to cite elsewhere. D-020 and D-026 were never used.
- **Status** — ✅ Decided, ⏳ Open, ⏸️ Parked, or 🗄️ Retired. A retired entry was superseded or became obsolete; it stays as a one-line tombstone pointing at what replaced it, so existing links keep working.
- **Impact** — structural dependency: how much of the contract or how many other decisions rest on this one. Not urgency.
- **Built in** — where the decision is implemented today: `beta-1`, `beta-2`, `Not yet` (with the target release from the [versioning schedule](../api/versioning-schedule.md) where known), or `n/a` for decisions about documentation or process.

Three documents describe the API, and they answer different questions:

| Document | Answers |
| --- | --- |
| [`openapi-beta-1.yaml`](../api/openapi-beta-1.md), [`openapi-beta-2.yaml`](../api/openapi-beta-2.md) | What is served today. Built from the JSON Schemas synced from `waste-movement-backend`. |
| [`openapi.yaml`](../api/openapi.md) | The target design for general availability. Subject to change. |
| This register | Why the contract is shaped the way it is, and what is still undecided. |

<!-- prettier-ignore -->
!!! note "Review in progress"
    The register is being re-checked group by group against what is built in beta-1 and beta-2. Entries under [Awaiting review](#awaiting-review) have not been re-checked yet and may still contain stale statements.

## Index

| ID | Decision | Group | Status | Impact | Built in |
| --- | --- | --- | --- | --- | --- |
| D-007 | [Delivery aggregates one or more Movements; a Movement may be on more than one Delivery](#d-007) | A1 | ✅ Decided | 🔴 High | beta-1 |
| D-015 | [Movement ↔ Collection is one or more ordered events; Delivery ↔ Receipt is 1:1](#d-015) | A1 | ✅ Decided | 🔴 High | Not yet |
| D-041 | [Receipt with no prior Delivery: `POST /receipts`, the server creates an empty Delivery](#d-041) | A1 | ✅ Decided | 🔴 High | beta-1 (gap: field name) |
| D-010 | [Hazardous Movements are split into their own Delivery by the server](#d-010) | A1 | ✅ Decided | 🟠 Medium | Not yet (beta-2, in progress) |
| D-029 | [Transit collection (driver to driver) is a further collection event on the same Movement](#d-029) | A1 | ✅ Decided | 🟠 Medium | Not yet |
| D-008 | [Who is declared at each event: a carrier always, a broker or dealer optionally](#d-008) | A2 | ✅ Decided | 🟠 Medium | Partly (beta-2) |
| D-043 | [Creation declares intended receiving sites as an array: `receivers`](#d-043) | A2 | ✅ Decided | 🟢 Low | Not yet |
| D-045 | [Creation declares intended carriers as an array: `intendedCarriers`](#d-045) | A2 | ✅ Decided | 🟢 Low | Not yet |
| D-047 | [The producer is described by waste source: Household, Commercial or Municipal](#d-047) | A2 | ✅ Decided | 🟠 Medium | beta-2 |
| D-048 | [Supporting references and special handling requirements](#d-048) | A2 | ✅ Decided | 🟢 Low | beta-2 |
| D-049 | [Recording that a movement is a council movement](#d-049) | A2 | ⏳ Open | 🟢 Low | n/a |
| D-030 | [Carrier-vs-broker discriminated union on `POST /movements`](#d-030) | A2 | 🗄️ Retired | — | — |
| D-031 | [Treatment codes: intended at Creation, actual at Receipt](#d-031) | A3 | ✅ Decided | 🟠 Medium | Not yet |
| D-032 | [Waste is described at Creation and weighed at Receipt; Collection and Delivery carry no waste details](#d-032) | A3 | ✅ Decided | 🟠 Medium | beta-1 |
| D-042 | [A waste item is its classification plus logistics; the ordinary receipt carries logistics only](#d-042) | A3 | ✅ Decided | 🟠 Medium | Not yet |
| D-044 | [POP and hazardous components: a measured concentration, or how it compares with the WM3 threshold](#d-044) | A3 | ✅ Decided | 🟢 Low | Not yet |
| D-006 | [The receipt is cross-checked against what was declared earlier; mismatches do not block it](#d-006) | A4 | ✅ Decided | 🟠 Medium | Not yet |
| D-018 | [The delivery address is required when recording a delivery](#d-018) | A4 | ✅ Decided | 🟠 Medium | Not yet |
| D-025 | [How a receipt records acceptance, rejection or partial acceptance](#d-025) | A4 | ⏳ Open | 🔴 High | Not yet |
| D-046 | [Soft data-quality issues: accept with warnings, or reject and confirm](#d-046) | A4 | ⏳ Open | 🔴 High | n/a |
| D-021 | [What counts as a mismatch in the receipt cross-check](#d-021) | A4 | ⏳ Open | 🟠 Medium | n/a |
| D-009 | [Soft-delete via `isDeleted`, set only on PUT](#d-009) _(awaiting review)_ | A5 | ✅ Decided | 🟠 Medium | Not yet (beta-3) |
| D-017 | [Delivery PUT restricted to soft-delete only](#d-017) _(awaiting review)_ | A5 | ✅ Decided | 🟠 Medium | Not yet (beta-3) |
| D-035 | [Addressing an individual collection event for correction](#d-035) _(awaiting review)_ | A5 | ⏳ Open | 🟠 Medium | n/a |
| D-019 | [Fate-of-waste GET — producer journey query](#d-019) _(awaiting review)_ | A6 | ⏳ Open | 🟠 Medium | Not yet |
| D-001 | [Extend the Phase 1 Receipt API into one end-to-end spec](#d-001) _(awaiting review)_ | B1 | ✅ Decided | 🔴 High | n/a |
| D-003 | [OpenAPI 3.1.0, not 3.0.3](#d-003) _(awaiting review)_ | B1 | ✅ Decided | 🟠 Medium | n/a |
| D-002 | [Single OpenAPI file, not `$ref`-split](#d-002) _(awaiting review)_ | B1 | ✅ Decided | 🟢 Low | n/a |
| D-016 | [Level 2 (Richardson Maturity Model) resource model](#d-016) _(awaiting review)_ | B2 | ✅ Decided | 🔴 High | beta-1 |
| D-022 | [Receipt migration: new endpoint vs extend Phase 1](#d-022) _(awaiting review)_ | B2 | ✅ Decided | 🔴 High | beta-1 |
| D-005 | [Receipt is linked to a delivery via the Delivery ID](#d-005) _(awaiting review)_ | B2 | ✅ Decided | 🔴 High | beta-1 |
| D-011 | [Static and transit collection collapsed into a single endpoint](#d-011) _(awaiting review)_ | B2 | ✅ Decided | 🟢 Low | n/a |
| D-040 | [Rename drop-off and Transfer ID to delivery and Delivery ID](#d-040) _(awaiting review)_ | B2 | ✅ Decided | 🟢 Low | beta-1 |
| D-033 | [Per-event GET endpoints — parked](#d-033) _(awaiting review)_ | B2 | ⏸️ Parked | 🟢 Low | Not yet (beta-4) |
| D-012 | [Per-event IDs not exposed in the public API](#d-012) _(awaiting review)_ | B3 | ✅ Decided | 🔴 High | beta-1 |
| D-013 | [Identifier format and capacity](#d-013) _(awaiting review)_ | B3 | ✅ Decided | 🔴 High | beta-1 |
| D-004 | [Receipt path parameter stays `{wasteTrackingId}`](#d-004) _(awaiting review)_ | B3 | ✅ Decided | 🟠 Medium | n/a |
| D-024 | [`wasteTrackingId` ↔ `movementId` reconciliation](#d-024) _(awaiting review)_ | B3 | ⏳ Open | 🟠 Medium | n/a |
| D-028 | [Pre-generated Delivery IDs for offline drivers](#d-028) _(awaiting review)_ | B3 | ⏳ Open | 🟠 Medium | Not yet |
| D-039 | [Cross-cutting API standards for new endpoints](#d-039) _(awaiting review)_ | B4 | ✅ Decided | 🔴 High | beta-1 |
| D-014 | [Sub-resource 404 shape: parent-not-found vs event-not-recorded](#d-014) _(awaiting review)_ | B4 | ✅ Decided | 🟠 Medium | Partly |
| D-034 | [PUT operations use history/revision pattern across all events](#d-034) _(awaiting review)_ | B4 | ✅ Decided | 🟠 Medium | Not yet (beta-3) |
| D-038 | [API versioning: versioned during beta, unversioned at GA](#d-038) _(awaiting review)_ | B5 | ✅ Decided | 🔴 High | beta-1 |
| D-023 | [Phase 1 receipt endpoint deprecation timeline](#d-023) _(awaiting review)_ | B5 | ⏳ Open | 🟠 Medium | n/a |
| D-036 | [Write authorisation: open append, amend restricted to the authoring organisation](#d-036) _(awaiting review)_ | B6 | ✅ Decided | 🔴 High | beta-1 |
| D-027 | [Per-organisation vs per-actor API credentials](#d-027) _(awaiting review)_ | B6 | ✅ Decided | 🟠 Medium | beta-1 |
| D-037 | [Phase 2 MongoDB storage model — three options under evaluation](#d-037) _(awaiting review)_ | B7 | ⏳ Open | 🔴 High | n/a |

## Part A — Waste business rules

### A1 Journey and cardinality

<a id="d-007"></a>

#### Delivery aggregates one or more Movements; a Movement may be on more than one Delivery

**D-007** · ✅ Decided · Impact: 🔴 High · Group: **A1** · Built in: **beta-1** · Related: [D-010](#d-010), [D-015](#d-015), [D-022](#d-022), [D-025](#d-025), [D-029](#d-029)

**Context.** A driver on a multi-collection run hands several Movements to the same receiving site at once. A delivery could be scoped to one Movement — one call per Movement, or a "primary" Movement on the URL — or cover several.

**Decision.**

- `POST /deliveries` takes `movementIds[]` (at least one) in the body and records one delivery event covering all of them. No Movement is "primary".
- The same Movement ID may appear on more than one Delivery. One delivery event is one Delivery ID over one or more Movement IDs; over the life of a Movement, Movement ↔ Delivery is many-to-many.

Two expected cases of a Movement on more than one Delivery:

- a collection holding more than one waste stream, delivered to different specialist receivers;
- a load partly rejected at the first receiver, with the rejected portion taken on to a second receiver. How the rejected portion is recorded belongs to the receipt outcome model ([D-025](#d-025)).

**Consequences.** Software providers make one call per physical handover, not one per Movement. The Delivery ID is the handle the receiver uses to record the receipt ([D-022](#d-022)). Hazardous Movements are the exception to aggregation: the server splits them out ([D-010](#d-010)). Once a Movement is on any Delivery its collection sequence is closed ([D-029](#d-029)).

Built today: aggregation, and an existence check on every Movement ID (an unknown ID returns `400`). Nothing restricts a Movement to a single Delivery, which is consistent with this decision.

<a id="d-010"></a>

#### Hazardous Movements are split into their own Delivery by the server

**D-010** · ✅ Decided · Impact: 🟠 Medium · Group: **A1** · Built in: **Not yet (beta-2, in progress)** · Related: [D-007](#d-007), [D-013](#d-013), [D-042](#d-042)

**Context.** Hazardous waste travels under one consignment note from end to end, and the regulator does not want that identifier to change mid-journey, so a hazardous Movement must never be merged with others under one Delivery ID. Carriers should still be able to submit a mixed load in one call rather than splitting it themselves.

**Decision.** `movementIds` may mix hazardous and non-hazardous Movements. The server splits them:

- all non-hazardous Movements in the request go under one newly minted Delivery ID;
- each hazardous Movement becomes its own Delivery, and its Delivery ID is the Movement ID itself.

Whether a Movement is hazardous comes from the waste classification declared at Creation ([D-042](#d-042)), not from the delivery request, so the split is a server rule and is not expressed in the schema.

The response is `data.deliveries[]`, one entry per resulting Delivery, each with `deliveryId`, `movementIds[]` and `wasteType` (`HAZARDOUS` or `NON_HAZARDOUS`). A request of `['haz1', 'nh1', 'haz2', 'nh2']` returns three entries:

```json
[
  { "deliveryId": "haz1", "movementIds": ["haz1"], "wasteType": "HAZARDOUS" },
  { "deliveryId": "haz2", "movementIds": ["haz2"], "wasteType": "HAZARDOUS" },
  {
    "deliveryId": "<minted>",
    "movementIds": ["nh1", "nh2"],
    "wasteType": "NON_HAZARDOUS"
  }
]
```

**Consequences.** Mixed loads still take one call. Integrators must read every entry in `deliveries[]` and hand the receiver the right Delivery ID for each part of the load. A hazardous Delivery ID and its Movement ID are the same string by design ([D-013](#d-013)).

Built today: the response shape. Being implemented in beta-2: the split itself. Until then every request returns a single `NON_HAZARDOUS` entry with a minted Delivery ID.

<a id="d-015"></a>

#### Movement ↔ Collection is one or more ordered events; Delivery ↔ Receipt is 1:1

**D-015** · ✅ Decided · Impact: 🔴 High · Group: **A1** · Built in: **Not yet** · Related: [D-007](#d-007), [D-016](#d-016), [D-025](#d-025), [D-029](#d-029), [D-035](#d-035)

**Context.** Addressing each event under its parent ([D-016](#d-016)) depends on how the four events relate to each other.

**Decision.**

- Each Movement has one or more collection events, in order. The first is the pickup from the producer; any later ones are driver-to-driver handovers ([D-029](#d-029)).
- Each Delivery has exactly one Receipt.
- A Movement can be on one or more Deliveries ([D-007](#d-007)).
- A driver picking up from several producers creates several Movements, one per pickup. A driver dropping at several receivers creates several Deliveries.
- Whatever the outcome at the receiving site — accepted, rejected or partly accepted — it is recorded on the single Receipt. The Movement is never split or duplicated ([D-025](#d-025)).

**Consequences.** A receipt has no ID of its own: it is addressed through its Delivery (`/deliveries/{deliveryId}/receipt`). Collection events are addressed by their position under the Movement ([D-029](#d-029), [D-035](#d-035)).

Built today: the paths. None of these rules is enforced yet — the collection and receipt endpoints check that the parent exists and store nothing else.

<a id="d-029"></a>

#### Transit collection (driver to driver) is a further collection event on the same Movement

**D-029** · ✅ Decided · Impact: 🟠 Medium · Group: **A1** · Built in: **Not yet** · Related: [D-007](#d-007), [D-009](#d-009), [D-012](#d-012), [D-015](#d-015), [D-019](#d-019), [D-032](#d-032), [D-035](#d-035)

**Context.** A load may pass from one carrier to another before it is delivered. Recording the handover as a new, unlinked Movement would make a legitimate handover look like a load that was collected and never delivered, and would break the producer's fate-of-waste lookup, which only knows the original Movement ID. Chaining Movements through a `precedingMovementId` field was considered and rejected: every audit or fate-of-waste query would have to walk the chain back.

**Decision.** A handover is appended as a further collection event on the same Movement.

- `POST /movements/{movementId}/collection` appends the next event. `collectionType` is `STATIC` (the default) or `TRANSIT`.
- `receivedFromCarrier` (same shape as `carrier`) is required for `TRANSIT` and not allowed for `STATIC`.
- Among active (not soft-deleted) events, the first must be `STATIC` and every later one `TRANSIT`, so the record is one linear chain. A load is never split between two onward carriers: two loads are two Movements.
- There is no limit on the number of `TRANSIT` events.
- Events are ordered by when the server received them, not by `actualDateTimeCollected`, which can be back-filled. A timestamp earlier than the previous event's returns a warning.
- `receivedFromCarrier` is recorded but not checked against the previous event's carrier. Mismatches are left for regulators to find in the data.
- Once the Movement is on any Delivery, its collection sequence is closed: no further events, and no `PUT` — neither correction nor soft-delete.
- Before that, `PUT /movements/{movementId}/collection` corrects or soft-deletes only the latest active event. Soft-delete works from the tail: the `STATIC` event can only be deleted when it is the only active one. Correcting an earlier event is [D-035](#d-035).

**Consequences.** The Movement ID stays the single handle for the whole journey, so fate-of-waste ([D-019](#d-019)) and audits query one ID. No public per-event ID is needed: events are addressed by position, and tail-only deletion keeps positions stable ([D-012](#d-012)). Collection events carry no waste weights ([D-032](#d-032)).

Built today: nothing. Collection is a stub in beta-1 and beta-2; `collectionType` and `receivedFromCarrier` exist only in the target spec.

<a id="d-041"></a>

#### Receipt with no prior Delivery: `POST /receipts`, the server creates an empty Delivery

**D-041** · ✅ Decided · Impact: 🔴 High · Group: **A1** · Built in: **beta-1 (gap: field name)** · Related: [D-007](#d-007), [D-012](#d-012), [D-017](#d-017), [D-018](#d-018), [D-022](#d-022), [D-025](#d-025), [D-042](#d-042)

**Context.** A receipt is recorded against a Delivery ([D-022](#d-022)) and has no ID of its own ([D-012](#d-012)). Sometimes waste arrives with no earlier Movement, collection or delivery recorded digitally. A receipt with no Delivery behind it would have no handle at all: it could not be looked up, corrected, or given an outcome ([D-025](#d-025)).

**Decision.** A dedicated endpoint, `POST /receipts`:

- The request is a receipt plus a mandatory `reasonForNoDeliveryId` saying why there is no Delivery ID. Its waste items carry the full classification, because there is no Creation to take it from ([D-042](#d-042)).
- The server creates an empty Delivery (no Movement IDs) and records the receipt against it, in the same request.
- The response returns the new Delivery ID in `data.deliveryId`. From then on the receipt is addressed like any other, under `/deliveries/{deliveryId}/receipt`.
- No delivery address is asked for. The empty Delivery has none; the receiving site on the receipt records where the waste arrived ([D-018](#d-018) applies to `POST /deliveries` only).

**Consequences.**

- The software provider makes one call and never handles the empty Delivery directly. `POST /deliveries` still requires at least one Movement ID ([D-007](#d-007)); empty Deliveries are created only by this endpoint.
- The empty Delivery holds nothing that could need correcting. Corrections — including to the classification — are made to the receipt through its `PUT`, which [D-017](#d-017)'s delivery restriction does not affect.
- Meets the DWTC-140/142 scenario "Delivery ID not provided but a reason is given → a Delivery ID is provided" ([Creating a Receipt](scenarios/beta-1/receipt/creating-a-receipt.md)).

Built today: the endpoint in beta-1 and beta-2, which creates the empty Delivery and returns its ID. **Gap:** the beta schemas name the field `reason`; it is to be renamed `reasonForNoDeliveryId`. The reason is not stored yet.

### A2 Parties and references

<a id="d-008"></a>

#### Who is declared at each event: a carrier always, a broker or dealer optionally

**D-008** · ✅ Decided · Impact: 🟠 Medium · Group: **A2** · Built in: **Partly (beta-2: broker or dealer)** · Related: [D-030](#d-030), [D-045](#d-045)

**Context.** A carrier is physically involved in every movement. A broker or dealer — someone who arranges the movement without handling the waste — is involved only sometimes, and their details may need confirming at more than one stage.

**Decision.**

| Event | Carrier | Broker or dealer |
| --- | --- | --- |
| Creation (`POST /movements`) | `intendedCarriers[]`, required, at least one ([D-045](#d-045)) | `brokerOrDealer`, optional |
| Collection | `carrier`, required | `brokerOrDealer`, optional |
| Delivery | `carrier`, required | not captured |
| Receipt (both receipt endpoints) | `carrier`, required | `brokerOrDealer`, optional |

`brokerOrDealer` has the same shape wherever it appears:

- `isPresent` says whether a broker or dealer was involved. When it is `true`, `items` must hold at least one entry; when it is `false` or absent, `items` is not allowed. Leaving `isPresent` out is the same as `false`.
- Each entry in `items` needs `organisationName`, `contactDetails` (at least one of `emailAddress` or `phoneNumber`) and exactly one of `registrationNumber` or `reasonForNoRegistrationNumber`. `address` is optional. More than one broker or dealer can be declared.

Every party — producer, carrier, broker or dealer, receiver — must carry contact details, as a `contactDetails` object holding `emailAddress` and `phoneNumber`, at least one of which is required. The only exception is a `Household` producer, which carries no details at all ([D-047](#d-047)). Contact details are never separate top-level fields on the party.

**Consequences.** Providers can state explicitly that no broker or dealer was involved, without the field being mandatory. `isPresent` is the boolean gate asked for in DWTC-152, DWTC-153, DWTC-155 and DWTC-162. `reasonForNoRegistrationNumber` is free text until the BA and policy team agree a list of reasons.

Built today: `brokerOrDealer` on Creation, Collection and both receipt endpoints in beta-2, and `contactDetails` on the producer and broker or dealer. Not yet built: `carrier` and `intendedCarriers`, which exist only in the target spec. There, the carrier and receiver shapes still carry flat `emailAddress`/`phoneNumber` fields, to be moved into `contactDetails`.

<a id="d-043"></a>

#### Creation declares intended receiving sites as an array: `receivers`

**D-043** · ✅ Decided · Impact: 🟢 Low · Group: **A2** · Built in: **Not yet** · Related: [D-045](#d-045)

**Context.** A producer may send waste to more than one receiving site (raised in DWTC-155). Creation previously took a single, optional `receiver`.

**Decision.** Creation takes `receivers`, an array of intended receiving sites.

- Required, with at least one entry, when the movement contains hazardous waste; optional otherwise. Whether the movement is hazardous comes from its waste classification, so this is checked by the server.
- Each entry needs `siteName`, `authorisationNumber`, `address` and `contactDetails` ([D-008](#d-008)).

The receivers declared at Creation are provisional. The site that actually received the waste is recorded on the receipt.

**Consequences.** The target spec and the Joi drafts in `data/` currently call the field `intendedReceivers`; they are to be renamed to `receivers` to match this decision.

<a id="d-045"></a>

#### Creation declares intended carriers as an array: `intendedCarriers`

**D-045** · ✅ Decided · Impact: 🟢 Low · Group: **A2** · Built in: **Not yet** · Related: [D-008](#d-008), [D-043](#d-043)

**Context.** When a movement is planned, the carrier may not be settled yet, or more than one carrier may be lined up. Creation previously took a single, required `carrier`.

**Decision.** Creation takes `intendedCarriers`, an array that is always required, with at least one entry.

- Each entry needs `meansOfTransport`, `organisationName` and `contactDetails` ([D-008](#d-008)). Other carrier details are optional, because they may not be known at planning time, but keep their usual rules when supplied — for example exactly one of `registrationNumber` or `reasonForNoRegistrationNumber`.
- Every later event takes a single `carrier`: the one that actually did the work ([D-008](#d-008)).

**Consequences.** Creation records intent; collection, delivery and receipt record what happened.

<a id="d-047"></a>

#### The producer is described by waste source: Household, Commercial or Municipal

**D-047** · ✅ Decided · Impact: 🟠 Medium · Group: **A2** · Built in: **beta-2**

**Context.** What can be known about a waste producer depends on where the waste comes from. Household waste has no producer organisation to name; commercial and municipal waste do.

**Decision.** `producer` is required on `POST /movements`, and its fields depend on `wasteSource`:

| `wasteSource` | Required | Optional |
| --- | --- | --- |
| `Household` | `wasteSource` only — no other field is allowed | — |
| `Commercial` | `organisationName`, `sicCode` (five digits), `address`, `contactDetails`, and exactly one of `authorisationNumber` or `reasonForNoAuthorisationNumber` | — |
| `Municipal` | as `Commercial`, except `sicCode` | `sicCode` |

`contactDetails` needs at least one of `emailAddress` or `phoneNumber`. `authorisationNumber` must be a valid UK permit or exemption number format. `reasonForNoAuthorisationNumber` is free text until the BA and policy team agree a list of reasons.

**Consequences.** No details of a householder are collected. The producer is captured at Creation only. A `councilMovement` flag was briefly required on every producer in beta-2. It has been taken out of the producer and parked as an open question ([D-049](#d-049)).

<a id="d-049"></a>

#### Recording that a movement is a council movement

**D-049** · ⏳ Open · Impact: 🟢 Low · Group: **A2** · Built in: **n/a** · Related: [D-047](#d-047)

**Context.** The BA's data list includes `councilMovement`, a flag marking a movement made by or for a local council. Beta-2 first required it on every producer. It was then taken out of the producer object, but it has not been dropped from scope.

**Open.** Does the service need to know that a movement is a council movement, and if so where should that come from?

- a field on the producer, as first built;
- a field on the Movement itself, since it describes the movement rather than the producer;
- derived from data already held — for example a `Municipal` waste source, or the submitting organisation's local-authority flag, which the Phase 1 receipt already records.

Until this is decided, beta-2 rejects `councilMovement` as an unknown field.

<a id="d-048"></a>

#### Supporting references and special handling requirements

**D-048** · ✅ Decided · Impact: 🟢 Low · Group: **A2** · Built in: **beta-2**

**Context.** Providers need to tie a movement to their own paperwork — a purchase order, a weighbridge ticket — and to pass handling instructions on to whoever handles the waste next.

**Decision.**

- `supportingReferences` — optional on all five write endpoints. When supplied, it holds at least one `{ label, reference }` pair. `label` is one of `Weighbridge Number`, `PO Number`, `Job Number`, `Invoice Number`, `Waste Ticket Number` or `Other`; `reference` is 1 to 50 characters.
- `specialHandlingRequirements` — optional free text of 1 to 500 characters, at Creation and Collection — for example "keep upright". Left out when there are none.

**Consequences.** The labels are a closed list; any other kind of reference uses `Other`. Neither field is checked against other events.

### A3 Waste description, weights and treatment

<a id="d-032"></a>

#### Waste is described at Creation and weighed at Receipt; Collection and Delivery carry no waste details

**D-032** · ✅ Decided · Impact: 🟠 Medium · Group: **A3** · Built in: **beta-1** · Related: [D-006](#d-006), [D-029](#d-029), [D-042](#d-042)

**Context.** Collection and Delivery record who moved the waste, where and when. What the waste is, and how much of it there is, are properties of the load as declared and as received.

**Decision.**

- Creation declares the waste: classification and estimated weights for each waste item.
- Collection and Delivery carry no `wasteItems`.
- Receipt records the actual weight of each waste item. `POST /receipts` also carries the classification, because it has no Creation to take it from ([D-042](#d-042)).

Every weight has the same shape: `{ metric, amount, isEstimate }`, where `metric` is `Grams`, `Kilograms` or `Tonnes` and `amount` is greater than zero.

**Consequences.** Collection and Delivery payloads stay small, and a transit handover ([D-029](#d-029)) does not restate the load. Declared and actual weights meet in one place only: the receipt compared against Creation ([D-006](#d-006)).

Built today: neither beta collection nor delivery accepts waste items. Waste items are not yet built on any endpoint.

<a id="d-042"></a>

#### A waste item is its classification plus logistics; the ordinary receipt carries logistics only

**D-042** · ✅ Decided · Impact: 🟠 Medium · Group: **A3** · Built in: **Not yet** · Related: [D-025](#d-025), [D-031](#d-031), [D-032](#d-032), [D-041](#d-041)

**Context.** A waste item has two kinds of information: its classification — what the waste is — and logistics — how much there is and how it is contained. Policy feedback was that the ordinary receipt should not make the receiver re-send a classification already declared at Creation.

**Decision.** A shared base waste item has two parts:

- `classification` — one object per item: `ewcCodes`, `wasteDescription`, `containsPops` and `pops`, `containsHazardous` and `hazardous`;
- logistics — `weight`, `physicalForm`, `typeOfContainers`, `numberOfContainers`.

Each endpoint uses it like this:

| Endpoint | Waste item |
| --- | --- |
| `POST /movements` (Creation) | base + `intendedTreatments` ([D-031](#d-031)) |
| `POST /receipts` (no prior Delivery) | base + optional `actualTreatments` — classification is needed because there is no Creation ([D-041](#d-041)) |
| `POST /deliveries/{deliveryId}/receipt` (ordinary receipt) | logistics + optional `actualTreatments` — no classification |

**Consequences.** A change to classification is made in one place and applies to both Creation and `POST /receipts`. The ordinary receipt payload stays small. A receiver who finds that the waste is not what was declared cannot restate the classification on the ordinary receipt; how that is reported belongs to the receipt outcome model ([D-025](#d-025)).

**Target spec gap.** The ordinary receipt shares one request body with the deprecated Phase 1 receipt endpoints, so the target spec currently shows the Phase 1 body with the light waste item too. The two are to be separated, with the Phase 1 body left exactly as it is live.

<a id="d-031"></a>

#### Treatment codes: intended at Creation, actual at Receipt

**D-031** · ✅ Decided · Impact: 🟠 Medium · Group: **A3** · Built in: **Not yet** · Related: [D-006](#d-006), [D-019](#d-019), [D-042](#d-042)

**Context.** A disposal or recovery code (an R-code or D-code) says what is done with the waste. At Creation it is the plan; at Receipt it is what the receiving site confirms. One field, `disposalOrRecoveryCodes`, used to serve both.

**Decision.** Each waste item carries a list of treatments. Each treatment is a `disposalOrRecoveryCode` with the `weight` treated under it, so one waste item can be split across codes — for example part recovered under R3 and part disposed of under D1.

- **Creation:** `intendedTreatments`, required, at least one. Each entry needs both the code and the weight.
- **Receipt** (both endpoints): `actualTreatments`, optional. Within an entry the code is optional, because a site may need to inspect or weigh the waste before confirming it; the weight is required when a code is given. A missing code returns a warning, not a rejection.

**Consequences.** `disposalOrRecoveryCodes` no longer exists in the Phase 2 contract. The intended treatment at Creation is not the final treatment the producer sees in fate-of-waste ([D-019](#d-019)).

<a id="d-044"></a>

#### POP and hazardous components: a measured concentration, or how it compares with the WM3 threshold

**D-044** · ✅ Decided · Impact: 🟢 Low · Group: **A3** · Built in: **Not yet** · Related: [D-042](#d-042)

**Context.** For each POP or hazardous component in the waste, the caller may know the exact concentration, or only how it compares with the threshold. An earlier shape asked for a threshold `{ operator, value }`. The BA pointed out that WM3 guidance publishes one fixed threshold per substance, so the value is a constant, not something the caller measures or chooses.

**Decision.** The caller sends `concentrationThresholdOperator` with no value. The threshold itself is looked up from WM3 guidance using the component's identity.

- **POP component:** `concentration` or `concentrationThresholdOperator` (`LESS_THAN`, `EQUAL_TO` or `GREATER_THAN_OR_EQUAL`) — one or neither, never both.
- **Hazardous component:** exactly one of `concentration` or `concentrationThresholdOperator` (`EQUAL_TO` or `GREATER_THAN_OR_EQUAL`).

**Consequences.** POP components are identified by `code`, taken from `/reference-data/pop-names`, so their threshold can be looked up. Hazardous components are identified by a free-text `name` with no reference list, so the service cannot look up their threshold until such a list exists. This is flagged for BA follow-up.

### A4 Receipt and checks

<a id="d-006"></a>

#### The receipt is cross-checked against what was declared earlier; mismatches do not block it

**D-006** · ✅ Decided · Impact: 🟠 Medium · Group: **A4** · Built in: **Not yet** · Related: [D-021](#d-021), [D-022](#d-022), [D-032](#d-032), [D-041](#d-041), [D-046](#d-046)

**Context.** By the time waste is received, the journey has already recorded what the waste is and who carried it. The receipt is the first point where the actual load is recorded, so it is the natural place to compare declared with actual. Paperwork often has small inconsistencies, and a receiver must still be able to record what arrived.

**Decision.** Every receipt recorded with `POST /deliveries/{deliveryId}/receipt` is cross-checked, and a mismatch does not stop the receipt being recorded:

- **Waste** is compared with the Movement's Creation record — classification and estimated weights — reached through the Delivery's Movement IDs. Collection and Delivery are not compared, because they carry no waste details ([D-032](#d-032)).
- **Carrier** is compared with the carrier recorded earlier in the journey.

A receipt recorded with `POST /receipts` has nothing earlier to compare with, so it is not cross-checked.

**Consequences.** Mismatches are reported back to the caller, not used to reject the receipt. A weight difference against Creation is expected — Creation holds estimates and the receipt holds actuals — so it is a signal, not necessarily an error. Still open: exactly what counts as a mismatch, and which earlier carrier is compared ([D-021](#d-021)); and whether mismatches are returned as warnings on a `201` or need confirming ([D-046](#d-046)).

<a id="d-018"></a>

#### The delivery address is required when recording a delivery

**D-018** · ✅ Decided · Impact: 🟠 Medium · Group: **A4** · Built in: **Not yet** · Related: [D-007](#d-007), [D-017](#d-017), [D-041](#d-041), [D-043](#d-043)

**Context.** The receiving site declared at Creation is an estimate ([D-043](#d-043)), and waste can end up somewhere else — for example a rejected load taken on to a second receiver ([D-007](#d-007)). So the place a delivery happened cannot be worked out from earlier events.

**Decision.** `POST /deliveries` requires `deliverySite`, with `siteName` and an `address` holding both `fullAddress` and `postcode`, even when it matches the receiver planned at Creation.

**Consequences.** Every delivery records where the waste was physically handed over. The address is captured once: a delivery cannot be edited afterwards ([D-017](#d-017)). `POST /receipts` creates its empty Delivery without an address — the receiving site on the receipt records where the waste arrived ([D-041](#d-041)).

<a id="d-021"></a>

#### What counts as a mismatch in the receipt cross-check

**D-021** · ⏳ Open · Impact: 🟠 Medium · Group: **A4** · Built in: **n/a** · Related: [D-006](#d-006), [D-046](#d-046)

[D-006](#d-006) decides that the receipt is cross-checked against earlier events. Still open, for the BA and policy team:

1. **Waste.** Which fields are compared, and how — EWC codes as a set, the description as text, the hazardous and POP declarations?
2. **Weight.** What tolerance between the Creation estimate and the actual weight counts as a mismatch, given that some difference is expected?
3. **Carrier.** Which earlier carrier the receipt is compared with — the Delivery's carrier is the obvious candidate — and which carrier fields must match: the registration number alone, or the name and address too?

If [D-046](#d-046) is adopted, every mismatch is handled the same way, so this narrows to which checks run at all.

<a id="d-025"></a>

#### How a receipt records acceptance, rejection or partial acceptance

**D-025** · ⏳ Open · Impact: 🔴 High · Group: **A4** · Built in: **Not yet** · Related: [D-007](#d-007), [D-015](#d-015), [D-041](#d-041), [D-042](#d-042)

In Phase 1, recording a receipt means the waste was accepted; there is no way to record a rejection. Phase 2 must support three outcomes: the whole load accepted, the whole load rejected, or part accepted and part rejected.

Open, for the policy team:

1. How the outcome is recorded on the receipt — an outcome field, accepted and rejected quantities per waste item, a reason for rejection.
2. What happens to the rejected portion: returned to the producer, or taken on to another receiver on a further Delivery of the same Movement ([D-007](#d-007)).
3. How a receiver reports that the waste is not what was declared, since the ordinary receipt does not restate the classification ([D-042](#d-042)).

Whatever is chosen is recorded on the single Receipt; the Movement is not split ([D-015](#d-015)).

**Timing.** The [versioning schedule](../api/versioning-schedule.md) includes rejection in beta-2, so this needs deciding before beta-2 is complete.

<a id="d-046"></a>

#### Soft data-quality issues: accept with warnings, or reject and confirm

**D-046** · ⏳ Open · Impact: 🔴 High · Group: **A4** · Built in: **n/a** · Related: [D-006](#d-006), [D-021](#d-021), [D-031](#d-031), [D-039](#d-039)

**Context.** Phase 1 stores a record that has soft data-quality issues and returns them as `validation.warnings` on the success response. The beta endpoints carry the same `validation.warnings` block, but it is always empty: no soft check has been built on them yet. No decision in this register sets accept-with-warnings as the general rule — only individual cases do ([D-006](#d-006), [D-031](#d-031)).

**Proposal.** [Validation confirmation](../api/validation-confirmation.md) (draft, not agreed) replaces accept-with-warnings on the new endpoints with reject-and-confirm. A request with soft issues is rejected with `400` and a server-issued confirmation token; sending the same request again with the token stores it. A `2xx` would then mean accepted with nothing outstanding, and the `validation` block would leave the success response.

**Open.** Adopt the proposal, or keep accept-with-warnings. Deciding before any soft check is built on a beta endpoint costs nothing; afterwards it is a breaking change for integrators.

## Awaiting review

Entries below are unchanged from before the review and are listed in ID order. Each moves into its group above once it has been re-checked.

<a id="d-001"></a>

### Extend the Phase 1 Receipt API into one end-to-end spec

**D-001** · ✅ Decided · Impact: 🔴 High · Area: **Spec scope** · Related: [D-016](#d-016), [D-022](#d-022)

**Context.** Phase 1 delivered a receiver-first Receipt of Waste API (live/public beta). Phase 2 adds the rest of the journey — create movement, collection, delivery, and producer fate-of-waste tracking. This could be built as a separate Phase 2 API alongside Phase 1, or as an extension of the existing contract.

**Decision.** Extend Phase 1 into a single Digital Waste Tracking spec (`api/openapi.yaml`) covering the movement end to end. The new endpoints are added alongside the Phase 1 receipt endpoints, which are retained as `deprecated: true` for backward compatibility, and the Phase 1 validation envelope and reference-data lookups are reused unchanged rather than reinvented. The standalone Phase 1 spec (`Receipt_API.yml`) and the extended spec coexist during alpha, so vendors can see the difference between the current contract and the extended one ahead of Phase 2 reaching public beta and production.

**Consequences.** Existing vendor integrations against the Receipt API keep working — no clean break. One contract describes the whole journey, so the deprecation path is visible in one place. Both specs are published during the transition; the extended spec becomes the single forward contract once Phase 2 reaches public beta/production, at which point the standalone `Receipt_API.yml`'s future is revisited. The cost is carrying some Phase 1 shape forward (e.g. the `wasteTrackingId` naming, the looser Phase 1 `address`); those trade-offs are recorded in their own entries. A removal timeline for the deprecated receipt endpoints _within_ the extended spec is a separate open question (see below).

<a id="d-002"></a>

### Single OpenAPI file, not `$ref`-split

**D-002** · ✅ Decided · Impact: 🟢 Low · Area: **Spec structure**

**Context.** Given the decision to extend Phase 1 into one spec (above), that spec could live as one OpenAPI file or be split into `$ref`-linked component files from the start.

**Decision.** Single file (`api/openapi.yaml`) for now. Split into components only if the file becomes unwieldy.

**Consequences.** Easier to navigate while the shape is still moving; refactor cost is low if and when it's needed. The file is currently ~2,000 lines — comfortable as one file, and the threshold for splitting is a judgement call not yet reached.

<a id="d-003"></a>

### OpenAPI 3.1.0, not 3.0.3

**D-003** · ✅ Decided · Impact: 🟠 Medium · Area: **Spec structure**

**Context.** The specs were OpenAPI 3.0.3, matching the Phase 1 Receipt API. That held while everything the spec described was written out inside it.

It stopped holding once the specs began referencing the JSON Schema files that hold the business rules. The version of JSON Schema that OpenAPI 3.0.3 understands is an older one than the version we write our rules in, and it cannot express much of what we need — rules like "for a household producer these fields are not allowed", or "give one of these two fields but not both". A spec on 3.0.3 silently drops those rules and tells the reader the API accepts more than it really does.

**Decision.** The `beta-n` specs are OpenAPI 3.1.0, the version built on the same JSON Schema we write our rules in. Lining the two up is the point: it lets the spec use the rule files as they are, so what we publish and what the service enforces stay the same thing instead of drifting apart.

This covers the `beta-n` specs only. The existing Receipt of Waste endpoints and their documentation are not touched.

**Consequences.** The spec now describes the API as it really behaves, so a software provider reading it sees the rules the service will actually apply. Every future `beta-n` spec starts on 3.1.0. The rule files and the specs are tied to matching versions from here on — if one moves, the other has to move with it. This is about what software reads from the spec; how it looks in the API viewer is largely unchanged.

One open risk. Some software providers generate their client code from our spec, and we do not yet know whether the tools they use can read 3.1. Worth asking the integrators already onboarded during beta-1 contract testing, which is when they will be generating clients anyway.

<a id="d-004"></a>

### Receipt path parameter stays `{wasteTrackingId}`

**D-004** · ✅ Decided · Impact: 🟠 Medium · Area: **Identifiers** · Related: [D-024](#d-024)

**Context.** An earlier decision renamed the Phase 1 receipt path parameter to `{id}`. The Level 2 restructure reversed this: with `{movementId}` and `{deliveryId}` now used on the new resources, a bare `{id}` on the receipt endpoints would be ambiguous — and the value is the Phase 1 `wasteTrackingId`, a receipt-time identifier, not a Phase 2 `movementId`.

**Decision.** Keep the path parameter as `{wasteTrackingId}` on the deprecated receipt endpoints. The parameter description states it is the Phase 1 `wasteTrackingId` returned by `POST /movements/receive`, minted at receipt, and that a Phase 2 Movement ID must not be substituted here. Supersedes the earlier rename-to-`{id}` decision.

`wasteTrackingId` was Phase 1's only identifier because a movement was then known only at receipt time. Phase 2 adds `movementId` (creation) and `deliveryId` (delivery) to track creation→receipt; all three use sqids (sqids.org). Whether and how a Phase 1 `wasteTrackingId` reconciles to a Phase 2 `movementId` is **not decided here** — it belongs to the Phase 1 → Phase 2 migration strategy (see Open).

**Consequences.** No `{id}` placeholder anywhere — every path parameter names the concrete identifier it carries (`movementId`, `deliveryId`, `wasteTrackingId`). Affects only how the deprecated legacy path reads. This entry no longer asserts a permanent identity relationship between `wasteTrackingId` and `movementId`; that is left to migration.

<a id="d-005"></a>

### Receipt is linked to a delivery via the Delivery ID (path parameter)

**D-005** · ✅ Decided · Impact: 🔴 High · Area: **Receipt** · Related: [D-006](#d-006), [D-016](#d-016), [D-022](#d-022), [D-041](#d-041)

**Context.** A receipt should be linkable to the delivery that preceded it, via the Delivery ID. An earlier decision added `deliveryId` as an optional field on the `POST /movements/receive` request body, so Phase 1 receivers could omit it and new flows could supply it.

**Decision.** Superseded by the Level 2 restructure. The canonical receipt is now `POST /deliveries/{deliveryId}/receipt`, where the Delivery ID is a mandatory path parameter — so every receipt recorded through the new endpoint is linked to its delivery by construction. The deprecated Phase 1 `POST /movements/receive` keeps its original body unchanged (no `deliveryId` field), preserving backward compatibility for standalone receipts. The optional-body-field mechanism was not carried forward.

**Consequences.** Linking is structural rather than an optional payload field: a receipt under a Delivery is always associated with that Delivery and, through it, the originating Movement IDs. Receivers not on the new flow continue to use the deprecated endpoint with no Delivery ID. (Contingent on Option 1 of the receipt-migration decision — see Open.)

<a id="d-009"></a>

### Soft-delete via `isDeleted`, set only on PUT

**D-009** · ✅ Decided · Impact: 🟠 Medium · Area: **Lifecycle** · Related: [D-007](#d-007), [D-014](#d-014), [D-015](#d-015), [D-017](#d-017), [D-029](#d-029), [D-034](#d-034)

**Context.** An earlier decision deferred deletion entirely ("no deletion endpoint in this version"), then a later pass added `DELETE` endpoints at each stage (`DELETE /movements/{movementId}`, `DELETE /movements/{movementId}/collection`, `DELETE /deliveries/{deliveryId}`, `DELETE /deliveries/{deliveryId}/receipt`), each marked `x-stability: proposal` and non-binding, pending a substantive decision on deletion rules (soft vs. hard, audit, authorisation). Those proposal endpoints have since been removed from the spec; no `DELETE` operation exists today. This entry replaces that proposal with the decided mechanism.

**Decision.** No hard deletion and no `DELETE` endpoint, on any event. Instead, `Movement`, `Collection` and `Delivery` each carry a boolean `isDeleted` field (default `false`) on their existing request/resource schema. `Receipt` does not get this field at all — once recorded, a receipt cannot be marked deleted, full stop, because it is the terminal event in the chain.

The rules, applied uniformly across the three deletable events:

- **PUT-only.** `isDeleted` may only be set to `true` via the event's `PUT` (update). A `POST` (create) request that supplies `isDeleted: true` is rejected with a `NotAllowed` validation error; `POST` requests may omit the field or send `false`.
- **No subsequent event.** An event may be marked deleted only while no later event in the chain has been recorded against it:
  - A Movement cannot be deleted once its Collection has been recorded.
  - A Collection cannot be deleted once its Movement has been referenced in a Delivery.
  - A Delivery cannot be deleted once a Receipt has been recorded against it.

  This checks whether the later event's record _exists_, not whether it is itself currently active — once a Collection has been recorded against a Movement, that Movement stays locked from deletion even if the Collection is later deleted too. The chain of what-was-recorded is preserved; deleting a later event does not reopen an earlier one. Violating this returns a `BusinessRuleViolation` validation error.

- **Deleted blocks what comes next.** While an event is `isDeleted: true`, no event later in the chain may be recorded or updated against it:
  - Collection cannot be recorded/updated against a deleted Movement.
  - A Movement that is deleted (with or without a Collection) cannot be named in a Delivery's `movementIds`; nor can a Movement whose Collection is deleted.
  - Receipt cannot be recorded/updated against a deleted Delivery.

  Each of these is a `BusinessRuleViolation` validation error, not a warning — the operation is rejected (400), consistent with how the user framed this: a "not permitted" operation, not an advisory.

- **Reversible.** A deleted event can be undeleted by a subsequent `PUT` with `isDeleted: false`. No extra precondition is needed on undelete: because nothing later could have been recorded while the event was deleted (previous rule), the "no subsequent event" invariant always still holds at the point of undeleting.

**Open sub-question, flagged rather than assumed.** "No subsequent event" is read here as _no record of that event exists_, regardless of whether that record is itself later deleted (the stricter reading — see the bullet above). The looser reading — deleting a Collection frees its Movement to be deleted too — was considered and rejected for this entry, on the basis that it could let two soft-deletes in sequence quietly erase the fact that a Collection ever happened. Worth a sense-check with the BA if a vendor scenario surfaces where the stricter reading is unworkable in practice.

**Consequences.** Vendors get a single, symmetric mechanism across Movement, Collection and Delivery rather than four bespoke proposal endpoints. No new public identifiers or endpoints are introduced — the field lives on the schemas already used by the existing `POST`/`PUT` operations. Server-side validation grows: every `POST`/`PUT` on Collection and Delivery must now also check the deletion state of what it references, in addition to the existence checks already in place ([D-014](#d-014)). Supersedes the earlier "non-binding DELETE proposal" decision; the malformed `DELETE /movements/create` from the original deferred-deletion decision remains gone.

For collection specifically, [D-029](#d-029) adds a further restriction once a Movement carries a sequence of collection events: only the _latest active_ event may be soft-deleted (tail-peel), so the `STATIC` head cannot be removed while active `TRANSIT` events still follow it. The "no subsequent event" rule above still applies unchanged at the chain boundary — no collection event may be deleted once the Movement has been referenced in a Delivery.

<a id="d-011"></a>

### Static and transit collection collapsed into a single endpoint

**D-011** · ✅ Decided · Impact: 🟢 Low · Area: **Collection** · Related: [D-016](#d-016), [D-029](#d-029)

**Original decision.** Merge the separate static- and transit-collection endpoints into one.

**Superseded.** v1 records **static collection only** (producer-to-driver) as a single event, 1:1 with its Movement, at `POST /movements/{movementId}/collection` (see _Level 2_ and _Movement ↔ Collection is 1:1_). Transit collection (driver-to-driver) is out of scope for v1 and parked (see Parked). With transit deferred there are no two endpoints to collapse, so the original framing is moot.

<a id="d-012"></a>

### Per-event IDs not exposed in the public API

**D-012** · ✅ Decided · Impact: 🔴 High · Area: **Identifiers** · Related: [D-016](#d-016)

**Context.** Earlier conversations specified per-event identifiers (creation, collection, delivery, plus the legacy receive ID) returned alongside Movement ID and Delivery ID in API responses. On review this was identified as a conflation of two concerns: server-side storage identifiers (every event needs a unique row internally) and public API contract identifiers (values vendors store and pass around).

**Decision.** Only Movement ID and Delivery ID are exposed in the API contract. The per-event identifiers — for creation, collection, delivery, and receipt — remain in the server's storage layer (internal UUIDs) but are not returned in API responses. The deprecated Phase 1 receipt path additionally exposes `wasteTrackingId`, Phase 1's receipt-time identifier — distinct from the Movement ID, with reconciliation between the two deferred to the migration strategy (see Open).

**Consequences.** Three response schemas slim down:

- `createMovementResponse` returns `movementId` and `validation` only.
- `recordCollectionResponse` returns `validation` only.
- `deliveryResponse` returns `deliveryId` and `validation` only.

The four placeholder ID schemas are removed from `components.schemas`; internal event IDs survive only as a documentation comment. There is no dedicated collection resource schema and no public collection ID — the collection is addressed through its parent Movement via the sub-resource path defined in [D-033](#d-033).

Vendors track two values per journey: Movement ID (durable, addresses a Movement) and Delivery ID (addresses a delivery across one or more Movements). On the deprecated Phase 1 path, `wasteTrackingId` is a third. Anything else is the server's business.

<a id="d-013"></a>

### Identifier format and capacity (year-prefixed sqids)

**D-013** · ✅ Decided · Impact: 🔴 High · Area: **Identifiers** · Related: [D-024](#d-024), [D-028](#d-028)

**Context.** Movement ID and Delivery ID are the public identifiers vendors store and pass around. They must be short, externally shareable, opaque, and collision-free at national volume (the service is estimated at >100,000 transactions/year).

**Decision.** Both are generated with sqids (https://sqids.org/) in a fixed 8-character format: a two-character year prefix (`YY`) followed by six characters from the 36-symbol alphabet A–Z and 0–9. The deprecated Phase 1 `wasteTrackingId` uses the same format.

Capacity per year: the six-character suffix over a 36-symbol alphabet gives 36^6 = **2,176,782,336** (~2.18 billion) unique IDs. The `YY` prefix partitions the space by year, so each year opens a fresh ~2.18 billion namespace and total capacity across years is effectively unbounded. (sqids reserves a small set of combinations for its profanity blocklist, so the usable count is marginally below the theoretical maximum.)

**Consequences.** ~2.18 billion IDs per year exceeds the national volume estimate by roughly four orders of magnitude — ample headroom. IDs are opaque; callers must not parse them (the schema descriptions say so). Movement ID and Delivery ID share the same format and are disambiguated by the endpoint/path they appear on, not by the string itself — except for a hazardous delivery, where the two are the same string by design (see [D-010](#d-010)).

Two follow-ups this surfaces, for the data/spec pass:

- The current spec is inconsistent about the prefix: `movementId`'s example is numeric (`25HRA0B2`, year "25") while the `wasteTrackingId` pattern requires two letters (`^[A-Z]{2}[A-Z0-9]{6}$`, example `YY...`). If the prefix is a numeric year, that regex is wrong; the canonical format above needs a single agreed prefix definition and matching patterns on all three identifier schemas.
- Whether the two ID types are minted from a shared sequence or partitioned per type (so a `movementId` and a `deliveryId` can never be the same string) is a server concern to confirm.

<a id="d-014"></a>

### Sub-resource 404 shape: parent-not-found vs event-not-recorded

**D-014** · ✅ Decided · Impact: 🟠 Medium · Area: **Lifecycle** · Related: [D-009](#d-009), [D-015](#d-015), [D-033](#d-033)

**Context.** Collection and receipt are 1:1 sub-resources that come into existence later than their parent: a Movement exists from creation but has no collection until one is recorded, and a Delivery is minted at delivery but has no receipt until one is recorded. `POST` and `PUT` operations on these sub-resource paths can fail with a 404 for two distinct reasons: the parent identifier is wrong (the parent record does not exist), or the parent exists but the event has not been recorded yet (relevant to `PUT`, which requires a prior `POST`).

**Decision.** Sub-resource operations return a `notFoundError` body on 404, whose `code` field distinguishes the two cases:

- `MOVEMENT_NOT_FOUND` / `DELIVERY_NOT_FOUND` — the parent does not exist. Applies to `POST` and `PUT` on sub-resource paths (and to `GET` when reinstated — see [D-033](#d-033)).
- `COLLECTION_NOT_RECORDED` / `RECEIPT_NOT_RECORDED` — the parent exists but the event has not been recorded yet. Applies to `PUT` only (call `POST` first); also to `GET` when reinstated.

Top-level single resources (`/movements/{movementId}`, `/deliveries/{deliveryId}`) have only one way to be missing and keep a plain `404` with no distinguishing code.

**Consequences.** Callers can tell a wrong identifier (stop, fix the ID) from a missing sub-event (for `POST` callers: the parent does not exist; for `PUT` callers: record the event with `POST` first). The `notFoundError` schema is shared across all four event sub-resource paths.

<a id="d-016"></a>

### Level 2 (Richardson Maturity Model) resource model

**D-016** · ✅ Decided · Impact: 🔴 High · Area: **Resource model** · Related: [D-011](#d-011), [D-012](#d-012), [D-015](#d-015), [D-017](#d-017), [D-029](#d-029), [D-035](#d-035)

**Context.** The original API spec used verb-shaped URL segments (`/movements/create`, `/movements/collection`, `/movements/delivery`, `/movements/receive`) with every operation as POST. After a sequence of architectural reviews, the team agreed the spec should adopt Richardson Level 2: URLs as resource paths, HTTP methods as the verbs.

The journey was:

- A colleague raised that the `/movements/` vs `/deliveries/` split was the natural Level 2 instinct.
- Another colleague pointed out that going further — events as first-class addressable resources — would unlock cacheable GETs and make the contract cleaner.
- The 1:1 cardinality (see previous decision) made it possible to adopt Level 2 without introducing additional public IDs for `collectionId` and `receiptId` — each sub-resource is uniquely addressed by its parent.

**Decision.** Adopt Level 2:

- Resources are plural collections: `/movements`, `/deliveries`.
- Individual resources: `/movements/{movementId}`, `/deliveries/{deliveryId}`.
- Sub-resources are singular (1:1): `/movements/{movementId}/collection`, `/deliveries/{deliveryId}/receipt`.
- HTTP methods carry the action: `POST` creates, `PUT` updates.
- `operationId`s stay verb-shaped (`createMovement`, `recordCollection`, `recordDelivery`, `recordReceipt`, etc.) — they describe the business event and remain stable across URL changes.

**Consequences.** Substantial spec restructure (all path keys changed except the reference data endpoints).

Movement ID and Delivery ID remain the only public IDs. Per-event IDs (`creationId`, `collectionId`, etc.) stay internal to the server. The "Per-event IDs not exposed in the public API" decision is unchanged by this; the Level 2 adoption _would_ have required them as URL parameters if the cardinality were 1:many, but at 1:1 the parent ID is sufficient.

**Amended by [D-029](#d-029).** This holds for every sub-resource except collection, which D-029 makes 1:N. A collection event is addressed by its _position_ in the Movement's ordered sequence — the parent Movement ID plus position is sufficient, so D-029 still introduces no public per-event id. Whether to expose the internal Collection ID after all, for correcting an arbitrary earlier event, is the open question [D-035](#d-035).

The Phase 1 receipt endpoints (`POST /movements/receive`, `PUT /movements/{wasteTrackingId}/receive`) remain in the spec marked `deprecated: true`. Their operationIds were renamed to `createReceiptMovementLegacy` and `updateReceiptMovementLegacy` to free up the canonical names for the new Delivery-scoped endpoints. A removal date for the deprecated endpoints is an open question — see below.

This decision also resolves the earlier "Static and transit collection collapsed into a single endpoint" decision in a more elegant way: collection is now a 1:1 sub-resource of a Movement, and what was called multi-collection is now multi-Movement-under-one-Delivery.

<a id="d-017"></a>

### Delivery PUT restricted to soft-delete only

**D-017** · ✅ Decided · Impact: 🟠 Medium · Area: **Lifecycle** · Related: [D-007](#d-007), [D-009](#d-009), [D-016](#d-016), [D-018](#d-018), [D-034](#d-034), [D-041](#d-041)

**Context.** A delivery is addressed by `deliveryId` (`PUT /deliveries/{deliveryId}`), covering all the Movements named in its `movementIds`; there is no per-Movement view of a delivery — that was settled by the Level 2 restructure (see [D-016](#d-016)). A delivery records a physical handover of waste at a place at a point in time: the carrier-declared site, the aggregated Movement IDs, the carrier, and the actual timestamp. As an audit fact about something that has already happened, policy requires it to be immutable once recorded.

**Decision.** The delivery `PUT` is de-potentiated. Once a delivery is registered, the only property that may change is `isDeleted` (the soft-delete flag from [D-009](#d-009)). `PUT /deliveries/{deliveryId}` does not accept `deliveryRequest`; it accepts a restricted `deliveryUpdateRequest` carrying only `isDeleted` — plus `apiCode` for caller identity, which is not a property of the delivery record and so does not breach immutability. Any other field is rejected with a `NotAllowed` validation error (`additionalProperties: false`). The history/revision pattern ([D-034](#d-034)) still applies to the `isDeleted` mutation.

Correcting a recorded delivery is therefore not an in-place edit: soft-delete the erroneous Delivery (`isDeleted: true`) and record a fresh delivery via `POST /deliveries` — subject to D-009's rule that a Delivery cannot be deleted once a Receipt has been recorded against it.

**Consequences.**

- `PUT /deliveries/{deliveryId}` (`updateDelivery`) is a soft-delete toggle only; its body is `deliveryUpdateRequest`, not `deliveryRequest`. Movement and Collection `PUT`s are unchanged and still accept full updates, so delivery is asymmetric with them (see open question).
- [D-018](#d-018) follows from this: `deliverySite.address` is required on `POST /deliveries` only, since it is not part of the `PUT` body.
- [D-007](#d-007): the many-to-many Movement↔Delivery relationship is fixed at `POST` and cannot be altered by a later `PUT`; re-aggregation means delete + re-create.

**Open questions — for BA / policy:**

1. **Cross-event symmetry.** Should the same immutability apply to Movement and Collection `PUT`s, or is delivery deliberately the only immutable event? The asymmetry should be intentional, not incidental.
2. **Correction after receipt.** Under D-009 a Delivery cannot be soft-deleted once a Receipt exists. With in-place edit also removed, a delivery with a recorded receipt has no correction path. Acceptable, or is an exception needed?
3. **`apiCode` in the restricted body.** Confirm `apiCode` stays as caller identity (vs. relying solely on the Bearer token). If auth is token-only, `isDeleted` is the entire body.

<a id="d-019"></a>

### Fate-of-waste GET — producer journey query (proposal)

**D-019** · ⏳ Open · Impact: 🟠 Medium · Area: **Fate-of-waste**

**Context.** A producer passes their Movement ID to a carrier and cannot record any of the four journey events themselves. A fate-of-waste endpoint gives producers a read-only window onto what happened to their waste: what was collected, when, where it ended up, and how it was treated. The Movement ID is the natural and unique key for this query — it is the producer's only persistent reference to the journey, and uniquely identifies a single waste movement across all four events.

**Current state.** `GET /movements/{movementId}/fate-of-waste` exists in the spec marked `x-stability: proposal`. The response schema has been stripped: the endpoint URL and `movementId` as the lookup key are considered stable; what the endpoint returns is not yet defined, pending resolution of the questions below.

**Open questions — to confirm with BA and policy team:**

1. **Timestamp cardinality.** Does the producer see a single `collectionDateTime` (e.g. earliest collection across multi-collection runs) and a single `receiptDateTime` (e.g. final receipt across multi-delivery scenarios)? Or arrays of timestamps? The provisional model was scalar-with-a-rule; needs BA confirmation.

2. **Treatment code source and shape.** `startTreatmentCode` can be derived from the receipt's `wasteItems[].disposalOrRecoveryCodes` array. `finalTreatmentCode` has no source in the current model — it implies onward movement (see question 3). Confirm: is treatment outcome a single derivable code, a summary across the weighted list, or not surfaced until onward movement is in scope?

3. **Onward movement scope.** When waste is accepted at a transfer station and moved on to a treatment facility, does that second leg fall within v1 scope? `finalTreatmentCode` cannot be defined until this is answered. Likely out of scope for v1 — confirm with policy team.

4. **Projection scope.** What fields should the producer see beyond identifiers and timestamps? Waste classification at each stage? Receiver site name? Carrier identity? To be defined once policy intent is clear.

<a id="d-022"></a>

### Receipt migration: new endpoint vs extend Phase 1

**D-022** · ✅ Decided · Impact: 🔴 High · Area: **Receipt** · Related: [D-005](#d-005), [D-006](#d-006), [D-015](#d-015), [D-016](#d-016), [D-023](#d-023), [D-041](#d-041)

How receivers move from the Phase 1 receipt to the linked Phase 2 receipt was undecided. Both options shared one internal receipt function, and both required a prior delivery to obtain a `deliveryId`, so implementation cost and the delivery dependency were equivalent either way — the difference was contract shape and migration friction.

**Decision: Option 1.** Implement `/deliveries/{deliveryId}/receipt` over the same internal receipt function called by `/movements/receive`, and deprecate `/movements/receive`. Linking is structural — the `deliveryId` is a mandatory path parameter, so a new-flow receipt cannot be recorded without a Delivery, and the cross-check against the linked delivery is unconditional. Fits the Level 2 model already adopted: receipt is a 1:1 sub-resource of Delivery with a cacheable, addressable read endpoint (see [D-033](#d-033)).

In practice this is two new endpoints, not one: the ordinary linked flow, `POST /deliveries/{deliveryId}/receipt`, plus `POST /receipts` ([D-041](#d-041)) for the exceptional case where there is no prior Delivery to link against. Both supersede `/movements/receive`; [D-023](#d-023) tracks the deprecation timeline for the Phase 1 endpoints now that Option 1 is confirmed.

**Option 2 (rejected).** Keep `/movements/receive` and add an optional `deliveryId` to its request body. Lowest URL churn — existing vendors keep the same endpoint and add the field when ready; one receipt endpoint, no "which do I call?". Rejected because linking would become optional-by-convention (a receipt that should be linked could be recorded without the field — a silent gap), the cross-check would revert to conditional ("when `deliveryId` is supplied"), and it would keep a verb-shaped, non-resource endpoint as the canonical receipt, partially reversing the Level 2 restructure.

**Consequences.** Two receipt endpoints coexist through the transition, and Phase 1 can't be fully retired until receivers record deliveries. These entries, flagged while the decision was open as needing revisiting under Option 2, stand unchanged now that Option 1 is confirmed: _Receipt is linked to a delivery via the Delivery ID_, _Cross-check of receipt details against the linked delivery_, _Level 2 (Richardson Maturity Model) resource model_, and _Movement ↔ Collection and Delivery ↔ Receipt are 1:1_.

<a id="d-023"></a>

### Phase 1 receipt endpoint deprecation timeline

**D-023** · ⏳ Open · Impact: 🟠 Medium · Area: **Receipt** · Related: [D-022](#d-022)

The Level 2 restructure superseded `POST /movements/receive` and `PUT /movements/{wasteTrackingId}/receive` with `POST /deliveries/{deliveryId}/receipt` and `PUT /deliveries/{deliveryId}/receipt`. The Phase 1 endpoints remain in the spec marked `deprecated: true` for backward compatibility, but no removal date has been set. Open: when do existing Phase 1 clients need to migrate, and how is that communicated to them? Options range from indefinite deprecation (Phase 1 endpoints stay forever) to a scheduled cutover with a removal window. A migration-by-redirect was considered but has known issues with non-GET methods across different HTTP client libraries.

**Contingent on the _Receipt migration_ decision.** This timeline question only arises under Option 1 (a separate `/deliveries/{deliveryId}/receipt` that deprecates `/movements/receive`). Under Option 2 there is no superseded endpoint to retire and this question falls away. The identifier side of migration is tracked separately under _`wasteTrackingId` ↔ `movementId` reconciliation_.

<a id="d-024"></a>

### `wasteTrackingId` ↔ `movementId` reconciliation

**D-024** · ⏳ Open · Impact: 🟠 Medium · Area: **Identifiers** · Related: [D-004](#d-004)

Phase 1 minted `wasteTrackingId` at receipt; Phase 2 mints `movementId` at creation. Whether a Phase 1 record maps to a Phase 2 Movement ID (and how), on migration, is undecided — owned by the Phase 1 → Phase 2 migration strategy.

<a id="d-027"></a>

### Per-organisation vs per-actor API credentials

**D-027** · ✅ Decided · Impact: 🟠 Medium · Area: **Onboarding** · Related: [D-008](#d-008), [D-036](#d-036)

**Context.** Phase 1 is receiver-first: a receiver registers its organisation via the Waste Tracking Service and receives credentials — a Cognito app client (`client_id` + `client_secret`) that is exchanged for a Bearer JWT, and an `apiCode` that identifies the submitting organisation in every API request. Phase 2 adds carrier, broker, and producer actors. The open question was whether those actors require separate per-role credentials or whether one organisation-level registration covers all roles that organisation holds.

**Decision.** Per-organisation credentials, not per-actor. Every actor type — carrier, broker, producer, and receiver — onboards via the same process and receives the same credential shape: a Cognito app client (`client_id` + `client_secret`) and an `apiCode`. Every record written to the API is assigned to the submitting organisation identified by `apiCode`; no distinction is made at the credential level between the role the caller is acting in for a given event. An organisation that acts as both a receiver and a carrier holds one set of credentials and uses them for both roles.

The two credentials are issued through different paths, and Phase 2 changes neither:

- **Cognito app client** (`client_id` + `client_secret`) is manually provisioned per third-party integrator system, in the relevant environment (test or production), with credentials shared via a secure channel. This step does not change for Phase 2 — carrier, broker, and producer integrators are provisioned the same manual way as receiver integrators are today.
- **`apiCode`** is self-service, not manually distributed. Once an organisation is registered and its users can sign in via Defra ID, any user in that organisation generates, names, and disables its own `apiCode`s through `waste-organisation-frontend`'s API management screens — no operator involvement, no encrypted-email step. This self-serve path already exists for Phase 1 receivers; no new UI is needed for Phase 2 actors to use it.

**Consequences.** The credential model is unchanged from Phase 1, but the two halves have different operational profiles. The `apiCode` half is fully self-serve for every actor type via the existing `waste-organisation-frontend` UI — the `waste-organisation-backend` API-code issuance flow is reused for carriers and brokers without modification. The Cognito app client half remains a manual, per-integrator provisioning step regardless of actor type; this is a standing onboarding-scale consideration as Phase 2 brings in carrier, broker, and producer integrators on top of receivers, not something Phase 2 introduces new. Role-based access restrictions — for example, whether only a permitted receiving site may record a Receipt — are a separate policy question deferred to a future decision; the identity mechanism supplies the information to enforce such rules but does not pre-empt them (see [D-036](#d-036)).

<a id="d-028"></a>

### Pre-generated Delivery IDs for offline drivers

**D-028** · ⏳ Open · Impact: 🟠 Medium · Area: **Identifiers** · Related: [D-013](#d-013)

If a driver has no signal at the delivery, they cannot call `POST /deliveries` to mint a Delivery ID in the moment — yet they need one to hand to the receiver (typically on paper) so the receipt can be recorded against it. Open: can software vendors be issued a pool of pre-generated Delivery IDs that a driver's app assigns offline and reconciles/POSTs when signal returns? Sub-questions: how are pre-generated IDs reserved without collision; do they draw from the same per-year sqids space (see _Identifier format and capacity_); how long does a reservation stay valid; what happens to a reserved ID that is never used; and does the same need apply to Movement IDs (created earlier, usually with signal) or only to Delivery IDs (minted at the delivery moment, the most likely offline point)? Connects to the deferred/retrospective collection-recording scenarios, which are the offline case generally.

**Proposed answer:** [Option A — Pre-reserved Delivery IDs](phase2/option-a-pre-reserved-delivery-IDs.md), a draft design (not yet reviewed or decided) covering the reservation endpoint, per-org quota, ownership verification and the validity-lookup contract.

<a id="d-033"></a>

### Per-event GET endpoints — parked

**D-033** · ⏸️ Parked · Impact: 🟢 Low · Area: **Lifecycle** · Related: [D-014](#d-014), [D-016](#d-016)

Following BA discussion, the four per-event GET operations have been removed from `openapi.yaml` and deferred to a future iteration:

- `GET /movements/{movementId}` (`getMovement`)
- `GET /movements/{movementId}/collection` (`getCollection`)
- `GET /deliveries/{deliveryId}` (`getDelivery`)
- `GET /deliveries/{deliveryId}/receipt` (`getReceipt`)

The Level 2 resource paths and HTTP method structure ([D-016](#d-016)) are unchanged — `POST` and `PUT` operations on all four event paths remain. The GETs are absent because their response schemas and projection scope are not yet agreed; they will be defined in a future iteration.

The `notFoundError` shape and distinguishing error codes (`MOVEMENT_NOT_FOUND`, `COLLECTION_NOT_RECORDED`, `DELIVERY_NOT_FOUND`, `RECEIPT_NOT_RECORDED`) from [D-014](#d-014) remain active in the spec for `POST` and `PUT` responses on sub-resource paths.

**Note.** `GET /movements/{movementId}/fate-of-waste` (`getFateOfWaste`) is the producer-facing read-only projection — it is a separate concern and is **not** parked.

<a id="d-034"></a>

### PUT operations use history/revision pattern across all events

**D-034** · ✅ Decided · Impact: 🟠 Medium · Area: **Lifecycle** · Related: [D-009](#d-009), [D-014](#d-014), [D-016](#d-016), [D-017](#d-017)

**Context.** The Phase 1 receipt `PUT /movements/{wasteTrackingId}/receive` is implemented with a history/revision pattern: before applying an update, the current live record is snapshotted into a separate history store, and a server-side revision counter on the live record is incremented. This gives a full audit trail of every mutation without exposing multiple versions through the public API. The revision counter also acts as an optimistic concurrency guard, preventing two concurrent PUTs from silently overwriting each other.

**Decision.** Extend the same pattern to all Phase 2 PUT operations: `updateMovement`, `updateCollection`, `updateDelivery`, and `updateReceipt`. Every PUT snapshots the current state to a history store before writing the new state, and increments the revision counter on the live record. The history store and revision counter are server-side implementation details — they are not part of the public API contract.

**Consequences.** Every mutation across all four events is fully auditable at the server level. The public API contract is unchanged: each PUT returns the updated record (or a validation envelope), not a version list. Clients see a single live record per resource, identical to the pre-decision behaviour.

<a id="d-035"></a>

### Addressing an individual collection event for correction

**D-035** · ⏳ Open · Impact: 🟠 Medium · Area: **Lifecycle** · Related: [D-009](#d-009), [D-012](#d-012), [D-016](#d-016), [D-029](#d-029), [D-032](#d-032), [D-033](#d-033), [D-034](#d-034)

Spun out of [D-029](#d-029). Once a Movement carries a sequence of collection events, `PUT /movements/{movementId}/collection` corrects or soft-deletes the _latest active_ event only — there is no way to target an arbitrary earlier event. Soft-delete of an older event is already ruled out by D-029's latest-only (tail-peel) rule, so the remaining gap is purely _data correction_ of an earlier event in the sequence.

Targeting a specific earlier event needs a stable handle. Two options, both deferred:

- **Expose the internal Collection ID.** The per-event id that already exists server-side (the glossary's Collection ID) becomes public, and correction is `PUT /movements/{movementId}/collection/{collectionId}`. Idiomatic REST and robust regardless of how the sequence changes, but it supersedes [D-012](#d-012)'s "per-event IDs not exposed" for collection. That stance was only ever justified by redundancy under 1:1 ([D-016](#d-016)); D-029 makes collection 1:N, which removes the redundancy, so exposing the id would be a principled supersede rather than a contradiction.
- **Frozen ordinal.** The server assigns an `eventSequence` at append, never renumbers, and soft-deleted events keep their slot; correction is `PUT /movements/{movementId}/collection/{sequence}`. Keeps D-012 intact — the ordinal is the handle, not an opaque id — at the cost of guaranteeing the sequence is never compacted.

Out of scope for v1: v1 records transit sequences and corrects the latest event, which covers the real-time and tail-correction cases. Flagged in the same spirit as D-032's positional contract ("revisit if it proves fragile"). To pick up with the BA when older-event correction is a demonstrated need rather than a hypothetical one.

<a id="d-036"></a>

### Write authorisation: open append, amend restricted to the authoring organisation

**D-036** · ✅ Decided · Impact: 🔴 High · Area: **Authorisation** · Related: [D-009](#d-009), [D-012](#d-012), [D-013](#d-013), [D-017](#d-017), [D-027](#d-027), [D-029](#d-029), [D-034](#d-034)

**Context.** The four-event model is multi-actor: a broker may create a Movement, a driver collect against the same `movementId`, a driver perform the delivery, and a receiver register the receipt — four different organisations appending events to one Movement. After creation, no single organisation "owns" the Movement. Authentication is settled (WTS-ADR001: CDP/Amazon Cognito OAuth 2.0 at the gateway, with an Organisation API ID identifying which organisation a call acts for), but the gateway only establishes _who is calling_; it does not decide whether that organisation may append a given event to a given Movement in its current state. The public identifiers are shareable, non-secret handles by design ([D-012](#d-012), [D-013](#d-013)): `movementId` is passed producer↔broker/carrier and driver↔driver on transit collections ([D-029](#d-029)), and `deliveryId` is passed driver↔receiver. Possession of an identifier therefore cannot confer the right to write to it. Phase 1 already constrains the receipt so that the `PUT` (amend) is bound to the _same_ organisation that recorded the `POST`; that behaviour is carried forward.

**Decision (technical half).**

- **Append (`POST`) is open.** Any authenticated, onboarded organisation may record any event. Possession of `movementId`/`deliveryId` is not an authorisation control.
- **Amend (`PUT`) is restricted to the authoring organisation** — the organisation whose identity (`apiCode`) recorded the event. This carries forward the Phase 1 receipt POST/PUT-same-organisation rule and composes with the existing PUT mechanics: soft-delete only, tail-only ([D-009](#d-009)); delivery PUT de-potentiated to soft-delete ([D-017](#d-017)); history/revision with optimistic concurrency ([D-034](#d-034)).
- **Integrity is by attribution, not prevention.** Every `POST` and `PUT` is stamped server-side with the authenticated writing organisation (`apiCode`) as immutable provenance, so an incorrect or bad-faith write is recorded against its author and is traceable by regulators. These are licensed, identified operators writing under their own credentials in a waste-crime-enforcement system, so accountability is a real deterrent, not only an audit trail.

**Deferred to policy (not decided here).** Whether write access to an event should be _restricted by actor role or relationship_ — for example whether only a permitted receiving site may record a Receipt, or only a declared carrier may record a Collection — is a business/regulatory rule, not a technical one. The service provides the authenticated-identity mechanism to enforce such rules if and when policy defines them; Phase 2 does not pre-empt them. Tracked alongside the credentials/identity question in [D-027](#d-027).

**Consequences.** The write model is deliberately open at append and accountable by attribution, which matches the messy reality of reassignment, sub-contracting and transit — consistent with [D-029](#d-029), which captures `receivedFromCarrier` without cross-checking it against the preceding event. The attribution guarantee depends on per-event, server-side provenance (writing organisation, vendor instance, timestamp) being captured immutably and being queryable by regulators; that is the implementation requirement the integrity argument rests on, and it links to the observability / non-reconciled-movement work planned for Beta. If policy later mandates participation restrictions, they are added as authorisation checks in the Movement domain service against the already-captured identity, without changing the public contract shape.

<a id="d-037"></a>

### Phase 2 MongoDB storage model — three options under evaluation

**D-037** · ⏳ Open · Impact: 🔴 High · Area: **Data model** · Related: [D-029](#d-029), [D-034](#d-034)

**Context.** Three MongoDB storage models have been considered for Phase 2.

The **aggregate model** ([`model/mongo-schema-proposal.md`](model/mongo-schema-proposal.md)) stores one document per public identifier: a `movements` aggregate embedding `creation` (singular) and an ordered `collectionEvents[]` array, and a `deliveries` aggregate embedding `movementIds[]`, `delivery`, and `receipt`. Each aggregate has a `-history` companion collection using the existing full-document-snapshot pattern from `waste-inputs-history`, and a `revision` field as the optimistic concurrency guard in `updateOne({ _id, revision })`.

The **per-event-collection model** (proposed by the Data Architect) stores one MongoDB collection per event type — creation, collection, delivery, and receipt — deferring cross-event reads to a view layer defined later.

The **CQRS / event-sourcing model** ([`model/mongo-schema-proposal-CQRS.md`](model/mongo-schema-proposal-CQRS.md)) uses an append-only `events` collection as the sole source of truth, with `movements` and `deliveries` as derived projection collections rebuilt from events. A unique compound index on `{ streamId, sequenceNumber }` replaces the `revision` concurrency guard. No `-history` collections are needed: the event log is the history. Aggregate root objects are rehydrated in memory from the event stream on each write to enforce domain invariants before appending.

**Previous position.** This entry was previously marked ✅ Decided in favour of the aggregate model, on five grounds: (1) per-event-collection had an undefined and costly read/view layer; (2) it conflicted with the `revision`-based concurrency pattern ([D-034](#d-034)); (3) the state machine had no home in a per-event model; (4) D-029 ordering enforcement was harder across a separate collection; (5) it would introduce a second, irreconcilable persistence paradigm alongside the Phase 1 pattern.

**Why this is reopened.** The CQRS / event-sourcing model was not evaluated when D-037 was first decided. It addresses all five of the above concerns:

1. Projections are defined upfront and maintained synchronously — GET reads one document by `_id`, identical performance to the aggregate model.
2. The unique `(streamId, sequenceNumber)` index replaces the `revision` guard; [D-034](#d-034) would be superseded for Phase 2 if this model is adopted.
3. State is computed in the aggregate root during rehydration and stored on the projection for reads.
4. Collection ordering ([D-029](#d-029)) is enforced by aggregate root invariants on every append — at least as strong as enforcing it within a single array.
5. Two paradigms coexist intentionally — Phase 1 (mutation + snapshot) and Phase 2 (event sourcing) are cleanly isolated in the same service, with the Phase 1 pattern retired when Phase 1 endpoints are deprecated.

A full evaluation of the CQRS model against all 37 decisions and the live Phase 1 implementation is available as an [interactive report](https://claude.ai/code/artifact/f52d0e9b-f90d-44d0-b956-0dafbe9a5fb0).

**Options.**

**Option A — Aggregate model.** Implement as described in `model/mongo-schema-proposal.md`. Closest to Phase 1 conventions; lowest learning curve. Mutation-based writes; `-history` snapshot collections; `revision` as concurrency guard. Does not support projection rebuild or event replay without additional work. Previously decided; not yet implemented.

**Option B — Per-event-type collections.** Described in [`model/mongo-schema-proposal-per-event.md`](model/mongo-schema-proposal-per-event.md). One collection per business event (`movement-creations`, `collection-events`, `deliveries`, `receipt-events`), each with a `-history` companion. GET requests require two-collection reads; fate-of-waste requires up to four. State must either be denormalised onto the creation document (requiring multi-document transactions on collection-event writes) or computed at read time. The unique compound index on `{ movementId, sequence }` in `collection-events` handles concurrency for collection-event appends in place of the aggregate `revision` guard. Independent event-type queries and bounded document growth are the genuine advantages over Option A.

**Option C — CQRS / Event Sourcing.** Implement as described in `model/mongo-schema-proposal-CQRS.md`. Append-only `events` collection; `movements` and `deliveries` as projections rebuilt from events. Higher upfront complexity (aggregate root classes, command handlers, projection handlers, two-step write path); significant long-term benefits (immutable audit trail, projection rebuild on demand, amendments as first-class facts, no `-history` collections). An annotated code sketch of all four Phase 2 write paths is available as an [interactive architecture sketch](https://claude.ai/code/artifact/65564a71-55db-4329-9910-b7b5e07b3133).

**What needs resolving before a decision can be made.**

- **Spike (Option C only).** Implement all four Phase 2 POST endpoints end-to-end — `POST /movements`, `POST /movements/{id}/collection`, `POST /deliveries`, `POST /deliveries/{id}/receipt` — plus the corresponding GET reads from projections, using the CQRS model. If the team is comfortable with the pattern after the spike, proceed with Option C and record the new decision. If not, fall back to Option A.
- **PUT handlers (Option C only).** The sketch covers POST happy paths only. Amendment and soft-delete handlers ([D-009](#d-009), [D-036](#d-036)) must be designed before committing to Option C.
- **Two-step write atomicity (Option C only).** Whether to wrap `appendEvent` + projection update in a MongoDB session transaction needs deciding before the first production write.
- **Team alignment.** The Tech Architect and Data Architect should be aligned on the CQRS pattern and its trade-offs before a decision is recorded.

**Consequences (deferred until decided).** If Option A: `model/mongo-schema-proposal.md` is the implementation reference; [D-034](#d-034) applies as decided; Phase 0 action #4 in `plan.md` is resolved. If Option C: `model/mongo-schema-proposal-CQRS.md` is the implementation reference; [D-034](#d-034) is superseded for Phase 2 by the event-log / unique-index model. In either case, Phase 1 collections (`waste-inputs`, `waste-inputs-history`) are unchanged.

<a id="d-038"></a>

### API versioning: versioned during beta, unversioned at GA

**D-038** · ✅ Decided · Impact: 🔴 High · Area: **Versioning** · Related: [D-023](#d-023)

**Context.** The API has no versioning today — no path prefix, header or query parameter; `info.version` is only a documentation label. As the remaining waste-movement endpoints are built, the shape will be found by iteration, which means frequent breaking changes before it stabilises; once stable, the public contract must not break its integrators. A single fixed policy fits one phase and not the other: always-version adds needless machinery and duplication once the shape is stable, while never-version makes breaking iteration painful while we are still designing. GOV.UK recommends URI-path versioning _if_ you version and advises against header/media-type versioning, but its overriding principle is not to break existing consumers.

**Decision.** Version the API **during beta** and **drop the version at GA**:

- **During beta** — each milestone is versioned in the URI path (`/beta-0`, `/beta-1`, …), a prefix on the resource path (e.g. `/beta-1/waste-movements/{id}`), and milestones can run in parallel, letting the small, controlled set of early integrators migrate at their own pace. Beta is non-public, so path labels are acceptable here. Every endpoint is available at every version — providers never see a split where some endpoints sit on one version and others on another, so a breaking change to one endpoint means copying **all** existing endpoints forward into the new version, not just the changed one. Orchestration is confirmed to live in-service (branching/duplicated handlers per milestone); there is no CDP platform- or gateway-level versioning/routing capability to use instead.
- **At GA** — drop the version and publish one stable **unversioned** API, evolving it **additive-only** thereafter (new optional fields/endpoints/enum values in place; clients tolerate unknown fields). A genuinely unavoidable breaking change is a new resource/API, not a `/v2`.
- **Cutover** — dropping the version at GA is a one-time, announced breaking change for beta integrators (expected of a beta contract); the final beta version runs alongside the unversioned GA API for a migration window, marked deprecated, then retired.
- **Deprecation** — beta versions are retired by usage: monitor calls per software provider (via the JWT `client_id`), and while deprecated every response carries a single `Deprecation: true` header as an in-band signal.

Applies only to the new endpoints; the already-live Receipt of Waste endpoints keep their current unversioned paths.

Full rationale in the [versioning pitch](../api/versioning.md).

<a id="d-039"></a>

### Cross-cutting API standards for new endpoints

**D-039** · ✅ Decided · Impact: 🔴 High · Area: **API conventions** · Related: [D-006](#d-006), [D-009](#d-009), [D-014](#d-014), [D-036](#d-036)

**Context.** The cross-cutting conventions — how new endpoints signal outcomes, shape responses, and trace requests — were never standardised for the receipt endpoints, so each new endpoint was free to invent its own. Before the rest of the waste-movement journey is built, a small consistent foundation was agreed: adopt the [GOV.UK API standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) where they apply, and codify what the live receipt endpoints already do. Applies to **new** endpoints only — the live Receipt of Waste create/update endpoints are untouched.

**Decision.** Adopt the conventions set out in [`../api/standards.md`](../api/standards.md), which is the **source of truth** for the detail, examples and rationale. This register entry is the pointer to it, not a second copy. In brief:

- **Status codes** — `201` create / `200` update; every operation documents `400` + `401` + `500`, `404` where the path has an id, `402` on charge-gated writes; `204` not used. Reject-vs-warn follows the accept-with-warnings model ([D-006](#d-006), [D-009](#d-009), [D-036](#d-036)). `409`/`422` are noted as future refinements, not adopted now.
- **`2xx` envelope** — one shape, `{ data, meta?, validation }`; `validation` always present on writes (empty array when clean); create returns the new id inside `data` as an object.
- **`4xx`/`5xx` envelope** — one shape, `{ error: { code, message, details? }, requestId }`; machine-readable `error.code`; per-field `errorType` enum adopted from the code; the [D-014](#d-014) `404` distinction rides in `error.code`.
- **Tracing** — a trace id is guaranteed per request and echoed on every response as the public `x-request-id` header (mapped from CDP's internal `x-cdp-request-id`), with a top-level `requestId` on error bodies.
- **Pagination — deferred.** No list endpoints exist yet; the `meta.pagination` slot is reserved so paging can be added purely additively later. The scheme itself is decided with the first endpoint that pages.

**Consequences.** New endpoints share one status-code vocabulary, one success envelope and one failure envelope with each other and with the GOV.UK API standards, and every response is traceable. The detail is maintained in [`../api/standards.md`](../api/standards.md) — update that document, not this record, when the conventions evolve.

<a id="d-040"></a>

### Rename drop-off and Transfer ID to delivery and Delivery ID

**D-040** · ✅ Decided · Applied register-wide · Impact: 🟢 Low · Area: **Naming** · Related: [D-005](#d-005), [D-007](#d-007), [D-013](#d-013), [D-018](#d-018), [D-028](#d-028), [D-036](#d-036), [D-041](#d-041)

**Context.** The event where a driver hands waste to a receiver, and the identifier it mints, were named "drop-off" and "Transfer ID" (`POST /transfers`, `transferId`). This reads awkwardly against the rest of the journey vocabulary (creation, collection, receipt) and "transfer" invites confusion with unrelated senses of the word (e.g. transfer of ownership/duty of care, data transfer).

**Decision.** Rename "drop-off" to "delivery" and "Transfer ID" to "Delivery ID" everywhere in the public contract and documentation:

- `POST /transfers` → `POST /deliveries`
- `POST /transfers/receipt` → `POST /deliveries/receipt`
- `POST /transfers/{transferId}/receipt` → `POST /deliveries/{deliveryId}/receipt`
- `transferId` → `deliveryId`
- The "Drop-off" tag/operation wording → "Delivery"

This is a pure rename. It does not change the resource shape, the many-to-one cardinality against Movement IDs ([D-007](#d-007)), the identifier format ([D-013](#d-013)), or any other already-decided behaviour.

**Update.** The rename was subsequently applied retroactively across this register: every entry above and below now reads with "delivery"/"Delivery ID" throughout, including in narrative Context/Decision/Consequences prose, rather than being left with the original "drop-off"/"Transfer ID" wording. The bullet list above is the one place that still cites the old terms deliberately, since it is the record of what was renamed from and to.

## Retired

Superseded or obsolete entries, kept so that existing links still resolve.

<a id="d-030"></a>

#### Carrier-vs-broker discriminated union on `POST /movements`

**D-030** · 🗄️ Retired · Group: **A2** — Carrier and broker or dealer are separate fields on every event ([D-008](#d-008)); a single either/or shape is no longer under consideration.
