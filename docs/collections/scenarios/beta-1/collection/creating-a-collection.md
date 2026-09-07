---
source_ticket: DWTC-118
---

# Creating a collection

```gherkin
Feature: Creating a collection

  Background:
    Given an authenticated software provider
    And a valid API Code

  Scenario: A collection is successfully created
    Given a software provider has valid collection data
    And a valid Movement ID
    When the collection is submitted
    Then the collection is created

  Scenario: A collection isn't created when a Movement ID is invalid
    Given a software provider has valid collection data
    And an invalid Movement ID
    When the collection is submitted
    Then the collection isn't created
    And the software provider is told the Movement ID isn't recognised

  Scenario: A collection isn't created when malformed data is provided
    Given a software provider has malformed collection data
    When the collection is submitted
    Then the collection isn't created
    And the software provider is told which fields are invalid
```
