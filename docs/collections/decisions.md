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
| D-031 | [Treatment codes: intended at Creation, actual at Receipt](#d-031) | A3 | ✅ Decided | 🟠 Medium | Not yet |
| D-032 | [Waste is described at Creation and weighed at Receipt; Collection and Delivery carry no waste details](#d-032) | A3 | ✅ Decided | 🟠 Medium | beta-1 |
| D-042 | [A waste item is its classification plus logistics; the ordinary receipt carries logistics only](#d-042) | A3 | ✅ Decided | 🟠 Medium | Not yet |
| D-044 | [POP and hazardous components: a measured concentration, or how it compares with the WM3 threshold](#d-044) | A3 | ✅ Decided | 🟢 Low | Not yet |
| D-006 | [The receipt is cross-checked against what was declared earlier; mismatches do not block it](#d-006) | A4 | ✅ Decided | 🟠 Medium | Not yet |
| D-018 | [The delivery address is required when recording a delivery](#d-018) | A4 | ✅ Decided | 🟠 Medium | Not yet |
| D-025 | [How a receipt records acceptance, rejection or partial acceptance](#d-025) | A4 | ⏳ Open | 🔴 High | Not yet |
| D-046 | [Soft data-quality issues: accept with warnings, or reject and confirm](#d-046) | A4 | ⏳ Open | 🔴 High | n/a |
| D-021 | [What counts as a mismatch in the receipt cross-check](#d-021) | A4 | ⏳ Open | 🟠 Medium | n/a |
| D-009 | [Soft-delete with `isDeleted`; no hard delete and no `DELETE` endpoint](#d-009) | A5 | ✅ Decided | 🟠 Medium | Not yet (beta-3) |
| D-017 | [A recorded delivery cannot be edited, only soft-deleted](#d-017) | A5 | ✅ Decided | 🟠 Medium | Not yet (beta-3) |
| D-035 | [How transit collection events are stored, edited and soft-deleted](#d-035) | A5 | ⏳ Open | 🟠 Medium | n/a |
| D-051 | [Delivery immutability: why only delivery, and what after a receipt?](#d-051) | A5 | ⏳ Open | 🟠 Medium | n/a |
| D-050 | [Does deleting a later event free an earlier one to be deleted?](#d-050) | A5 | ⏳ Open | 🟢 Low | n/a |
| D-019 | [What a producer can see about the fate of their waste](#d-019) | A6 | ⏳ Open | 🟠 Medium | Not yet (beta-4) |
| D-001 | [One target spec for the whole journey, extending the Phase 1 Receipt API](#d-001) | B1 | ✅ Decided | 🔴 High | n/a |
| D-052 | [JSON Schemas in `waste-movement-backend` are the source of truth for request and response shapes](#d-052) | B1 | ✅ Decided | 🔴 High | beta-1 |
| D-003 | [OpenAPI 3.1, not 3.0.3](#d-003) | B1 | ✅ Decided | 🟠 Medium | n/a |
| D-016 | [Resource-shaped URLs, with HTTP methods as the verbs](#d-016) | B2 | ✅ Decided | 🔴 High | beta-1 |
| D-022 | [How a receipt is linked to its Delivery: new endpoints, or an extended Phase 1 receipt](#d-022) | B2 | ⏳ Open | 🔴 High | beta-1 (Option 1) |
| D-033 | [Per-event reads are deferred](#d-033) | B2 | ⏸️ Parked | 🟢 Low | Not yet (beta-4) |
| D-012 | [Only the Movement ID and the Delivery ID are public](#d-012) | B3 | ✅ Decided | 🔴 High | beta-1 |
| D-013 | [Identifiers are a two-digit year plus a sqids code, and their length is not fixed](#d-013) | B3 | ✅ Decided | 🔴 High | beta-1 |
| D-004 | [The Phase 1 receipt path keeps `{wasteTrackingId}`](#d-004) | B3 | ✅ Decided | 🟢 Low | n/a |
| D-028 | [Pre-reserved Delivery IDs for drivers without signal](#d-028) | B3 | ⏳ Open | 🟠 Medium | Not yet |
| D-039 | [API standards for the new endpoints: status codes, envelopes and tracing](#d-039) | B4 | ✅ Decided | 🔴 High | beta-1 |
| D-014 | [A `404` says whether the parent is missing or the event is not recorded yet](#d-014) | B4 | ✅ Decided | 🟠 Medium | Partly |
| D-034 | [Every update keeps the previous version and guards against concurrent changes](#d-034) | B4 | ✅ Decided | 🟠 Medium | Not yet (beta-3) |
| D-038 | [Versioned in the path during beta, unversioned at general availability](#d-038) | B5 | ✅ Decided | 🔴 High | beta-1 |
| D-023 | [When and how the Phase 1 receipt endpoints are retired](#d-023) | B5 | ⏳ Open | 🟠 Medium | n/a |
| D-024 | [How a Phase 1 `wasteTrackingId` relates to a Phase 2 Movement ID](#d-024) | B5 | ⏳ Open | 🟠 Medium | n/a |
| D-036 | [Anyone may record an event; only its author may change it](#d-036) | B6 | ✅ Decided | 🔴 High | Partly (beta-1) |
| D-027 | [One set of credentials per organisation, whatever role it plays](#d-027) | B6 | ✅ Decided | 🟠 Medium | beta-1 |
| D-037 | [How Phase 2 events are stored in MongoDB](#d-037) | B7 | ⏳ Open | 🔴 High | n/a |
| D-005 | [Receipt is linked to a delivery via the Delivery ID](#d-005) | B2 | 🗄️ Retired | — | — |
| D-011 | [Static and transit collection collapsed into a single endpoint](#d-011) | B2 | 🗄️ Retired | — | — |
| D-040 | [Rename drop-off and Transfer ID to delivery and Delivery ID](#d-040) | B2 | 🗄️ Retired | — | — |
| D-030 | [Carrier-vs-broker discriminated union on `POST /movements`](#d-030) | A2 | 🗄️ Retired | — | — |
| D-002 | [Single OpenAPI file, not `$ref`-split](#d-002) | B1 | 🗄️ Retired | — | — |

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

**Consequences.** A receipt has no ID of its own: it is addressed through its Delivery (`/deliveries/{deliveryId}/receipt`). How an individual collection event is addressed is still open ([D-035](#d-035)).

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
- Once the Movement is on any Delivery, no further collection events can be added.

How transit events are stored, and how a collection event is edited or soft-deleted, is still open ([D-035](#d-035)).

**Consequences.** The Movement ID stays the single handle for the whole journey, so fate-of-waste ([D-019](#d-019)) and audits query one ID. Whether a collection event needs a public ID of its own depends on how events are edited ([D-035](#d-035), [D-012](#d-012)). Collection events carry no waste weights ([D-032](#d-032)).

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

Built today: `brokerOrDealer` on Creation, Collection and both receipt endpoints in beta-2, and `contactDetails` on the producer and broker or dealer. Not yet built: `carrier` and `intendedCarriers`, which exist only in the target spec.

<a id="d-043"></a>

#### Creation declares intended receiving sites as an array: `receivers`

**D-043** · ✅ Decided · Impact: 🟢 Low · Group: **A2** · Built in: **Not yet** · Related: [D-045](#d-045)

**Context.** A producer may send waste to more than one receiving site (raised in DWTC-155). Creation previously took a single, optional `receiver`.

**Decision.** Creation takes `receivers`, an array of intended receiving sites.

- Required, with at least one entry, when the movement contains hazardous waste; optional otherwise. Whether the movement is hazardous comes from its waste classification, so this is checked by the server.
- Each entry needs `siteName`, `authorisationNumber`, `address` and `contactDetails` ([D-008](#d-008)).

The receivers declared at Creation are provisional. The site that actually received the waste is recorded on the receipt.

**Consequences.** The Joi drafts in `data/` still call the field `intendedReceivers`; they are to be renamed to `receivers` to match this decision.

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

In the target spec the ordinary receipt has its own request body, separate from the Phase 1 receipt, whose body is defined by the live [Receipt of Waste API reference](https://defra.github.io/waste-tracking-service/production/apiSpecifications/) and is unchanged.

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

A receipt recorded with `POST /receipts` has nothing earlier to compare with, so it is not cross-checked. If the live Phase 1 receipt is extended instead ([D-022](#d-022), Option 2), the check can only run when a Delivery ID is sent.

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

### A5 Corrections and lifecycle

<a id="d-009"></a>

#### Soft-delete with `isDeleted`; no hard delete and no `DELETE` endpoint

**D-009** · ✅ Decided · Impact: 🟠 Medium · Group: **A5** · Built in: **Not yet (beta-3)** · Related: [D-017](#d-017), [D-029](#d-029), [D-035](#d-035), [D-034](#d-034), [D-036](#d-036), [D-050](#d-050)

**Context.** Providers need a way to withdraw an event recorded in error. Removing records outright would lose the audit trail of what was submitted.

**Decision.** Nothing is ever hard-deleted, and there is no `DELETE` endpoint.

- **What can be deleted.** Movement, Collection and Delivery each carry `isDeleted` (default `false`). A Receipt cannot be deleted: it is the last event in the journey. How a single collection event in a sequence is soft-deleted is still open ([D-035](#d-035)).
- **How.** `isDeleted` is set to `true` only through the event's `PUT`. A `POST` that sends `isDeleted: true` is rejected (`NotAllowed`).
- **Only while nothing later exists.** A Movement can be deleted until a collection is recorded against it; a collection until the Movement is on a Delivery; a Delivery until a Receipt is recorded against it. A later event that has itself been deleted still counts ([D-050](#d-050)).
- **A deleted event blocks what follows.** No collection can be recorded or updated against a deleted Movement. A deleted Movement, or one with no active collection event, cannot be named on a Delivery. No receipt can be recorded or updated against a deleted Delivery.
- **Undo.** A `PUT` with `isDeleted: false` restores the event. This is always allowed, because nothing later could have been recorded while it was deleted.

Breaking a rule is rejected with `400` (`BusinessRuleViolation`), not reported as a warning.

**Consequences.** One mechanism covers all three deletable events. Only the organisation that recorded an event can delete it ([D-036](#d-036)), and every change is kept in the event's history ([D-034](#d-034)). Every write must check the deletion state of the events it refers to, as well as that they exist.

<a id="d-050"></a>

#### Does deleting a later event free an earlier one to be deleted?

**D-050** · ⏳ Open · Impact: 🟢 Low · Group: **A5** · Built in: **n/a** · Related: [D-009](#d-009)

Spun out of [D-009](#d-009), to confirm with the BA. D-009 takes the stricter reading: once a collection has been recorded against a Movement, the Movement can never be deleted, even if that collection is later deleted. The looser reading — deleting the collection frees the Movement — was rejected, because two deletes in a row could hide the fact that a collection ever happened. Confirm the stricter reading holds up in real provider scenarios.

<a id="d-017"></a>

#### A recorded delivery cannot be edited, only soft-deleted

**D-017** · ✅ Decided · Impact: 🟠 Medium · Group: **A5** · Built in: **Not yet (beta-3)** · Related: [D-007](#d-007), [D-009](#d-009), [D-018](#d-018), [D-027](#d-027), [D-034](#d-034), [D-051](#d-051)

**Context.** A delivery records a physical handover: which Movements, by which carrier, where and when. Policy requires that record to be unchangeable once made.

**Decision.** `PUT /deliveries/{deliveryId}` accepts only `isDeleted`, plus `apiCode`, which every request carries to identify the organisation ([D-027](#d-027)). Any other field is rejected (`NotAllowed`).

To correct a delivery, soft-delete it and record a new one with `POST /deliveries`. This is only possible until a receipt has been recorded against it ([D-009](#d-009)).

**Consequences.** The Movement IDs on a delivery ([D-007](#d-007)) and its address ([D-018](#d-018)) are fixed once recorded; changing them means delete and record again. The soft-delete itself is kept in the delivery's history ([D-034](#d-034)). Two policy questions remain open ([D-051](#d-051)).

<a id="d-051"></a>

#### Delivery immutability: why only delivery, and what after a receipt?

**D-051** · ⏳ Open · Impact: 🟠 Medium · Group: **A5** · Built in: **n/a** · Related: [D-009](#d-009), [D-017](#d-017)

Spun out of [D-017](#d-017), for the BA and policy team:

1. **Consistency.** Movement and collection `PUT`s accept full updates; delivery accepts only soft-delete. Is delivery deliberately the only event that cannot be edited?
2. **Correction after a receipt.** Once a receipt is recorded, a delivery can be neither edited nor deleted, so a mistake in it can never be put right. Is that acceptable, or is an exception needed?

<a id="d-035"></a>

#### How transit collection events are stored, edited and soft-deleted

**D-035** · ⏳ Open · Impact: 🟠 Medium · Group: **A5** · Built in: **n/a** · Related: [D-009](#d-009), [D-012](#d-012), [D-016](#d-016), [D-017](#d-017), [D-029](#d-029), [D-037](#d-037)

Spun out of [D-029](#d-029), which decides that a driver-to-driver handover is recorded as a further `TRANSIT` collection event on the same Movement. How those events are then stored and managed is still to be worked out:

1. **Storage.** Whether collection events are held as an ordered sequence on the Movement, or in a separate MongoDB collection of their own. This depends on the storage model ([D-037](#d-037)).
2. **Link to the previous carrier.** How a `TRANSIT` event's `receivedFromCarrier` relates to the carrier on the event before it. D-029 already decides they are not cross-checked; open is what, if anything, links the two in the stored record.
3. **Editing.** How a provider addresses a specific collection event to correct it. Options so far:
   - only the latest event can be corrected, through `PUT /movements/{movementId}/collection`;
   - expose each event's ID, with `PUT /movements/{movementId}/collection/{collectionId}`. This reverses "per-event IDs are not exposed" ([D-012](#d-012)) for collection, a rule that rested on each event being 1:1 with its parent ([D-016](#d-016));
   - a fixed sequence number given when the event is appended and never reused, with `PUT /movements/{movementId}/collection/{sequence}`.
4. **Soft deletion.** Which events in a sequence can be soft-deleted ([D-009](#d-009)), and whether anything else has to follow.

**Earlier position, to revisit.** Only the latest active event could be corrected or soft-deleted, working back from the tail, so the `STATIC` event could only be deleted once it was the only active one. Once the Movement was on a Delivery, collection events could no longer be changed at all, in line with deliveries ([D-017](#d-017)).

### A6 Fate of waste

<a id="d-019"></a>

#### What a producer can see about the fate of their waste

**D-019** · ⏳ Open · Impact: 🟠 Medium · Group: **A6** · Built in: **Not yet (beta-4)** · Related: [D-007](#d-007), [D-029](#d-029), [D-031](#d-031), [D-033](#d-033), [D-036](#d-036)

**Context.** A producer hands their Movement ID to a carrier and records nothing after Creation themselves. A fate-of-waste read gives them a view of what happened next: when it was collected, where it ended up, and how it was treated. The Movement ID is the key, because it is the producer's only reference to the journey.

**Current state.** The target spec has `GET /movements/{movementId}/fate-of-waste`, marked as a proposal. The path and the key are settled; what it returns is not. Reads are planned for beta-4 ([versioning schedule](../api/versioning-schedule.md)).

**Open, for the BA and policy team:**

1. **Several events.** A Movement can have several collection events ([D-029](#d-029)) and be on several Deliveries, each with its own receipt ([D-007](#d-007)). Does the producer see every event, or a summary — for example the first collection and the last receipt?
2. **Treatment.** The actual treatment comes from each receipt's `actualTreatments`, which can split a waste item across several codes by weight ([D-031](#d-031)). Is the producer shown that list, a summary of it, or nothing until a final treatment is known?
3. **Onward movement.** Waste accepted at a transfer station may move on to a treatment facility. Is that second leg in scope? If not, the final treatment cannot be shown.
4. **Content.** Beyond dates and treatment, what else does the producer see — the waste classification, the receiving site, the carriers?
5. **Who may read it.** Movement IDs are shared between organisations and are not secret ([D-036](#d-036)). Is the read limited to the producer, or the organisation that created the Movement, or open to anyone holding the ID? Many producers have no API access at all.

Unlike the per-event reads ([D-033](#d-033)), this is a producer-facing summary, not a copy of the recorded events.

## Part B — Technical and API design

### B1 Specs and schemas

<a id="d-001"></a>

#### One target spec for the whole journey, extending the Phase 1 Receipt API

**D-001** · ✅ Decided · Impact: 🔴 High · Group: **B1** · Built in: **n/a** · Related: [D-016](#d-016), [D-022](#d-022), [D-023](#d-023), [D-038](#d-038), [D-052](#d-052)

**Context.** Phase 1 delivered a receiver-only Receipt of Waste API, which is live. Phase 2 adds the rest of the journey: creating a movement, collection, delivery, and fate-of-waste for producers. It could be designed as a separate Phase 2 API, or as an extension of the existing contract.

**Decision.** `openapi.yaml` is one target spec covering the whole journey, built as an extension of the Phase 1 Receipt API:

- It describes the intended contract at general availability, without a version prefix ([D-038](#d-038)). It is a design target and subject to change.
- The Phase 1 receipt endpoints stay in it. They are shown as deprecated under the current proposal, but that depends on how receipts are linked to Deliveries ([D-022](#d-022)), and nothing is decided about when or how they would be retired ([D-023](#d-023)).
- The Phase 1 reference-data lookups (`/reference-data/...`) are kept as they are.

What is served today is described separately, by `openapi-beta-1.yaml` and `openapi-beta-2.yaml` ([D-052](#d-052)).

**Consequences.** One document shows the whole journey and the intended path away from the Phase 1 receipt. The cost is carrying some Phase 1 shapes forward, such as the `wasteTrackingId` name ([D-004](#d-004)). The live Phase 1 endpoints and their own documentation are not changed by this spec.

<a id="d-052"></a>

#### JSON Schemas in `waste-movement-backend` are the source of truth for request and response shapes

**D-052** · ✅ Decided · Impact: 🔴 High · Group: **B1** · Built in: **beta-1** · Related: [D-001](#d-001), [D-003](#d-003)

**Context.** Request and response shapes used to be written in several places — the spec, Joi validation in the services, and Joi drafts in this repo — and drifted apart. What we publish and what the service enforces must be the same thing.

**Decision.**

- Every beta request and response shape is a JSON Schema file in `waste-movement-backend` under `src/schemas/beta-N/`, with its tests beside it.
- The backend validates requests and responses against those files. A request that fails is rejected with `400`; a response that fails is logged and returned as `500`, so the service cannot silently drift from its own contract.
- This repo keeps a verbatim copy under `docs/event-model/schemas/`, refreshed with `npm run schemas:sync`. A check on every pull request reports when the copy no longer matches the backend's `main`.
- The beta specs refer to those files with `$ref` instead of restating them. `npm run specs:bundle` inlines every reference into a single file per spec and validates it against the OpenAPI 3.1 rules; the published pages render the bundled file.
- The target spec `$ref`s the beta-2 files wherever beta-2 already defines a shape, and describes the rest itself until it is built.

**Consequences.** Changing a shape means changing the backend schema; the docs follow. The Joi drafts in `docs/collections/data/` are retired resource by resource as their shapes move into the backend schemas. Replaces the single hand-written spec file of [D-002](#d-002).

<a id="d-003"></a>

#### OpenAPI 3.1, not 3.0.3

**D-003** · ✅ Decided · Impact: 🟠 Medium · Group: **B1** · Built in: **n/a** · Related: [D-052](#d-052)

**Context.** The specs were OpenAPI 3.0.3, like the Phase 1 Receipt API. Once they started referring to the JSON Schema files ([D-052](#d-052)), that no longer worked: 3.0.3 understands an older JSON Schema than the one the files are written in, and cannot express rules such as "for a household producer these fields are not allowed" or "exactly one of these two fields". A 3.0.3 spec drops those rules silently and tells the reader the API accepts more than it does.

**Decision.** Every spec in this repo — the beta specs and the target spec — is OpenAPI 3.1, which uses the same JSON Schema version as the schema files.

**Consequences.** The specs describe the rules the service actually applies. The schema files and the specs must stay on matching versions: if one moves, the other moves with it. The live Phase 1 endpoints and their own documentation are unchanged.

One open risk: some providers generate client code from the spec, and not every generator reads 3.1. Worth asking the integrators already testing against beta-1.

### B2 Resource model and URLs

<a id="d-016"></a>

#### Resource-shaped URLs, with HTTP methods as the verbs

**D-016** · ✅ Decided · Impact: 🔴 High · Group: **B2** · Built in: **beta-1** · Related: [D-012](#d-012), [D-015](#d-015), [D-022](#d-022), [D-023](#d-023), [D-041](#d-041)

**Context.** The first draft of the spec used verb-shaped paths — `/movements/create`, `/movements/collection`, `/movements/delivery`, `/movements/receive` — with every operation a `POST`. After architecture reviews the team agreed on resource paths with HTTP methods as the verbs (Level 2 of the Richardson Maturity Model): a cleaner contract, and the basis for cacheable reads later.

**Decision.**

- Top-level resources are plural: `/movements` and `/deliveries`.
- A single resource is addressed by its public ID: `/movements/{movementId}`, `/deliveries/{deliveryId}`.
- Events that belong to a parent are singular sub-resources of it: `/movements/{movementId}/collection` and `/deliveries/{deliveryId}/receipt`. The parent's ID is the handle, so these events need no public ID of their own ([D-012](#d-012)).
- `POST` records an event; `PUT` updates it.
- `operationId`s stay verb-shaped and describe the business event — `createMovement`, `recordCollection`, `recordDelivery`, `recordReceipt` — so they stay stable if a path changes.

`POST /receipts` is the one top-level receipt path, for a receipt with no prior Delivery ([D-041](#d-041)).

**Consequences.** Movement ID and Delivery ID are the only identifiers a provider handles. Reads (`GET`) can be added on the same paths later without changing them.

**Phase 1 receipt endpoints.** In the target spec, `POST /movements/receive` and `PUT /movements/{wasteTrackingId}/receive` are shown as `deprecated: true`, with operationIds `createReceiptMovementLegacy` and `updateReceiptMovementLegacy`, so that the plain names belong to the new receipt endpoints. They are shown as deprecated under the current proposal, but that depends on [D-022](#d-022): if the live receipt is extended instead, it is not retired. Nothing has been decided about when or how — the gap between Phase 1 and Phase 2 is still being defined ([D-023](#d-023)) — and the live endpoints are unchanged.

Built today: the four event paths plus `POST /receipts`, `POST` only, under the `/beta-1` and `/beta-2` prefixes ([D-038](#d-038)).

<a id="d-022"></a>

#### How a receipt is linked to its Delivery: new endpoints, or an extended Phase 1 receipt

**D-022** · ⏳ Open · Impact: 🔴 High · Group: **B2** · Built in: **beta-1 (Option 1, as the beta proposal)** · Related: [D-001](#d-001), [D-006](#d-006), [D-016](#d-016), [D-023](#d-023), [D-041](#d-041)

**Context.** In Phase 2 a receipt should be linked to the Delivery it completes. Two options:

- **Option 1 — new endpoints.** `POST /deliveries/{deliveryId}/receipt`, with the Delivery ID in the path, and `POST /receipts` for a receipt with no prior Delivery ([D-041](#d-041)). Every receipt is linked by construction and always cross-checked ([D-006](#d-006)); the URLs follow the resource model ([D-016](#d-016)). Providers have to move to new endpoints.
- **Option 2 — extend the live Phase 1 receipt.** Keep `POST /movements/receive` and add an optional `deliveryId` to its body. One receipt endpoint, and existing providers add a field when ready. But linking becomes optional, so a receipt can silently go unlinked; the cross-check only runs when the field is sent; and it means changing the live Receipt of Waste endpoint.

**Current position.** The beta work carries on with Option 1: `/deliveries/{deliveryId}/receipt` and `/receipts` are the beta proposal, and the target spec follows it. Changing the live Receipt of Waste endpoint (Option 2) is still an option, to address later.

**Open.** Measure the impact of both from a software provider's point of view before deciding — the integration change each one asks of providers already live on Phase 1, the risk to the live service, and how reliably receipts end up linked. The decision also drives whether and how the Phase 1 receipt is retired ([D-023](#d-023)).

<a id="d-033"></a>

#### Per-event reads are deferred

**D-033** · ⏸️ Parked · Impact: 🟢 Low · Group: **B2** · Built in: **Not yet (beta-4)** · Related: [D-014](#d-014), [D-016](#d-016), [D-019](#d-019)

After discussion with the BA, the reads of individual events were taken out of the target spec until their content is agreed:

- `GET /movements/{movementId}` (`getMovement`)
- `GET /movements/{movementId}/collection` (`getCollection`)
- `GET /deliveries/{deliveryId}` (`getDelivery`)
- `GET /deliveries/{deliveryId}/receipt` (`getReceipt`)

The paths stay as defined in [D-016](#d-016), and reads can be added on them later without changing anything else. Reads are planned for beta-4 ([versioning schedule](../api/versioning-schedule.md)). Until then the not-found distinctions in [D-014](#d-014) apply to `POST` and `PUT` only.

The producer-facing fate-of-waste read is a separate question ([D-019](#d-019)).

### B3 Identifiers

<a id="d-012"></a>

#### Only the Movement ID and the Delivery ID are public

**D-012** · ✅ Decided · Impact: 🔴 High · Group: **B3** · Built in: **beta-1** · Related: [D-013](#d-013), [D-016](#d-016), [D-035](#d-035)

**Context.** Every event needs a unique record internally, but that is a storage concern. What matters for the contract is which values providers have to store and pass around.

**Decision.** The contract exposes two identifiers: the **Movement ID**, minted by `POST /movements`, and the **Delivery ID**, minted by `POST /deliveries` or `POST /receipts`. Creation, collection, delivery and receipt events keep their own internal IDs, which are never returned. The Phase 1 receipt keeps its own `wasteTrackingId` ([D-004](#d-004)).

What each beta endpoint returns in `data`:

| Endpoint | `data` |
| --- | --- |
| `POST /movements` | `{ movementId }` |
| `POST /movements/{movementId}/collection` | `null` |
| `POST /deliveries` | `{ deliveries: [{ deliveryId, movementIds, wasteType }] }` ([D-010](#d-010)) |
| `POST /deliveries/{deliveryId}/receipt` | `{ deliveryId }` |
| `POST /receipts` | `{ deliveryId }` — the Delivery created for the receipt ([D-041](#d-041)) |

**Consequences.** A provider tracks two values per journey: the Movement ID, which identifies the movement from creation to fate-of-waste, and the Delivery ID, which identifies one handover of one or more Movements. Collection and receipt are addressed through their parent ([D-016](#d-016)). Whether collection events need public IDs of their own is part of [D-035](#d-035).

<a id="d-013"></a>

#### Identifiers are a two-digit year plus a sqids code, and their length is not fixed

**D-013** · ✅ Decided · Impact: 🔴 High · Group: **B3** · Built in: **beta-1** · Related: [D-010](#d-010), [D-012](#d-012), [D-024](#d-024), [D-028](#d-028)

**Context.** Movement and Delivery IDs are written on paperwork and passed between organisations, so they must be short, easy to share, opaque and unique at national volume (estimated at more than 100,000 movements a year).

**Decision.** IDs are minted by `waste-tracking-id-backend` from a counter that restarts every year. Each ID is the last two digits of the year followed by the counter encoded with sqids ([sqids.org](https://sqids.org/)) using the characters `A–Z` and `0–9`, at least six characters long — for example `25HRA0B2`.

- **Length is not fixed.** It is at least eight characters and grows as the yearly counter grows; nine-character IDs are already issued. Providers must not assume a fixed length or validate a pattern.
- **One shared sequence.** Movement IDs, Delivery IDs and the Phase 1 `wasteTrackingId` all come from the same counter, so two different IDs are never the same string — except a hazardous Delivery, whose ID is its Movement ID by design ([D-010](#d-010)).
- **Opaque.** IDs carry no meaning a provider should rely on, beyond being unique.

**Consequences.** The year prefix gives each year a fresh range, so capacity is effectively unlimited. The beta schemas describe IDs as plain strings with no pattern. The target spec describes `wasteTrackingId` the same way.

<a id="d-004"></a>

#### The Phase 1 receipt path keeps `{wasteTrackingId}`

**D-004** · ✅ Decided · Impact: 🟢 Low · Group: **B3** · Built in: **n/a** · Related: [D-012](#d-012), [D-016](#d-016), [D-024](#d-024)

**Context.** An earlier draft renamed the Phase 1 receipt path parameter to `{id}`. Next to `{movementId}` and `{deliveryId}` on the new paths, a bare `{id}` would be ambiguous — and the value is the Phase 1 `wasteTrackingId`, minted at receipt, not a Movement ID.

**Decision.** `PUT /movements/{wasteTrackingId}/receive` keeps `{wasteTrackingId}`, as it is live. Every path parameter names the identifier it carries; there is no generic `{id}` anywhere.

**Consequences.** A Movement ID must never be sent where a `wasteTrackingId` is expected. How the two relate is part of migration ([D-024](#d-024)).

<a id="d-028"></a>

#### Pre-reserved Delivery IDs for drivers without signal

**D-028** · ⏳ Open · Impact: 🟠 Medium · Group: **B3** · Built in: **Not yet** · Related: [D-013](#d-013)

A driver with no signal at the point of delivery cannot call `POST /deliveries` to get a Delivery ID — yet they need one to hand to the receiver, often on paper, so the receipt can be recorded against it.

Open: can providers reserve a pool of Delivery IDs in advance, which a driver's app assigns offline and records with `POST /deliveries` once back in signal? Sub-questions:

- how reserved IDs are issued without clashing, given the shared sequence ([D-013](#d-013));
- how long a reservation lasts, and what happens to IDs never used;
- whether Movement IDs need the same, or only Delivery IDs — the delivery is the most likely point to be offline.

**Proposed answer:** [Option A — Pre-reserved Delivery IDs](phase2/option-a-pre-reserved-delivery-IDs.md), a draft design not yet reviewed: a reservation endpoint, a per-organisation quota, ownership checks and a validity lookup. A spike exists on an unmerged backend branch.

### B4 API conventions

<a id="d-039"></a>

#### API standards for the new endpoints: status codes, envelopes and tracing

**D-039** · ✅ Decided · Impact: 🔴 High · Group: **B4** · Built in: **beta-1** · Related: [D-014](#d-014), [D-046](#d-046)

**Context.** The live receipt endpoints never had agreed conventions for status codes, response shapes or tracing, and returned two different error shapes. Before the rest of the journey was built, a small consistent set was agreed, following the [GOV.UK API standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) where they apply. It covers the new endpoints only; the live Receipt of Waste endpoints are unchanged.

**Decision.** Adopt [API standards](../api/standards.md), which is the source of truth for the detail and the reasoning. In brief:

- **Status codes.** `201` for a `POST` that records an event, `200` for a `PUT`. Every operation documents `400`, `401` and `500`; `404` where the path holds an ID; `402` where the service charge applies. `204`, `409` and `422` are not used for now.
- **Success.** One envelope, `{ data, meta?, validation }`. `data` holds the result — the new ID as an object on create ([D-012](#d-012)); `meta` is reserved for paging; `validation.warnings` is always present on writes, empty when there is nothing to report. Whether warnings stay at all is open ([D-046](#d-046)).
- **Errors.** [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) (`application/problem+json`) for every `4xx` and `5xx`: `type`, `title`, `detail`, `instance`, `requestId`, and on `400` an `errors[]` list of `{ pointer, errorType, message }`, where `pointer` is a JSON Pointer to the field. Each `type` has a page under [Problem types](../problems/index.md).
- **Tracing.** Every response carries an `x-request-id` header; error bodies repeat it as `requestId`.
- **Paging.** Not needed yet — there are no list endpoints. `meta` leaves room to add it without breaking anything.

**Consequences.** All new endpoints share one set of status codes, one success shape and one error shape, and every response can be traced.

`type` URIs point at the published [Problem types](../problems/index.md) pages on this docs site (`https://defra.github.io/digital-waste-tracking-api-docs/…/problems/`), as the service returns them today.

Built today: all of the above on beta-1 and beta-2.

<a id="d-014"></a>

#### A `404` says whether the parent is missing or the event is not recorded yet

**D-014** · ✅ Decided · Impact: 🟠 Medium · Group: **B4** · Built in: **Partly** · Related: [D-009](#d-009), [D-033](#d-033), [D-039](#d-039)

**Context.** Collection and receipt are recorded under a parent that exists first. A request to one of these paths can return `404` for two different reasons: the parent's ID is wrong, or the parent exists but the event has not been recorded yet — for example a `PUT` before any `POST`. The caller needs to tell them apart: one means "fix the ID", the other "record it first".

**Decision.** The `404` problem `type` ([D-039](#d-039)) distinguishes the cases:

| Path | Parent missing | Event not recorded yet |
| --- | --- | --- |
| `/movements/{movementId}/collection` | `movement-not-found` | `collection-not-recorded` |
| `/deliveries/{deliveryId}/receipt` | `delivery-not-found` | `receipt-not-recorded` |

"Not recorded yet" only arises on `PUT` and, later, `GET` ([D-033](#d-033)). Top-level paths such as `/movements/{movementId}` can only be missing in one way, and use a plain not-found.

**Consequences.** A caller can act on the `type` alone, without parsing the message.

Built today: only `POST` exists, so only "parent missing" can occur, and the service returns the generic `not-found` type with the cause in `detail`. The specific types are not built yet; the target spec shows them, and the beta specs show what is returned today.

<a id="d-034"></a>

#### Every update keeps the previous version and guards against concurrent changes

**D-034** · ✅ Decided · Impact: 🟠 Medium · Group: **B4** · Built in: **Not yet (beta-3)** · Related: [D-009](#d-009), [D-017](#d-017), [D-036](#d-036), [D-037](#d-037)

**Context.** The Phase 1 receipt `PUT` copies the current record into a history store before applying an update, and increments a revision number on the record so that two simultaneous updates cannot silently overwrite each other.

**Decision.** Every Phase 2 `PUT` — movement, collection, delivery and receipt, including a soft-delete ([D-009](#d-009)) — keeps the previous version of the record and rejects a concurrent change instead of overwriting it. How this is stored depends on the storage model ([D-037](#d-037)): history copies with a revision number as in Phase 1, or an append-only event log that holds every version by design.

**Consequences.** Every change to an event can be audited, including who made it ([D-036](#d-036)). None of this is visible in the contract: a `PUT` returns the usual `200` envelope ([D-039](#d-039)), and there is one current record per event.

### B5 Versioning and Phase 1 migration

<a id="d-038"></a>

#### Versioned in the path during beta, unversioned at general availability

**D-038** · ✅ Decided · Impact: 🔴 High · Group: **B5** · Built in: **beta-1** · Related: [D-001](#d-001), [D-016](#d-016), [D-023](#d-023)

**Context.** While the new endpoints are being shaped, breaking changes are frequent; once the shape is stable, the public contract must never break its integrators. Versioning everything for ever adds needless machinery once the shape is stable, while never versioning makes iteration painful while it is not. GOV.UK recommends path versioning if you version at all, and above all not breaking existing consumers.

**Decision.**

- **During beta, the version is a path prefix:** `/beta-1/movements`, `/beta-2/movements`, and so on. Versions run side by side, so the small set of early integrators can move at their own pace. Each version offers every endpoint — a breaking change to one endpoint means copying all of them into the next version, so a provider never has to mix versions. Versions are run by the service itself; the platform offers no version routing.
- **At general availability, the version is dropped.** One unversioned API, changed only by adding things — new optional fields, endpoints or enum values — and clients must ignore fields they don't know. A change that cannot be made that way becomes a new resource, not a `/v2`.
- **Cutover.** Dropping the version is one announced breaking change for beta integrators. The last beta version runs alongside the unversioned API for a migration window, marked as deprecated, then is withdrawn.
- **Retiring a beta version** is driven by usage: calls are monitored per software provider, and while a version is deprecated every response carries a `Deprecation: true` header.

This covers the new endpoints only. The live Receipt of Waste endpoints keep their unversioned paths; "beta-0" in the [versioning schedule](../api/versioning-schedule.md) is just a name for them, not a path.

**Consequences.** Full reasoning in the [versioning pitch](../api/versioning.md).

Built today: `/beta-1` and `/beta-2`, each with all five endpoints. The gateway enables versions one by one through configuration, and the logs record the calling provider and organisation on every beta request. Not built yet: the `Deprecation` header.

<a id="d-023"></a>

#### When and how the Phase 1 receipt endpoints are retired

**D-023** · ⏳ Open · Impact: 🟠 Medium · Group: **B5** · Built in: **n/a** · Related: [D-001](#d-001), [D-016](#d-016), [D-022](#d-022), [D-024](#d-024)

**Current position.** The live Receipt of Waste endpoints — `POST /movements/receive` and `PUT /movements/{wasteTrackingId}/receive` — are not changed until a migration from Phase 1 to Phase 2 is documented. The target spec shows them as deprecated under the current proposal ([D-001](#d-001)).

**Open.**

1. **Whether they are retired at all.** That depends on how receipts are linked to Deliveries ([D-022](#d-022)): with new endpoints, the Phase 1 receipt is eventually retired; if it is extended instead, it stays.
2. **The gap.** What a provider live on Phase 1 has to change to move to Phase 2 — still being defined, by comparing the current endpoints with the beta ones from a provider's point of view.
3. **When and how.** Anything from keeping the Phase 1 endpoints indefinitely to a scheduled cutover with a migration window, and how providers are told. Redirecting old calls to the new endpoints was considered, but HTTP clients handle redirects of `POST` and `PUT` inconsistently.

How existing Phase 1 records relate to Phase 2 Movements is [D-024](#d-024).

<a id="d-024"></a>

#### How a Phase 1 `wasteTrackingId` relates to a Phase 2 Movement ID

**D-024** · ⏳ Open · Impact: 🟠 Medium · Group: **B5** · Built in: **n/a** · Related: [D-004](#d-004), [D-013](#d-013), [D-022](#d-022), [D-023](#d-023)

Phase 1 mints `wasteTrackingId` when waste is received; Phase 2 mints the Movement ID when the movement is created. Open, as part of the Phase 1 to Phase 2 migration ([D-023](#d-023)): does a Phase 1 receipt map to a Phase 2 Movement, and if so how? The answer depends on how receipts are linked to Deliveries ([D-022](#d-022)). Both IDs come from the same sequence ([D-013](#d-013)), so a `wasteTrackingId` can never clash with a Movement ID.

### B6 Identity and authorisation

<a id="d-027"></a>

#### One set of credentials per organisation, whatever role it plays

**D-027** · ✅ Decided · Impact: 🟠 Medium · Group: **B6** · Built in: **beta-1** · Related: [D-036](#d-036)

**Context.** Phase 1 is used by receivers only. Each integrating system gets a Cognito app client (`client_id` and `client_secret`), exchanged for a bearer token, and each request carries an `apiCode` that identifies the organisation it is made for. Phase 2 adds producers, carriers and brokers or dealers. The question was whether each role needs its own credentials.

**Decision.** Credentials are per organisation, not per role. Every organisation onboards the same way and gets the same two credentials; an organisation that is both a carrier and a receiver uses one set for both.

- **Cognito app client** — issued manually, per integrating system and per environment, and shared over a secure channel. Unchanged from Phase 1.
- **`apiCode`** — self-service: once an organisation is registered and its users sign in with Defra ID, they create, name and disable their own API codes in the organisation service (`waste-organisation-frontend`). Already in place for Phase 1; nothing new is needed for Phase 2.

Every record is attributed to the organisation identified by the `apiCode`, whatever role it is acting in.

**Consequences.** API codes scale through self-service; app clients remain a manual step per integrating system, which grows as carriers, brokers and producers join. Restricting which roles may record which events is a separate policy question ([D-036](#d-036)).

Built today: on every beta request the gateway looks the `apiCode` up in the organisation service and passes the organisation on to the backend. An unknown code is rejected with `400`; an organisation whose service charge has lapsed gets `402`.

<a id="d-036"></a>

#### Anyone may record an event; only its author may change it

**D-036** · ✅ Decided · Impact: 🔴 High · Group: **B6** · Built in: **Partly (beta-1)** · Related: [D-009](#d-009), [D-012](#d-012), [D-017](#d-017), [D-027](#d-027), [D-029](#d-029), [D-034](#d-034)

**Context.** One Movement passes through several organisations: a broker may create it, one carrier collect it, another take it on ([D-029](#d-029)), and a receiver record the receipt. After creation no single organisation owns it. Authentication says who is calling, but not whether they may write to a given Movement. Movement and Delivery IDs are shared between organisations by design ([D-012](#d-012)), so holding an ID cannot be what grants the right to write. Phase 1 already lets only the organisation that recorded a receipt update it.

**Decision.**

- **Recording (`POST`) is open.** Any authenticated, onboarded organisation may record any event against any Movement or Delivery.
- **Changing (`PUT`) is limited to the author** — the organisation whose `apiCode` recorded the event. This includes soft-delete ([D-009](#d-009)) and applies alongside the other update rules ([D-017](#d-017), [D-034](#d-034)).
- **Integrity comes from attribution.** Every write is stamped by the server with the organisation that made it, and that record cannot be changed. A wrong or bad-faith write is traceable to its author — and these are licensed, identified operators, so that is a real deterrent.

**Not decided here.** Whether policy should restrict who may record what — for example only a permitted receiving site may record a receipt, or only a declared carrier a collection. The service has the identity needed to enforce such rules if policy defines them, without changing the contract.

**Consequences.** The model fits the reality of reassignment, subcontracting and handovers. It depends on every write's author being stored, unchangeable and available to regulators.

Built today: beta stores the organisation on every Movement and Delivery it records, and does not restrict which organisation may refer to an existing one. Not yet built: `PUT`, so the author-only rule is not exercised yet.

### B7 Storage

<a id="d-037"></a>

#### How Phase 2 events are stored in MongoDB

**D-037** · ⏳ Open · Impact: 🔴 High · Group: **B7** · Built in: **n/a** · Related: [D-029](#d-029), [D-034](#d-034), [D-035](#d-035)

**Context.** Three storage models have been proposed for Phase 2:

- **Option A — one document per Movement and per Delivery** ([proposal](model/mongo-schema-proposal.md)). A `movements` document holds the creation and its collection events; a `deliveries` document holds its Movement IDs, the delivery and the receipt. Each has a history collection and a revision number, as in Phase 1. Closest to Phase 1, with the lowest learning curve; no replay or rebuilding of views without extra work.
- **Option B — one collection per event type** ([proposal](model/mongo-schema-proposal-per-event.md)). Creations, collection events, deliveries and receipts each in their own collection, each with history. Simple, bounded documents and independent queries per event type; but reading a Movement means reading two collections, fate-of-waste up to four, and keeping state consistent needs multi-document transactions.
- **Option C — event log with derived views** ([proposal](model/mongo-schema-proposal-CQRS.md)). Every change is appended to one `events` collection, the only source of truth; `movements` and `deliveries` are views rebuilt from it. The log is the history, so no history collections are needed, and a unique index on stream and sequence number guards against concurrent writes. The most powerful option — full audit trail, views can be rebuilt, corrections are recorded as facts — and the most complex to build.

Option A was previously recorded as decided. The entry was reopened because Option C had not been evaluated at the time.

**What has to happen before deciding.**

- **Spike Option C:** all four Phase 2 `POST`s and their reads, end to end. If the team is comfortable with the pattern, adopt it; if not, fall back to Option A.
- **Design updates for Option C:** corrections and soft-deletes ([D-009](#d-009), [D-036](#d-036)) are not yet covered.
- **Atomicity for Option C:** whether appending the event and updating the view happen in one MongoDB transaction.
- **Agreement** between the Tech Architect and the Data Architect.

**Consequences once decided.** The chosen proposal becomes the implementation reference. Option C would change how [D-034](#d-034)'s history and concurrency guard are met. The transit collection storage question ([D-035](#d-035)) follows from the choice. The Phase 1 collections (`waste-inputs`, `waste-inputs-history`) are unchanged in every option.

Built today: beta keeps two minimal collections, `movements` and `deliveries`, holding IDs, the organisation and timestamps — enough to check that referenced IDs exist. None of the three options is implemented yet.

## Retired

Superseded or obsolete entries, kept so that existing links still resolve.

<a id="d-030"></a>

#### Carrier-vs-broker discriminated union on `POST /movements`

**D-030** · 🗄️ Retired · Group: **A2** — Carrier and broker or dealer are separate fields on every event ([D-008](#d-008)); a single either/or shape is no longer under consideration.

<a id="d-002"></a>

#### Single OpenAPI file, not `$ref`-split

**D-002** · 🗄️ Retired · Group: **B1** — Superseded by [D-052](#d-052): the specs now `$ref` the JSON Schema files synced from the backend and are bundled into one file for publishing.

<a id="d-005"></a>

#### Receipt is linked to a delivery via the Delivery ID

**D-005** · 🗄️ Retired · Group: **B2** — Folded into [D-022](#d-022), which covers how a receipt is linked to its Delivery.

<a id="d-011"></a>

#### Static and transit collection collapsed into a single endpoint

**D-011** · 🗄️ Retired · Group: **B2** — Superseded by [D-029](#d-029): static and transit collection both use `POST /movements/{movementId}/collection`, distinguished by `collectionType`.

<a id="d-040"></a>

#### Rename drop-off and Transfer ID to delivery and Delivery ID

**D-040** · 🗄️ Retired · Group: **B2** — The rename is complete: `POST /transfers` became `POST /deliveries` and `transferId` became `deliveryId` throughout the contract and this register.
