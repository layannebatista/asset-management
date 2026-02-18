Feature: Inventory

Scenario: Start inventory
Given unit exists
When inventory started
Then inventory status must be OPEN

Scenario: Close inventory
Given inventory complete
When closing
Then inventory must be CLOSED