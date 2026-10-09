# Confirmation Required

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/confirmation-required` |
| Title | Confirmation Required |
| Status | `422` |

The request is valid, but it has one or more warnings, so nothing was stored. The warnings do not stop the record being stored. You can either correct the request, or confirm the warnings and force the request to be accepted.

## When this happens

A write request (`POST` or `PUT`) has no errors but has data-quality warnings. For example:

| Cause | `errorType` |
| --- | --- |
| A field you should normally provide is missing, but the record can be stored without it. For example, the actual treatment code, when the waste has not been inspected yet. | `NotProvided` |

If a request has errors as well as warnings, you get [bad-request](bad-request.md) instead. Correct the errors first. The response also lists the warnings, so you can deal with them at the same time.

## Response members

As well as the [standard members](index.md#response-members), the response contains:

| Member | Description |
| --- | --- |
| `warnings` | Every warning found in the request. Each entry has the same `message`, `pointer` and `errorType` members as a [validation error](bad-request.md#validation-errors). |
| `confirmationToken` | Token you send back to confirm these warnings. See [Confirm the warnings](#confirm-the-warnings). |

## Example

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json
x-request-id: 4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f
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

## How to fix it

Check each entry in `warnings` and decide whether to correct the request or confirm the warnings.

### Correct the request

If you have the missing or correct data, add it to the field that `pointer` refers to and send the request again without a token. This is the better option whenever the data is available.

### Confirm the warnings

If a warning reflects the real situation, for example the treatment is not known yet, you can confirm it. Send the **same request again**, to the same endpoint, with the `confirmationToken` in the `X-Confirm-Warnings` header:

```http
POST /beta-2/deliveries/25HRA0B2/receipt
Authorization: Bearer …
x-api-code: …
Content-Type: application/json
X-Confirm-Warnings: eyJ2IjoxLCJwIjoiYTk0ZTc3…
```

If the token is accepted, the record is stored and you get the usual success response, for example `201 Created`.

The token:

- only works for the request it was issued for, sent to the same endpoint
- stops working if you change any value in the request body
- does not expire
- must be sent back exactly as you received it. Do not try to read or build it.

If the token does not match, for example because the request has changed, it is ignored and the request is handled as if you had not sent it. If the request now has no errors or warnings it is stored, if it has errors you get [bad-request](bad-request.md), and if it still has warnings you get a new `422` with a new token.

### Do not confirm automatically

Confirming tells us your organisation has seen the warnings and accepts the record as it is. The record is stored with the gaps visible and is attributed to your organisation.

Show the warnings to the person submitting the record and let them decide. Do not build software that confirms every warning without anyone seeing them. Confirmation rates are monitored.
