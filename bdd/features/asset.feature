Feature: Asset lifecycle

Scenario: Create asset
Given valid unit exists
When asset is created
Then unique asset number must be generated

Scenario: Transfer asset
Given asset exists
When transfer approved
Then unit must be updated