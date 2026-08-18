# Pitch: Standardising the Digital Waste Tracking API

## TL;DR

The smallest consistent set of cross-cutting conventions for the DWT API, applied to **new** endpoints only (live Receipt-of-Waste endpoints untouched), adopting the [GOV.UK API standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) where they apply.

- **Status codes** — `201`/`200`; every op documents `400`+`401`+`500`, `404` with an id, `402` on charge-gated writes.
- **Responses** — one envelope: success `{ data, meta?, validation? }`, failure `{ error: { code, message, details? }, requestId }`.
- **Accept-with-warnings** — store on soft data-quality issues, reject only on schema/structure/state/authorisation.
- **Tracing** — `x-request-id` on every response; `requestId` in error bodies.
- **Versioning** — versioned during alpha (`/v1-alpha-N`, parallel milestones), then **unversioned + additive-only at GA**; deprecate via `Deprecation: true`.
- **Pagination** — none yet (reserve `meta.pagination`). **Auth** — open.

## Baseline

Today only the **Receipt of Waste** API is implemented — the live `waste-movement-external-api` gateway, its `waste-movement-backend`, and the shared `waste-movement-utils`, running on the CDP platform. The rest of the waste-movement journey (creation, collection, drop-off, producer tracking) is planned but not yet built.

Where a convention already exists in the implemented endpoints or is provided by the CDP platform, we prefer to **codify what already works** over inventing something new.

