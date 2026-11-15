// src/ui/assets.ts
// Asset path helpers.
// The game is served from a sub-folder on GitHub Pages and itch.io, so files in public/ are
// always addressed relative to Vite's base URL, never from the site root.

const BASE = import.meta.env?.BASE_URL ?? '/';

/** URL for a file in public/, e.g. assetUrl('/seals/01_bael.png'). Accepts paths with or without a leading slash. */
export const assetUrl = (path: string) => `${BASE}${path.replace(/^\/+/, '')}`;

/** Full-body art for a portrait. Saved portraits are stored as '/portraits/<file>.png'. */
export const getFullBodyPath = (squarePath: string) => {
  const filename = (squarePath || '/portraits/thaumaturge_m1.png').split('/').pop();
  return assetUrl(`portraits/full_body/fb_${filename}`);
};
