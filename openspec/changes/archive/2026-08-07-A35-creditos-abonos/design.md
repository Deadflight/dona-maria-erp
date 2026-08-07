# Design: A35 — Credit Sales & Abonos

## Technical Approach

Server-enforced credit ledger. One migration (`20260806000001`) re-creates `create_sale_with_movements` (base: `20260806000000`) with a `credito` branch, adds security-definer `register_abono`, and grants sellers INSERT on `abonos_creditos`. Actions/Zod mirror clientes CRUD; `/credits` UI reuses its page/dialog pattern; POS blocks over-limit credit client-side (RPC authoritative).

## Architecture Decisions

| # | Decision | Options | Choice | Rationale |
|---|----------|---------|--------|-----------|
| 1 | Balance updates | Supabase-js writes vs. RPC | Single security-definer RPC, one transaction | Atomic; FOR UPDATE serializes concurrent abonos |
| 2 | Limit check | Client-only vs. RPC | RPC lock on clientes; POS block UX only | Server authoritative (REQ-3/4) |
| 3 | `pagos_venta` on credit | Insert row vs. skip | Skip entirely | No false 'paid' record |
| 4 | Venta `estado` | Default vs. explicit | Insert `'credito'`/`'completada'` | Non-credit behavior identical |
| 5 | `vencido` state | DB job/column vs. derived | Derived in `listCreditos` TS | No mutation, no job (REQ-UI-1) |
| 6 | `listCreditos` gate | admin+seller vs. authenticated | Authenticated; `registerAbono` gated `requireWriteRole` | Viewer sees list, abono hidden (REQ-UI-3) |
| 7 | Abono `metodo_pago` | Free text vs. enum | Zod enum (efectivo,pago_movil,transferencia,divisa,mixto) | Unconstrained column; validation in Zod/RPC |
| 8 | Nav entry | `adminOnly` vs. plain | Plain item, all roles | Layout lacks allowlist; viewer read-only (dec. 6) |

## Data Flow

```
POS: ClientSelector ─listClients(+limite,saldo)─► use-cart ─► PaymentPanel
  over-limit = saldo+total>limite ─► block confirm (UX); RPC authoritative
Credit RPC: lock productos+clientes → validate limite → ventas(estado='credito') → detalles
  → creditos (no pagos_venta) → movements(_skip_lock=true)
Abono RPC: lock creditos+clientes → validate → insert abono → decrement both → revalidate
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260806000001_credit_sales_abonos.sql` | Create | Re-create sale RPC w/ credit branch; `register_abono`; seller INSERT policy |
| `lib/supabase/actions/creditos.ts` | Create | `listCreditos`, `registerAbono`, `AbonoFormState` |
| `lib/validations/creditos.ts` | Create | `abonoSchema` |
| `lib/money.ts` | Create | `formatCurrency` es-VE `Bs.`, 2 decimals |
| `app/(dashboard)/credits/page.tsx` | Create | Server page (clients pattern) |
| `app/(dashboard)/credits/_components/credits-table.tsx` | Create | List, `formatCurrency`, estado badges, abono button (admin/seller) |
| `app/(dashboard)/credits/_components/abono-dialog.tsx` | Create | `useActionState` + `FieldError` + toast; client-side overpayment guard |
| `app/(dashboard)/layout.tsx` | Modify | Nav `Créditos` → `/credits` |
| `lib/supabase/actions/ventas.ts` | Modify | `listClients` select adds `limite_credito, saldo_actual` |
| `app/(pos)/pos/_components/client-selector.tsx` | Modify | `ClientResult`/`onSelect` carry `limite_credito`/`saldo_actual` |
| `app/(pos)/pos/_hooks/use-cart.ts` | Modify | `clienteLimiteCredito`/`clienteSaldoActual` state; `isCreditoOverLimit` |
| `app/(pos)/pos/page.tsx` | Modify | Pass new cart fields to `PaymentPanel` |
| `app/(pos)/pos/_components/payment-panel.tsx` | Modify | Over-limit warning + block via `formatCurrency` |
| `types/database.types.ts` | Modify | `register_abono` RPC result typing (apply-time) |

## Interfaces / Contracts

```sql
register_abono(p_credito_id uuid, p_monto numeric(14,2), p_metodo_pago text, p_referencia text default null)
returns jsonb {credito_id, saldo_pendiente, saldo_actual, estado}
-- plpgsql, security definer, search_path=''; rejects monto<=0 / overpayment;
-- locks creditos+clientes FOR UPDATE; decrements both; estado='cancelado' at 0
```

Credit branch (only `p_metodo_pago='credito'`): after the stock loop, lock clientes FOR UPDATE and raise `'El cliente no tiene crédito habilitado'` (limite=0) or `'El cliente excede su límite de crédito: saldo actual=%, total=%, límite=%'`. Venta insert sets `estado` (`'credito'`/`'completada'`); `creditos` replaces `pagos_venta` (`tasa_interes=0, cuotas=1, +30d`); bump `saldo_actual`. Non-credit path byte-identical to `20260806000000`.

`abonoSchema` (Zod v4): `credito_id` uuid, `monto` positive + 0.01 step, `metodo_pago` enum, `referencia` optional. `registerAbono`: `requireWriteRole` → safeParse → `rpc("register_abono", {p_credito_id, p_monto, p_metodo_pago, p_referencia: referencia || null})` → `revalidatePath("/credits")`; dialog guards `monto <= saldo_pendiente` client-side.

RLS: `CREATE POLICY "seller_insert_abonos_creditos" ON public.abonos_creditos FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'seller');` (other policies exist in `20260530000009`).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Actions | `tests/actions/creditos.test.ts` (Create): list gates, derived vencido; abono gates, Zod, RPC shape | `vi.mock` chain (`ventas.test.ts`) |
| Actions | `tests/actions/ventas.test.ts` (Modify): listClients select; credit passthrough | extend existing mocks |
| Validations | `tests/validations/creditos.test.ts` (Create): monto>0, enum, referencia | safeParse |
| SQL text | `tests/supabase/credit-sales-migration.test.ts` (Create): clientes FOR UPDATE, error strings, creditos insert, no pagos, `_skip_lock=>true`, RPC, policy | readFileSync (`sale-detail-discounts-migration.test.ts`) |
| Components | `tests/components/credits/{credits-table,abono-dialog}.test.tsx` (Create): render, vencido badge, overpayment blocked, viewer read-only | RTL + user-event |
| Component | `tests/components/pos/payment-panel.test.tsx` (Modify): over-limit block + warning | RTL |
| Unit lib | `tests/money.test.ts` (Create): es-VE grouping, zero, negative | Vitest |
| Integration (opt-in) | `tests/concurrency/abono-races.test.ts` (Create): concurrent abonos → 1 succeeds; limit race | `describeConcurrent`, skipped in CI |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

Single migration after `20260806000000`. No backfill (RPC created none); no flag. Rollback: `git revert`; prior RPC restored, `register_abono` + policy dropped; existing rows valid.

## Open Questions

- [ ] None blocking (`metodo_pago` labels mirror PaymentPanel, decision 7).
