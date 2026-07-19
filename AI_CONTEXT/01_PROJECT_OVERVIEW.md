# 01 - Project Overview

## Purpose

Eight publishable JavaScript/TypeScript packages sharing a core HTTP client and typed clients for Posty5 links, QR codes, hosting, form submissions, variables, and social publishing.

## Capabilities

- **Authenticated HTTP client** - owned by `core`.
- **Short links** - owned by `short-link`.
- **QR codes** - owned by `qr-code`.
- **HTML hosting** - owned by `html-hosting`.
- **Hosting variables** - owned by `html-hosting-variables`.
- **Form submissions** - owned by `html-hosting-form-submission`.
- **Social workspaces** - owned by `social-publisher-workspace`.
- **Social posts** - owned by `social-publisher-post`.

## Stack

- Project type: npm workspaces TypeScript SDK monorepo.
- Runtime: Node.js 16+ and compatible browser runtimes.
- Package/build system: npm workspaces.

## Boundaries

- Owns client behavior and public TypeScript types, not the backend API implementation.
- Each posty5-* workspace is independently published.
- dist, coverage, logs, and test media outputs are generated/local artifacts.

The source of truth for ownership is [MODULE_INDEX.json](MODULE_INDEX.json); feature mapping is in [FEATURE_INDEX.json](FEATURE_INDEX.json).
