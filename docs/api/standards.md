---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# API Standards

## Summary

The cross-cutting conventions every new Digital Waste Tracking API endpoint must follow. Each topic below is normative: endpoints are implemented to comply with it.

- **Status codes** — `201`/`200`; every operation documents `400`, `401` and `500`, `404` where the path has an id, `402` on charge-gated writes, `422` on writes with confirmable checks.
- **Responses** — success envelope `{ data, meta? }`; failure as **RFC 9457 Problem Details** (`application/problem+json` — `type`, `title`, `detail`, `instance`, `requestId`, `errors[]`, `warnings[]`).
- **Confirming warnings** — a `2xx` means accepted with nothing outstanding. Hard errors are rejected with `400` `bad-request`; soft data-quality issues are rejected with `422` `confirmation-required` and a token, and resubmitting the same payload with the token in `X-Confirm-Warnings` stores it ([Confirming warnings](confirming-warnings.md)).
- **Tracing** — `x-request-id` on every response; `requestId` in error bodies.
- **Pagination** — no scheme defined; `meta.pagination` is reserved for it.

## Scope

These standards apply to the **new** endpoints: the `beta` endpoints and those that follow them across the waste-movement journey. They do **not** apply to the Phase 1 Receipt of Waste endpoints (`POST /movements/receive`, `PUT /movements/{wasteTrackingId}/receive`), which keep their existing contract.

