// src/ui/session/useMapCanvas.ts
// Map canvas rendering and pointer interaction.
import { useEffect, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { getRipeness } from '../../engine/world';
import { isProceduralSite } from '../../engine/sites';
import { isTraining } from '../../engine/tutorial';
import { SECTOR_QUIRKS, getSectorQuirk, type SubGridNode } from '../../engine/sectorGenerator';
import type { MacroSectorDef } from '../../content/map';
import { drawBackdropGrid, drawRegionalMap, drawSonarRings, drawSubGrid, drawWaveform } from './mapDrawing';
import { ThaumaturgicAudio } from '../audio';
import type { FieldOps } from './useFieldOps';
import type { SessionCore } from './useSessionCore';

/** Canvas render loop for the sector sub-grid / regional map, plus pan, zoom and click handling. */
export function useMapCanvas(s: SessionCore & FieldOps) {
  const {
    state,
    travelTo,
    viewport,
    setViewport,
    mapViewMode,
    setMapViewMode,
    mapZoom,
    setMapZoom,
    mapPan,
    setMapPan,
    isPanningRef,
    panStartRef,
    didDragRef,
    pointersRef,
    pinchRef,
    mapWrapRef,
    contracts,
    updateContract,
    setDeducedSigns,
    mapCanvasRef,
    waveformCanvasRef,
    visualFxRef,
    isSectorSecured,
    isSectorLost,
    isSectorClosed,
    isSectorUnlocked,
    allSectors,
    addMicroEntropy,
    addToast,
    appendLog,
    currentContract,
    isAdjacentOrEntry,
    getRoomEntryHeatCost
  } = s;

  useEffect(() => {
    if (state.gameStage !== 'ACTIVE' || viewport !== 'FIELD_OPS') return;
    let animId: number;

    const drawMap = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const fx = visualFxRef.current;
      ctx.clearRect(0, 0, w, h);
      drawBackdropGrid(ctx, w, h);
      ctx.save();
      ctx.translate(w / 2 + mapPan.x, h / 2 + mapPan.y);
      ctx.scale(mapZoom, mapZoom);
      ctx.translate(-w / 2, -h / 2);
      drawSonarRings(ctx, fx, w, h);
      if (mapViewMode === 'SUB_GRID' && currentContract) {
        const failed = isSectorLost(currentContract.sectorId);
        drawSubGrid(ctx, w, h, {
          contract: currentContract,
          failed,
          closed: failed || isSectorSecured(currentContract.sectorId),
          angle: fx.angle,
          isReachable: isAdjacentOrEntry,
          entryCost: getRoomEntryHeatCost
        });
      } else {
        drawRegionalMap(ctx, w, h, {
          sectors: allSectors,
          isUnlocked: isSectorUnlocked,
          statusOf: sec => ({
            isCurrent: sec.id === state.currentNode,
            secured: isSectorSecured(sec.id),
            lost: isSectorLost(sec.id),
            unlocked: isSectorUnlocked(sec),
            heat: state.sectorEntropy[sec.id] || 0,
            ripeness: getRipeness(state, sec.id),
            cycle: state.campaign?.cycles?.[sec.id] || 0,
            procedural: isProceduralSite(sec)
          })
        });
      }
      ctx.restore();
    };

    const renderLoop = () => {
      const fx = visualFxRef.current;
      fx.angle += 0.025;
      const heat = state.sectorEntropy[state.currentNode] || 0;
      fx.wavePhase += 0.14 + heat / 220;

      const mapCtx = mapCanvasRef.current?.getContext('2d');
      if (mapCtx) drawMap(mapCtx, mapCtx.canvas.width, mapCtx.canvas.height);
      const waveCtx = waveformCanvasRef.current?.getContext('2d');
      if (waveCtx) drawWaveform(waveCtx, waveCtx.canvas.width, waveCtx.canvas.height, heat, fx.wavePhase);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [state.gameStage, viewport, mapViewMode, currentContract, state.currentNode, state.sectorEntropy, state.sectorRipeness, state.flags, allSectors, mapZoom, mapPan]);

  // Size the canvas from its own wrapper (layout px, unaffected by CSS zoom). The wrapper's size
  // never depends on the canvas, so there is no feedback loop on auto-height mobile layouts.
  useEffect(() => {
    if (state.gameStage !== 'ACTIVE' || viewport !== 'FIELD_OPS') return;
    const wrap = mapWrapRef.current;
    const canvas = mapCanvasRef.current;
    if (!wrap || !canvas) return;
    const fit = () => {
      const w = Math.max(1, Math.floor(wrap.clientWidth));
      const h = Math.max(1, Math.floor(wrap.clientHeight));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [state.gameStage, viewport]);

  // Wheel zoom needs a non-passive listener, or the page scrolls underneath the map
  useEffect(() => {
    if (state.gameStage !== 'ACTIVE' || viewport !== 'FIELD_OPS') return;
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.18 : -0.18;
      setMapZoom(prev => clampZoom(prev + delta));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [state.gameStage, viewport]);

  const clampZoom = (z: number) => Math.min(2.8, Math.max(0.6, +z.toFixed(2)));
  /** Keeps the map from being flung out of view. */
  const clampPan = (p: { x: number; y: number }, zoom: number) => {
    const canvas = mapCanvasRef.current;
    const limX = ((canvas?.width || 400) * zoom) / 2;
    const limY = ((canvas?.height || 300) * zoom) / 2;
    return { x: Math.max(-limX, Math.min(limX, p.x)), y: Math.max(-limY, Math.min(limY, p.y)) };
  };

  const getWorldCoordsFromClient = (clientX: number, clientY: number) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return { wx: 0, wy: 0, w: 1, h: 1 };
    const rect = canvas.getBoundingClientRect();
    // Client px -> canvas px (rect is scaled by CSS zoom / text size; the canvas buffer is not)
    const sx = ((clientX - rect.left) * canvas.width) / (rect.width || 1);
    const sy = ((clientY - rect.top) * canvas.height) / (rect.height || 1);
    const w = canvas.width;
    const h = canvas.height;
    const wx = (sx - w / 2 - mapPan.x) / mapZoom + w / 2;
    const wy = (sy - h / 2 - mapPan.y) / mapZoom + h / 2;
    return { wx, wy, w, h };
  };

  // One pointer pans; two pointers pinch-zoom around their midpoint.
  const handleCanvasPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 1) {
      isPanningRef.current = true;
      didDragRef.current = false;
      panStartRef.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        zoom: mapZoom,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        pan: mapPan
      };
      isPanningRef.current = false;
      didDragRef.current = true;
    }
  };

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      const zoom = clampZoom(pinch.zoom * ((Math.hypot(a.x - b.x, a.y - b.y) || 1) / pinch.dist));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      setMapZoom(zoom);
      setMapPan(clampPan({ x: pinch.pan.x + (mid.x - pinch.mid.x), y: pinch.pan.y + (mid.y - pinch.mid.y) }, zoom));
      return;
    }
    if (!isPanningRef.current) return;
    const next = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y };
    if (Math.hypot(next.x - mapPan.x, next.y - mapPan.y) > 5) didDragRef.current = true;
    if (didDragRef.current) setMapPan(clampPan(next, mapZoom));
  };

  const handleCanvasPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      // Lifting one finger of a pinch: continue panning with the other, without a jump
      const [rest] = [...pointersRef.current.values()];
      isPanningRef.current = true;
      panStartRef.current = { x: rest.x - mapPan.x, y: rest.y - mapPan.y };
    } else if (pointersRef.current.size === 0) {
      isPanningRef.current = false;
    }
  };

  /** The first point within `radius` px of the click, in map space. */
  const hitTest = <T extends { x: number; y: number }>(items: T[], wx: number, wy: number, w: number, h: number, radius: number) =>
    items.find(it => Math.hypot(wx - it.x * w, wy - it.y * h) <= radius);

  const selectRoom = (node: SubGridNode) => {
    if (!currentContract) return;
    ThaumaturgicAudio.keyClick();
    updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: node.id }));
    visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 0.9 });
  };

  const routeToSector = (sec: MacroSectorDef) => {
    if (isTraining(state) && sec.id !== state.currentNode) {
      ThaumaturgicAudio.errorBuzz();
      addToast('TRAINING TETHER LOCKED TO SECTOR', 'ALERT');
      return;
    }
    if (!isSectorUnlocked(sec)) {
      ThaumaturgicAudio.errorBuzz();
      addToast('SECTOR LOCKED', 'ALERT');
      return;
    }
    ThaumaturgicAudio.scryPing();
    addMicroEntropy(0.02);
    setDeducedSigns([]);
    if (sec.id === 'safehouse') {
      travelTo('safehouse');
      setViewport('SAFEHOUSE_ALTAR');
      return;
    }
    travelTo(sec.id);
    setMapViewMode('SUB_GRID');
    appendLog(`[*] ROUTED TETHER TO SECTOR: <strong style="color:#62f080;">${sec.label}</strong> (${sec.region}). (+0.02% Global Entropy)`, 'info');
    const destQuirk = getSectorQuirk(contracts[sec.id]);
    if (destQuirk !== 'NONE' && !isSectorClosed(sec.id)) {
      appendLog(`[⚠ SECTOR CONDITION: <strong style="color:#00f3ff;">${SECTOR_QUIRKS[destQuirk].label}</strong>] ${SECTOR_QUIRKS[destQuirk].desc}`, 'warn');
    }
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (didDragRef.current) return;
    const { wx, wy, w, h } = getWorldCoordsFromClient(e.clientX, e.clientY);
    if (mapViewMode === 'SUB_GRID' && currentContract) {
      const room = hitTest(currentContract.subNodes, wx, wy, w, h, 30);
      if (room) selectRoom(room);
      return;
    }
    const sec = hitTest(allSectors, wx, wy, w, h, 26);
    if (sec) routeToSector(sec);
  };


  return {
    getWorldCoordsFromClient,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasClick
  };
}

export type MapCanvas = ReturnType<typeof useMapCanvas>;
