import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getICPSettings, updateICPSettings, recalculateLeads } from '@/lib/api';
import {
  Save,
  RotateCw,
  MapPin,
  Factory,
  Users,
  Briefcase,
  Ban,
  Target,
  Loader2,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [newItem, setNewItem] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getICPSettings();
      setSettings(data);
    } catch (err) {
      toast.error('Failed to load ICP settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateICPSettings(settings);
      toast.success('ICP settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await recalculateLeads();
      toast.success(result.message);
    } catch (err) {
      toast.error('Failed to recalculate leads');
    } finally {
      setRecalculating(false);
    }
  };

  const addToList = (field) => {
    const value = (newItem[field] || '').trim();
    if (!value) return;
    if (settings[field]?.includes(value)) {
      toast.error('Already exists');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value],
    }));
    setNewItem((prev) => ({ ...prev, [field]: '' }));
  };

  const removeFromList = (field, index) => {
    setSettings((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-[1000px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-muted-foreground">Failed to load settings</p>
        <Button variant="outline" onClick={fetchSettings} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[1000px] mx-auto space-y-6" data-testid="icp-settings-panel">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">ICP Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your Ideal Customer Profile criteria. Changes affect lead scoring and ICP fit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => setShowRecalculateDialog(true)}
            disabled={recalculating}
          >
            {recalculating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCw className="w-4 h-4" />
            )}
            Recalculate All Leads
          </Button>
          <Button
            size="sm"
            className="h-9 gap-2"
            onClick={handleSave}
            disabled={saving}
            data-testid="icp-settings-save-button"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target Countries */}
        <TagListCard
          icon={MapPin}
          title="Target Countries"
          description="Countries that match your ICP"
          items={settings.target_countries || []}
          newValue={newItem.target_countries || ''}
          onNewValueChange={(v) => setNewItem((p) => ({ ...p, target_countries: v }))}
          onAdd={() => addToList('target_countries')}
          onRemove={(i) => removeFromList('target_countries', i)}
          placeholder="Add country..."
        />

        {/* Target Industries */}
        <TagListCard
          icon={Factory}
          title="Target Industries"
          description="Industries you want to target"
          items={settings.target_industries || []}
          newValue={newItem.target_industries || ''}
          onNewValueChange={(v) => setNewItem((p) => ({ ...p, target_industries: v }))}
          onAdd={() => addToList('target_industries')}
          onRemove={(i) => removeFromList('target_industries', i)}
          placeholder="Add industry..."
        />

        {/* Target Decision Maker Roles */}
        <TagListCard
          icon={Briefcase}
          title="Target Decision Maker Roles"
          description="Key decision maker titles to prioritize"
          items={settings.target_decision_maker_roles || []}
          newValue={newItem.target_decision_maker_roles || ''}
          onNewValueChange={(v) => setNewItem((p) => ({ ...p, target_decision_maker_roles: v }))}
          onAdd={() => addToList('target_decision_maker_roles')}
          onRemove={(i) => removeFromList('target_decision_maker_roles', i)}
          placeholder="Add role..."
        />

        {/* Excluded Industries */}
        <TagListCard
          icon={Ban}
          title="Excluded Industries"
          description="Industries to automatically reject"
          items={settings.excluded_industries || []}
          newValue={newItem.excluded_industries || ''}
          onNewValueChange={(v) => setNewItem((p) => ({ ...p, excluded_industries: v }))}
          onAdd={() => addToList('excluded_industries')}
          onRemove={(i) => removeFromList('excluded_industries', i)}
          placeholder="Add industry..."
          variant="destructive"
        />
      </div>

      {/* Company Size & Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Company Size & Scoring</CardTitle>
          </div>
          <CardDescription>
            Define the target employee range and minimum acceptable lead score
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm">Minimum Employees</Label>
              <Input
                type="number"
                value={settings.target_employee_min || 0}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    target_employee_min: parseInt(e.target.value) || 0,
                  }))
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Maximum Employees</Label>
              <Input
                type="number"
                value={settings.target_employee_max || 0}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    target_employee_max: parseInt(e.target.value) || 0,
                  }))
                }
                className="mt-1.5"
              />
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Minimum Acceptable Lead Score</Label>
              <span className="text-sm font-semibold tabular-nums">
                {settings.minimum_acceptable_score || 0} / 10
              </span>
            </div>
            <Slider
              value={[settings.minimum_acceptable_score || 0]}
              onValueChange={([v]) =>
                setSettings((prev) => ({ ...prev, minimum_acceptable_score: v }))
              }
              max={10}
              step={1}
              className="py-2"
              data-testid="icp-settings-min-score-slider"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leads below this score will still be saved but flagged as low priority.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recalculate Confirm Dialog */}
      <AlertDialog open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalculate All Leads</AlertDialogTitle>
            <AlertDialogDescription>
              This will recalculate scores and regenerate explanations for all leads. This cannot be undone. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowRecalculateDialog(false);
              handleRecalculate();
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TagListCard({
  icon: Icon,
  title,
  description,
  items,
  newValue,
  onNewValueChange,
  onAdd,
  onRemove,
  placeholder,
  variant = 'default',
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-3">
          <Input
            value={newValue}
            onChange={(e) => onNewValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-8"
          />
          <Button size="sm" variant="outline" className="h-8 px-3" onClick={onAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[40px]">
          {items.map((item, i) => (
            <Badge
              key={i}
              variant={variant === 'destructive' ? 'destructive' : 'secondary'}
              className={cn(
                'gap-1 pr-1',
                variant === 'destructive'
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  : 'hover:bg-secondary'
              )}
            >
              {item}
              <button
                onClick={() => onRemove(i)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No items added yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