The [GOV.UK API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards), with the companion guidance on [documenting APIs](https://www.gov.uk/guidance/how-to-document-apis), are adopted wherever they apply. Where this page goes beyond them, it says so.

### Hard errors and soft issues

Validation outcomes fall into two classes, and the status codes and response formats below depend on the distinction:

- A **hard error** means the request cannot be stored as sent: schema or format errors, and structural, state-integrity or authorisation violations (D-009, D-036). It is rejected with `400` [`bad-request`](../problems/bad-request.md) and must be corrected.
- A **soft issue** is a data-quality problem with a request that could still be stored. If a request has soft issues and no hard errors, it is rejected with `422 Unprocessable Content` [`confirmation-required`](../problems/confirmation-required.md) and a server-issued confirmation token. The caller either corrects the request or resubmits the same payload with the token in the `X-Confirm-Warnings` header, and only then is it stored.

Every rejection therefore offers a route forward, and a `2xx` means the request was accepted with nothing outstanding. The full specification — how the token works and which warnings can be confirmed — is [Confirming warnings](confirming-warnings.md) (D-046).

## 1. Status codes for responses

- **Success:** `201` for a `POST` that creates (the body carries the new id), `200` for a `PUT` that updates. `204 No Content` is not used, so every success response has the same `{ data }` envelope and an update can later return the updated resource without a breaking change.
- **Reject vs confirm:** `2xx` only when there is nothing outstanding; hard errors are `400` `bad-request`, soft issues are `422` `confirmation-required`.
- **Error set every operation documents:** `400` (validation), `401` (auth) and `500` (server) on every operation; `404` where the path has an id; `402` on service-charge-gated writes; `422` on writes that run confirmable checks.
- **`422` is reserved for `confirmation-required`.** It means the request is well formed and could be stored, but has warnings that must be corrected or confirmed. It is **not** used for semantic validation failures in general — those are `400`, even though some frameworks use `422` for them.
- **Not used:** `409` (state conflicts), and any wider `400`/`422` split between malformed and semantically-invalid requests. All client validation that cannot be confirmed is `400`. Both are possible future refinements, and nothing here precludes them.

## 2. `2xx` response format

- **One consistent envelope for every response:** `data` holds the payload and `meta` is reserved for response metadata (e.g. pagination).
- **No warnings on success.** A `2xx` means accepted with nothing outstanding; warnings are reported as a `confirmation-required` rejection instead (topic 3, [Confirming warnings](confirming-warnings.md)).
- **Create returns the new id inside `data`,** e.g. `data: { movementId }`. It is an _object_ deliberately, so it can be extended to the full created resource later without a breaking change.

```json
// 201 create
{ "data": { "movementId": "25HRA0B2" } }
// 200 update
{ "data": null }
// 200 list
{ "data": [ /* items */ ], "meta": {} }
```

## 3. `4xx` & `5xx` response format

Every `4xx` and `5xx` response uses **[RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457)** (`application/problem+json`) as its single failure envelope. GOV.UK neither mandates nor forbids it; it is used because it is an established IETF standard that gives one consistent, self-describing error shape.

- **Members** (a flat top-level object, no `error` wrapper):

  - `type` — a stable URI identifying the problem kind; the machine-readable id, dereferenceable to a docs page.
  - `title` — short, stable human summary for that `type`.
  - `detail` — human message specific to this occurrence.
  - `instance` — the request path where it occurred.
  - `requestId` — extension member, the trace id (topic 5).
  - `errors[]` — extension member carrying field-level hard errors; present only when there is at least one, omitted otherwise.
  - `warnings[]` — extension member carrying soft data-quality issues, which can be confirmed rather than corrected; present only when there is at least one, omitted otherwise. It follows the same rule as `errors[]`: neither is sent as an empty array.
  - `confirmationToken` — extension member, present only on `confirmation-required` responses; the caller sends it back in the `X-Confirm-Warnings` request header to confirm the soft issues ([Confirming warnings](confirming-warnings.md)).
  - The optional advisory `status` member is **omitted** — the HTTP status line already carries it, and duplicating it only invites drift.

  ```json
  // 400 — validation   (Content-Type: application/problem+json)
  {
    "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/bad-request",
    "title": "Bad Request",
    "detail": "The receipt could not be stored because 2 fields are invalid.",
    "instance": "/movements/25HRA0B2/receive",
    "requestId": "…",
    "errors": [
      { "pointer": "/wasteItems/0/ewcCodes/0", "errorType": "InvalidValue", "message": "EWC code '99 99 99' is not a recognised code" },
      { "pointer": "/receiver/authorisationNumbers", "errorType": "NotProvided", "message": "At least one authorisation number is required" }
    ]
  }
  // 422 — soft issues only, confirmable   (Content-Type: application/problem+json)
  {
    "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/confirmation-required",
    "title": "Confirmation Required",
    "detail": "The receipt was not stored because 1 field has a warning. It can still be accepted: send the same request again with the confirmationToken in the X-Confirm-Warnings header to force it.",
    "instance": "/beta-2/deliveries/25HRA0B2/receipt",
    "requestId": "…",
    "confirmationToken": "eyJ2IjoxLCJwIjoiYTk0ZTc3…",
    "warnings": [
      { "pointer": "/wasteItems/0/actualTreatments/0/disposalOrRecoveryCode", "errorType": "NotProvided", "message": "Recording the actual treatment applied is a legal requirement under [regulation reference]. Supply the code, or confirm to record this receipt without it." }
    ]
  }
  // 404 / 401 / 500   (no field errors)
  {
    "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/movement-not-found",
    "title": "Waste movement not found",
    "detail": "No waste movement exists with tracking ID 25HRA0B2.",
    "instance": "/movements/25HRA0B2",
    "requestId": "…"
  }
  ```

- **`400` versus `422`.** `400` [`bad-request`](../problems/bad-request.md) is for hard errors — sending the same request again fails the same way, so it must be corrected. `422` [`confirmation-required`](../problems/confirmation-required.md) is for soft issues only — the same request succeeds when resent with the token. Hard errors take precedence: a request with both gets `bad-request` with no token, its hard errors in `errors[]` and any soft issues found in `warnings[]`. `confirmation-required` never has `errors[]`.

- **`404` distinguished by `type` (D-014):** distinct type URIs — `…/movement-not-found` / `…/delivery-not-found` (parent missing) vs `…/collection-not-recorded` / `…/receipt-not-recorded` (parent exists, event not recorded yet). The status stays `404`; the distinction rides in `type`.

- **Field-level items use `errorType` and JSON Pointer.** Each `errors[]` and `warnings[]` item is `{ pointer, errorType, message }`: `pointer` is an [RFC 6901](https://www.rfc-editor.org/rfc/rfc6901) JSON Pointer to the field (`/wasteItems/0/weight`); `errorType` is one of `NotProvided`, `NotAllowed`, `InvalidType`, `InvalidFormat`, `InvalidValue`, `OutOfRange`, `BusinessRuleViolation`, `UnexpectedError`.

- **`5xx`** uses the same Problem Details shape, with `detail` never leaking internals (stack traces, downstream errors). All error responses set `Content-Type: application/problem+json`.

- **`type` URIs resolve to the published [Problem types](../problems/index.md) pages** on this docs site — `https://defra.github.io/digital-waste-tracking-api-docs/…/problems/<type>` — so each `type` a developer receives opens a page explaining it.

## 4. Pagination

No pagination scheme is defined. It is chosen with the first endpoint that actually needs to page, and must be addable without a breaking change:

- A list endpoint returns the topic 2 `{ data, meta }` envelope — the list under `data`, `meta` for response metadata.
- Paging metadata goes under `meta.pagination`, never mixed into `data`, so pagination can be introduced **purely additively** without breaking existing clients.

## 5. Tracing

A client must be able to obtain the trace id for their request, so that when something goes wrong they can quote it back to us and we can find that request in our logs.

1. **A trace id exists for every request** — CDP's inbound `x-cdp-request-id` is used; if it is absent, one is generated server-side.
2. **It is echoed back on every response** (success _and_ error) under the **public** header **`x-request-id`**. The value is the internal CDP trace id, but the public name deliberately does **not** leak the platform — `x-cdp-request-id` is for inbound/internal use only, and the same value is mapped onto `x-request-id` on the way out.
3. **It is surfaced in the error body too** — a top-level `requestId` on `4xx`/`5xx` responses (topic 3) — so a developer sees it without inspecting headers. The body field is named `requestId` to match the `x-request-id` header.
4. **It is documented** in the OpenAPI spec: the `x-request-id` response header on all responses, the `requestId` field on the error schema, and guidance to include it when contacting support.

**Success (`2xx`) responses carry the id in the `x-request-id` header only** — the body stays the `{ data, … }` envelope. The id appears in the body solely on `4xx`/`5xx`, where a developer needs to quote it to support. If cross-vendor distributed tracing is ever needed, a standard `traceparent` header can be added alongside without breaking `x-request-id`.

## References

Standards and guidance these conventions draw on. Individual topics cite the specific one that applies.

- [GOV.UK — API technical and data standards](https://www.gov.uk/guidance/gds-api-technical-and-data-standards) — the baseline government API guidance (informs status codes and error handling).
- [GOV.UK — Documenting APIs](https://www.gov.uk/guidance/how-to-document-apis) — how government API documentation should be structured and written.
- [Defra software development standards](https://defra.github.io/software-development-standards/) — Defra's development standards.
- [Confirming warnings](confirming-warnings.md) — the full specification of how warnings are rejected and confirmed (topics 1–3).
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457) — the error-response format for `4xx`/`5xx` (topic 3).
- [RFC 6901 — JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) — the field-path syntax used in `errors[].pointer` and `warnings[].pointer` (topic 3).
