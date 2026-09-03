# Proposal: Display USD/VES Exchange Rate in Operational Views

## Problem

The application already maintains a current USD-to-VES exchange rate and uses it to authorize sales, but operators and administrators do not receive a consistent visual indication of the active rate in the operational views where monetary decisions are made. The rate is currently managed in `/rates`, while the POS, sales detail, and daily close workflows need visible context about the rate and its status.

## Outcome

Make the active USD/VES rate visible and understandable in the POS, sale detail, and daily close views without changing rate acquisition, persistence, or historical sale calculations.

## Scope

- Add a reusable authenticated read/display contract for the current rate and its freshness state.
- Show the current rate, source, and status in the POS near the cart/payment summary.
- Show the rate applied to a completed sale in the sale detail view when the persisted sale contract exposes it.
- Show the relevant rate and USD/VES context in the daily close summary.
- Cover current, stale, unavailable, and source-display states with focused tests.
- Preserve the existing `/rates` administration flow and sale blocking behavior.

## Non-goals

- Changing BCV, DolarAPI, cron, fallback, or manual update behavior.
- Recalculating historical sales with the current rate.
- Adding rate displays to inventory, purchases, or credits in this first slice.
- Redesigning the `/rates` administration page.

## Success Criteria

1. POS users can identify the active rate and whether it is usable before confirming a sale.
2. Sale details preserve audit context by showing the rate applied to that transaction when available.
3. Daily close users can distinguish USD totals, VES totals, and the rate context used by the summary.
4. Stale or unavailable rate states are explicit and do not appear as a valid current rate.
5. Existing rate update and sale calculation behavior remains unchanged.
6. The focused test suite passes and the full project check remains green.

## Risks and Rollback

The main risk is duplicating rate-fetch logic or confusing the current rate with the historical rate stored on a sale. The implementation should reuse the existing rate action and persisted sale fields, with one shared display model where appropriate. Rollback is limited to reverting the view and test changes; no database migration or rate-provider change is required.

## Delivery

Single PR linked to issue #116. The change follows Strict TDD with `pnpm test` and is planned as a low-risk first slice before any inventory, purchase, or credit integration.
