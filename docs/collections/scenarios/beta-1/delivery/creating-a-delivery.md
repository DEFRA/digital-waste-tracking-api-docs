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
    When they submit the Delivery with those Movement IDs
    Then the Delivery is created
    And a Delivery ID is provided

  Scenario: A Delivery isn't created when malformed data is provided
    Given they have malformed Delivery data
    When they submit the Delivery
    Then the Delivery isn't created
    And a reason for each invalid field is provided

  Scenario: A Delivery isn't created when a Movement ID is invalid
    Given they have one or more Movement IDs from prior Movements
    When they submit the Delivery with an invalid Movement ID
    Then the Delivery isn't created
    And a reason for each unrecognised Movement ID is provided

  Scenario: A Delivery isn't created when no Movement ID is provided
    Given they have no Movement IDs
    When they submit the Delivery with no Movement IDs
    Then the Delivery isn't created
    And a reason for the missing Movement ID is provided
```
