import type { StatusEffect } from '../../game/types';
import { cn } from '../../utils/cn';

interface StatusEffectsProps {
  statuses: StatusEffect[];
  safePlay: number;
}

const statusInfo: Record<string, { label: string; color: string; icon: string }> = {
  focused: { label: 'Focused', color: 'bg-blue-500', icon: '🎯' },
  dialed_in: { label: 'Dialed In', color: 'bg-green-500', icon: '🔥' },
  hot_putter: { label: 'Hot Putter', color: 'bg-orange-500', icon: '🏒' },
  rattled: { label: 'Rattled', color: 'bg-red-500', icon: '😰' },
  nervous: { label: 'Nervous', color: 'bg-yellow-600', icon: '😬' },
  in_your_head: { label: 'In Your Head', color: 'bg-purple-500', icon: '🧠' },
};

export function StatusEffects({ statuses, safePlay }: StatusEffectsProps) {
  if (statuses.length === 0 && safePlay === 0) return null;

  return (
    <div className="bg-black/30 rounded-lg p-3 text-white">
      <div className="font-semibold mb-2 text-sm">Status</div>
      <div className="flex flex-wrap gap-2">
        {safePlay > 0 && (
          <div className="flex items-center gap-1 bg-cyan-500 px-2 py-1 rounded text-sm">
            <span>🛡️</span>
            <span>Safe Play x{safePlay}</span>
          </div>
        )}
        {statuses.map((status, i) => {
          const info = statusInfo[status.type];
          if (!info) return null;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-sm',
                info.color
              )}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
