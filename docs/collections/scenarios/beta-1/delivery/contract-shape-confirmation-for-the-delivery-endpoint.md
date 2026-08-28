---
source_ticket: DWTC-119
---

# Contract shape confirmation for the delivery endpoint

```gherkin
Feature: Contract shape confirmation for the delivery endpoint

  Scenario: Submitting a correctly formed delivery payload referencing Movement IDs
    Given a software provider has one or more MovementIDs from prior create submissions
    When a delivery payload is submitted with valid Movement IDs in the movementIds array
    Then a successful response is returned
    And a TransferID is returned in the response
    And the TransferID is stored
    And the outcome logged

  Scenario: Submitting a malformed payload to the delivery endpoint
    Given a software provider has a malformed payload for the delivery endpoint
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

   Scenario: Submitting a correctly formed delivery payload referencing an invalid movementId
    Given a software provider has one or more Movement ID from prior create submissions
    When a delivery payload is submitted with invalid Movement IDs in the movementIds array
    Then the payload is rejected
    And the outcome is logged

  Scenario: Submitting a correctly formed delivery payload referencing no MovementID
    Given a software provider has no MovementIDs
    When a delivery payload is submitted with no Movement Ids in the array
    Then the payload is rejected
    And the outcome is logged
```
