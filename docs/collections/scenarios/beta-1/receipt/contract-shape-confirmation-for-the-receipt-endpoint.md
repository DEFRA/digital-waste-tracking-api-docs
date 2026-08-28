---
source_ticket:
  - DWTC-140
  - DWTC-142
---

# Contract shape confirmation for the receipt endpoint

```gherkin
Feature: Contract shape confirmation for the receipt endpoint

  # Milestone 1 version of the Receipt endpoint
  Scenario: Submitting a correctly formed payload to the receipt endpoint with valid TransferId
    Given a software provider has a payload formed correctly against the receipt endpoint contract with a valid movementId
    When the payload is submitted
    Then a successful response is returned
    And the outcome is logged

  Scenario: Submitting a correctly formed payload to the receipt endpoint with an invalid TransferId (Movement Error)
    Given a software provider has a payload formed correctly against the receipt endpoint contract with a valid movementId
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

  Scenario: Submitting a malformed payload to the receipt endpoint (Schema Error)
    Given a software provider has a malformed payload for the receipt endpoint with a valid movementId
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

  # Null Transfer ID handling — new in Phase 2
  Scenario: Receipt submitted without a transferID but with a reason
    Given a software provider has a receipt of waste payload
    When no transferID is provided
    And a reason for no transferID is provided
    Then a successful response is returned
    And a TransferId returned in the response
    And the outcome is logged

  Scenario: Receipt submitted without a transferID and without reason
    Given a software provider has a receipt of waste payload
    When no transferID is provided
    And no reason for no transferID is provided
    Then the payload is rejected with a validation error
    And the outcome is logged
```
