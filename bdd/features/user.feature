Feature: User lifecycle

Scenario: Create user
Given admin authenticated
When valid user data submitted
Then user must be created pending activation

Scenario: Prevent login without activation
Given user is pending activation
When attempting login
Then access must be denied