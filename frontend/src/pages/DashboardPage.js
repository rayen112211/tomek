import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import FilterBar from '@/components/FilterBar';
import LeadDetailsSheet from '@/components/LeadDetailsSheet';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ICPBadge, EmailStatusBadge, GrowthSignalBadges, PipelineStatusBadge, TypedSignalBadge } from '@/components/StatusBadges';
import { getLeads, getLeadStats, exportLeads, seedData, bulkDeleteLeads, updateLeadStatus } from '@/lib/api';
import {
  Download,
  Upload,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Database,
  Loader2,
  Users,
  Target,
  AlertCircle,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  PhoneCall,
  XCircle,
  Sparkles,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 300;

const PIPELINE_STATUSES = [
  'New',
  'Reviewing',
  'Approved for Outreach',
  'Contacted',
  'Converted',
  'Rejected',
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [filterOptions, setFilterOptions] = useState({});
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    icp_fit: '',
    pipeline_status: '',
    min_score: 0,
    country: '',
    industry: '',
    email_status: '',
    incomplete_only: false,
  });
  const [sortField, setSortField] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize,
        sort_field: sortField,
        sort_order: sortOrder,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.icp_fit) params.icp_fit = filters.icp_fit;
      if (filters.pipeline_status) params.pipeline_status = filters.pipeline_status;
      if (filters.min_score > 0) params.min_score = filters.min_score;
      if (filters.country) params.country = filters.country;
      if (filters.industry) params.industry = filters.industry;
      if (filters.email_status) params.email_status = filters.email_status;
      if (filters.incomplete_only) params.incomplete_only = true;

      const data = await getLeads(params);
      setLeads(data.leads || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setFilterOptions(data.filter_options || {});
    } catch (err) {
      toast.error('Failed to load leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortOrder, debouncedSearch, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getLeadStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? new Set(leads.map((l) => l.id)) : new Set());
  };

  const handleSelectRow = (id, checked) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id); else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleRowClick = (lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const handleLeadUpdated = (updated) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
    );
    fetchStats();
  };

  const handleQuickStatus = async (e, leadId, status) => {
    e.stopPropagation();
    setUpdatingStatus(leadId);
    try {
      const updated = await updateLeadStatus(leadId, status);
      handleLeadUpdated(updated);
      toast.success(`Marked as: ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : null;
      await exportLeads(ids, filters);
      toast.success(`Exported ${ids ? ids.length : total} leads`);
    } catch (err) {
      toast.error('Failed to export leads');
    } finally {
      setExporting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteLeads(Array.from(selectedIds));
      toast.success(`Deleted ${selectedIds.size} leads`);
      setSelectedIds(new Set());
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete leads');
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedData();
      toast.success(result.message);
      fetchLeads();
      fetchStats();
    } catch (err) {
      toast.error('Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const activeFilterCount = [
    filters.icp_fit,
    filters.pipeline_status,
    filters.min_score > 0,
    filters.country,
    filters.industry,
    filters.email_status,
    filters.incomplete_only,
  ].filter(Boolean).length;

  const SortableHeader = ({ field, children }) => {
    const isActive = sortField === field;
    return (
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => handleSort(field)}
      >
        {children}
        {isActive ? (
          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Building2} label="Total Companies" value={stats.total} />
          <StatCard icon={Target} label="ICP Fit" value={stats.fit} color="text-emerald-600" />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={(stats.pipeline || {})['Approved for Outreach'] || 0}
            color="text-emerald-600"
          />
          <StatCard
            icon={PhoneCall}
            label="Contacted"
            value={(stats.pipeline || {})['Contacted'] || 0}
            color="text-purple-600"
          />
          <StatCard
            icon={Sparkles}
            label="Converted"
            value={(stats.pipeline || {})['Converted'] || 0}
            color="text-teal-600"
          />
          <StatCard icon={BarChart3} label="Avg Score" value={stats.avg_score} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          filterOptions={filterOptions}
          activeFilterCount={activeFilterCount}
        />

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-indigo-50 rounded-md border border-indigo-200">
              <span className="text-sm font-medium text-indigo-800">{selectedIds.size} selected</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-3 h-3 mr-1" />Delete
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={handleExport}
            disabled={exporting || total === 0}
            data-testid="bulk-export-csv-button"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export
          </Button>

          <Button size="sm" className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/import')}>
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>

          {total === 0 && !loading && (
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={handleSeedData} disabled={seeding}>
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Load KiMatch Sample Data
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="overflow-auto">
          <Table data-testid="lead-table">
            <TableHeader>
              <TableRow className="bg-slate-50/70" data-testid="lead-table-header">
                <TableHead className="w-[40px] py-2 px-3">
                  <Checkbox
                    checked={leads.length > 0 && selectedIds.size === leads.length}
                    onCheckedChange={handleSelectAll}
                    data-testid="bulk-select-all-checkbox"
                  />
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <SortableHeader field="score">Score</SortableHeader>
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <SortableHeader field="company_name">Company</SortableHeader>
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Decision Maker
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Top Signal
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <SortableHeader field="pipeline_status">Status</SortableHeader>
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Why KiMatch
                </TableHead>
                <TableHead className="py-2 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j} className="py-2 px-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building2 className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-base font-medium">No leads found</p>
                      <p className="text-sm mt-1">
                        {activeFilterCount > 0
                          ? 'Try adjusting your filters'
                          : 'Import a CSV or load KiMatch sample data to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const topSignal = lead.typed_signals?.[0];
                  const explanation = lead.ai_explanation || lead.why_this_lead || '';
                  const isUpdating = updatingStatus === lead.id;

                  return (
                    <TableRow
                      key={lead.id}
                      className={cn(
                        'cursor-pointer hover:bg-slate-50 transition-colors group',
                        isSelected && 'bg-indigo-50/60 ring-1 ring-indigo-200',
                        lead.pipeline_status === 'Converted' && 'bg-teal-50/30',
                        lead.pipeline_status === 'Rejected' && 'opacity-60'
                      )}
                      data-testid="lead-row"
                    >
                      {/* Checkbox */}
                      <TableCell className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(lead.id, checked)}
                        />
                      </TableCell>

                      {/* Score */}
                      <TableCell className="py-2 px-3" onClick={() => handleRowClick(lead)}>
                        <div className="flex items-center gap-2">
                          <ScoreBadge score={lead.score || 0} />
                          {lead.score >= 7 && (!lead.email || lead.email_status === 'missing') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center p-1 bg-red-50 text-red-600 rounded cursor-help">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">No contact email</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>

                      {/* Company */}
                      <TableCell className="py-2 px-3 cursor-pointer" onClick={() => handleRowClick(lead)}>
                        <div>
                          <div className="font-semibold text-sm max-w-[160px] truncate text-slate-800">
                            {lead.company_name || 'Unnamed'}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[160px]">
                            {lead.country}{lead.industry ? ` · ${lead.industry}` : ''}
                          </div>
                        </div>
                      </TableCell>

                      {/* Decision Maker */}
                      <TableCell className="py-2 px-3" onClick={() => handleRowClick(lead)}>
                        <div className="max-w-[150px]">
                          <div className="text-sm font-medium truncate text-slate-700">
                            {lead.decision_maker_name || '—'}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {lead.decision_maker_role || ''}
                          </div>
                        </div>
                      </TableCell>

                      {/* Top Signal */}
                      <TableCell className="py-2 px-3" onClick={() => handleRowClick(lead)}>
                        {topSignal ? (
                          <TypedSignalBadge signal={topSignal} />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>

                      {/* Pipeline Status */}
                      <TableCell className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="focus:outline-none">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                              ) : (
                                <PipelineStatusBadge status={lead.pipeline_status} />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-52">
                            {PIPELINE_STATUSES.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={(e) => handleQuickStatus(e, lead.id, s)}
                                className={cn('text-sm', lead.pipeline_status === s && 'font-semibold')}
                              >
                                <PipelineStatusBadge status={s} />
                                {lead.pipeline_status === s && (
                                  <span className="ml-auto text-xs text-muted-foreground">current</span>
                                )}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      {/* AI Explanation */}
                      <TableCell className="py-2 px-3 max-w-[280px]" onClick={() => handleRowClick(lead)}>
                        {explanation ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <p className="text-xs text-slate-500 line-clamp-2 text-left leading-relaxed">
                                  {explanation}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[320px] text-sm leading-relaxed" side="left">
                                {explanation}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                                  onClick={(e) => handleQuickStatus(e, lead.id, 'Approved for Outreach')}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approve for Outreach</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                                  onClick={(e) => handleQuickStatus(e, lead.id, 'Rejected')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reject</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} companies
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Lead Details Sheet */}
      <LeadDetailsSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="px-4 py-3 border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-50">
          <Icon className={cn('w-4 h-4', color || 'text-slate-500')} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-slate-800">{value ?? '—'}</p>
        </div>
      </div>
    </Card>
  );
}
