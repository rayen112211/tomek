import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ICPBadge({ fit, size = 'sm' }) {
  const config = {
    Fit: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    'Partial Fit': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
    'Not Fit': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50',
  };

  // xs size: just a small colored dot, no text — for inline table use
  if (size === 'xs') {
    const dotColor = {
      Fit: 'bg-emerald-500',
      'Partial Fit': 'bg-amber-400',
      'Not Fit': 'bg-rose-400',
    }[fit] || 'bg-rose-400';
    return (
      <span
        className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', dotColor)}
        title={fit || 'Not Fit'}
      />
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium px-2 py-0.5 whitespace-nowrap', config[fit] || config['Not Fit'])}
    >
      {fit || 'Not Fit'}
    </Badge>
  );
}

export function EmailStatusBadge({ status }) {
  const config = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unverified: 'bg-slate-50 text-slate-600 border-slate-200',
    missing: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  const labels = {
    verified: 'Verified',
    unverified: 'Unverified',
    missing: 'Missing',
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs px-2 py-0.5', config[status] || config['missing'])}
    >
      {labels[status] || 'Unknown'}
    </Badge>
  );
}

export function GrowthSignalBadges({ signals, maxShow = 3 }) {
  if (!signals || signals.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const shown = signals.slice(0, maxShow);
  const rest = signals.length - maxShow;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((signal, i) => (
        <Badge
          key={i}
          variant="secondary"
          className="text-xs px-1.5 py-0 bg-indigo-50 text-indigo-700 border border-indigo-100"
        >
          {signal}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0 text-muted-foreground">
          +{rest}
        </Badge>
      )}
    </div>
  );
}

// Pipeline status badge — the core new component for QMatch
export function PipelineStatusBadge({ status, size = 'sm' }) {
  const config = {
    'New': {
      className: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    },
    'Reviewing': {
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    'Approved for Outreach': {
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    'Contacted': {
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
    },
    'Converted': {
      className: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    'Rejected': {
      className: 'bg-rose-50 text-rose-600 border-rose-200',
      dot: 'bg-rose-400',
    },
  };

  const cfg = config[status] || config['New'];

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        cfg.className
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', cfg.dot)} />
      {status || 'New'}
    </Badge>
  );
}

// Typed signal badge (scaling / structure / risk / growth / expansion / leadership)
export function TypedSignalBadge({ signal }) {
  const typeConfig = {
    scaling: { className: 'bg-blue-50 text-blue-700 border-blue-100', prefix: '↑' },
    structure: { className: 'bg-amber-50 text-amber-700 border-amber-100', prefix: '⚙' },
    risk: { className: 'bg-rose-50 text-rose-700 border-rose-100', prefix: '⚠' },
    growth: { className: 'bg-emerald-50 text-emerald-700 border-emerald-100', prefix: '🚀' },
    expansion: { className: 'bg-indigo-50 text-indigo-700 border-indigo-100', prefix: '🌐' },
    leadership: { className: 'bg-purple-50 text-purple-700 border-purple-100', prefix: '👤' },
    ecom: { className: 'bg-orange-50 text-orange-700 border-orange-100', prefix: '🛒' },
  };

  const cfg = typeConfig[signal?.type] || { className: 'bg-slate-50 text-slate-600 border-slate-200', prefix: '•' };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs px-1.5 py-0.5 gap-1', cfg.className)}
    >
      <span>{cfg.prefix}</span>
      {signal?.label}
    </Badge>
  );
}

// Target Group badge — maps to the 3 QMatch ABM groups from the spec
export function TargetGroupBadge({ group, size = 'sm' }) {
  const config = {
    'Group 1': {
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: '🚀 Rapid Growth',
      dot: 'bg-emerald-500',
    },
    'Group 2': {
      className: 'bg-blue-50 text-blue-800 border-blue-200',
      label: '🔄 Transformation',
      dot: 'bg-blue-500',
    },
    'Group 3': {
      className: 'bg-orange-50 text-orange-800 border-orange-200',
      label: '📉 Declining',
      dot: 'bg-orange-400',
    },
  };

  if (!group || !config[group]) {
    return null;
  }

  const cfg = config[group];

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium whitespace-nowrap',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        cfg.className
      )}
    >
      {cfg.label}
    </Badge>
  );
}

