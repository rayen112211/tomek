import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScoreBadge, ScoreBreakdown } from '@/components/ScoreBadge';
import { ICPBadge, EmailStatusBadge, PipelineStatusBadge, TypedSignalBadge } from '@/components/StatusBadges';
import { updateLead, generateExplanation } from '@/lib/api';
import {
  Save,
  Mail,
  ExternalLink,
  Building2,
  Globe,
  User,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw,
  Linkedin,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPELINE_STATUSES = [
  'New',
  'Reviewing',
  'Approved for Outreach',
  'Contacted',
  'Converted',
  'Rejected',
];

export default function LeadDetailsSheet({ lead, open, onOpenChange, onLeadUpdated }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [generatingExplanation, setGeneratingExplanation] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    }
  }, [lead]);

  if (!lead) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fieldsToSend = {
        company_name: formData.company_name,
        website: formData.website,
        country: formData.country,
        industry: formData.industry,
        employee_range: formData.employee_range,
        linkedin_company_url: formData.linkedin_company_url,
        decision_maker_name: formData.decision_maker_name,
        decision_maker_role: formData.decision_maker_role,
        decision_maker_linkedin_url: formData.decision_maker_linkedin_url,
        email: formData.email,
        phone: formData.phone,
        email_status: formData.email_status,
        growth_signals: formData.growth_signals,
        notes: formData.notes,
        source: formData.source,
        pipeline_status: formData.pipeline_status,
      };
      const updated = await updateLead(lead.id, fieldsToSend);
      toast.success('Lead updated');
      onLeadUpdated?.(updated);
    } catch (err) {
      toast.error('Failed to update lead');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };


  const handleGenerateExplanation = async () => {
    setGeneratingExplanation(true);
    try {
      const result = await generateExplanation(lead.id);
      setFormData((prev) => ({ ...prev, ai_explanation: result.ai_explanation }));
      onLeadUpdated?.({ ...formData, ai_explanation: result.ai_explanation });
      toast.success('AI explanation regenerated');
    } catch (err) {
      toast.error('Failed to generate explanation');
    } finally {
      setGeneratingExplanation(false);
    }
  };

  const hasIncomplete = formData.incomplete_flags && formData.incomplete_flags.length > 0;
  const explanation = formData.ai_explanation || formData.why_this_lead || '';
  const typedSignals = formData.typed_signals || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[440px] sm:w-[540px] lg:w-[620px] p-0 flex flex-col"
        data-testid="lead-details-sheet"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border/60 bg-slate-50/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold text-slate-800 truncate">
                {formData.company_name || 'Lead Details'}
              </SheetTitle>
              {formData.website && (
                <a
                  href={formData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-0.5"
                >
                  <Globe className="w-3 h-3" />
                  {formData.website?.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 ml-3">
              <ICPBadge fit={formData.icp_fit} />
              <ScoreBadge score={formData.score || 0} size="md" />
            </div>
          </div>

          {/* Pipeline Status Selector */}
          <div className="mt-3">
            <Label className="text-xs text-slate-500 mb-1.5 block">Pipeline Status</Label>
            <Select
              value={formData.pipeline_status || 'New'}
              onValueChange={(v) => handleChange('pipeline_status', v)}
            >
              <SelectTrigger className="h-9 w-full border-slate-200 bg-white">
                <SelectValue>
                  <PipelineStatusBadge status={formData.pipeline_status || 'New'} size="sm" />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <PipelineStatusBadge status={s} size="sm" />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-5">

            {/* Incomplete Warning */}
            {hasIncomplete && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Incomplete Data</p>
                  <p className="text-amber-700 mt-0.5">{formData.incomplete_flags?.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Decision Maker Contact Card */}
            {(formData.decision_maker_name || formData.decision_maker_role || formData.email) && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  {/* Initials Avatar */}
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-indigo-700">
                      {formData.decision_maker_name
                        ? formData.decision_maker_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        : <User className="w-4 h-4 text-indigo-400" />}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {formData.decision_maker_name || '—'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {formData.decision_maker_role || 'Role unknown'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {/* Email */}
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {formData.email ? (
                      <a
                        href={`mailto:${formData.email}`}
                        className="text-xs text-indigo-600 hover:underline truncate"
                      >
                        {formData.email}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not available</span>
                    )}
                  </div>

                  {/* Phone */}
                  {formData.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a
                        href={`tel:${formData.phone}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        {formData.phone}
                      </a>
                    </div>
                  )}

                  {/* Decision Maker LinkedIn */}
                  {formData.decision_maker_linkedin_url && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a
                        href={formData.decision_maker_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        View on LinkedIn <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Company LinkedIn */}
                  {formData.linkedin_company_url && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a
                        href={formData.linkedin_company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Company page <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-indigo-800">Why KiMatch Should Target This Company</h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-1 text-indigo-600 hover:bg-indigo-100 px-2"
                  onClick={handleGenerateExplanation}
                  disabled={generatingExplanation}
                >
                  {generatingExplanation ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Regenerate
                </Button>
              </div>
              {(() => {
                // Split AI explanation from Suggested angle for cleaner display
                const parts = explanation.split(/Suggested angle:/i);
                const mainText = parts[0].trim();
                const angle = parts[1] ? parts[1].trim() : null;
                return (
                  <>
                    {mainText ? (
                      <p className="text-sm text-slate-700 leading-relaxed">{mainText}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No explanation yet — save the lead or click Regenerate.</p>
                    )}
                    {angle && (
                      <div className="mt-3 pt-3 border-t border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Suggested Opening Line</p>
                        <p className="text-sm text-slate-700 leading-relaxed italic">"{angle}"</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Growth Signals */}
            {typedSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-700">Growth Signals</h3>
                <div className="flex flex-wrap gap-1.5">
                  {typedSignals.map((signal, i) => (
                    <TypedSignalBadge key={i} signal={signal} />
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-slate-700">Score Breakdown</h3>
              <ScoreBreakdown breakdown={formData.score_breakdown} />
            </div>

            <Separator />

            {/* Company Information */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-slate-700">
                <Building2 className="w-4 h-4" /> Company Information
              </h3>
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <Input
                    value={formData.company_name || ''}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="mt-1 h-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Country</Label>
                    <Input
                      value={formData.country || ''}
                      onChange={(e) => handleChange('country', e.target.value)}
                      className="mt-1 h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Industry</Label>
                    <Input
                      value={formData.industry || ''}
                      onChange={(e) => handleChange('industry', e.target.value)}
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Employee Range</Label>
                    <Select
                      value={formData.employee_range || ''}
                      onValueChange={(v) => handleChange('employee_range', v)}
                    >
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {['1-10', '11-50', '20-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <Input
                      value={formData.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">LinkedIn Company URL</Label>
                  <Input
                    value={formData.linkedin_company_url || ''}
                    onChange={(e) => handleChange('linkedin_company_url', e.target.value)}
                    className="mt-1 h-8"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Decision Maker */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4" /> Decision Maker
              </h3>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      value={formData.decision_maker_name || ''}
                      onChange={(e) => handleChange('decision_maker_name', e.target.value)}
                      className="mt-1 h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role / Title</Label>
                    <Input
                      value={formData.decision_maker_role || ''}
                      onChange={(e) => handleChange('decision_maker_role', e.target.value)}
                      className="mt-1 h-8"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">LinkedIn Profile</Label>
                  <Input
                    value={formData.decision_maker_linkedin_url || ''}
                    onChange={(e) => handleChange('decision_maker_linkedin_url', e.target.value)}
                    className="mt-1 h-8"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Email */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4" /> Email & Contact
              </h3>
              <div className="grid gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="h-8"
                    />
                    <EmailStatusBadge status={formData.email_status} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="mt-1 h-8"
                    placeholder="+48 123 456 789"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400 italic">Contact details sourced from Apollo import.</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="mt-1 min-h-[100px]"
                placeholder="Add notes about this company or contact..."
                data-testid="lead-details-notes-textarea"
              />
            </div>

            {/* Source */}
            <div>
              <Label className="text-xs text-muted-foreground">Source</Label>
              <Input
                value={formData.source || ''}
                onChange={(e) => handleChange('source', e.target.value)}
                className="mt-1 h-8"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Save Footer */}
        <div className="border-t border-border/60 px-6 py-3 bg-white">
          <Button
            className="w-full h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSave}
            disabled={saving}
            data-testid="lead-details-save-button"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
