# Numeric Utils Specification

## Purpose

Reusable rounding utilities for fractional quantities. Consumes `UNIDAD_CONFIG` from `lib/constants/unidad-config.ts` for type-aware precision. Pure functions with zero side effects.

## Requirements

### Requirement: roundToDecimals

The system MUST provide `roundToDecimals(value: number, decimals: number): number` that rounds a numeric value to the specified decimal places using half-up rounding. The function MUST handle zero, negative values, and exact boundaries without precision loss.

#### Scenario: Round to 2 decimals

- GIVEN value `1.235` and decimals `2`
- WHEN calling `roundToDecimals(1.235, 2)`
- THEN returns `1.24`

#### Scenario: Round to 0 decimals (integer)

- GIVEN value `2.7` and decimals `0`
- WHEN calling `roundToDecimals(2.7, 0)`
- THEN returns `3`

#### Scenario: Zero value

- GIVEN value `0` and decimals `2`
- WHEN calling `roundToDecimals(0, 2)`
- THEN returns `0`

#### Scenario: Negative value

- GIVEN value `-1.235` and decimals `2`
- WHEN calling `roundToDecimals(-1.235, 2)`
- THEN returns `-1.24`

#### Scenario: Exact boundary (no rounding needed)

- GIVEN value `1.23` and decimals `2`
- WHEN calling `roundToDecimals(1.23, 2)`
- THEN returns `1.23`

### Requirement: roundToStep

The system MUST provide `roundToStep(value: number, step: number): number` that rounds a numeric value to the nearest multiple of `step`. The function MUST use half-up rounding. The step MUST be positive; passing step <= 0 is undefined behavior (callers MUST use valid config).

#### Scenario: Round to step 1 (unidad)

- GIVEN value `2.7` and step `1`
- WHEN calling `roundToStep(2.7, 1)`
- THEN returns `3`

#### Scenario: Round to step 0.001 (peso/longitud)

- GIVEN value `1.2356` and step `0.001`
- WHEN calling `roundToStep(1.2356, 0.001)`
- THEN returns `1.236`

#### Scenario: Round to step 0.01

- GIVEN value `1.234` and step `0.01`
- WHEN calling `roundToStep(1.234, 0.01)`
- THEN returns `1.23`

#### Scenario: Exact multiple

- GIVEN value `2.0` and step `0.5`
- WHEN calling `roundToStep(2.0, 0.5)`
- THEN returns `2.0`

#### Scenario: Negative value with step

- GIVEN value `-1.2356` and step `0.001`
- WHEN calling `roundToStep(-1.2356, 0.001)`
- THEN returns `-1.236`

## Non-Goals

- `formatQuantity()` / `formatUnitDisplay()` helpers — deferred to Approach 3 / separate change
- Receipt total rounding — separate change
- Conversion factor calculations — separate change
