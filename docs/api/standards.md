---
search:
  exclude: true
robots: noindex, nofollow
---

# API Standards

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

## TL;DR

The smallest consistent set of cross-cutting conventions for the DWT API, applied to **new** endpoints only (live Receipt-of-Waste endpoints untouched), adopting the [GOV.UK API standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) where they apply.

- **Status codes** — `201`/`200`; every op documents `400`+`401`+`500`, `404` with an id, `402` on charge-gated writes.
- **Responses** — success envelope `{ data, meta?, validation? }`; failure as **RFC 9457 Problem Details** (`application/problem+json` — `type`, `title`, `detail`, `instance`, `requestId`, `errors[]`).
- **Accept-with-warnings** — store on soft data-quality issues, reject only on schema/structure/state/authorisation.
- **Tracing** — `x-request-id` on every response; `requestId` in error bodies.
- **Pagination** — none yet (reserve `meta.pagination`).

## Baseline

Today only the **Receipt of Waste** API is implemented — the live `waste-movement-external-api` gateway, its `waste-movement-backend`, and the shared `waste-movement-utils`, running on the CDP platform. The rest of the waste-movement journey (creation, collection, delivery, producer tracking) is planned but not yet built.

Where a convention already exists in the implemented endpoints or is provided by the CDP platform, we prefer to **codify what already works** over inventing something new.