Beyond our own code, an external baseline already applies: the [GOV.UK API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards), with companion guidance on [documenting APIs](https://www.gov.uk/guidance/how-to-document-apis), are the cross-government standards we are expected to follow. We **adopt** them where they apply rather than invent our own — they inform our decisions on versioning, status codes, error handling and deprecation. The full list is in [References](#references).

## Problem

The cross-cutting API conventions — how we signal outcomes, shape responses, authenticate, version, page, and trace requests — were never standardised for the receipt endpoints. Without an agreed standard, each new endpoint is free to invent its own. Left unaddressed, patterns diverge, integrators have to special-case our responses, and the cost of correcting it only grows as more of the journey ships.

That makes **now** — before the remaining endpoints are written — the right moment to set a **basic, consistent foundation**. We are not aiming for a complete API-design rulebook: we want the **smallest set of conventions that is consistent and can scale** into a richer standard later if the service needs it.

## Solution

Agree one convention per concern and apply it uniformly to the endpoints we build from here on. Keep each convention as simple as possible while leaving room to grow.

**New endpoints only — leave what exists alone.** These conventions apply to the **newly created** endpoints (the rest of the waste-movement journey, still to be built). We deliberately do **not** retrofit them onto the already-implemented endpoints — the live Receipt of Waste create/update endpoints.

**Follow the cross-government standard.** The [GOV.UK API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) are the baseline government API guidance we are expected to follow.

**Accept-with-warnings.** This is the decided, current implementation. The service stores an operational record even when it has soft, data-quality problems, and returns those as `validation.warnings` (D-006). It still rejects with `400` when a request cannot be safely stored: schema/format errors, and structural, state-integrity or authorisation violations (D-009, D-036). In short: warn on data quality, reject on structure/state/authorisation. We adopt this as-is; it frames the status-code and response-format topics below.

### 1. Status codes for responses

**In the code today:** a canonical `HTTP_STATUS` set already exists in `waste-movement-utils`. Live receipt endpoints emit `201` (create), `200` (update), `400`, `404`, `401` (JWT), `500`, and `402` (Payment Required — service-charge expiry).

**Proposal:**

- **Success:** `201` for a POST that creates (body carries the new id), `200` for a PUT that updates (body carries any warnings). Matches the live gateway. `204 No Content` is not used, because responses carry a `validation` body.
- **Reject vs warn:** governed by the accept-with-warnings model above — a storable record is `2xx` with `validation.warnings`; only unstorable requests are rejected with `400`.
- **Baseline error set every operation documents:** `400` (validation), `401` (auth) and `500` (server) on every operation; `404` where the path has an id; `402` on service-charge-gated writes.
- **Not now:** hold off on `409` (state conflicts) and `422` (malformed vs semantically-invalid split) — keep `400` for all client validation, and note these as future refinements so we don't preclude them.

### 2. `2xx` response format

**In the code today:** success is `{ wasteTrackingId, validation?: { warnings } }` on create and `{ validation?: { warnings } }` (or `{}`) on update — the `validation` object is included **only when warnings exist**. Warning item is `{ key, errorType, message }`.

**Proposal:**

- **One consistent envelope for every response:** `data` holds the payload, `meta` is reserved for response metadata (e.g. pagination, added later), and `validation` carries warnings on write operations.
- **`validation` always present on writes:** create/update responses always include `validation.warnings` — an empty array when clean — so the shape is predictable and clients need no null-check.
- **Create returns the new id inside `data`,** e.g. `data: { movementId }`. It stays an _object_ deliberately, so it can be extended to the full created resource later without a breaking change.
- **Warnings and errors share one item shape** — `{ key, errorType, message }`. `validation.warnings` here and `validation.errors` (topic 3) differ only by the array name.

```json
// 201 create
{
  "data": { "movementId": "25HRA0B2" },
  "validation": { "warnings": [] }
}
// 200 update
{
  "data": null,
  "validation": { "warnings": [] }
}
// 200 list
{ "data": [ /* items */ ], "meta": {} }
```

### 3. `4xx` & `5xx` response format

**In the code today:** two error shapes. `400` uses `{ validation: { errors: [{ key, errorType, message }] } }` (its `errorType` enum includes `UnexpectedError`); `401/402/404/500` use the default **Hapi Boom** shape `{ statusCode, error, message }`.

**Proposal:**

- **One unified failure envelope for every `4xx`/`5xx`:** the presence of `error` means the request failed. Field-level problems (`400`) ride in `error.details[]`, reusing the shared item shape `{ key, errorType, message }` (topic 2). Non-validation failures omit `details`.

  ```json
  // 400 — validation
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "…",
      "details": [
        { "key": "wasteItems[0].weight", "errorType": "NotProvided", "message": "…" }
      ]
    },
    "requestId": "…"
  }
  // 404 / 401 / 500
  {
    "error": {
      "code": "MOVEMENT_NOT_FOUND",
      "message": "…"
    },
    "requestId": "…"
  }
  ```

- **Machine-readable `error.code`:** a stable top-level enum for programmatic handling — e.g. `VALIDATION_FAILED`, `UNAUTHORIZED`, `PAYMENT_REQUIRED`, `INTERNAL_ERROR`, and the `404` variants below — separate from the per-field `errorType`.

- **`404` distinguished by `error.code` (D-014):** `MOVEMENT_NOT_FOUND` / `TRANSFER_NOT_FOUND` (parent missing) vs `COLLECTION_NOT_RECORDED` / `RECEIPT_NOT_RECORDED` (parent exists, event not recorded yet). The status stays `404`; the distinction rides in `error.code`.

- **Per-field `errorType` enum, adopted as-is from the code:** `NotProvided`, `NotAllowed`, `InvalidType`, `InvalidFormat`, `InvalidValue`, `OutOfRange`, `BusinessRuleViolation`, `UnexpectedError`.

- **`requestId` top-level on every error body** (topic 6). **`5xx`** uses the same envelope, with `message` never leaking internals (stack traces, downstream errors).

### 4. Pagination

**In the code today:** there are no list endpoints, so nothing paginates.

**Proposal:** don't decide pagination now — keep the design extensible so it can be added later without a breaking change.

When an list endpoint is eventually added, it returns the Topic 2 `{ data, meta }` envelope — the list under `data`, `meta` reserved for response metadata. Because paging metadata would live under `meta.pagination`, never mixed into `data`, pagination can then be introduced **purely additively**, without breaking existing clients.

### 5. Authentication — headers vs request body

**In the code today:** there are **two credentials doing two jobs**, and one of them travels in the body:

- The **JWT Bearer** token (AWS Cognito, the default auth strategy) carries `client_id` — it _authenticates the calling software_ and is forwarded downstream as `x-dwt-client-id`.
- The **`apiCode`** in the request body _authorizes acting for a waste organisation_. It is not just a label: the backend rejects an unknown `apiCode`, and on update it must resolve to the **same org that created the record**.

So `apiCode` is effectively an **authorization credential carried in the request body** — a shared, bearer-like secret, yet typed as a plain `uuid` with no secret handling. Critically, **nothing binds the two**: any valid JWT combined with any valid `apiCode` is accepted, so `apiCode` alone decides which organisation you may act as.

The question for the standard: should organisation authorization move to a header / the token rather than the body, and how do we bind it to the authenticated caller?

**Proposal:** _TBD — to discuss._

### 6. Tracing

**In the code today:** the CDP platform propagates a trace id _internally_ — `@defra/hapi-tracing` reads the inbound `x-cdp-request-id` header, surfaces it in logs as `trace.id`, and forwards it to downstream calls. But it is **read-only inbound and never returned to the client**, and it is **not generated** when the header is absent. So a client currently has no way to learn the trace id for a request.

**Requirement:** a client must be able to obtain the trace id for their request, so that when something goes wrong they can quote it back to us and we can find that request in our logs.

**Proposal:**

1. **Guarantee a trace id exists** for every request — use CDP's inbound `x-cdp-request-id`; if it is absent, generate one server-side so every request is traceable.
2. **Echo it back on every response** (success _and_ error) under a **public** header, **`x-request-id`**. The value is the internal CDP trace id, but the public name deliberately does **not** leak the platform — we keep `x-cdp-request-id` for inbound/internal use only and map the same value onto `x-request-id` on the way out. This is the core change.
3. **Surface it in the error body too** — a top-level `requestId` on `4xx`/`5xx` responses — so a developer sees it without inspecting headers (ties into the error-format decision in topic 3). The body field is named `requestId` to match the `x-request-id` header.
4. **Document it** in the OpenAPI spec: the `x-request-id` response header on all responses, the `requestId` field on the error schema, and guidance to include it when contacting support.

Keep it minimal: the header echo is the essential part; the error-body field is a developer-friendly addition. **Success (`2xx`) responses carry the id in the `x-request-id` header only** — the body stays the clean `{ data, … }` envelope. The id appears in the body solely on `4xx`/`5xx`, where a developer needs to quote it to support. If cross-vendor distributed tracing is ever needed, a standard `traceparent` header can be added alongside without breaking `x-request-id`.

### 7. Versioning

**In the code today:** no versioning of any kind — no path prefix, no version header, no query parameter. The spec's `info.version` (`0.2.5-alpha`) is a documentation label, not a runtime version, and the server URL carries no `/v1`. The only existing statement is a terms-of-service line telling integrators to keep their software compatible with "the latest version" — a single-track policy with no technical scheme.

**Proposal:** **version while in alpha, then drop the version at GA.** Use versioning as a development-phase tool to iterate on the API shape; once the shape is settled, publish a single stable **unversioned** API and evolve it additively from then on. This applies the ["just say no to versioning"](https://www.hmeid.com/blog/just-say-no-to-versioning) discipline exactly where it matters — the stable public contract — while keeping versioning where it earns its keep — rapid, breaking iteration during alpha.

- **During alpha — versioned in the URI path.** While we are still discovering the shape, breaks are frequent, so we version each milestone in the path (`/v1-alpha-0`, `/v1-alpha-1`, …) and can run milestones **in parallel**, letting the small, controlled set of early integrators migrate at their own pace. Path is the simplest addressable form and alpha is non-public, so it is acceptable here; a request header would keep URLs cleaner (nodding to review feedback that milestone labels shouldn't sit in public paths), but that only matters once public — which, by design, this never is.
- **At GA — drop the version; unversioned and additive-only thereafter.** Once the shape is settled we publish one **unversioned** API and commit to never breaking it: additive changes only (new optional fields/endpoints/enum values, shipped in place), clients tolerate unknown fields, complexity absorbed server-side. A genuinely unavoidable breaking change is treated as a **new resource/API**, not a `/v2`. This honours the GOV.UK standard's overriding principle — don't break existing consumers — and the response envelopes (Topics 2–3) are already built to extend this way.
- **The alpha→GA cutover.** Dropping the version at GA is itself a one-time breaking change for alpha integrators — but that is expected (an alpha contract is unstable by definition) and it is a single, announced event. Smooth it with the deprecation mechanism below: run the final alpha version **alongside** the unversioned GA API for a migration window, mark the alpha paths deprecated, then retire them.
- **New endpoints only; existing stay put.** All of this applies to the new waste-movement endpoints; the already-live endpoints keep their current unversioned paths — we don't move them ("new endpoints only").
- **Orchestrated in the service — working assumption, to confirm.** Running alpha milestones in parallel is assumed to live in the **same service** (branching/duplicated handlers per milestone). We do **not** yet know what CDP offers — there may be a platform- or gateway-level way to route/version services we should use instead. Confirm CDP's capability before relying on in-service duplication. (Post-GA there is a single unversioned API, so this cost disappears.)
- **Usage-driven deprecation, signalled by `Deprecation: true`.** To retire an alpha version, monitor calls **per software provider** (via the JWT `client_id`, Topic 5), nudge remaining providers to migrate, and once use is negligible, withdraw it. While deprecated, every response from that version carries a single `Deprecation: true` header — an in-band signal a monitoring client can detect immediately, not only via out-of-band comms.

## Rabbit holes

- **Pagination (Topic 4).** Don't choose or build a paging scheme now — there is no read/collection endpoint that needs one. Reserve the `meta` hook and stop there; the scheme is decided with the first endpoint that actually pages.
- **Platform-level versioning (Topic 7).** We assume version orchestration lives in the service (parallel code paths per milestone). Before hard-coding that, confirm whether CDP or the API gateway already offers versioning/routing we should use instead — it may move where the duplication lives, or remove it.

## References

Cross-government and Defra standards this pitch is expected to follow. Individual topics cite the specific one that applies.

- [GOV.UK — API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) — the baseline government API guidance (informs versioning, status codes, error handling and deprecation).
- [GOV.UK — Documenting APIs](https://www.gov.uk/guidance/how-to-document-apis) — how government API documentation should be structured and written (informs the eventual published spec/docs).
- [Defra software development standards](https://defra.github.io/software-development-standards/) — Defra's development standards; add no separate API-versioning rule and defer to the GOV.UK standard above.
