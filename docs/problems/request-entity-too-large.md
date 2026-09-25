# Request Entity Too Large

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/request-entity-too-large` |
| Title | Request Entity Too Large |
| Status | `413` |

The request body is bigger than the maximum size allowed, so it was not processed.

## When this happens

The request body is larger than 1 MB (1,048,576 bytes).

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/request-entity-too-large",
  "title": "Request Entity Too Large",
  "detail": "Payload content length greater than maximum allowed: 1048576",
  "instance": "/beta-1/receipts",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```

## How to fix it

- Split the data across several smaller requests.
- Remove fields that are not needed. Fields the endpoint does not accept will be rejected anyway, see [bad-request](bad-request.md).