Beyond our own code, an external baseline already applies: the [GOV.UK API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards), with companion guidance on [documenting APIs](https://www.gov.uk/guidance/how-to-document-apis), are the cross-government standards we are expected to follow. We **adopt** them where they apply rather than invent our own — they inform our decisions on status codes and error handling. The full list is in [References](#references).

## Problem

The cross-cutting API conventions — how we signal outcomes, shape responses, page, and trace requests — were never standardised for the receipt endpoints. Without an agreed standard, each new endpoint is free to invent its own. Left unaddressed, patterns diverge, integrators have to special-case our responses, and the cost of correcting it only grows as more of the journey ships.

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
- **Warnings and field errors share one item shape** — `{ pointer, errorType, message }`, where `pointer` is a JSON Pointer to the field. The same item appears in `validation.warnings` here and in the `errors[]` of a `400` Problem Details response (topic 3).

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

**Proposal:** adopt **[RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457)** (`application/problem+json`) as the single failure envelope for every `4xx`/`5xx`. This is a change from the code (which emits two shapes today); GOV.UK neither mandates nor forbids it — we take it because it is an established IETF standard that gives one consistent, self-describing error shape.

- **Members we use** (a flat top-level object, no `error` wrapper):

  - `type` — a stable URI identifying the problem kind; our machine-readable id, dereferenceable to a docs page. Replaces the old `code` enum.
  - `title` — short, stable human summary for that `type`.
  - `detail` — human message specific to this occurrence.
  - `instance` — the request path where it occurred.
  - `requestId` — extension member, the trace id (topic 5).
  - `errors[]` — extension member carrying field-level problems on `400`; omitted otherwise.
  - We **omit** the optional advisory `status` member — the HTTP status line already carries it, and duplicating it only invites drift.

  ```json
  // 400 — validation   (Content-Type: application/problem+json)
  {
    "type": "https://waste-tracking.service.gov.uk/problems/validation-error",
    "title": "Request validation failed",
    "detail": "The receipt could not be stored because 2 fields are invalid.",
    "instance": "/movements/25HRA0B2/receive",
    "requestId": "…",
    "errors": [
      { "pointer": "/wasteItems/0/ewcCodes/0", "errorType": "InvalidValue", "message": "EWC code '99 99 99' is not a recognised code" },
      { "pointer": "/receiver/authorisationNumbers", "errorType": "NotProvided", "message": "At least one authorisation number is required" }
    ]
  }
  // 404 / 401 / 500   (no field errors)
  {
    "type": "https://waste-tracking.service.gov.uk/problems/movement-not-found",
    "title": "Waste movement not found",
    "detail": "No waste movement exists with tracking ID 25HRA0B2.",
    "instance": "/movements/25HRA0B2",
    "requestId": "…"
  }
  ```

- **`404` distinguished by `type` (D-014):** distinct type URIs — `…/movement-not-found` / `…/delivery-not-found` (parent missing) vs `…/collection-not-recorded` / `…/receipt-not-recorded` (parent exists, event not recorded yet). The status stays `404`; the distinction rides in `type`.

- **Field errors keep `errorType`, and use JSON Pointer.** Each `errors[]` item is `{ pointer, errorType, message }`: `pointer` is an [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901) JSON Pointer (`/wasteItems/0/weight`), replacing the code's current dotted `key` (`wasteItems[0].weight`); `errorType` is kept as-is from the code — `NotProvided`, `NotAllowed`, `InvalidType`, `InvalidFormat`, `InvalidValue`, `OutOfRange`, `BusinessRuleViolation`, `UnexpectedError`. Same item shape as `validation.warnings` (topic 2).

- **`5xx`** uses the same Problem Details shape, with `detail` never leaking internals (stack traces, downstream errors). All error responses set `Content-Type: application/problem+json`.

- **`type` URIs are minted under a stable base** — `https://waste-tracking.service.gov.uk/problems/…` — ideally resolving to a short docs page per problem type.

### 4. Pagination

**In the code today:** there are no list endpoints, so nothing paginates.

**Proposal:** don't decide pagination now — keep the design extensible so it can be added later without a breaking change.

When an list endpoint is eventually added, it returns the Topic 2 `{ data, meta }` envelope — the list under `data`, `meta` reserved for response metadata. Because paging metadata would live under `meta.pagination`, never mixed into `data`, pagination can then be introduced **purely additively**, without breaking existing clients.

### 5. Tracing

**In the code today:** the CDP platform propagates a trace id _internally_ — `@defra/hapi-tracing` reads the inbound `x-cdp-request-id` header, surfaces it in logs as `trace.id`, and forwards it to downstream calls. But it is **read-only inbound and never returned to the client**, and it is **not generated** when the header is absent. So a client currently has no way to learn the trace id for a request.

**Requirement:** a client must be able to obtain the trace id for their request, so that when something goes wrong they can quote it back to us and we can find that request in our logs.

**Proposal:**

1. **Guarantee a trace id exists** for every request — use CDP's inbound `x-cdp-request-id`; if it is absent, generate one server-side so every request is traceable.
2. **Echo it back on every response** (success _and_ error) under a **public** header, **`x-request-id`**. The value is the internal CDP trace id, but the public name deliberately does **not** leak the platform — we keep `x-cdp-request-id` for inbound/internal use only and map the same value onto `x-request-id` on the way out. This is the core change.
3. **Surface it in the error body too** — a top-level `requestId` on `4xx`/`5xx` responses — so a developer sees it without inspecting headers (ties into the error-format decision in topic 3). The body field is named `requestId` to match the `x-request-id` header.
4. **Document it** in the OpenAPI spec: the `x-request-id` response header on all responses, the `requestId` field on the error schema, and guidance to include it when contacting support.

Keep it minimal: the header echo is the essential part; the error-body field is a developer-friendly addition. **Success (`2xx`) responses carry the id in the `x-request-id` header only** — the body stays the clean `{ data, … }` envelope. The id appears in the body solely on `4xx`/`5xx`, where a developer needs to quote it to support. If cross-vendor distributed tracing is ever needed, a standard `traceparent` header can be added alongside without breaking `x-request-id`.

## Rabbit holes

- **Pagination (Topic 4).** Don't choose or build a paging scheme now — there is no read/collection endpoint that needs one. Reserve the `meta` hook and stop there; the scheme is decided with the first endpoint that actually pages.

## References

Standards and guidance this pitch draws on. Individual topics cite the specific one that applies.

- [GOV.UK — API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) — the baseline government API guidance (informs status codes and error handling).
- [GOV.UK — Documenting APIs](https://www.gov.uk/guidance/how-to-document-apis) — how government API documentation should be structured and written (informs the eventual published spec/docs).
- [Defra software development standards](https://defra.github.io/software-development-standards/) — Defra's development standards.
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457) — the IETF standard error-response format adopted for `4xx`/`5xx` (topic 3).
- [RFC 6901 — JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) — the field-path syntax used in `errors[].pointer` (topic 3).
