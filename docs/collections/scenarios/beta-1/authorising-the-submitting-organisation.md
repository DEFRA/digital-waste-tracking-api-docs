# Authorising the submitting organisation

```gherkin
Feature: Authorising the submitting organisation

  Background:
    Given an authenticated software provider

  Scenario Outline: A <record> is successfully created when a valid API Code is provided
    Given a software provider has valid <record> data
    And a valid API Code
    When the <record> is submitted
    Then the <record> is created

    Examples:
      | record     |
      | movement   |
      | collection |
      | delivery   |
      | receipt    |

  Scenario Outline: A <record> isn't created when no API Code is provided
    Given a software provider has valid <record> data
    And no API Code
    When the <record> is submitted
    Then the <record> isn't created
    And the software provider is told an API Code is required

    Examples:
      | record     |
      | movement   |
      | collection |
      | delivery   |
      | receipt    |
```
