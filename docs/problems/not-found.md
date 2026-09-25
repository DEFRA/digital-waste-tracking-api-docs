# Not Found

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/not-found` |
| Title | Not Found |
| Status | `404` |

The resource in the request path does not exist, so nothing was stored.

## When this happens

| Cause | Example `detail` |
| --- | --- |
| The Movement ID in `POST /movements/{movementId}/collection` does not exist | `movementId not found` |
| The Delivery ID in `POST /deliveries/{deliveryId}/receipt` does not exist | `No delivery exists with delivery ID: 25KMT4Z9` |
| The path or HTTP method does not match an endpoint | `Not Found` |

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/not-found",
  "title": "Not Found",
  "detail": "movementId not found",
  "instance": "/beta-1/movements/25HRA0B2/collection",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```

## How to fix it

- Check that the ID in the path is exactly the one the API returned. For example, use the `movementId` from `POST /movements` or the `deliveryId` from `POST /deliveries`.
- Check that you are sending the request to the same environment that created the ID.
- Check the path, API version prefix (for example `/beta-1`) and HTTP method against the [API spec](../api/openapi.md).
