---
source_ticket: DWTC-119
---

# Contract shape confirmation for the delivery endpoint

```gherkin
Feature: Contract shape confirmation for the delivery endpoint

  Scenario: Submitting a correctly formed delivery payload referencing Movement IDs
    Given a software provider has one or more Movement IDs from prior create submissions
    When a delivery payload is submitted with valid Movement IDs in the movementIds array
    Then a successful response is returned
    And a Delivery ID is returned in the response
    And the Delivery ID is stored
    And the outcome is logged

  Scenario: Submitting a malformed payload to the delivery endpoint
    Given a software provider has a malformed payload for the delivery endpoint
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

  Scenario: Submitting a correctly formed delivery payload referencing an invalid Movement ID
    Given a software provider has one or more Movement IDs from prior create submissions
    When a delivery payload is submitted with invalid Movement IDs in the movementIds array
    Then the payload is rejected
    And the outcome is logged

  Scenario: Submitting a correctly formed delivery payload referencing no Movement ID
    Given a software provider has no Movement IDs
    When a delivery payload is submitted with no Movement IDs in the movementIds array
    Then the payload is rejected
    And the outcome is logged
```
