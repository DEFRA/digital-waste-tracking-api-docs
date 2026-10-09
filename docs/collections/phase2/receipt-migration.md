---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

<!-- prettier-ignore -->
!!! info "Draft — in progress"
    Item 1 of 7 is written. The rest follow the same shape.

# Receipt migration: Phase 1 to Phase 2

What a software provider integrated with the live Receipt of Waste (RoW) API would have to change to record receipts in Phase 2 — and who asked for each change, why, and who it affects. It is the evidence for three open decisions: how receipts are linked to Deliveries ([D-022](../decisions.md#d-022)), whether and how the Phase 1 receipt is retired ([D-023](../decisions.md#d-023)), and how Phase 1 records relate to Phase 2 Movements ([D-024](../decisions.md#d-024)).

## Scope

|  | Phase 1 — live RoW | Phase 2 — beta-2 today, and the target |
| --- | --- | --- |
| Record a receipt | `POST /movements/receive` | `POST /deliveries/{deliveryId}/receipt`, or `POST /receipts` when there is no Delivery ID |
| Update a receipt | `PUT /movements/{wasteTrackingId}/receive` | `PUT /deliveries/{deliveryId}/receipt` (planned for beta-3) |
| Definition | [Receipt of Waste API reference](https://defra.github.io/waste-tracking-service/production/apiSpecifications/) | [beta-2 spec](../../api/openapi-beta-2.md), [target spec](../../api/openapi.md) |

RoW also accepts receipts in bulk through an Excel spreadsheet upload in the Waste Tracking Service. It records the same receipt as `POST /movements/receive`, so each option affects it too.

## The options

In every option, the four-event journey records a receipt with `POST /deliveries/{deliveryId}/receipt`, against the Delivery the waste arrived on. The options differ only in what happens to the RoW-style receipt — today's `POST /movements/receive` ([D-022](../decisions.md#d-022)). None is anyone's proposal yet: they are ideas on the table, to be weighed.

- **Option A — extend RoW.** `POST /movements/receive` gains a `deliveryId` and a `reasonForNoDeliveryId`. With no Delivery ID, an empty Delivery is generated so the receipt still has one.
- **Option B — new endpoint.** What beta-2 builds today: `POST /receipts` records a receipt with no Delivery ID, alongside a reason, as the Phase 2 counterpart of `POST /movements/receive`. RoW stays as it is until it is retired ([D-023](../decisions.md#d-023)).
- **Option C — keep RoW.** `POST /movements/receive` is unchanged, with no Delivery ID and no reason, and there is no `POST /receipts`. From October 2027 only the four-event journey is compliant — which needs Defra to agree that receipt-only recording is no longer a compliant route.

## How to read each item

| Heading | Answers |
| --- | --- |
| **The problem** | Why the item matters for the move to Phase 2. |
| **Phase 1 today** | What a live RoW integration does now, and how the data is kept. |
| **Phase 2** | What Phase 2 does, whichever option is chosen. |
| **Requested by** | Who asked for the change — Software Providers, DWT Team C, DWT Architect, or Defra (and regulators) — and its business value. |
| **Options A, B and C** | How each option works, its value, and what it means for Software Providers and their users, the Excel upload, and data and reporting. |
| **Comparison** | The options side by side, in a few words each. |
| **Open points** | Anything undecided that the item depends on. |

## Summary

| # | Item | What it decides | Status |
| --- | --- | --- | --- |
| 1 | [Linking a receipt to its journey](#1-linking-a-receipt-to-its-journey) | How RoW receipts become linkable to the four-event journey, to stay compliant from October 2027 | Draft — under review |
| 2 | Identity and authentication |  | _to come_ |
| 3 | Identifiers |  | _to come_ |
| 4 | Request fields |  | _to come_ |
| 5 | Responses and errors |  | _to come_ |
| 6 | Validation and warnings |  | _to come_ |
| 7 | Overall effort per option |  | _to come_ |

---

## 1. Linking a receipt to its journey

### The problem

RoW was designed before the events that now come before a receipt — creation, collection and delivery — existed. A RoW receipt is the first and only record of a movement: nothing exists beforehand, and nothing links it to anything else.

Phase 2 tracks the whole journey, so a receipt has to be correlated with the events before it, through the Delivery the waste arrived on. RoW, as it is, cannot be connected.

That changes what counts as compliant. A RoW receipt **is compliant under the October 2026 policy** (Phase 1), but **not under the October 2027 policy** (Phase 2), which expects a receipt to be linked to the journey before it. Defra has asked that, from October 2027, a receipt is compliant when it gives either a Delivery ID or, when there is none, a reason; adding one of the two is the minimum change that keeps a RoW receipt compliant (Options A and B). Defra could instead agree that only the four-event journey is compliant from October 2027 (Option C).

### Phase 1 today

A receiver records what arrived with `POST /movements/receive`. The service mints a `wasteTrackingId` and returns it; the receiver stores it and corrects the receipt later with `PUT /movements/{wasteTrackingId}/receive`.

Receivers who don't use a software provider's system can upload the same receipts in bulk as an Excel spreadsheet, signed in to the Waste Tracking Service. The service reads one receipt per row, validates each against the same receipt schema as `POST /movements/receive`, records it, and emails the spreadsheet back with a `wasteTrackingId` on each row — or with the failing cells marked. An upload in update mode corrects receipts by their `wasteTrackingId`. The spreadsheet has no column for a Delivery ID or a reason.

Every RoW receipt, from the API or the Excel upload, is one document in the `waste-inputs` MongoDB collection, keyed by its `wasteTrackingId`. It holds the request as sent (`receipt.movement`), the submitting organisation, the client, the trace ID, the Excel upload's `bulkId`, and a `revision` number. Each correction first copies the previous version into `waste-inputs-history`. After every create or update, the stored record is pushed through CDP Audit to an S3 bucket, from which the GIO Data Platform loads it for regulators (Assurance ADR 3).

### Phase 2

**`POST /deliveries/{deliveryId}/receipt`** records a receipt against the Delivery the waste arrived on: linked by construction, so compliant, and cross-checked against what was declared earlier ([D-006](../decisions.md#d-006)). The receipt is then addressed by its Delivery ID; corrections use `PUT /deliveries/{deliveryId}/receipt` (beta-3). It is the receipt step of the four-event journey, whichever option is chosen for the RoW-style receipt. Built in beta-2 today, as `POST`.

A compliant receipt from October 2027 is recorded with `POST /deliveries/{deliveryId}/receipt` and stored in a new `receipts` collection, next to the `movements` and `deliveries` collections beta already uses.

### Requested by

| Change | Requested by | Business value |
| --- | --- | --- |
| Every receipt correlated with the journey before it | **Defra (and regulators)** — the October 2027 policy: tracking waste from creation to receipt | The regulator sees each load from producer to receiving site, and can spot waste that was collected but never received. Receipts stay compliant after October 2027. |
| A reason when there is no Delivery ID | **Defra (and regulators)** — confirmed for the October 2027 policy | Waste without a digital trail can still be recorded compliantly, and the reason shows why the trail is missing. |

The options below are ways to deliver that, not requests in themselves; none has an owner yet.

### Option A — extend RoW

**How it works.** `POST /movements/receive` accepts two more fields:

- **`deliveryId`** — the receipt is linked to that Delivery, and through it to its movements, and can be cross-checked ([D-006](../decisions.md#d-006)).
- **`reasonForNoDeliveryId`** — when there is no Delivery ID. An empty Delivery is generated so the receipt still has a Delivery ID to be found by.

A receipt that sends neither is still accepted, as today: compliant under the October 2026 policy, but not from October 2027. The endpoint, the `wasteTrackingId` and the rest of the RoW contract stay as they are.

**Value.** The smallest change for providers already live, and the minimum needed to stay compliant from October 2027: one receipt endpoint, no migration of stored IDs.

**What it means for:**

- **Software Providers and their users** — add two fields to an existing integration.
- **The Excel upload** — two new columns: Delivery ID, and a reason when there is none. The upload checks rows against the same receipt schema as RoW, so the new fields reach it with the schema change; the template, its column mapping and its guidance need updating. Corrections keep using the `wasteTrackingId`.
- **Data and reporting** — RoW receipts either stay in `waste-inputs`, now with a Delivery ID or reason (**A1**), or are written straight into `receipts` (**A2**). With A1, `waste-inputs` keeps growing and reporting combines two stores; with A2 it is frozen from the switch-over and every new receipt is in one collection. A Delivery has exactly one receipt ([D-015](../decisions.md#d-015)); with A1 a RoW receipt and a journey receipt could both name the same Delivery, a rule far easier to enforce in one collection — which favours A2.

### Option B — new endpoint

**How it works.** **`POST /receipts`** records a receipt with no Delivery ID, with a mandatory reason; an empty Delivery is created to hold it, and its Delivery ID is returned ([D-041](../decisions.md#d-041)). It is the Phase 2 counterpart of `POST /movements/receive`, following the Phase 2 conventions. A receipt that has a Delivery ID uses the journey route. `POST /movements/receive` stays live and unchanged until it is retired ([D-023](../decisions.md#d-023)). Built in beta-2 today, as `POST`; the reason is still called `reason`.

**Value.** Every receipt is recorded on Phase 2 endpoints with the Phase 2 conventions (envelopes, errors, `x-api-code`) and addressed by a Delivery ID; RoW is left untouched until a planned retirement.

**What it means for:**

- **Software Providers and their users** — move from `POST /movements/receive` to `POST /receipts`, and store a new key; keep RoW running until it is retired.
- **The Excel upload** — it records RoW receipts, so it stays on RoW until RoW is retired, and its receipts stop being compliant from October 2027. Keeping it compliant means a new bulk route on the Phase 2 endpoints, with the Phase 2 receipt fields — effectively a new spreadsheet.
- **Data and reporting** — every new receipt goes to `receipts` (from `POST /receipts`, with an empty Delivery in `deliveries`, or from the journey route). `waste-inputs` is frozen once RoW is retired; until then reporting also sees unlinked RoW receipts.

### Option C — keep RoW

**How it works.** `POST /movements/receive` stays exactly as it is live: no Delivery ID, no reason. There is no `POST /receipts`. A RoW receipt stays compliant under the October 2026 policy only; from October 2027 a receipt is compliant only on the journey route, which needs a Delivery ID. This depends on Defra agreeing that receipt-only recording — with or without a reason — is no longer a compliant route from October 2027.

**Value.** No change to the live service or to existing integrations, and no new receipt endpoint to build; one simple rule for compliance from October 2027 — the four-event journey.

**What it means for:**

- **Software Providers and their users** — no change to RoW; to stay compliant from October 2027, adopt the journey route. A load that arrives without a Delivery ID can still be recorded on RoW, but not compliantly.
- **The Excel upload** — unchanged, and its receipts stop being compliant from October 2027. A compliant spreadsheet would need a bulk version of the journey route, with a Delivery ID on every row.
- **Data and reporting** — two stores with no end date: linked receipts in `receipts`, unlinked ones in `waste-inputs`, which keeps growing for as long as RoW runs.

### Comparison

|  | A — extend RoW | B — new endpoint | C — keep RoW |
| --- | --- | --- | --- |
| Change to the live RoW API | Small — two fields | None until retired | None |
| Effort for providers already live | Low | High | Low on RoW; high to stay compliant |
| Compliant route for receipts with no trail, from Oct 2027 | ✅ reason on RoW | ✅ `POST /receipts` | ❌ none |
| Excel upload stays compliant | ✅ two new columns | ❌ needs a new bulk route | ❌ needs a new bulk route |
| Receipt stores to report on | One (A2) or two (A1) | One, plus RoW history | Two, no end date |
| Needs Defra to change its request | No | No | Yes |

### Data: what can be done internally

**In every option, the reporting feed.** Beta writes are not pushed to CDP Audit today, so Phase 2 records — movements, deliveries and receipts — do not reach the GIO Data Platform. The same push has to be added for them, and GIO has to take a second record shape alongside `waste-inputs`.

These internal choices are independent of the contract providers see, and can be combined:

1. **Write RoW receipts into `receipts` (Option A2).** The RoW endpoints and the Excel upload keep their contract, but the service stores each receipt in the Phase 2 shape, keeping its `wasteTrackingId` as an indexed legacy key so `PUT /movements/{wasteTrackingId}/receive` still finds it. From the switch-over, every receipt lives in one collection.
2. **Leave `waste-inputs` as a read-only archive.** No data moves; reporting keeps reading both shapes for the history. Lowest risk, but the two shapes stay forever.
3. **Backfill the history into `receipts`.** Each historic receipt needs a Delivery to hang from: an empty Delivery is created for it, as `POST /receipts` does. Because Movement IDs, Delivery IDs and `wasteTrackingId`s come from one pool ([D-013](../decisions.md#d-013)), that Delivery could reuse the receipt's `wasteTrackingId` as its Delivery ID — no new ID, no clash, and the old receipt becomes addressable as `/deliveries/{wasteTrackingId}/receipt`. This is one possible answer to [D-024](../decisions.md#d-024). The `waste-inputs-history` versions move with it, in whatever form [D-037](../decisions.md#d-037) chooses.

Each needs the Phase 1 receipt mapped onto the Phase 2 receipt fields — the subject of item 4.

### Open points

- [D-022](../decisions.md#d-022) — which option.
- [D-023](../decisions.md#d-023) — under Option B, whether, when and how `POST /movements/receive` is retired; under Options A and C it stays.
- [D-028](../decisions.md#d-028) — how a driver without signal gets a Delivery ID to hand over.
