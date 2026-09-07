---
source_ticket: DWTC-118
---

# Creating a Collection

```gherkin
Feature: Creating a Collection
  As a software provider
  I want to record that waste has been collected from a producer
  So that the Movement reflects what was actually picked up

  Background:
    Given they are authenticated
    And they have a valid API Code

  Scenario: A Collection is successfully created
    Given they have valid Collection data
    And they have a valid Movement ID
    When they submit the Collection
    Then the Collection is created

  Scenario: A Collection isn't created when a Movement ID is invalid
    Given they have valid Collection data
    And they have an invalid Movement ID
    When they submit the Collection
    Then the Collection isn't created
    And a reason for the unrecognised Movement ID is provided

  Scenario: A Collection isn't created when malformed data is provided
    Given they have malformed Collection data
    When they submit the Collection
    Then the Collection isn't created
    And a reason for each invalid field is provided
```
