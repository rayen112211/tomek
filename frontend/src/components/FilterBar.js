import { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function FilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  filterOptions = {},
  activeFilterCount = 0,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleSearchChange = useCallback(
    (e) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const cleared = {
      icp_fit: 'Fit,Partial Fit',
      pipeline_status: '',
      min_score: 0,
      country: '',
      industry: '',
      email_status: '',
      incomplete_only: false,
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setFiltersOpen(false);
  };

  const updateLocalFilter = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search companies, contacts, emails..."
          value={search}
          onChange={handleSearchChange}
          className="pl-9 h-9 bg-white"
          data-testid="lead-search-input"
        />
      </div>

      {/* Filters Popover */}
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            data-testid="lead-filters-button"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end" data-testid="filters-popover">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filters</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                Clear all
              </Button>
            </div>
            <Separator />

            {/* Pipeline Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Pipeline Status</Label>
              <Select
                value={localFilters.pipeline_status || 'all'}
                onValueChange={(v) => updateLocalFilter('pipeline_status', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Reviewing">Reviewing</SelectItem>
                  <SelectItem value="Approved for Outreach">Approved for Outreach</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ICP Fit */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">ICP Fit</Label>
              <Select
                value={localFilters.icp_fit || 'all'}
                onValueChange={(v) => updateLocalFilter('icp_fit', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Fit,Partial Fit">Fit & Partial Fit</SelectItem>
                  <SelectItem value="Fit">Fit</SelectItem>
                  <SelectItem value="Partial Fit">Partial Fit</SelectItem>
                  <SelectItem value="Not Fit">Not Fit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Score */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Min Score: {localFilters.min_score || 0}
              </Label>
              <Slider
                value={[localFilters.min_score || 0]}
                onValueChange={([v]) => updateLocalFilter('min_score', v)}
                max={10}
                step={1}
                className="py-1"
                data-testid="filter-min-score-slider"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select
                value={localFilters.country || 'all'}
                onValueChange={(v) => updateLocalFilter('country', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {(filterOptions.countries || []).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Industry</Label>
              <Select
                value={localFilters.industry || 'all'}
                onValueChange={(v) => updateLocalFilter('industry', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {(filterOptions.industries || []).map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Email Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email Status</Label>
              <Select
                value={localFilters.email_status || 'all'}
                onValueChange={(v) => updateLocalFilter('email_status', v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Incomplete Only */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Incomplete Only</Label>
              <Switch
                checked={localFilters.incomplete_only || false}
                onCheckedChange={(v) => updateLocalFilter('incomplete_only', v)}
              />
            </div>

            <Separator />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-8" onClick={applyFilters}>
                Apply
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setFiltersOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.pipeline_status && (
            <Badge variant="secondary" className="gap-1 text-xs h-6 bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filters.pipeline_status}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, pipeline_status: '' })} />
            </Badge>
          )}
          {filters.icp_fit && (
            <Badge variant="secondary" className="gap-1 text-xs h-6 bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filters.icp_fit === 'Fit,Partial Fit' ? 'Showing: ICP Fit only' : filters.icp_fit}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, icp_fit: '' })} />
            </Badge>
          )}
          {filters.min_score > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs h-6">
              Score ≥ {filters.min_score}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, min_score: 0 })} />
            </Badge>
          )}
          {filters.country && (
            <Badge variant="secondary" className="gap-1 text-xs h-6">
              {filters.country}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, country: '' })} />
            </Badge>
          )}
          {filters.industry && (
            <Badge variant="secondary" className="gap-1 text-xs h-6">
              {filters.industry}
              <X className="w-3 h-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, industry: '' })} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
