// src/ui/components/SigilTracingBoard.tsx
// Shared pointer/touch tracing surface used by both the Sealing Rite and the Grand Rite of Banishment.
import { useRef, useState, type PointerEvent } from 'react';
import type { SealMatrix } from '../../engine/sealMatrix';

export interface TracingPalette {
  /** Faint guide outline of the full figure. */
  guide: string;
  guideWidth?: number;
  guideOpacity?: number;
  /** Line drawn over completed segments. */
  trace: string;
  traceWidth?: number;
  /** Dashed line from the last node to the pointer. */
  pointer: string;
  pointerWidth?: number;
  /** Fill of the next / completed nodes. */
  activeNode: string;
  /** Fill of untouched nodes. */
  idleNode: string;
  /** Outline of untouched nodes. */
  idleStroke: string;
  /** Outline of the next node. */
  nextStroke: string;
  /** Pulsing ring around the next node (defaults to `nextStroke`). */
  pulse?: string;
}

interface SigilTracingBoardProps {
  matrix: SealMatrix;
  /** Node ids traced so far (owned by the parent so it can react to completion). */
  path: number[];
  /** Called when the pointer reaches the next node in the sequence. */
  onNodeHit: (nodeId: number) => void;
  enabled: boolean;
  palette: TracingPalette;
  /** Hit radius in viewBox units. */
  hitRadius?: number;
}

export function SigilTracingBoard({ matrix, path, onNodeHit, enabled, palette, hitRadius = 17 }: SigilTracingBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const nodeById = (id: number) => matrix.nodes.find(n => n.id === id)!;
  const nextId = matrix.sequence[path.length];

  const toSvgCoords = (e: PointerEvent) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(ctm.inverse());
  };

  const testHit = (coords: { x: number; y: number }) => {
    if (nextId === undefined) return;
    const target = nodeById(nextId);
    if (Math.hypot(coords.x - target.x, coords.y - target.y) < hitRadius) onNodeHit(target.id);
  };

  const handleDown = (e: PointerEvent) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = toSvgCoords(e);
    if (!coords) return;
    setPointer({ x: coords.x, y: coords.y });
    testHit(coords);
  };

  const handleMove = (e: PointerEvent) => {
    if (!enabled || !pointer) return;
    const coords = toSvgCoords(e);
    if (!coords) return;
    setPointer({ x: coords.x, y: coords.y });
    testHit(coords);
  };

  const handleUp = (e: PointerEvent) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    setPointer(null);
  };

  const toPoints = (ids: number[]) => ids.map(id => { const n = nodeById(id); return `${n.x},${n.y}`; }).join(' ');
  const last = path.length > 0 ? nodeById(path[path.length - 1]) : null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 100 100"
      style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 10, cursor: 'crosshair', touchAction: 'none' }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
    >
      <polygon points={toPoints(matrix.sequence)} fill="none" stroke={palette.guide} strokeWidth={palette.guideWidth ?? 0.7} strokeOpacity={palette.guideOpacity ?? 1} />
      <polyline points={toPoints(path)} fill="none" stroke={palette.trace} strokeWidth={palette.traceWidth ?? 2} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
      {pointer && last && path.length < matrix.sequence.length && (
        <line x1={last.x} y1={last.y} x2={pointer.x} y2={pointer.y} stroke={palette.pointer} strokeWidth={palette.pointerWidth ?? 1.3} strokeDasharray="2 2" style={{ pointerEvents: 'none' }} />
      )}
      {matrix.nodes.map(node => {
        const isCompleted = path.includes(node.id);
        const isNext = node.id === nextId;
        return (
          <g key={node.id} style={{ pointerEvents: 'none' }}>
            <circle
              cx={node.x}
              cy={node.y}
              r={isNext ? 4.2 : 2.4}
              fill={isNext || isCompleted ? palette.activeNode : palette.idleNode}
              stroke={isNext ? palette.nextStroke : palette.idleStroke}
              strokeWidth={0.8}
            />
            {isNext && <circle cx={node.x} cy={node.y} r={7.5} fill="none" stroke={palette.pulse ?? palette.nextStroke} strokeWidth={1.1} style={{ animation: 'blink 0.8s infinite' }} />}
          </g>
        );
      })}
    </svg>
  );
}
