# Unauthorized

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/unauthorized` |
| Title | Unauthorized |
| Status | `401` |

The request did not include valid credentials, so it was not processed.

## When this happens

- The `Authorization` header is missing.
- The username or password is wrong.
- The `Authorization` header does not include a username.

The response also includes a `WWW-Authenticate: Basic` header.

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/unauthorized",
  "title": "Unauthorized",
  "detail": "Bad username or password",
  "instance": "/beta-1/movements",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f"
}
```

## How to fix it

- Send an `Authorization: Basic <credentials>` header with every request, where `<credentials>` is `username:password` encoded in Base64.
- Check that you are using the credentials for the right environment.
- If your credentials have stopped working, contact us and include the `requestId`.

An `Authorization` header that cannot be read returns a [bad-request](bad-request.md) problem instead.
