// src/ui/session/useMapCanvas.ts
// Map canvas rendering and pointer interaction.
import { useEffect, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { MACRO_SECTORS } from '../../content/map';
import { getRipeness } from '../../engine/world';
import { SECTOR_QUIRKS, getSectorQuirk } from '../../engine/sectorGenerator';
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

    const renderLoop = () => {
      const fx = visualFxRef.current;
      fx.angle += 0.025;
      const heat = state.sectorEntropy[state.currentNode] || 0;
      fx.wavePhase += 0.14 + (heat / 220);

      const canvas = mapCanvasRef.current;
      if (canvas) {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect && (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height))) {
          canvas.width = Math.floor(rect.width);
          canvas.height = Math.floor(rect.height);
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(74, 124, 89, 0.08)';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
          for (let y = 0; y < h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

          ctx.save();
          ctx.translate(w / 2 + mapPan.x, h / 2 + mapPan.y);
          ctx.scale(mapZoom, mapZoom);
          ctx.translate(-w / 2, -h / 2);

          for (let i = fx.sonarRings.length - 1; i >= 0; i--) {
            const sr = fx.sonarRings[i];
            sr.r += 4;
            sr.alpha -= 0.02;
            if (sr.alpha <= 0) { fx.sonarRings.splice(i, 1); continue; }
            ctx.beginPath();
            ctx.arc(sr.x * w, sr.y * h, sr.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(98, 240, 128, ${sr.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          if (mapViewMode === 'SUB_GRID' && currentContract) {
            const sectorFailed = isSectorLost(currentContract.sectorId);
            const sectorSecured = isSectorSecured(currentContract.sectorId) || sectorFailed;

            if (!currentContract.activeSubNodeId) {
              const r1 = currentContract.subNodes[0];
              if (r1) {
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([5, 4]);
                ctx.moveTo(0.03 * w, r1.y * h);
                ctx.lineTo(r1.x * w, r1.y * h);
                ctx.strokeStyle = 'rgba(98, 240, 128, 0.85)';
                ctx.lineWidth = 2.4;
                ctx.stroke();
                ctx.fillStyle = '#62f080';
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.fillText('START ->', 0.06 * w, r1.y * h - 8);
                ctx.restore();
              }
            }

            currentContract.subNodes.forEach(node => {
              node.connections.forEach(tid => {
                const target = currentContract.subNodes.find(n => n.id === tid);
                if (!target || node.index > target.index) return;
                const isActivePath =
                  currentContract.activeSubNodeId === node.id ||
                  currentContract.activeSubNodeId === target.id;

                ctx.save();
                ctx.beginPath();
                if (isActivePath && !sectorSecured) {
                  ctx.setLineDash([6, 4]);
                  ctx.strokeStyle = 'rgba(98, 240, 128, 0.85)';
                  ctx.lineWidth = 2.6;
                } else {
                  ctx.strokeStyle = sectorFailed
                    ? 'rgba(255, 42, 85, 0.45)'
                    : sectorSecured
                    ? 'rgba(98, 240, 128, 0.55)'
                    : node.status !== 'LOCKED' && target.status !== 'LOCKED'
                    ? 'rgba(98, 240, 128, 0.35)'
                    : 'rgba(74, 124, 89, 0.18)';
                  ctx.lineWidth = 1.4;
                }
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.stroke();
                ctx.restore();
              });
            });

            currentContract.subNodes.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === currentContract.activeSubNodeId;
              const isSelected = node.id === currentContract.selectedSubNodeId;
              const isReachable = isAdjacentOrEntry(node) && !isCurrent;
              const entryHeat = getRoomEntryHeatCost(node);

              let color = '#ff2a55';
              if (sectorFailed) color = '#ff2a55';
              else if (sectorSecured || node.status === 'CLEARED') color = '#62f080';
              else if (node.status === 'SCANNED') {
                color = node.patrolActive ? '#ff2a55' : node.nodeType === 'SHRINE' ? '#00f3ff' : '#ffb800';
              } else if (node.status === 'ENTERED') color = '#ffb800';

              if (isReachable && !sectorSecured) {
                ctx.beginPath();
                ctx.arc(nx, ny, 23, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(98, 240, 128, 0.45)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
              }

              ctx.save();
              ctx.translate(nx, ny);
              ctx.rotate(isCurrent ? fx.angle : -fx.angle * 0.5);
              ctx.beginPath();
              const r = isCurrent ? 21 : 16;
              for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
                else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
              }
              ctx.closePath();
              ctx.strokeStyle = isSelected ? '#ffffff' : color;
              ctx.lineWidth = isSelected ? 2.5 : 1.6;
              ctx.stroke();
              ctx.restore();

              ctx.beginPath();
              ctx.arc(nx, ny, 5, 0, Math.PI * 2);
              ctx.fillStyle = isCurrent ? '#62f080' : '#050706';
              ctx.fill();
              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.font = 'bold 11px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = isSelected ? '#ffffff' : '#a8ccaf';
              ctx.fillText(node.label, nx, ny + 30);

              let subBadge = sectorFailed ? '[LOST]' : sectorSecured ? '[SECURED]' : isCurrent ? '[YOU ARE HERE]' : `[${node.status} // +${entryHeat}% HEAT]`;
              if (!sectorSecured && !isCurrent && node.status === 'SCANNED') {
                const typeTag = node.patrolActive ? '! PATROL !' : node.nodeType === 'SHRINE' ? 'SHRINE' : node.nodeType === 'ANCHOR' ? 'ANCHOR' : node.nodeType === 'WITNESS' ? 'WITNESS' : 'CLUE';
                subBadge = `[${typeTag} // +${entryHeat}% HEAT]`;
              }
              ctx.font = '10px "Courier New", monospace';
              ctx.fillStyle = isCurrent ? '#62f080' : color;
              ctx.fillText(subBadge, nx, ny + 42);

              if (isReachable && !sectorSecured) {
                ctx.fillStyle = '#62f080';
                ctx.font = 'bold 9px "Courier New", monospace';
                ctx.fillText('● REACHABLE', nx, ny + 53);
              }

              if (node.status !== 'LOCKED' && !sectorSecured) {
                if (node.patrolActive) {
                  ctx.fillStyle = '#ff2a55';
                  ctx.font = 'bold 10px "Courier New", monospace';
                  ctx.fillText(`! PATROL !`, nx, ny - 23);
                } else if (node.hazard !== 'NONE') {
                  ctx.fillStyle = '#00f3ff';
                  ctx.font = 'bold 10px "Courier New", monospace';
                  ctx.fillText(`! TRAP: ${node.hazard} !`, nx, ny - 23);
                }
              }
            });
          } else {
            MACRO_SECTORS.forEach(node => {
              const unlockedA = isSectorUnlocked(node);
              node.connections.forEach(tid => {
                const target = MACRO_SECTORS.find(n => n.id === tid);
                if (!target) return;
                const unlockedB = isSectorUnlocked(target);
                ctx.beginPath();
                ctx.moveTo(node.x * w, node.y * h);
                ctx.lineTo(target.x * w, target.y * h);
                ctx.strokeStyle = unlockedA && unlockedB ? 'rgba(98, 240, 128, 0.35)' : 'rgba(42, 82, 51, 0.15)';
                ctx.lineWidth = unlockedA && unlockedB ? 1.5 : 0.9;
                ctx.stroke();
              });
            });

            MACRO_SECTORS.forEach(node => {
              const nx = node.x * w;
              const ny = node.y * h;
              const isCurrent = node.id === state.currentNode;
              const secured = isSectorSecured(node.id);
              const lost = isSectorLost(node.id);
              const unlocked = isSectorUnlocked(node);
              const nodeHeat = state.sectorEntropy[node.id] || 0;

              let color = '#2a5233';
              if (node.id === 'safehouse') color = '#00f3ff';
              else if (secured) color = '#62f080';
              else if (lost) color = '#ff2a55';
              else if (unlocked) color = nodeHeat >= 75 ? '#ff2a55' : '#ffb800';

              ctx.beginPath();
              ctx.arc(nx, ny, isCurrent ? 13 : unlocked ? 9 : 5, 0, Math.PI * 2);
              ctx.fillStyle = secured ? 'rgba(98, 240, 128, 0.25)' : lost ? 'rgba(255, 42, 85, 0.3)' : '#050706';
              ctx.fill();
              ctx.strokeStyle = isCurrent ? '#ffffff' : color;
              ctx.lineWidth = isCurrent ? 2.5 : 1.8;
              ctx.stroke();

              // Ripeness ring: how close this anchor is to manifesting on its own
              const ripeness = getRipeness(state, node.id);
              if (unlocked && !secured && !lost && node.id !== 'safehouse' && ripeness > 0) {
                ctx.beginPath();
                ctx.arc(nx, ny, (isCurrent ? 13 : 9) + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * ripeness) / 100);
                ctx.strokeStyle = ripeness >= 75 ? '#ff2a55' : ripeness >= 50 ? '#ffb800' : '#a8ccaf';
                ctx.lineWidth = 2;
                ctx.stroke();
              }

              ctx.font = unlocked ? 'bold 10px "Courier New", monospace' : '9px "Courier New", monospace';
              ctx.textAlign = 'center';
              ctx.fillStyle = isCurrent ? '#ffffff' : unlocked ? '#a8ccaf' : '#2a5233';
              ctx.fillText(unlocked ? node.short : '??? [LOCKED]', nx, ny + 23);

              if (unlocked) {
                ctx.font = '9px "Courier New", monospace';
                ctx.fillStyle = color;
                const statusTxt = node.id === 'safehouse' ? '[SAFEHOUSE]' : secured ? '✓ SECURED' : lost ? '☠ LOST' : `HEAT:${nodeHeat}% · RIPE:${ripeness}%`;
                ctx.fillText(statusTxt, nx, ny + 34);
              }
            });
          }

          ctx.restore();
        }
      }

      const waveCanvas = waveformCanvasRef.current;
      if (waveCanvas) {
        const ctx = waveCanvas.getContext('2d');
        if (ctx) {
          const w = waveCanvas.width;
          const h = waveCanvas.height;
          ctx.clearRect(0, 0, w, h);
          const amp = Math.min(h / 2 - 2, 3 + (heat / 10));
          ctx.beginPath();
          ctx.strokeStyle = heat >= 75 ? '#ff2a55' : heat >= 35 ? '#ffb800' : '#62f080';
          ctx.lineWidth = 1.5;
          for (let x = 0; x < w; x++) {
            const y = h / 2 + Math.sin(x * 0.22 + fx.wavePhase) * amp * Math.sin(x * 0.05);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [state.gameStage, viewport, mapViewMode, currentContract, state.currentNode, state.sectorEntropy, state.flags, mapZoom, mapPan]);

  const getWorldCoordsFromClient = (clientX: number, clientY: number) => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return { wx: 0, wy: 0, w: 1, h: 1 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const w = canvas.width;
    const h = canvas.height;
    const wx = (sx - w / 2 - mapPan.x) / mapZoom + w / 2;
    const wy = (sy - h / 2 - mapPan.y) / mapZoom + h / 2;
    return { wx, wy, w, h };
  };

  const handleCanvasPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    isPanningRef.current = true;
    didDragRef.current = false;
    panStartRef.current = { x: e.clientX - mapPan.x, y: e.clientY - mapPan.y };
  };

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.hypot(dx - mapPan.x, dy - mapPan.y) > 5) didDragRef.current = true;
    setMapPan({ x: dx, y: dy });
  };

  const handleCanvasPointerUp = () => {
    isPanningRef.current = false;
  };

  const handleCanvasWheel = (e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.18 : -0.18;
    setMapZoom(prev => Math.min(2.8, Math.max(0.6, +(prev + delta).toFixed(2))));
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (didDragRef.current) return;
    const { wx, wy, w, h } = getWorldCoordsFromClient(e.clientX, e.clientY);

    if (mapViewMode === 'SUB_GRID' && currentContract) {
      for (const node of currentContract.subNodes) {
        const nx = node.x * w;
        const ny = node.y * h;
        if (Math.hypot(wx - nx, wy - ny) <= 30) {
          ThaumaturgicAudio.keyClick();
          updateContract(currentContract.sectorId, c => ({ ...c, selectedSubNodeId: node.id }));
          visualFxRef.current.sonarRings.push({ x: node.x, y: node.y, r: 6, alpha: 0.9 });
          break;
        }
      }
    } else {
      for (const sec of MACRO_SECTORS) {
        const nx = sec.x * w;
        const ny = sec.y * h;
        if (Math.hypot(wx - nx, wy - ny) <= 26) {
          if (!isSectorUnlocked(sec)) {
            ThaumaturgicAudio.errorBuzz();
            addToast(`Sector Locked! Secure an adjacent sector first.`, 'ALERT');
            return;
          }
          ThaumaturgicAudio.scryPing();
          addMicroEntropy(0.02);
          setDeducedSigns([]);
          if (sec.id === 'safehouse') {
            travelTo('safehouse');
            setViewport('SAFEHOUSE_ALTAR');
          } else {
            travelTo(sec.id);
            setMapViewMode('SUB_GRID');
            appendLog(`[*] ROUTED TETHER TO SECTOR: <strong style="color:#62f080;">${sec.label}</strong> (${sec.region}). (+0.02% Global Entropy)`, 'info');
            const destQuirk = getSectorQuirk(contracts[sec.id]);
            if (destQuirk !== 'NONE' && !isSectorClosed(sec.id)) {
              appendLog(`[⚠ SECTOR CONDITION: <strong style="color:#00f3ff;">${SECTOR_QUIRKS[destQuirk].label}</strong>] ${SECTOR_QUIRKS[destQuirk].desc}`, 'warn');
            }
          }
          break;
        }
      }
    }
  };


  return {
    getWorldCoordsFromClient,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasWheel,
    handleCanvasClick
  };
}

export type MapCanvas = ReturnType<typeof useMapCanvas>;
