---
search:
  exclude: true
robots: noindex, nofollow
---

<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team, not published guidance for Software Providers integrating with the Digital Waste Tracking API. Content here may be incomplete, in-progress, or superseded.

# Confirming Warnings

## Summary

New endpoints never accept a request with warnings. If a write request has warnings, the service rejects it with `422` and a confirmation token. The caller either fixes the request, or sends the same request again with the token in the `X-Confirm-Warnings` header to accept it as it is.

- A `2xx` means the request was accepted with nothing outstanding.
- Every rejection offers a way forward: errors must be fixed, warnings can be fixed or confirmed.
- Nothing extra is stored. Warnings are worked out from the record itself.

## Scope

Applies to every `POST` and `PUT` on the new endpoints covered by [API Standards](standards.md).

Does not apply to the Phase 1 Receipt of Waste endpoints (`POST /movements/receive`, `PUT /movements/{wasteTrackingId}/receive`), which keep their existing contract.

## Errors and warnings

- An **error** means the request cannot be stored as sent, for example a missing required field, a wrong format, or a state or authorisation problem. It must be fixed.
- A **warning** means the request could be stored, but has a data-quality problem, for example a field that is normally required is missing, or a value does not match an earlier event ([D-006](../collections/decisions.md#d-006)). It can be fixed or confirmed.

## Behaviour

| The request has… | Response | Stored? |
| --- | --- | --- |
| No errors or warnings | `201` or `200` | Yes |
| Errors (with or without warnings) | `400` [`bad-request`](../problems/bad-request.md), with `errors[]` and any `warnings[]`, no token | No |
| Warnings only | `422` [`confirmation-required`](../problems/confirmation-required.md), with `warnings[]` and `confirmationToken` | No |
| Warnings only, plus a matching token | `201` or `200` | Yes |

Errors are always reported first. The `400` also lists any warnings, so the caller can fix everything in one go.

### Rejection

```http
POST /beta-2/deliveries/25HRA0B2/receipt
```

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
```

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/confirmation-required",
  "title": "Confirmation Required",
  "detail": "The receipt was not stored because 1 field has a warning. It can still be accepted: send the same request again with the confirmationToken in the X-Confirm-Warnings header to force it.",
  "instance": "/beta-2/deliveries/25HRA0B2/receipt",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f",
  "confirmationToken": "eyJ2IjoxLCJwIjoiYTk0ZTc3…",
  "warnings": [
    {
      "pointer": "/wasteItems/0/actualTreatments/0/disposalOrRecoveryCode",
      "errorType": "NotProvided",
      "message": "Recording the actual treatment applied is a legal requirement under [regulation reference]. Supply the code, or confirm to record this receipt without it."
    }
  ]
}
```

- `warnings[]` items have the same shape as `errors[]` items: `{ pointer, errorType, message }`. Each array is only present when it has entries.
- Each `message` says why the field matters (naming the legal requirement where there is one) and that the caller can supply it or confirm.

### Confirmation

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

The confirming request is validated again from scratch. If the token matches the request and its warnings, the record is stored. If it does not, for example because the request changed, the token is ignored and the request gets the normal outcome from the table above: stored if it now has no errors or warnings, `400` if it has errors, or a new `422` with a new token if it has warnings only.

## The token

The token is a plain hash (for example SHA-256) of:

- the request payload, in a canonical form
- the request method and path
- the list of fields with warnings

So a token only confirms the exact request it was issued for. It is not signed and does not expire. The service checks it by working out the hash again; nothing is stored between the two calls. Callers must treat the token as opaque and send it back unchanged.

The token is not a security control. A provider could script the retry, or compute the hash themselves. The point is that each confirmation is a deliberate act that can be traced and reported on ([D-036](../collections/decisions.md#d-036): "integrity is by attribution, not prevention").

## Which warnings can be confirmed

A warning is confirmable when it reflects reality: the data does not exist yet, the discrepancy is genuine, or an exemption applies. For example, the treatment is not known until the load is inspected, or the carrier has no registration number.

A warning is **not** confirmable when our rule is wrong, for example it is stricter than the regulation or our reference data is missing a valid code. We fix the rule instead.

Confirmations are monitored per field. A spike on one field usually means the rule needs reviewing.

## Persistence

Nothing extra is stored. Warnings are worked out from the payload, so the records themselves show every confirmed gap. For example, receipts with a confirmed missing treatment code are the ones where `disposalOrRecoveryCode` is absent. Who confirmed it and when come from the record's existing organisation and timestamp.

## Design notes

- **Why `422`.** The request is valid and could be stored, but the service will not store it as sent, which is what `422` means. It also lets callers tell the two cases apart by status alone: `400` means fix it, `422` means fix it or confirm it. `422` is used only for `confirmation-required`; every other validation failure is `400`.
- **Specific to this API.** `warnings`, `confirmationToken` and `X-Confirm-Warnings` are our own extensions, not part of the GOV.UK API standards or RFC 9457.
- **Not adopted:**
  - a blanket override flag such as `X-Force-Submit: true`, because vendors would switch it on permanently
  - a signed token with an expiry, because a plain hash is enough and needs no secret to manage
  - a reason code for each missing field, because each would need agreeing with policy; worth revisiting if the extra call proves too costly

## Open points

- **Canonical payload form.** The hash needs a fixed key order and number format, so a resend that differs only in formatting still matches. This has to be chosen and documented.
- **Metrics.** A rejected-then-confirmed submission should count as one submission, not a failure plus a success.
- **Mismatch warnings.** `errorType` has no value for "two supplied values disagree". To be decided when the D-006 cross-checks are specified.

## References

- [API Standards](standards.md)
- [Problem types](../problems/index.md): [Bad Request](../problems/bad-request.md), [Confirmation Required](../problems/confirmation-required.md)
- [Decisions register](../collections/decisions.md): [D-006](../collections/decisions.md#d-006), [D-036](../collections/decisions.md#d-036), [D-046](../collections/decisions.md#d-046)
- [RFC 9110: 422 Unprocessable Content](https://www.rfc-editor.org/rfc/rfc9110#name-422-unprocessable-content), [RFC 9457: Problem Details](https://www.rfc-editor.org/rfc/rfc9457)
