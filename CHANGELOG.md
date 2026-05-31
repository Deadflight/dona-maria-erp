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
