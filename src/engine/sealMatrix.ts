// src/engine/sealMatrix.ts

export interface SealNode {
  id: number;
  x: number;
  y: number;
}

export interface SealMatrix {
  id: string;
  /** Seconds allowed to trace the full sequence. */
  timeLimit: number;
  nodes: SealNode[];
  /** Node ids to visit in order. */
  sequence: number[];
}

/** Builds a randomly rotated star-polygon tracing puzzle in a 100x100 viewBox. */
export function generateSealMatrix(): SealMatrix {
  const geometries = [
    { n: 5, s: 2, name: "PENTAGRAM" }, { n: 7, s: 2, name: "HEPTAGRAM_OBTUSE" },
    { n: 7, s: 3, name: "HEPTAGRAM_ACUTE" }, { n: 8, s: 3, name: "OCTAGRAM" },
    { n: 9, s: 2, name: "ENNEAGRAM_OBTUSE" }, { n: 9, s: 4, name: "ENNEAGRAM_ACUTE" }
  ];
  const config = geometries[Math.floor(Math.random() * geometries.length)];
  const isBound = Math.random() > 0.5;
  const rotationOffset = Math.random() * Math.PI * 2;
  const nodes: SealNode[] = [];
  for (let i = 0; i < config.n; i++) {
    const angle = rotationOffset + (i * 2 * Math.PI) / config.n;
    nodes.push({ id: i, x: 50 + 42 * Math.sin(angle), y: 50 - 42 * Math.cos(angle) });
  }
  const sequence: number[] = [];
  let current = 0;
  for (let i = 0; i < config.n; i++) {
    sequence.push(current);
    current = (current + config.s) % config.n;
  }
  sequence.push(0);
  if (isBound) {
    for (let i = 0; i < config.n; i++) {
      current = (current + 1) % config.n;
      sequence.push(current);
    }
  }
  const timeLimit = Math.ceil((sequence.length - 1) * 1.45) + 4;
  return { id: `${isBound ? "BOUND_" : "LESSER_"}${config.name}_PROTOCOL`, timeLimit, nodes, sequence };
}
