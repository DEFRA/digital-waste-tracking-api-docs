---
source_ticket:
  - DWTC-140
  - DWTC-142
---

# Contract shape confirmation for the receipt endpoint

```gherkin
Feature: Contract shape confirmation for the receipt endpoint

  # Milestone 1 version of the Receipt endpoint
  Scenario: Submitting a correctly formed payload to the receipt endpoint with a valid Delivery ID
    Given a software provider has a payload formed correctly against the receipt endpoint contract with a valid movementId
    When the payload is submitted
    Then a successful response is returned
    And the outcome is logged

  Scenario: Submitting a correctly formed payload to the receipt endpoint with an invalid Delivery ID (Movement Error)
    Given a software provider has a payload formed correctly against the receipt endpoint contract with an invalid Movement ID
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

  Scenario: Submitting a malformed payload to the receipt endpoint (Schema Error)
    Given a software provider has a malformed payload for the receipt endpoint with a valid movementId
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

  # Receipt without a prior delivery – new in Phase 2 (D-041)
  # A dedicated POST /receipts endpoint, not an optional field on the
  # canonical receipt endpoint above: the server creates an empty Delivery
  # server-side and returns its Delivery ID in the same response.
  Scenario: Receipt submitted to POST /receipts with a reasonForNoDeliveryId
    Given a software provider has a receipt of waste payload with no prior delivery
    When the payload is submitted to POST /receipts with a reasonForNoDeliveryId
    Then a successful response is returned
    And a Delivery ID is returned in the response for the empty Delivery created server-side
    And the outcome is logged

  Scenario: Receipt submitted to POST /receipts without a reasonForNoDeliveryId
    Given a software provider has a receipt of waste payload with no prior delivery
    When the payload is submitted to POST /receipts without a reasonForNoDeliveryId
    Then the payload is rejected with a validation error
    And the outcome is logged
```
