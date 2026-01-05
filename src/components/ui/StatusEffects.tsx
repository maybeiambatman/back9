import type { StatusEffect } from '../../game/types';
import { cn } from '../../utils/cn';

interface StatusEffectsProps {
  statuses: StatusEffect[];
  safePlay: number;
}

const statusInfo: Record<string, { label: string; color: string; icon: string; description: string }> = {
  focused: {
    label: 'Focused',
    color: 'bg-blue-500',
    icon: '🎯',
    description: '+20% accuracy on your next shot'
  },
  dialed_in: {
    label: 'Dialed In',
    color: 'bg-green-500',
    icon: '🔥',
    description: '+10% accuracy on all shots this hole'
  },
  hot_putter: {
    label: 'Hot Putter',
    color: 'bg-orange-500',
    icon: '🏒',
    description: '+15% putt make chance this hole'
  },
  rattled: {
    label: 'Rattled',
    color: 'bg-red-500',
    icon: '😰',
    description: '-15% accuracy on all shots this hole'
  },
  nervous: {
    label: 'Nervous',
    color: 'bg-yellow-600',
    icon: '😬',
    description: '-1 max confidence this hole'
  },
  in_your_head: {
    label: 'In Your Head',
    color: 'bg-purple-500',
    icon: '🧠',
    description: 'Discard 1 card at the start of each phase'
  },
};

const safePlayDescription = 'Reduces penalty strokes from bad outcomes. Each stack prevents 1 penalty stroke.';

export function StatusEffects({ statuses, safePlay }: StatusEffectsProps) {
  if (statuses.length === 0 && safePlay === 0) return null;

  return (
    <div className="bg-black/30 rounded-lg p-3 text-white">
      <div className="font-semibold mb-2 text-sm">Status</div>
      <div className="flex flex-wrap gap-2">
        {safePlay > 0 && (
          <div
            className="flex items-center gap-1 bg-cyan-500 px-2 py-1 rounded text-sm cursor-help relative group"
            title={safePlayDescription}
          >
            <span>🛡️</span>
            <span>Safe Play x{safePlay}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {safePlayDescription}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
            </div>
          </div>
        )}
        {statuses.map((status, i) => {
          const info = statusInfo[status.type];
          if (!info) return null;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-sm cursor-help relative group',
                info.color
              )}
              title={info.description}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {info.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
