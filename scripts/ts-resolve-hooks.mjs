/**
 * Resolver hook: appends `.ts` / `/index.ts` to extensionless relative
 * specifiers so Node can load the application's TypeScript directly.
 */

const RELATIVE = /^\.{1,2}\//;
const HAS_EXTENSION = /\.[cm]?[jt]sx?$/;

export async function resolve(specifier, context, nextResolve) {
  if (RELATIVE.test(specifier) && !HAS_EXTENSION.test(specifier)) {
    for (const candidate of [`${specifier}.ts`, `${specifier}/index.ts`]) {
      try {
        return await nextResolve(candidate, context);
      } catch {
        /* try the next candidate */
      }
    }
  }

  return nextResolve(specifier, context);
}