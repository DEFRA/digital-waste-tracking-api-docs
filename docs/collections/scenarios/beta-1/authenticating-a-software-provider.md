# Authenticating a software provider

```gherkin
Feature: Authenticating a software provider

  Scenario Outline: A <record> is successfully created when the software provider is authenticated
    Given a software provider has valid <record> data
    And the software provider is authenticated
    When the <record> is submitted
    Then the <record> is created

    Examples:
      | record     |
      | movement   |
      | collection |
      | delivery   |
      | receipt    |

  Scenario Outline: A <record> isn't created when the software provider isn't authenticated
    Given a software provider has valid <record> data
    And the software provider isn't authenticated
    When the <record> is submitted
    Then the <record> isn't created
    And the software provider is told they aren't authenticated

    Examples:
      | record     |
      | movement   |
      | collection |
      | delivery   |
      | receipt    |
```
