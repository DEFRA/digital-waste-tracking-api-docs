---
source_ticket:
  - DWTC-140
  - DWTC-142
---

# Creating a receipt

```gherkin
Feature: Creating a receipt

  Background:
    Given an authenticated software provider
    And a valid API Code

  Scenario: A receipt is successfully created
    Given a software provider has valid receipt data
    And a valid Delivery ID
    When the receipt is submitted
    Then the receipt is created

  Scenario: A receipt isn't created when a Delivery ID is invalid
    Given a software provider has valid receipt data
    And an invalid Delivery ID
    When the receipt is submitted
    Then the receipt isn't created
    And the software provider is told the Delivery ID isn't recognised

  Scenario: A receipt isn't created when malformed data is provided
    Given a software provider has malformed receipt data
    When the receipt is submitted
    Then the receipt isn't created
    And the software provider is told which fields are invalid

  # Null Delivery ID handling – new in Phase 2
  Scenario: A receipt is successfully created when no Delivery ID is provided but a reason is given
    Given a software provider has valid receipt data
    And no Delivery ID
    And a reason for no Delivery ID
    When the receipt is submitted
    Then the receipt is created
    And a Delivery ID is provided

  Scenario: A receipt isn't created when no Delivery ID is provided and no reason is given
    Given a software provider has valid receipt data
    And no Delivery ID
    And no reason for no Delivery ID
    When the receipt is submitted
    Then the receipt isn't created
    And the software provider is told a reason for no Delivery ID is required
```
