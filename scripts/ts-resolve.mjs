/**
 * Node module-resolution hooks for the Phase 4.5 test scripts.
 *
 * Node's native TypeScript type stripping does not resolve extensionless
 * relative imports such as `./config`, which is valid TypeScript and valid for
 * Next.js/Turbopack but not for a bare ESM loader.
 *
 * This adds ONLY a resolver. Application source is never modified for the sake
 * of testing.
 *
 * Usage:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs <script>
 */

import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);