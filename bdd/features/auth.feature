Feature: Authentication

Scenario: Login successfully
Given user exists and is active
When user submits valid credentials
Then JWT token should be returned

Scenario: Login blocked user
Given user is blocked
When attempting login
Then system must deny access