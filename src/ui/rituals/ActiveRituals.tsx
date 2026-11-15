// src/ui/rituals/ActiveRituals.tsx
// Mounts the Sealing / Banishment overlays when a rite is active.
import { allGoetia } from '../../content/goetia';
import { MACRO_SECTORS } from '../../content/map';
import { isTraining, TUTORIAL_SEAL_BONUS_SECONDS } from '../../engine/tutorial';
import { useSession } from '../session/SessionContext';
import { BanishmentTerminal } from './BanishmentTerminal';
import { SealingTerminal } from './SealingTerminal';

export function ActiveRituals() {
  const {
    state,
    dispatch,
    sealGoetia,
    contracts,
    updateContract,
    attunedSectors,
    setDeducedSigns,
    activeSealSuspectId,
    setActiveSealSuspectId,
    activeBanishmentTarget,
    setActiveBanishmentTarget,
    isSectorSecured,
    isReleased,
    addToast,
    appendLog,
    currentContract
  } = useSession();

  return (
    <>
      {activeSealSuspectId && (() => {
        const suspect = allGoetia.find(g => g.id === activeSealSuspectId);
        if (!suspect || !currentContract) return null;
        const actualAnchorId = currentContract.targetGoetiaId;
        const training = isTraining(state);
        const attunedBonus = ((currentContract && attunedSectors[currentContract.sectorId]) ? 4 : 0) + (training ? TUTORIAL_SEAL_BONUS_SECONDS : 0);
        return (
          <SealingTerminal
            suspect={suspect}
            actualAnchorId={actualAnchorId}
            sealCost={suspect.sealCost || {}}
            attunedBonusSeconds={attunedBonus}
            onClose={() => setActiveSealSuspectId(null)}
            sectorId={currentContract.sectorId}
            onSuccessSeal={(sealedId) => {
              dispatch({ type: 'MODIFY_INVENTORY', payload: { itemId: 'obols', amount: 45 } });
              dispatch({ type: 'MODIFY_SECTOR_ENTROPY', payload: { nodeId: state.currentNode, amount: -100 } });
              dispatch({ type: 'SET_FLAG', payload: { flagId: `sector_secured_${state.currentNode}`, value: true } });

              const currentMacro = MACRO_SECTORS.find(s => s.id === state.currentNode);
              if (currentMacro) {
                currentMacro.connections.forEach(connId => {
                  dispatch({ type: 'SET_FLAG', payload: { flagId: `sector_unlocked_${connId}`, value: true } });
                });
              }

              let cascadeMsg = '';
              const cascadedNamesList: string[] = [];
              if (['King', 'Prince', 'Duke'].includes(suspect.rank)) {
                // Never cascade-seal a demon that anchors another unsecured sector:
                // that sector would be left with no sealable target (softlock).
                const reservedTargets = new Set(
                  Object.values(contracts)
                    .filter(c => c.sectorId !== state.currentNode && !isSectorSecured(c.sectorId))
                    .map(c => c.targetGoetiaId)
                );
                const vassals = allGoetia.filter(
                  g => g.allegiance === suspect.allegiance &&
                  g.id !== sealedId &&
                  !state.sealedGoetia.includes(g.id) &&
                  !isReleased(g.id) &&
                  !reservedTargets.has(g.id) &&
                  !['King', 'Prince'].includes(g.rank)
                );
                const cascadeTargets = vassals.slice(0, suspect.rank === 'King' ? 2 : 1);
                if (cascadeTargets.length > 0) {
                  cascadeTargets.forEach(v => {
                    sealGoetia(v.id);
                    cascadedNamesList.push(`#${v.manifestId.toString().padStart(2, '0')} ${v.name.toUpperCase()} (${v.rank})`);
                  });
                  cascadeMsg = `<br/><span style="color:#ffb800;">⚡ SOLOMONIC RESONANCE CASCADE: Binding ${suspect.rank} ${suspect.name} automatically collapsed the feudal tether of ${cascadedNamesList.join(' & ')} into the Brass Vessel!</span>`;
                }
              }

              setDeducedSigns([]);
              if (currentContract) {
                updateContract(currentContract.sectorId, c => ({ ...c, discoveredLogs: [] }));
              }

              appendLog(
                `<div style="border-left:3px solid #62f080;padding-left:10px;margin:6px 0;color:#62f080;">` +
                `<strong>[✓ SECTOR PERMANENTLY SECURED: ${currentContract?.sectorLabel}]</strong><br/>` +
                `Goetian Anchor <strong>${suspect.name}</strong> severed! +45 Obols awarded.${cascadeMsg}` +
                `</div>`,
                'success'
              );
              return cascadedNamesList;
            }}
            dispatch={dispatch}
            sealGoetia={sealGoetia}
            addToast={addToast}
            tetheredYokai={state.tetheredYokai}
            isTraining={training}
          />
        );
      })()}

      {activeBanishmentTarget && (
        <BanishmentTerminal
          horseman={activeBanishmentTarget}
          state={state}
          dispatch={dispatch}
          onClose={() => setActiveBanishmentTarget(null)}
          addToast={addToast}
          tetheredYokai={state.tetheredYokai}
        />
      )}
    </>
  );
}
