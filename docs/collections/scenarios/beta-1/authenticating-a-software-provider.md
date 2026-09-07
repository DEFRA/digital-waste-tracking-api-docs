# Authenticating a software provider

```gherkin
Feature: Authenticating a software provider
  As a software provider
  I want every submission to be authenticated
  So that only onboarded organisations can record waste tracking events

  Scenario Outline: A <record> is successfully created when authentication is valid
    Given they have valid <record> data
    And they are authenticated
    When they submit the <record>
    Then the <record> is created

    Examples:
      | record     |
      | Movement   |
      | Collection |
      | Delivery   |
      | Receipt    |

  Scenario Outline: A <record> isn't created when authentication is invalid
    Given they have valid <record> data
    And they aren't authenticated
    When they submit the <record>
    Then the <record> isn't created
    And a reason for the failed authentication is provided

    Examples:
      | record     |
      | Movement   |
      | Collection |
      | Delivery   |
      | Receipt    |
```
