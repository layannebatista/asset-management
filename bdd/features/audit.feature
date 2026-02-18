Feature: Audit

Scenario: Record audit log
Given operation executed
When completed
Then audit log must exist