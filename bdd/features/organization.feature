Feature: Organization Management

Scenario: Create organization
Given admin is authenticated
When valid organization data is submitted
Then organization must be created

Scenario: Prevent duplicate organization
Given organization already exists
When creating with same identifier
Then request must be rejected