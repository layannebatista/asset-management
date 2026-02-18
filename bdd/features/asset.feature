Feature: Asset Management

Scenario: Asset exists
Given authenticated user
When requesting assets
Then response is valid
