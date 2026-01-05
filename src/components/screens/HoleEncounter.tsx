import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CardHand } from '../cards/CardHand';
import { HoleDisplay } from '../hole/HoleDisplay';
import { ConfidenceBar } from '../ui/ConfidenceBar';
import { StatusEffects } from '../ui/StatusEffects';
import { ShotResultModal } from '../hole/ShotResultModal';
import { useRunStore } from '../../stores/runStore';
import { Button } from '../ui/Button';
import type { ShotResult } from '../../game/types';

export function HoleEncounter() {
  const currentHole = useRunStore(state => state.currentHole);
  const confidence = useRunStore(state => state.confidence);
  const maxConfidence = useRunStore(state => state.maxConfidence);
  const strokesOverPar = useRunStore(state => state.strokesOverPar);
  const holesCompleted = useRunStore(state => state.holesCompleted);
  const endPhase = useRunStore(state => state.endPhase);
  const advancePhase = useRunStore(state => state.advancePhase);
  const drawPile = useRunStore(state => state.drawPile);
  const discardPile = useRunStore(state => state.discardPile);
  const trinkets = useRunStore(state => state.trinkets);

  const [shotResult, setShotResult] = useState<ShotResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!currentHole) return null;

  const handleEndPhase = () => {
    setIsResolving(true);
    const result = endPhase();
    setShotResult(result);
  };

  const handleResultDismiss = () => {
    if (!shotResult) return;
    advancePhase(shotResult);
    setShotResult(null);
    setIsResolving(false);
  };

  const phaseLabels = {
    tee: 'Tee Shot',
    approach: 'Approach',
    short_game: 'Short Game',
    putt: 'Putting',
  };

  const scoreDisplay = strokesOverPar === 0
    ? 'E'
    : strokesOverPar > 0
    ? `+${strokesOverPar}`
    : strokesOverPar.toString();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-600 to-green-700 flex flex-col">
      {/* Top HUD */}
      <header className="p-4 flex justify-between items-start">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="text-lg font-bold">{currentHole.holeData.name}</div>
          <div className="text-sm opacity-80">
            Par {currentHole.holeData.par} • {currentHole.holeData.distance} yards
          </div>
          <div className="text-sm mt-1">
            Phase: <span className="font-semibold">{phaseLabels[currentHole.currentPhase]}</span>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-right">
          <div className="text-3xl font-bold">{scoreDisplay}</div>
          <div className="text-sm opacity-80">Hole {holesCompleted + 1} of 9</div>
          <div className="text-sm opacity-80">
            Strokes this hole: {currentHole.strokesTaken}
          </div>
        </div>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <HoleDisplay hole={currentHole} />

        {/* Info panels */}
        <div className="flex gap-4 flex-wrap justify-center">
          {/* Hidden info panel */}
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <div className="font-semibold mb-2">Conditions</div>
            <div className="space-y-1">
              <div>
                Wind: {currentHole.windRevealed
                  ? `${currentHole.holeData.windStrength} mph ${currentHole.holeData.windDirection.replace('_', ' ')}`
                  : '???'}
              </div>
              <div>
                Lie: {currentHole.lieRevealed
                  ? currentHole.currentLie.replace('_', ' ')
                  : '???'}
              </div>
              {currentHole.currentPhase === 'putt' && (
                <div>
                  Break: {currentHole.breakRevealed ? 'Revealed' : '???'}
                </div>
              )}
            </div>
          </div>

          {/* Distance display */}
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 text-white text-center min-w-[120px]">
            <div className="text-3xl font-bold">
              {currentHole.currentPhase === 'putt'
                ? `${Math.round(currentHole.puttDistance)} ft`
                : `${Math.round(currentHole.distanceRemaining)} yds`}
            </div>
            <div className="text-sm opacity-80">
              {currentHole.currentPhase === 'putt' ? 'to hole' : 'remaining'}
            </div>
          </div>

          {/* Status effects */}
          <StatusEffects
            statuses={currentHole.statuses}
            safePlay={currentHole.safePlayStacks}
          />
        </div>

        {/* Trinkets display */}
        {trinkets.length > 0 && (
          <div className="flex gap-2">
            {trinkets.map(t => (
              <div
                key={t.id}
                className="bg-black/30 px-2 py-1 rounded text-xs text-yellow-300"
                title={t.description}
              >
                {t.name}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom area - cards and actions */}
      <footer className="bg-black/40 backdrop-blur-sm p-4">
        {/* Confidence and deck info */}
        <div className="flex justify-between items-center mb-4 px-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ConfidenceBar current={confidence} max={maxConfidence} />
            <div className="text-white text-sm">
              Draw: {drawPile.length} | Discard: {discardPile.length}
            </div>
          </div>

          <Button
            onClick={handleEndPhase}
            disabled={isResolving}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-2"
          >
            End Phase
          </Button>
        </div>

        {/* Card hand */}
        <CardHand />
      </footer>

      {/* Shot result modal */}
      <AnimatePresence>
        {shotResult && (
          <ShotResultModal
            result={shotResult}
            onDismiss={handleResultDismiss}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
