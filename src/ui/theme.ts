// src/ui/theme.ts
// Shared visual tokens, UI types and small text helpers.

export interface TerminalEntry {
  id: number;
  html: string;
  type: 'normal' | 'info' | 'system' | 'success' | 'warn' | 'error' | 'command';
}

export type ViewportMode = 'FIELD_OPS' | 'CODEX' | 'KAGE_NO_SHO' | 'SAFEHOUSE_ALTAR' | 'HORSEMEN' | 'DOSSIER' | 'MANUAL';
export type FontScale = 'SM' | 'MD' | 'LG';
export type ControlMode = 'PALETTE' | 'CLI';

export const FONT_ZOOM_MAP: Record<FontScale, number> = { SM: 1, MD: 1.1, LG: 1.2 };

export const theme = {
  bgDark: '#050706',
  bgPanel: '#090d0a',
  borderTerminal: '#1f3d26',
  textTerminal: '#4a7c59',
  textBright: '#62f080',
  textMuted: '#2a5233',
  accentAmber: '#ffb800',
  accentRed: '#ff2a55',
  accentCyan: '#00f3ff',
  fontMono: '"JetBrains Mono", "Courier New", Courier, monospace',
};

/** Escapes text before it is interpolated into terminal HTML (rendered via dangerouslySetInnerHTML). */
export const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export const SIGIL_REVEALED_FILTER = 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%) drop-shadow(0 0 6px rgba(98, 240, 128, 0.45))';

// ============================================================================ //

export const formatLabel = (str: string) => str.replaceAll('_', ' ').toUpperCase();
