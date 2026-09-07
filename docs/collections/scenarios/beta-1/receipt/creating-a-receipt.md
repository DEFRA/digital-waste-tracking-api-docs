---
source_ticket:
  - DWTC-140
  - DWTC-142
---

# Creating a Receipt

```gherkin
Feature: Creating a Receipt
  As a software provider
  I want to record the waste a site has accepted, whether or not it has a Delivery ID
  So that the Movement is complete and the waste is accounted for

  Background:
    Given they are authenticated
    And they have a valid API Code

  Scenario: A Receipt is successfully created
    Given they have valid Receipt data
    And they have a valid Delivery ID
    When they submit the Receipt
    Then the Receipt is created

  Scenario: A Receipt isn't created when a Delivery ID is invalid
    Given they have valid Receipt data
    And they have an invalid Delivery ID
    When they submit the Receipt
    Then the Receipt isn't created
    And a reason for the unrecognised Delivery ID is provided

  Scenario: A Receipt isn't created when malformed data is provided
    Given they have malformed Receipt data
    When they submit the Receipt
    Then the Receipt isn't created
    And a reason for each invalid field is provided

  Scenario: A Receipt is successfully created when no Delivery ID is provided but a reason is given
    Given they have valid Receipt data
    And they have no Delivery ID
    And they have a reason for no Delivery ID
    When they submit the Receipt
    Then the Receipt is created
    And a Delivery ID is provided

  Scenario: A Receipt isn't created when no Delivery ID is provided and no reason is given
    Given they have valid Receipt data
    And they have no Delivery ID
    And they have no reason for no Delivery ID
    When they submit the Receipt
    Then the Receipt isn't created
    And a reason for the rejection is provided
```
