Feature: Maintenance

Scenario: Request maintenance
Given asset exists
When maintenance requested
Then maintenance must be created

Scenario: Complete maintenance
Given maintenance exists
When completed
Then asset must return to active state