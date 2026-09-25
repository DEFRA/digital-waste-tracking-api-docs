# Internal Server Error

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/internal-server-error` |
| Title | Internal Server Error |
| Status | `500` |

Something went wrong on our side and the request could not be completed. The problem is not caused by your request.

## When this happens

An unexpected error happened while the request was being processed, for example a database was temporarily unavailable.

These responses do not include a `detail` member, so that internal information is not exposed.

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/internal-server-error",
  "title": "Internal Server Error",
  "instance": "/beta-1/deliveries",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```

## How to fix it

- Wait a short time, then send the request again. Wait longer after each failed attempt.
- If the problem continues, contact us and include the `requestId` and the time of the request.
