// scripts/test-loader.mjs
// Lets `node --test` run the engine's TypeScript directly (Node >= 22.18 strips types natively).
// The app imports files without extensions (Vite style), so this resolve hook tries `.ts`,
// `.tsx` and `/index.ts` the way Vite does. No extra dependencies needed.
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(String.raw`
      const CANDIDATES = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
      export async function resolve(specifier, context, next) {
        const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
        const hasExtension = /\.[cm]?[jt]sx?$|\.json$/.test(specifier);
        if (!isRelative || hasExtension) return next(specifier, context);
        for (const suffix of CANDIDATES) {
          try {
            return await next(specifier + suffix, context);
          } catch {
            // try the next candidate
          }
        }
        return next(specifier, context);
      }
    `),
  import.meta.url
);
