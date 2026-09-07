---
source_ticket: DWTC-117
---

# Creating a Movement

```gherkin
Feature: Creating a Movement
  As a software provider
  I want to register an intended waste Movement
  So that the waste can be tracked from Creation through to Receipt

  Background:
    Given they are authenticated
    And they have a valid API Code

  Scenario: A Movement is successfully created
    Given they have valid Movement data
    When they submit the Movement
    Then the Movement is created
    And a Movement ID is provided

  Scenario: A Movement isn't created when malformed data is provided
    Given they have malformed Movement data
    When they submit the Movement
    Then the Movement isn't created
    And a reason for each invalid field is provided
```
