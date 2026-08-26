---
source_ticket: DWTC-117
---

# Contract shape confirmation for the create endpoint

```gherkin
Feature: Contract shape confirmation for the create endpoint

  Scenario: Submitting a correctly formed payload to the create endpoint
    Given a software provider has a payload formed correctly against the create endpoint contract
    When the payload is submitted
    Then a successful response is returned
    And a Movement ID is returned in the response
    And the Movement ID is stored
    And the outcome logged

  Scenario: Submitting a malformed payload to the create endpoint
    Given a software provider has a malformed payload for the create endpoint
    When the payload is submitted
    Then the payload is rejected
    And the outcome is logged
```
