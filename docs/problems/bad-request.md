# Bad Request

|  |  |
| --- | --- |
| Type | `https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/bad-request` |
| Title | Bad Request |
| Status | `400` |

The request was rejected and nothing was stored. Correct the request before you send it again. Sending the same request again will fail in the same way.

## When this happens

| Cause | Example `detail` | `errors` present |
| --- | --- | --- |
| The request body does not match the endpoint's schema, for example a required field is missing or a value has the wrong type or format | `2 validation errors occurred` | Yes |
| The `apiCode` is not recognised | `the API Code supplied is invalid` | No |
| A Movement ID in a `POST /deliveries` request does not exist | `No movement exists for movement ID(s): 25HRA0B2, 25HRA0B3` | No |
| The request body is not valid JSON | `Invalid request payload JSON format` | No |
| The `Authorization` header is malformed | `Bad HTTP authentication header format` | No |

## Validation errors

If the request body fails schema validation, the response includes an `errors` array with one entry for each problem found. All problems are reported together, so you can fix them in one go.

| Member | Description |
| --- | --- |
| `message` | Human-readable description of the problem. |
| `pointer` | [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) to the field in the request body, for example `/wasteItems/0/ewcCodes`. |
| `errorType` | Category of the problem. One of the values in the table below. |

| `errorType` | Meaning |
| --- | --- |
| `NotProvided` | A required field is missing. |
| `NotAllowed` | A field is present that the endpoint does not accept. |
| `InvalidType` | A value has the wrong JSON type, for example a string instead of a number. |
| `InvalidFormat` | A value does not match the required format or pattern, for example a date. |
| `InvalidValue` | A value is not one of the allowed values. |
| `OutOfRange` | A value, string length or number of items is above the maximum or below the minimum. |
| `BusinessRuleViolation` | A value breaks a business rule. |
| `UnexpectedError` | Any other validation problem. |

## Example

```json
{
  "type": "https://defra.github.io/digital-waste-tracking-api-docs/preview/problems/bad-request",
  "title": "Bad Request",
  "detail": "2 validation errors occurred",
  "instance": "/beta-1/movements",
  "requestId": "4f6c1f0e9a3b4c2d8e7f6a5b4c3d2e1f",
  "errors": [
    {
      "message": "\"apiCode\" is required",
      "pointer": "/apiCode",
      "errorType": "NotProvided"
    },
    {
      "message": "must NOT have additional properties",
      "pointer": "/unknownField",
      "errorType": "NotAllowed"
    }
  ]
}
```

## How to fix it

- Check each entry in `errors` and correct the field that `pointer` refers to.
- Check the request against the [API spec](../api/openapi.md).
- Check that you are using the `apiCode` you were given for your organisation.
- For `POST /deliveries`, check that every Movement ID was returned by an earlier `POST /movements` request.
