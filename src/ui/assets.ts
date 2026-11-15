// src/ui/assets.ts
// Asset path helpers.

export const getFullBodyPath = (squarePath: string) => {
  const filename = (squarePath || '/portraits/thaumaturge_m1.png').split('/').pop();
  return `/portraits/full_body/fb_${filename}`;
};
