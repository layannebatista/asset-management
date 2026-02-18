Feature: Asset transfer

Scenario: Create transfer request
Given asset exists
When transfer requested
Then transfer must be created

Scenario: Approve transfer
Given transfer exists
When approved
Then asset unit must change