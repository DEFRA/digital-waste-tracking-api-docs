# Problem types

When a request to a `beta` endpoint of the Digital Waste Tracking API fails, the response body is an [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) object with the content type `application/problem+json`.

Each problem has a `type` URI. The `type` URI identifies the kind of problem and links to one of the pages below.

| Status | Type | Title |
| --- | --- | --- |
| 400 | [`bad-request`](bad-request.md) | Bad Request |
| 401 | [`unauthorized`](unauthorized.md) | Unauthorized |
| 404 | [`not-found`](not-found.md) | Not Found |
| 413 | [`request-entity-too-large`](request-entity-too-large.md) | Request Entity Too Large |
| 415 | [`unsupported-media-type`](unsupported-media-type.md) | Unsupported Media Type |
| 500 | [`internal-server-error`](internal-server-error.md) | Internal Server Error |

## Response members

| Member | Always present | Description |
| --- | --- | --- |
| `type` | Yes | URI of the problem type, for example `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/bad-request`. Use this value, not `title` or `detail`, to decide how to handle the error. |
| `title` | Yes | Short summary of the problem type. It is the same for every occurrence of that type. |
| `detail` | No | Explanation of this occurrence. It is left out of `500` responses. Do not parse this text because it can change. |
| `instance` | Yes | Path of the request that failed, for example `/beta-1/movements`. |
| `requestId` | Yes | Trace ID for the request. It matches the `x-request-id` response header. Include it when you contact support. |
| `errors` | No | Field-level validation errors. Only present on `400` responses caused by an invalid request body. See [bad-request](bad-request.md#validation-errors). |

## Example

```http
HTTP/1.1 404 Not Found
Content-Type: application/problem+json
x-request-id: 4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f
```

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/not-found",
  "title": "Not Found",
  "detail": "No delivery exists with delivery ID: 25KMT4Z9",
  "instance": "/beta-1/deliveries/25KMT4Z9/receipt",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```
