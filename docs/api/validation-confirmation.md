---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

<!-- prettier-ignore -->
!!! info "Draft proposal — not decided"
    This is a **draft proposal for team discussion**, not an agreed position. Nothing here is decided, and no entry exists for it in the [decisions register](../collections/decisions.md) — the register still records the accept-with-warnings behaviour this pitch proposes to replace ([D-031](../collections/decisions.md#d-031), [D-039](../collections/decisions.md#d-039)). The current behaviour stands until this is agreed and recorded. The [follow-up](#follow-up-if-adopted) section lists what would need to change if it is.

# Validation Confirmation

## TL;DR

Replace **accept-with-warnings** on new endpoints with **reject-and-confirm**. A request with soft data-quality issues is rejected with `400` and a server-issued confirmation token; resubmitting the same payload with that token in a header stores the record.

- **`2xx` means accepted with nothing outstanding.** The `validation.warnings` block leaves the success envelope entirely.
- **Soft issues are reported as a rejection** — a new `confirmation-required` problem type, with the issues in `errors[]` and a `confirmationToken` extension member.
- **No dead ends.** This is not "stricter validation": every rejection offers a route forward, correct it or confirm it. Some issues genuinely cannot be corrected by the submitting party, and those must stay filable.
- **Confirming is an explicit, per-submission act.** The token is bound to the payload, the issues, the calling organisation and a short expiry, so it cannot be hardcoded or reused.
- **Nothing new to store.** Soft issues are a pure function of the payload, so "which receipts have no confirmed treatment code" is a query over the records themselves. No warnings log, no confirmation log.
- **New endpoints only.** The live Receipt of Waste endpoints are untouched, consistent with [API Standards](standards.md).
- **No integrator impact today, which is the point.** No `beta` endpoint has ever produced a warning — the envelope is empty scaffolding. Changing it now is free; once warning logic is wired in and vendors depend on it, it is not.

## Baseline

The service accepts a request that has soft, data-quality problems, stores the record, and returns those problems as `validation.warnings` on a `201`/`200`. This was inherited from the Phase 1 Receipt of Waste API when the [API Standards](standards.md) pitch was written, and carried forward into the `beta` contract: `api/openapi-beta-2.yaml` marks `validation` as `required` on every success response schema, so a warnings array is part of the promised shape whether or not there are warnings.

Four things about that baseline are worth stating precisely, because the argument turns on them.

**No decision establishes it.** [API Standards](standards.md) describes accept-with-warnings as "the decided, current implementation" and cites [D-006](../collections/decisions.md#d-006), [D-009](../collections/decisions.md#d-009) and [D-036](../collections/decisions.md#d-036). [D-039](../collections/decisions.md#d-039) in turn says reject-vs-warn "follows the accept-with-warnings model" and defers the detail back to this document. The three cited decisions do not contain it: D-006 decides that one receipt cross-check surfaces as warnings, D-009 states the opposite for its own case ("a `BusinessRuleViolation` validation error, not a warning — the operation is rejected (400)"), and D-036 does not discuss response semantics at all. The one entry that does decide it, for a single field, is [D-031](../collections/decisions.md#d-031): "Omitting the code produces a warning, not a rejection."

**Every warning is a missing field.** All ten warning validators in `waste-movement-utils` (`src/validation-warnings/validators/`) use one `errorType`: `NotProvided`. The `TBC` type is defined and never used. Nothing warns about a value being wrong, out of range, or inconsistent with an earlier event. So what the standards document frames as a general model for soft data-quality issues is, in practice, one rule — "you did not provide this" — applied to three field groups: actual treatments, POPs/hazardous components, and carrier registration number.

**Warnings are never stored.** `generateAllValidationWarnings` runs in the gateway (`waste-movement-external-api/src/handlers/create-receipt-movement.js`) _after_ the write to the backend, purely to decorate the response. `waste-movement-backend` has no notion of a warning in its domain, services or Mongo schemas. A warning exists for the duration of one HTTP response and is then gone. This matters less than it appears — the issue itself is re-derivable from the stored record ([Nothing extra to persist](#nothing-extra-to-persist)) — but it does mean a warning has no effect of any kind beyond the response it rides on.

**No warning states an obligation.** The full set of messages in `waste-movement-utils/src/constants/validation-warning-messages.js` is "{{#label}} is required", "{{#label}} is required for proper waste tracking and compliance", and two variants of "{{#label}} are recommended when source of components is …". None cites a legal or regulatory requirement, and two say _recommended_.

**And on the new endpoints, nothing is generated at all.** Every `validation.warnings` in the `beta-1` and `beta-2` routes is a hardcoded empty array — six occurrences in `waste-movement-backend/src/routes/beta-*/` — and neither the backend nor the gateway calls any warning generator on a `beta` path. Warning generation is wired only to the Phase 1 receipt handlers. So for the endpoints these standards actually govern, `validation` is a field the contract marks `required` and guarantees to be empty.

## Problem

Returning `200` with a body full of entries labelled `errorType` reads as an error reported with a success code. It has drawn repeated review feedback, and the objection is sound on its own terms: a `2xx` should mean the request was accepted and there is nothing for the caller to deal with.

The deeper problem is that the mechanism does not do the job it is there to do. Take the case it exists for — a receiving site cannot always know the actual treatment at the point of receipt, because the waste may need inspecting or weighing first, and the treatment is still required. Under accept-with-warnings:

- **The warning can be ignored at no cost.** The record is already stored by the time the caller reads it. Nothing further is required of them and nothing happens if they do nothing.
- **Nothing is chased.** The warning asks for no response and triggers nothing. Whether the missing code is ever supplied depends entirely on the integrator choosing to send a later `PUT`, and nothing in the exchange prompts them to. (Note this is _not_ an argument that the gap is invisible — see [Nothing extra to persist](#nothing-extra-to-persist). The records can be found; nothing acts on them.)
- **"Not yet known" and "not supplied" are indistinguishable.** Both produce a byte-identical `NotProvided` entry. The distinction that makes the case legitimate is the distinction the mechanism discards — and confirmation does not recover it either, which is the strongest argument for the reason-for-absence alternative in [No-gos](#no-gos).
- **The obligation is never stated.** If the requirement is that the integrator is told the field is a legal requirement, the current messages do not say so.

And the boundary was never definable. Which discrepancies are warnings and which are errors is still open in [D-021](../collections/decisions.md#d-021), and D-006 records that the granularity of its own cross-check — "string match, field-by-field, weight tolerance, etc." — remains undefined. That is not an oversight waiting to be closed; it is a sign that "soft issue" is not a category the contract can carry cleanly.

**Why now.** The `beta` endpoints carry the envelope but have never filled it: no soft validation is implemented on any of them, so no integrator has received a warning from one. Nothing has to be migrated, deprecated or dual-run, and no vendor code has to change — the cost of this decision is as low as it will ever be. That inverts once warning logic is written against the current envelope, because the shape then has real dependants and the same change becomes a breaking one. The decision is cheap today and expensive shortly.

## Solution

Reject the request, tell the caller what is wrong, and let them confirm it deliberately.

### The exchange

A request with soft issues is rejected. Nothing is stored.

```http
POST /beta-2/deliveries/25HRA0B2/receipt
```

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json
x-request-id: 4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f
```

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/confirmation-required",
  "title": "Confirmation Required",
  "detail": "1 field needs confirmation before the receipt can be stored.",
  "instance": "/beta-2/deliveries/25HRA0B2/receipt",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f",
  "confirmationToken": "eyJ2IjoxLCJwIjoiYTk0ZTc3…",
  "errors": [
    {
      "pointer": "/wasteItems/0/actualTreatments/0/disposalOrRecoveryCode",
      "errorType": "NotProvided",
      "message": "Recording the actual treatment applied is a legal requirement under [regulation reference]. Supply the code, or confirm to record this receipt without it."
    }
  ]
}
```

The caller either corrects the payload and resubmits, or resubmits the same payload with the token to confirm.

```http
POST /beta-2/deliveries/25HRA0B2/receipt
X-Confirm-Warnings: eyJ2IjoxLCJwIjoiYTk0ZTc3…
```

```http
HTTP/1.1 201 Created
```

```json
{ "data": { "deliveryId": "25HRA0B2" } }
```

The success body is now unambiguous: a `2xx` carries no outstanding issues, and the `validation` block is gone from the success envelope.

### No dead ends

Some issues cannot be corrected by the party submitting. A receiver cannot change what a producer declared at Creation, so a weight or carrier cross-check mismatch ([D-006](../collections/decisions.md#d-006)) may be accurate and permanent. A carrier may genuinely have no registration number. POPs or hazardous components may not have been supplied with the waste. The treatment may not be knowable until the load is inspected.

This gives the mechanism its governing principle: **every rejection must offer a route forward — correct it, or confirm it.** A rejection with neither is a dead end, and a dead end means a legitimate operational record cannot be filed at all. That is a worse outcome than any data-quality problem it prevents, in a service whose purpose is to have the movement recorded.

It also means "the caller cannot avoid this" is not on its own a reason to make something confirmable, because two very different situations produce it:

| The issue is unavoidable because… | Right response |
| --- | --- |
| Reality is like that — the discrepancy is genuine, the data does not exist yet, the exemption applies | **Confirmable.** The caller acknowledges it and the record is filed with the gap visible in the data. |
| **We** are wrong — a rule stricter than the regulation, a validator bug, a legitimate EWC code missing from our reference data | **Not confirmable. Fix it.** A confirm token here buys silence: the defect is hidden, and the records carry an acknowledgement of a problem that was never the operator's. |

Keeping the second category out of the confirm path is a standing obligation, not a one-off design step, because the only way to tell the two apart is to look. Which gives the confirmation rate a second use beyond the accountability argument above: **a spike in confirmations on one `pointer` is far more likely to mean our rule is wrong than that operators have collectively become careless.** Monitored per pointer rather than per organisation, it is a defect detector for our own validation.

### The token

The token is a signed value the caller cannot mint and cannot usefully keep. It is an HMAC over four things, with no server-side state:

| Bound to | Why |
| --- | --- |
| Canonical hash of the request payload | A token issued for one submission cannot confirm a different one, so it cannot be cached and replayed. |
| The set of issue pointers | A new, unanticipated issue is not covered by an existing token and produces a fresh `400`. |
| The authenticated organisation (`apiCode`) | A token cannot be shared between integrators. |
| Issued-at timestamp, short expiry | Tokens cannot be stockpiled ahead of time. |

Verification is recomputation, so there is no pending-submission store to keep, expire or replicate across instances.

The two bindings do different jobs, and both are needed. **Binding to the payload** is what stops a token being cached and replayed across submissions — a token for one receipt cannot confirm another. **Keying the hash** is what stops the token being forged. Neither substitutes for the other.

That second point is the one to be deliberate about, because a plain unkeyed hash of the payload is the obvious simplification and it quietly defeats the purpose. `sha256(canonical(payload))` is computable by the caller, so an integrator could skip the rejected call entirely and send `X-Confirm-Warnings` on every request from the start — reinstating exactly the confirm-by-default behaviour the mechanism exists to prevent, while looking like it prevents it. An HMAC cannot be computed without the server secret, so the first call is unavoidable and the caller has to be shown the issues before confirming them. The cost of the difference is one signing secret in CDP Secrets Manager and a rotation overlap; the property bought is the whole point of the design.

### What this does and does not enforce

The token prevents a software provider from turning confirmation on by default. It does **not** prevent one from scripting the retry — catch the `400`, read the token, resubmit — and no mechanism at this layer can.

What it gives instead is attribution and measurability, which is the argument [D-036](../collections/decisions.md#d-036) already makes for write integrity generally: "integrity is by attribution, not prevention". Each confirmation is a discrete act tied to one payload, one organisation and one timestamp, so blanket auto-confirmation becomes a visible, reportable pattern rather than an invisible default. This is a deterrent backed by accountability, not a control, and the distinction should be recorded as such rather than discovered later.

### Nothing extra to persist

An earlier draft of this pitch proposed storing each confirmation — what was confirmed, by whom, when. That is unnecessary, and worth stating explicitly so it does not get built.

Soft issues are **derived**, not declared. Each one is a pure function of the payload, computed by the validators in `waste-movement-utils`. So everything a stored confirmation log would hold is already recoverable from the record:

| Question | Answered by |
| --- | --- |
| Which receipts have no confirmed treatment code? | A query over the records — `actualTreatments[].disposalOrRecoveryCode` is absent. The issue list never needed storing to be findable. |
| Was this record confirmed? | The record exists and has a soft issue. Confirmation is the only route to storing it, so the answer is implied. |
| Which organisation confirmed it? | The writing organisation already stamped on every write as immutable provenance ([D-036](../collections/decisions.md#d-036)). |
| When? | The record's own timestamp. |

This removes the largest piece of new work the mechanism would otherwise need, and it means the change is confined to the request/response exchange: no new collection, no new fields on the stored document, nothing to migrate.

The one thing recomputation does not preserve is **what the operator was shown at the time**. If a validator is added or changed later, re-deriving today's issues under tomorrow's rules answers "does this record have a gap now", not "what did we tell them then". For the compliance question — which records have gaps — current rules are the right rules and recomputation is the better answer. For a hypothetical dispute about what a specific operator was shown on a specific day, it is not. That is not a use case anyone has asked for, so it is noted in [Rabbit holes](#rabbit-holes) rather than designed for.

### Why `400` and not `422`

`422` is arguably the better semantic fit, since the request is well-formed and acceptable rather than malformed. `400` is chosen anyway because [API Standards](standards.md) already defers `409` and `422` as future refinements and keeps `400` for all client validation. Using `400` here keeps that deferral intact instead of reopening it as a side effect of this change.

### A new problem type, not a reuse of `bad-request`

The existing [`bad-request`](../problems/bad-request.md) page states that "sending the same request again will fail in the same way". That is precisely what does not hold here: the same request, with a token, succeeds. Confirmation therefore needs its own `type` URI and its own page. Note this makes `confirmation-required` the second problem type at `400`, where the [problem types](../problems/index.md) index currently lists one type per status code.

### A non-standard extension

`confirmationToken` and `X-Confirm-Warnings` are our own invention. They are not drawn from the [GOV.UK API standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) that this API otherwise adopts, and RFC 9457 sanctions extension members without describing this use of one. That should be stated explicitly wherever the mechanism is documented, so a future reader does not mistake it for something inherited.

One open question is narrowed rather than answered. [D-021](../collections/decisions.md#d-021) asks which discrepancies warn and which reject; under this proposal everything soft takes the same route, so what remains of D-021 is only which checks run at all — a smaller question than the one it currently poses.

## Rabbit holes

- **Payload canonicalisation.** The payload hash needs stable key ordering, whitespace and number formatting, or a byte-different but semantically identical resubmission breaks its own token. Pick a canonical JSON form and treat it as part of the contract. This is the fiddliest part of the mechanism and the one most likely to generate support traffic.
- **Signing key rotation.** Tokens signed under an outgoing key must still verify for the length of their expiry window, so rotation needs an overlap rather than a cutover.
- **Doubled request volume on the confirm path.** Every confirmed submission is two calls. This affects request metrics, any rate limiting, and the existing validation metrics in `waste-movement-utils` — a rejected-then-confirmed submission should not read as one failure plus one success.
- **The issue vocabulary outgrows `NotProvided`.** Every soft issue today is a missing field, but the uncorrectable cases above are not: a cross-check mismatch is a discrepancy between two supplied values, and the published `errorType` enum in [Bad Request](../problems/bad-request.md) has no value for that — it would land in `BusinessRuleViolation` by default, which reads as the caller breaking a rule rather than two records disagreeing. Whether to add a value, and what it means for the shared item shape, is deferred until the D-006 cross-checks are specified.
- **Validator drift versus recomputation.** Because soft issues are re-derived rather than stored ([Nothing extra to persist](#nothing-extra-to-persist)), changing a validator changes the answer retrospectively: a record confirmed under one rule set reads differently under the next. This is correct for "which records have gaps today" and wrong for "what was this operator shown last March". Decide whether the second question is ever asked before concluding it does not matter — the answer is probably no, but it should be an answer rather than an oversight.
- **The bulk/spreadsheet path.** Per-row issues across a batch do not map onto one token per request. Out of scope for this pitch, since the standards apply to new endpoints only, but it should not be assumed to fall out for free.

## No-gos

- **No retrofit of Phase 1.** `POST /movements/receive` and `PUT /movements/{wasteTrackingId}/receive` keep returning warnings. Changing them is breaking for live integrators and is not proposed.
- **No blanket override flag.** A boolean `X-Force-Submit: true` is the obvious alternative and is rejected: it would be set permanently in vendor client configuration, leaving accept-with-warnings behaviour at twice the request volume with no record of what was acknowledged.
- **No server-side pending-submission store.** The token is self-contained. Nothing is held between the two calls.
- **No per-field reason enums, for now.** Requiring a structured reason for each absent obligated field (`PENDING_INSPECTION` and similar, extending the `reasonForNoRegistrationNumber` pattern) is a real alternative and would cost one round trip instead of two. It is not proposed here because it needs a reason enum agreed per field with policy, and confirmation covers every case with one mechanism. Worth revisiting if the confirm path proves too costly on high-volume receipt submission.
- **No stored confirmation log.** Recording what was confirmed, by whom and when was in an earlier draft and is dropped: it is all derivable from the record, so it would be a second copy of data the service already holds. See [Nothing extra to persist](#nothing-extra-to-persist).
- **No attempt to prevent scripted auto-confirmation.** Addressed by attribution and monitoring, not by the contract.

## Follow-up if adopted

Nothing below has been done. Grouped by where the work lands, because a decision recorded in this repo has no effect until the sibling service repos are changed to match.

### This repo — the contract

- **Remove `validation` from every success response schema.** Four schemas in `api/openapi-beta-2.yaml` — `createMovementResponse`, `recordCollectionResponse`, `deliveryResponse`, `recordReceiptResponse` — declare `required: [data, validation]` and carry a `validation` property. Drop both, and delete the now-unused `validation` schema. The same four-schema change applies to `api/openapi-beta-1.yaml`, which has the identical envelope. This is behaviour-neutral: the field is hardcoded empty in every `beta` route, so removing it changes the documented contract and no observed response.
- **Add `confirmationToken`** to the `problemDetails` schema in both `beta` specs, as an optional member present only on `confirmation-required` responses.
- **Document the `X-Confirm-Warnings` request header** on every write operation in both `beta` specs.
- **Decide whether `beta-1` changes at all**, or whether this lands only in `beta-2` and later. [D-038](../collections/decisions.md#d-038) requires a breaking change to be copied forward into a new milestone rather than amended in place — but removing an always-empty field, and adding an optional member and an optional header, is arguably not breaking. Worth settling explicitly rather than assuming either way.

### This repo — the published problem types

- **Add `docs/problems/confirmation-required.md`**, following the shape of the existing pages: type URI, title, status, when it happens, the `confirmationToken` member, how to confirm, and worked examples of both calls.
- **Add the row** to the table in `docs/problems/index.md`, and note that `400` now has two types where the table currently implies one type per status.
- **Add `confirmationToken`** to the response-members table in `docs/problems/index.md`.
- **Amend `docs/problems/bad-request.md`**, which states "sending the same request again will fail in the same way" — true of `bad-request`, not of `confirmation-required`, so the two should cross-reference.

### This repo — standards and register

- **Rework [API Standards](standards.md)**: the accept-with-warnings bullet in TL;DR, the "Accept-with-warnings" paragraph in Solution, the reject-vs-warn bullet in Topic 1, and the whole of Topic 2 including its `validation` examples and the shared warning/error item shape.
- **Add a new decision entry.** Next free ID is **D-046** (D-045 is the current highest). Per the register's conventions this needs both the body entry in ID order and a row in the ranked Index table near the top.
- **Amend [D-031](../collections/decisions.md#d-031)**, whose last sentence reads "Omitting the code produces a warning, not a rejection".
- **Update [D-039](../collections/decisions.md#d-039)**'s summary bullets, which describe the reject-vs-warn model and the `2xx` envelope.
- **Update [D-006](../collections/decisions.md#d-006)** and the glossary entry it drives (`collections/glossary.md`, cross-check definition: "Mismatches return validation warnings rather than hard errors"), plus the matching claim in `collections/plan.md` for `POST /deliveries/{deliveryId}/receipt`.
- **Update the `data/` fixtures** that describe warning behaviour in their comments: `receiptJoi.js` ("produces a warning, not a rejection"), `collectionJoi.js`, `creationJoi.js` and `deliveryJoi.js` (the `isDeleted`-on-POST note), and the `warnings` arrays in the `collectionEvent.js` and `creationEvent.js` example payloads.
- **Leave `collections/phase1/` alone.** Those pages describe the implemented Phase 1 model as it is, and Phase 1 is explicitly out of scope.

### Sibling repos — the implementation

- **`waste-movement-utils`** — the warning validators become issue producers on the rejection path; the messages need the legal-obligation wording they currently lack; a shared token sign/verify helper and canonical-payload-hash helper belong here, since both the gateway and any other caller need them.
- **`waste-movement-external-api`** — issue the token on rejection, verify it on the confirming call, and stop decorating `2xx` responses in `handlers/create-receipt-movement.js` and the `beta` handlers.
- **`waste-movement-backend`** — drop `validation: { warnings: [] }` from the six `beta` route responses. That is the whole of it: because nothing extra is persisted, the stored document, the Mongo schemas and the domain layer are untouched.
- **A signing secret** in CDP Secrets Manager, with the rotation overlap noted in [Rabbit holes](#rabbit-holes).
- **`digital-waste-tracking-docs`** — run its `/drift-audit` once the contract changes, to catch anything in the architecture model that assumed the old envelope.

## References

- [API Standards](standards.md) — the cross-cutting conventions this pitch amends.
- [Problem types](../problems/index.md) and [Bad Request](../problems/bad-request.md) — the published problem-type pages a new type would join.
- [Decisions register](../collections/decisions.md) — [D-006](../collections/decisions.md#d-006), [D-009](../collections/decisions.md#d-009), [D-021](../collections/decisions.md#d-021), [D-031](../collections/decisions.md#d-031), [D-036](../collections/decisions.md#d-036), [D-039](../collections/decisions.md#d-039).
- [GOV.UK — API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) — the baseline government guidance; this pitch adds an extension it does not cover.
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457) — the error envelope the new problem type uses.
- [RFC 6901 — JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) — the field-path syntax in `errors[].pointer`.
