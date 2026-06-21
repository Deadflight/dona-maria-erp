## [1.7.1](https://github.com/Deadflight/dona-maria-erp/compare/v1.7.0...v1.7.1) (2026-06-21)

### Bug Fixes

* **ci:** harden repo verification chain ([d229de5](https://github.com/Deadflight/dona-maria-erp/commit/d229de5721c3df81f1a728541bf85b06c0e994de))

## [1.7.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.6.0...v1.7.0) (2026-06-21)

### Features

* **recepcion:** implement full receipt management UI ([4026621](https://github.com/Deadflight/dona-maria-erp/commit/4026621ae60fe26294e4809ce50914dd48d674ab))

## [1.6.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.5.0...v1.6.0) (2026-06-18)

### Features

* **recepcion:** add receipt list UI with detail dialog and search ([87635e2](https://github.com/Deadflight/dona-maria-erp/commit/87635e2975a84eeba26c086a4621eaf11aaf4e12))

## [1.5.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.4.1...v1.5.0) (2026-06-17)

### Features

* define Database and Json types for improved type safety and structure ([9a18ac9](https://github.com/Deadflight/dona-maria-erp/commit/9a18ac9e608e2685eaa896f7d010091a29ff6e0e))

## [1.4.1](https://github.com/Deadflight/dona-maria-erp/compare/v1.4.0...v1.4.1) (2026-06-17)

### Bug Fixes

* update expected result structure in listStockAlerts test to include pagination ([cf5bae5](https://github.com/Deadflight/dona-maria-erp/commit/cf5bae5420ec9eb239629dd6d3fe638f395f5d1a))

## [1.4.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.3.1...v1.4.0) (2026-06-17)

### Features

* enhance compras actions with new listProveedores and generateReceiptNumber functions ([5f4786f](https://github.com/Deadflight/dona-maria-erp/commit/5f4786f54da1559b0d985e7bd397935a5b64d4a2))

## [1.3.1](https://github.com/Deadflight/dona-maria-erp/compare/v1.3.0...v1.3.1) (2026-06-17)

### Bug Fixes

* **lint:** resolve 9 errors and 11 warnings to reach clean pnpm lint ([5a074eb](https://github.com/Deadflight/dona-maria-erp/commit/5a074eb59f520d55030f4407a8c41e60ec350685))

## [1.3.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.2.0...v1.3.0) (2026-06-13)

### Features

* **api:** add stock alert RPCs, Zod validation, and Server Actions ([dceb656](https://github.com/Deadflight/dona-maria-erp/commit/dceb656c48359d0977b54e0e288f0a9346d3a237)), closes [#5](https://github.com/Deadflight/dona-maria-erp/issues/5)
* **api:** add Zod schemas, Server Actions, and tests for productos CRUD ([0b3d53e](https://github.com/Deadflight/dona-maria-erp/commit/0b3d53ea51b6decd94500c4560ceb1c456adc960))
* **compras:** add purchase receipt Server Actions ([4e6266d](https://github.com/Deadflight/dona-maria-erp/commit/4e6266d43dd5867c3efb2f07ece06778c4c9eed5)), closes [#24](https://github.com/Deadflight/dona-maria-erp/issues/24)
* **dashboard:** add KPI cards component ([a7f4587](https://github.com/Deadflight/dona-maria-erp/commit/a7f4587031d3827be0a53f6e880fe00f70b69acf))
* **dashboard:** add quick navigation component ([c87645b](https://github.com/Deadflight/dona-maria-erp/commit/c87645b2c26aa76b259925e1b3e6ddb8af22c0b8))
* **dashboard:** add stock level table component ([17c2ed0](https://github.com/Deadflight/dona-maria-erp/commit/17c2ed001ef45d3f6e327fdba1d9302ac21606c6))
* **dashboard:** create RSC page with admin gate and KPI fetch ([4189f3b](https://github.com/Deadflight/dona-maria-erp/commit/4189f3b4f56805e7641e6852ec9c03b65489bcda))
* **db:** add migration for fractional quantities in detalles_venta ([1410df9](https://github.com/Deadflight/dona-maria-erp/commit/1410df95e135a56914356a9455a0795500b5e7d5))
* Implement fractional quantities in sale details ([1be4694](https://github.com/Deadflight/dona-maria-erp/commit/1be46947d0a7ea1f5fdd2fa8dbb98359dce4f837))
* **inventory:** add DashboardKPIs type ([b04c7c6](https://github.com/Deadflight/dona-maria-erp/commit/b04c7c662390281ca1d09f35c1bea8c073fc1054))
* **inventory:** add stock alert badge to nav sidebar ([01d786d](https://github.com/Deadflight/dona-maria-erp/commit/01d786ded73babdaa3cfa9d39fe217fe928bb7e1))
* **inventory:** implement getDashboardKPIs server action ([e07e071](https://github.com/Deadflight/dona-maria-erp/commit/e07e07168cc198e4ad1e31f9c9d2ebb14822e0f8))
* **products:** add UI for products CRUD (table + form dialog) ([caa0bb8](https://github.com/Deadflight/dona-maria-erp/commit/caa0bb850232914144ed1188a7ba96a39a2c0cdc))
* **stock-alerts:** finalizar ciclo SDD — verify, fix y archive ([fd932fc](https://github.com/Deadflight/dona-maria-erp/commit/fd932fc2b409f24f17cde1c57e39ca6f649ac946))

### Bug Fixes

* **bulk_update_prices:** improve error message for percentage range validation ([d3cbc74](https://github.com/Deadflight/dona-maria-erp/commit/d3cbc743046466c447a5c8465cba1ebf5a194300))
* **db:** reorder function params in create_receipt_with_movements to meet PG requirement ([7341c28](https://github.com/Deadflight/dona-maria-erp/commit/7341c283b9004e0d612e4f920b9511a50061c54a))
* **db:** update RLS policy in inventory_movements to use profiles/role after table rename ([fc19931](https://github.com/Deadflight/dona-maria-erp/commit/fc19931f533e315b263e204115cca4745004a8c6))
* **products:** add shadcn CSS baseline and fix component usage ([6bb4303](https://github.com/Deadflight/dona-maria-erp/commit/6bb4303006e81b6e02e36ba3c4aaeb2edd838d6d))
* **tests:** mock getStockAlertCount in layout test to prevent cookies() regression ([64a461a](https://github.com/Deadflight/dona-maria-erp/commit/64a461a763bf28b23f93a6896be721f2117c6f31))

## [1.2.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.1.0...v1.2.0) (2026-06-02)

### Features

* **db:** add inventory_movements table with RLS, VIEW, and RPC ([6d92c83](https://github.com/Deadflight/dona-maria-erp/commit/6d92c83ebf15f91c58276764f6b40074a89cf5c7)), closes [#23](https://github.com/Deadflight/dona-maria-erp/issues/23)
* **db:** add purchase_receipts tables with wrapper RPC and proveedores ([02f1d1d](https://github.com/Deadflight/dona-maria-erp/commit/02f1d1d92b4ecd7ae2cd7de2ed545e984487ceeb)), closes [#24](https://github.com/Deadflight/dona-maria-erp/issues/24)
* **inventario:** add Server Actions for inventory movement queries ([3e05bae](https://github.com/Deadflight/dona-maria-erp/commit/3e05bae9b55637ec83adb8f7bf333e031e159fba)), closes [#23](https://github.com/Deadflight/dona-maria-erp/issues/23)

### Bug Fixes

* **inventario:** rename perfiles/rol to profiles/role in Server Actions ([6111ec7](https://github.com/Deadflight/dona-maria-erp/commit/6111ec72f542234d43e138592a9ad1421b22876a)), closes [#24](https://github.com/Deadflight/dona-maria-erp/issues/24)

## [1.1.0](https://github.com/Deadflight/dona-maria-erp/compare/v1.0.0...v1.1.0) (2026-05-31)

### Features

* **auth:** add inactive user check and remove duplicate validation ([b0e64a7](https://github.com/Deadflight/dona-maria-erp/commit/b0e64a78ff35232f4e0762eaae6a6bbe247e66c6))
* **auth:** add Next.js 16 proxy for route protection ([ce9fc30](https://github.com/Deadflight/dona-maria-erp/commit/ce9fc303fedd3a2bb1409c147e60ed1799d1cb4b))
* **auth:** implement auth server actions ([9fd4cb5](https://github.com/Deadflight/dona-maria-erp/commit/9fd4cb5ec7526a5c3b13dd8e80277f58922744c2))
* **auth:** update root page with session-based redirect ([0ff4a09](https://github.com/Deadflight/dona-maria-erp/commit/0ff4a0906053594c947c8a55987a93976193fe87))
* **db:** add rename migration and convert seed to TypeScript ([a6d1b45](https://github.com/Deadflight/dona-maria-erp/commit/a6d1b456529701689585d4616b13031e7e59d0ed))
* **db:** add RLS policies, align roles, seed admin, and activo column ([f1589f3](https://github.com/Deadflight/dona-maria-erp/commit/f1589f3c10aca5397ad9056900658129366ea5f1))
* **supabase:** add admin client with service_role key ([a00e2cc](https://github.com/Deadflight/dona-maria-erp/commit/a00e2cc13c26dd4b51cd23116024a5b1b5ee62cb))
* **supabase:** add SSR middleware client for proxy context ([1e6d972](https://github.com/Deadflight/dona-maria-erp/commit/1e6d972859c6f4043c46b6307dc03981f65935c8))
* **ui:** add protected dashboard layout ([7f6cce9](https://github.com/Deadflight/dona-maria-erp/commit/7f6cce9296bdf39ac7b83db901864d0d4a4ba7be))
* **ui:** create login page in Spanish ([c15b5a2](https://github.com/Deadflight/dona-maria-erp/commit/c15b5a2000e862291f206a60e353d6498be5c613))

## 1.0.0 (2026-05-25)

### Features

* **db:** add Supabase local schema with 10 tables and RLS ([fb100df](https://github.com/Deadflight/dona-maria-erp/commit/fb100df66600cb7b8f8d0a41f61da3afe420ea6f))
* setup Next.js with shadcn/ui, Tailwind v4, and Supabase client ([3c1d436](https://github.com/Deadflight/dona-maria-erp/commit/3c1d436bd75ab596df0d6f37e51846b5b3adfa05))

### Bug Fixes

* **ci:** add changelog and npm plugins to semantic-release ([dca09b8](https://github.com/Deadflight/dona-maria-erp/commit/dca09b824d4e2ca6c5076cf8449aeba33a906128))
* **ci:** add packages field to pnpm-workspace.yaml ([c035f1d](https://github.com/Deadflight/dona-maria-erp/commit/c035f1ddef02aeb0d07b8e85a3c5809e06854bf9))
* **ci:** remove presetConfig.types from release-notes-generator ([af00718](https://github.com/Deadflight/dona-maria-erp/commit/af00718fc962ad85b37ca4e8b7719dbe2794b25d))
* **ci:** update release workflow with proper Node 24 config ([ddb38da](https://github.com/Deadflight/dona-maria-erp/commit/ddb38da0d2f0dc365d792e9ae724263326df12b4))
* **ci:** upgrade Node.js from 22 to 24 ([7f35e54](https://github.com/Deadflight/dona-maria-erp/commit/7f35e544645e2fc20664f61e62d484339fc8fa08))
* **ci:** use CommonJS module.exports for release.config.js ([7d90ae6](https://github.com/Deadflight/dona-maria-erp/commit/7d90ae60af68d04daeef1caefe3b8b15f57fc1ab))
* **ci:** use pnpm/action-setup for proper pnpm caching ([ef180b1](https://github.com/Deadflight/dona-maria-erp/commit/ef180b13c17d16e4ac77cbe5fe211dea742e38f1))
* update release workflow to use Node.js 22 and install pnpm explicitly ([a5f9109](https://github.com/Deadflight/dona-maria-erp/commit/a5f91098d60f5326beb2dc8ed8349161a68c510c))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features
- Setup inicial del proyecto con Next.js 16, React 19 y TypeScript
- Configuración de shadcn/ui con componentes base
- Theme WCAG AAA compliant para accesibilidad
- Configuración de Supabase client (browser y server components)

### Bug Fixes
- ( Ninguno aún )

### Documentation
- Documentación de capítulos de tesis (Diagnóstico, Marco Teórico, Marco Metodológico, Análisis y Diseño)
- Documentación ADR para decisiones técnicas
- Colección Postman para testing de API

### Maintenance
- Configuración de semantic-release para releases automatizados
