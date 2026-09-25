# Unsupported Media Type

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/unsupported-media-type` |
| Title | Unsupported Media Type |
| Status | `415` |

The request body is in a format the API does not accept, so it was not processed.

## When this happens

The `Content-Type` header of the request is not a supported JSON type, for example `application/xml`.

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/unsupported-media-type",
  "title": "Unsupported Media Type",
  "detail": "Unsupported Media Type",
  "instance": "/beta-1/movements",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```

## How to fix it

Send the request body as JSON with the header `Content-Type: application/json`.
