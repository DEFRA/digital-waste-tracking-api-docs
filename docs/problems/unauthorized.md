# Unauthorized

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/unauthorized` |
| Title | Unauthorized |
| Status | `401` |

The request did not include valid credentials, so it was not processed and nothing was stored.

## When this happens

Every request needs an access token. From beta-2 it also needs your organisation's API Code in a header.

| Cause | Applies to | Example `detail` |
| --- | --- | --- |
| The `Authorization` header is missing | All versions | — |
| The access token is invalid, has expired, or does not carry the `waste-movement-external-api-resource-srv/access` scope | All versions | — |
| The `x-api-code` header is missing | beta-2 | `The x-api-code header is required` |
| The `x-api-code` header holds an API Code that is unknown or has been disabled | beta-2 | `The x-api-code header does not contain a valid API code` |

On beta-1, the API Code is sent in the request body instead; an unrecognised one returns a [bad-request](bad-request.md) problem.

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/unauthorized",
  "title": "Unauthorized",
  "detail": "The x-api-code header is required",
  "instance": "/beta-2/movements",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```

## How to fix it

- Get an access token with the OAuth 2.0 client credentials grant, using the client ID and secret you were given, and send it with every request as `Authorization: Bearer <token>`.
- Request a new token when the current one expires.
- Check that you are using the credentials for the right environment.
- On beta-2, send your organisation's API Code with every request as `x-api-code: <apiCode>`, not in the body. API Codes are managed in the Waste Tracking Service; a disabled code is rejected.
- If your credentials have stopped working, contact us and include the `requestId`.

An `Authorization` header that cannot be read returns a [bad-request](bad-request.md) problem instead.
