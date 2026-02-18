Feature: Unit Management

Scenario: Create unit
Given organization exists
When valid unit data is submitted
Then unit must be created

Scenario: Prevent creation in inactive organization
Given organization is inactive
When creating unit
Then request must be rejected