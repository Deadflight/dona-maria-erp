# Money Formatting Specification

## Purpose

A canonical `lib/money.ts` `formatCurrency` helper (es-VE, Bolívares) used by the credits UI and POS credit display.

## Requirements

### Requirement: REQ-MONEY-1 — formatCurrency helper

The system MUST export `formatCurrency(amount)` from `lib/money.ts` that formats a numeric amount in the Spanish-Venezuela locale as Bolívares with 2 decimals and a `Bs.` prefix. The credits UI and POS credit display MUST use this helper; existing inline formatters elsewhere are NOT required to be consolidated.

#### Scenario: Formats with es-VE grouping

- GIVEN amount `1234.5`
- WHEN `formatCurrency(1234.5)` is called
- THEN it returns `"Bs. 1.234,50"` (dot thousands separator, comma decimals)

#### Scenario: Zero and negative amounts

- GIVEN amounts `0` and `-50`
- WHEN `formatCurrency` is called for each
- THEN `0` formats as `"Bs. 0,00"` and `-50` as `"Bs. -50,00"`

#### Scenario: Used in credits UI and POS credit display

- GIVEN the credits list and the POS payment panel
- WHEN a monetary value renders in either surface
- THEN it is rendered via `formatCurrency`
