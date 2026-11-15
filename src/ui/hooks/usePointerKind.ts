// src/ui/hooks/usePointerKind.ts
// Whether the player is on a touch screen or using a mouse, so on-screen guidance can say
// "tap" or "click". Follows the primary pointer, and updates if it changes (e.g. a tablet docked to a keyboard).
import { useEffect, useState } from 'react';
import type { PointerKind } from '../../content/tutorial';

const QUERY = '(pointer: coarse)';

const detect = (): PointerKind => {
  try {
    return globalThis.matchMedia?.(QUERY).matches ? 'touch' : 'mouse';
  } catch {
    return 'touch';
  }
};

export function usePointerKind(): PointerKind {
  const [kind, setKind] = useState<PointerKind>(detect);
  useEffect(() => {
    const mq = globalThis.matchMedia?.(QUERY);
    if (!mq) return;
    const onChange = () => setKind(detect());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return kind;
}
