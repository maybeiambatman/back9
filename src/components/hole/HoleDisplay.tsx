import type { HoleState } from '../../game/types';

interface HoleDisplayProps {
  hole: HoleState;
}

export function HoleDisplay({ hole }: HoleDisplayProps) {
  const { holeData, distanceRemaining, currentLie, currentPhase, puttDistance } = hole;

  // ASCII art style hole visualization
  const renderHoleLayout = () => {
    if (currentPhase === 'putt') {
      return (
        <div className="text-center font-mono text-green-300">
          <div className="text-2xl mb-2">🏌️ → ⛳</div>
          <div className="text-lg">{Math.round(puttDistance)} ft to hole</div>
        </div>
      );
    }

    const progressPercent = 1 - (distanceRemaining / holeData.distance);
    const ballPosition = Math.floor(progressPercent * 20);

    return (
      <div className="font-mono text-sm">
        {/* Hole visualization */}
        <div className="flex items-center gap-1 text-lg">
          <span>🏌️</span>
          <div className="flex-1 flex">
            {Array.from({ length: 20 }).map((_, i) => {
              if (i === ballPosition) return <span key={i}>⚪</span>;
              if (i === 19) return <span key={i}>⛳</span>;
              if (i < 3) return <span key={i} className="text-green-500">▫</span>;
              if (holeData.hasFairwayBunker && i === 8) return <span key={i} className="text-yellow-400">▪</span>;
              if (holeData.hasWaterByGreen && i > 16) return <span key={i} className="text-blue-400">~</span>;
              return <span key={i} className="text-green-600">─</span>;
            })}
          </div>
        </div>

        {/* Hazard legend */}
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          {holeData.hasWaterOffTee && <span>💧 Water off tee</span>}
          {holeData.hasFairwayBunker && <span>🏖️ Fairway bunker</span>}
          {holeData.hasGreensideBunker && <span>🏖️ Greenside bunker</span>}
          {holeData.hasWaterByGreen && <span>💧 Water by green</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black/20 rounded-xl p-6 min-w-[400px]">
      {renderHoleLayout()}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-gray-300">
          <span className="text-gray-500">Lie: </span>
          <span className="capitalize">{currentLie.replace('_', ' ')}</span>
        </div>
        <div className="text-gray-300">
          <span className="text-gray-500">Pin: </span>
          <span className="capitalize">{holeData.pinPosition.replace('_', ' ')}</span>
        </div>
        <div className="text-gray-300">
          <span className="text-gray-500">Green: </span>
          <span className="capitalize">{holeData.greenSpeed}</span>
        </div>
        <div className="text-gray-300">
          <span className="text-gray-500">Difficulty: </span>
          {'⭐'.repeat(holeData.difficulty)}
        </div>
      </div>
    </div>
  );
}
