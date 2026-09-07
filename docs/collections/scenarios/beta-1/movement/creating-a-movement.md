---
source_ticket: DWTC-117
---

# Creating a movement

```gherkin
Feature: Creating a movement

  Background:
    Given an authenticated software provider
    And a valid API Code

  Scenario: A movement is successfully created
    Given a software provider has valid movement data
    When the movement is submitted
    Then the movement is created
    And a Movement ID is provided

  Scenario: A movement isn't created when malformed data is provided
    Given a software provider has malformed movement data
    When the movement is submitted
    Then the movement isn't created
    And the software provider is told which fields are invalid
```
