---
source_ticket: DWTC-118
---

# Contract shape confirmation for the collect endpoint

```gherkin
Feature: Contract shape confirmation for the collect endpoint

  Scenario: Submitting a correctly formed payload to the collect endpoint
    Given a software provider has a payload formed correctly against the collect endpoint contract with a valid movementId
    When the payload is submitted
    Then a successful response is returned
    And the outcome is logged

  Scenario: Submitting a correctly formed payload to the collect endpoint with an invalid movementId (Movement Error)
    Given a software provider has a payload formed correctly against the collect endpoint contract with an invalid movementId
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged

  Scenario: Submitting a malformed payload to the collect endpoint (Schema Error)
    Given a software provider has a malformed payload for the collect endpoint
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged
```
