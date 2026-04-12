import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScoreBadge } from '@/components/ScoreBadge';
import { TypedSignalBadge } from '@/components/StatusBadges';
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Layers,
  BarChart3,
  Users,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGNAL_META = {
  risk: { label: 'Founder Risk', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
  scaling: { label: 'Scaling', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  structure: { label: 'Structure Need', icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  growth: { label: 'Growth', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  expansion: { label: 'Expansion', icon: Users, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
};

export default function ImportBriefing({ importResult, batchLeads, onDone, onImportMore }) {
  const navigate = useNavigate();

  if (!importResult || !batchLeads) return null;

  const totalProcessed = importResult.total_processed || 0;
  const created = importResult.created || 0;
  const icpFitCount = batchLeads.filter((l) => l.icp_fit === 'Fit').length;
  const partialFitCount = batchLeads.filter((l) => l.icp_fit === 'Partial Fit').length;
  const rejectedCount = batchLeads.filter((l) => l.icp_fit === 'Not Fit').length;

  // Signal breakdown
  const signalBreakdown = {};
  batchLeads.forEach((lead) => {
    (lead.typed_signals || []).forEach((sig) => {
      const t = sig.type || 'other';
      signalBreakdown[t] = (signalBreakdown[t] || 0) + 1;
    });
  });

  // Top 3 leads by score
  const top3 = [...batchLeads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);

  const riskCount = signalBreakdown['risk'] || 0;
  const scalingCount = signalBreakdown['scaling'] || 0;
  
  let smartHeadline = `${icpFitCount} companies matched QMatch's ICP and are ready for review.`;
  if (riskCount > 0) {
    smartHeadline = `${riskCount} ${riskCount === 1 ? 'company shows' : 'companies show'} Owner's Trap signals — founder carrying full operational load without a management layer.`;
  } else if (scalingCount > 0) {
    smartHeadline = `${scalingCount} companies are at a scaling inflection point.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[80vh] pb-16"
    >
      {/* Header */}
      <div className="text-center mb-10 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI Intelligence Briefing
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Import Complete — Here's What We Found
        </h1>
        <p className="text-slate-500 text-base max-w-xl mx-auto mb-6">
          {created} companies processed. QMatch's signal engine has analyzed each one and surfaced the highest-priority targets.
        </p>
        <p className="text-lg font-medium text-indigo-700">
          {smartHeadline}
        </p>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard value={totalProcessed} label="Total Processed" color="text-slate-800" />
        <StatCard value={icpFitCount} label="ICP Fit" color="text-emerald-600" />
        <StatCard value={partialFitCount} label="Partial Fit" color="text-amber-600" />
        <StatCard value={rejectedCount} label="Rejected" color="text-rose-500" />
      </div>

      {/* Signal Breakdown */}
      {Object.keys(signalBreakdown).length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Signals Detected Across Batch
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(signalBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const meta = SIGNAL_META[type] || { label: type, icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' };
                const Icon = meta.icon;
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium',
                      meta.bg,
                      meta.color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{meta.label}</span>
                    <span className="ml-1 font-bold">{count}</span>
                    <span className="font-normal opacity-70">{count === 1 ? 'company' : 'companies'}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <Separator className="mb-8" />

      {/* Top 3 lead cards */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Top {top3.length} Priority Targets
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((lead, i) => {
            const explanation = lead.ai_explanation || lead.why_this_lead || '';
            const [body, suggestedAngle] = explanation.includes('Suggested angle:')
              ? [
                  explanation.split('Suggested angle:')[0].trim(),
                  'Suggested angle:' + explanation.split('Suggested angle:')[1],
                ]
              : [explanation, ''];

            return (
              <motion.div
                key={lead.id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Badge strip */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                  <span className="text-xs font-bold text-slate-400 mr-1">#{i + 1}</span>
                  <ScoreBadge score={lead.score} size="sm" />
                  <span className="ml-auto text-xs text-slate-400">
                    {lead.country} · {lead.industry}
                  </span>
                </div>

                <div className="flex-1 px-4 py-4 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900 text-base leading-tight">
                      {lead.company_name}
                    </p>
                    {lead.decision_maker_role && (
                      <p className="text-xs text-slate-500 mt-0.5">{lead.decision_maker_role}</p>
                    )}
                  </div>

                  {lead.typed_signals?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {lead.typed_signals.slice(0, 2).map((s, j) => (
                        <TypedSignalBadge key={j} signal={s} />
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {body}
                  </p>

                  {suggestedAngle && (
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                      <p className="text-xs font-semibold text-indigo-700 mb-0.5">Suggested angle</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">
                        {suggestedAngle.replace('Suggested angle:', '').trim()}
                      </p>
                    </div>
                  )}

                  {lead.decision_maker_linkedin_url && (
                    <a
                      href={lead.decision_maker_linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mt-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on LinkedIn &rarr;
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={onImportMore} className="gap-2">
          Import Another File
        </Button>
        <Button
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
      <p className={cn('text-3xl font-bold tabular-nums mb-1', color)}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
