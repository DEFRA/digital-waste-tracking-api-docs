---
source_ticket: DWTC-119
---

# Creating a delivery

```gherkin
Feature: Creating a delivery

  Background:
    Given an authenticated software provider
    And a valid API Code

  Scenario: A delivery is successfully created
    Given a software provider has one or more Movement IDs from prior movements
    When a delivery is submitted with those Movement IDs
    Then the delivery is created
    And a Delivery ID is provided

  Scenario: A delivery isn't created when malformed data is provided
    Given a software provider has malformed delivery data
    When the delivery is submitted
    Then the delivery isn't created
    And the software provider is told which fields are invalid

  Scenario: A delivery isn't created when a Movement ID is invalid
    Given a software provider has one or more Movement IDs from prior movements
    When a delivery is submitted with an invalid Movement ID
    Then the delivery isn't created
    And the software provider is told which Movement ID isn't recognised

  Scenario: A delivery isn't created when no Movement ID is provided
    Given a software provider has no Movement IDs
    When a delivery is submitted with no Movement IDs
    Then the delivery isn't created
    And the software provider is told a Movement ID is required
```
