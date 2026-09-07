---
source_ticket: DWTC-119
---

# Creating a Delivery

```gherkin
Feature: Creating a Delivery
  As a software provider
  I want to record that one or more Movements have been delivered to a receiver
  So that the receiver can record the waste accepted against a single Delivery ID

  Background:
    Given they are authenticated
    And they have a valid API Code

  Scenario: A Delivery is successfully created
    Given they have one or more Movement IDs from prior Movements
    When they submit the Delivery
    Then the Delivery is created
    And a Delivery ID is provided

  Scenario: A Delivery isn't created when a Movement ID is invalid
    Given they have an invalid Movement ID
    When they submit the Delivery
    Then the Delivery isn't created
    And they should be informed of each unrecognised Movement ID

  Scenario: A Delivery isn't created when a Movement ID is not provided
    Given they have no Movement IDs
    When they submit the Delivery
    Then the Delivery isn't created
    And they should be informed that a Movement ID is required

  Scenario: A Delivery isn't created when malformed data is provided
    Given they have malformed Delivery data
    When they submit the Delivery
    Then the Delivery isn't created
    And they should be informed of each invalid field
```
