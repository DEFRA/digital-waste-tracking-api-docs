# Authorising the submitting organisation

```gherkin
Feature: Authorising the submitting organisation
  As a software provider
  I want every submission to carry my organisation's API Code
  So that every waste tracking event is attributed to the organisation that recorded it

  Background:
    Given they are authenticated

  Scenario Outline: A <record> is successfully created when a valid API Code is provided
    Given they have valid <record> data
    And they have a valid API Code
    When they submit the <record>
    Then the <record> is created

    Examples:
      | record     |
      | Movement   |
      | Collection |
      | Delivery   |
      | Receipt    |

  Scenario Outline: A <record> isn't created when an API Code is invalid
    Given they have valid <record> data
    And they have an invalid API Code
    When they submit the <record>
    Then the <record> isn't created
    And they should be informed that the API Code is unrecognised

    Examples:
      | record     |
      | Movement   |
      | Collection |
      | Delivery   |
      | Receipt    |

  Scenario Outline: A <record> isn't created when an API Code is not provided
    Given they have valid <record> data
    And they have no API Code
    When they submit the <record>
    Then the <record> isn't created
    And they should be informed that an API Code is required

    Examples:
      | record     |
      | Movement   |
      | Collection |
      | Delivery   |
      | Receipt    |
```
