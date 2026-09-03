# Specification: Display USD/VES Exchange Rate in Operational Views

## Requirements

### REQ-RATE-1 Current rate display contract

The application MUST expose an authenticated read model containing the current rate value, source, creation timestamp, and freshness status (`current`, `stale`, or `unavailable`). The read model MUST use the existing `tasas_cambio` source and `isExchangeRateStale` policy.

#### Scenario: Current rate is available

- **Given** an authenticated user and an active exchange rate within the allowed age
- **When** an operational view requests the rate display model
- **Then** the model contains the rate, source, timestamp, and status `current`

#### Scenario: Rate is stale

- **Given** an authenticated user and an active exchange rate older than the allowed age
- **When** an operational view requests the rate display model
- **Then** the model contains the rate and source with status `stale`

#### Scenario: Rate is unavailable

- **Given** an authenticated user and no active exchange rate, or a read error
- **When** an operational view requests the rate display model
- **Then** the model has status `unavailable` and the UI MUST NOT present it as valid for a sale

### REQ-RATE-2 POS visibility

The POS MUST display the current USD/VES rate, source, and freshness status near the cart/payment summary. A stale or unavailable state MUST be visually and textually distinguishable from a current state.

#### Scenario: POS shows a usable rate

- **Given** a current rate exists
- **When** a seller opens the POS
- **Then** the cart/payment area shows the rate, source, and a current-status indication

#### Scenario: POS shows a stale rate

- **Given** the active rate is stale
- **When** a seller opens the POS
- **Then** the POS shows a stale warning and does not label the rate as current

#### Scenario: POS has no rate

- **Given** no active rate is available
- **When** a seller opens the POS
- **Then** the POS shows an unavailable state and the existing sale-blocking behavior remains intact

### REQ-RATE-3 Persist applied sale rate

When a sale is created successfully, the system MUST persist the exact USD/VES rate used for authorization and calculation on the sale record. The persisted rate MUST remain unchanged if the current rate changes later.

#### Scenario: Sale stores the authorized rate

- **Given** a current rate is available at sale confirmation
- **When** the sale RPC creates the sale
- **Then** the sale stores that rate and the VES total calculated from the USD total

#### Scenario: Historical sale remains auditable

- **Given** a completed sale with an applied rate
- **When** the current rate changes
- **Then** the sale detail continues to show the original applied rate and original VES total

### REQ-RATE-4 Sale detail visibility

The sale detail view MUST show the persisted applied rate and VES total alongside the existing USD total. If historical data has no applied rate, the view MUST show an explicit unavailable marker instead of using the current rate.

#### Scenario: Detail shows applied conversion

- **Given** a sale with `tasa_cambio_usd_a_ves` and `total_ves`
- **When** an authorized user opens the sale detail
- **Then** the detail shows the USD total, VES total, and applied rate

#### Scenario: Legacy sale has no rate

- **Given** a sale without persisted exchange-rate fields
- **When** an authorized user opens the sale detail
- **Then** the detail shows the USD total and an unavailable marker for the historical VES conversion

### REQ-RATE-5 Daily close visibility

The daily close view MUST show the rate context and distinguish USD totals from VES totals. The daily close MUST NOT recalculate historical sales using the current rate when persisted VES totals are available.

#### Scenario: Daily close shows rate context

- **Given** completed sales for the selected day with persisted rates
- **When** an administrator opens daily close
- **Then** the summary shows the USD total, VES total, transaction count, and the rate context for the day

#### Scenario: Daily close has mixed or missing rates

- **Given** the selected day contains sales with different or missing applied rates
- **When** an administrator opens daily close
- **Then** the summary identifies the mixed or unavailable rate context and does not imply one rate applies to every sale

### REQ-RATE-6 Scope and regression protection

The implementation MUST NOT change rate-provider, cron, fallback, manual-update, or stale-sale-blocking behavior. It MUST preserve existing authorization and role restrictions. The first slice MUST NOT add rate displays to inventory, purchases, or credits.

#### Scenario: Existing rate administration remains unchanged

- **Given** an administrator updates or reviews rates in `/rates`
- **When** the operation completes
- **Then** the existing source, history, and manual-update behavior remains unchanged

#### Scenario: Existing stale-sale guard remains active

- **Given** the active rate is stale at sale confirmation
- **When** a seller attempts to complete a sale
- **Then** the sale remains blocked with the existing stale-rate error
