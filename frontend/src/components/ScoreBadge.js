import { cn } from '@/lib/utils';

export function ScoreBadge({ score, size = 'sm' }) {
  const getScoreColor = (s) => {
    if (s >= 7) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (s >= 4) return 'text-amber-900 bg-amber-50 border-amber-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  const getBarColor = (s) => {
    if (s >= 7) return 'bg-emerald-500';
    if (s >= 4) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-md border font-semibold tabular-nums',
          getScoreColor(score),
          size === 'sm' ? 'px-2 py-0.5 text-xs min-w-[32px]' : 'px-3 py-1 text-sm min-w-[40px]'
        )}
        data-testid="score-badge"
      >
        {score}/10
      </span>
      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full score-bar-fill', getBarColor(score))}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ breakdown = {} }) {
  const labels = {
    icp_match: { label: 'ICP Match (Industry, Country, Size)', max: 3 },
    decision_maker: { label: 'Decision Maker Role', max: 2 },
    growth_signals: { label: 'Growth Signals', max: 2 },
    email_available: { label: 'Direct Email', max: 1 },
    completeness: { label: 'Profile Completeness', max: 1 },
    kimatch_bonus: { label: 'KiMatch regional bonus', max: 1 },
  };

  return (
    <div className="space-y-2" data-testid="score-breakdown">
      {Object.entries(labels).map(([key, { label, max }]) => {
        const value = breakdown[key] || 0;
        return (
          <div key={key} className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn(
              'font-medium tabular-nums',
              value > 0 ? 'text-foreground' : 'text-muted-foreground/50'
            )}>
              +{value}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
