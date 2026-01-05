import { cn } from '../../utils/cn';

interface ConfidenceBarProps {
  current: number;
  max: number;
}

export function ConfidenceBar({ current, max }: ConfidenceBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-400 font-bold text-sm">Confidence:</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 border-yellow-400',
              i < current ? 'bg-yellow-400' : 'bg-transparent'
            )}
          />
        ))}
      </div>
      <span className="text-white text-sm">({current}/{max})</span>
    </div>
  );
}
