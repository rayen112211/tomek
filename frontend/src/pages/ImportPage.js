import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import ImportBriefing from '@/components/ImportBriefing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { previewCSV, commitImport, getLeads } from '@/lib/api';
import {
  Upload,
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERNAL_FIELDS = [
  { value: 'company_name', label: 'Company Name', required: true },
  { value: 'website', label: 'Website' },
  { value: 'country', label: 'Country' },
  { value: 'industry', label: 'Industry' },
  { value: 'employee_range', label: 'Employee Range' },
  { value: 'linkedin_company_url', label: 'LinkedIn Company URL' },
  { value: 'decision_maker_name', label: 'Decision Maker Name' },
  { value: 'decision_maker_role', label: 'Decision Maker Role' },
  { value: 'decision_maker_linkedin_url', label: 'Decision Maker LinkedIn URL' },
  { value: 'email', label: 'Email' },
  { value: 'email_status', label: 'Email Status' },
  { value: 'growth_signals', label: 'Growth Signals' },
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Source' },
];

const STEPS = ['Upload', 'Map Columns', 'Preview', 'Confirm'];

export default function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [source, setSource] = useState('CSV Import');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [batchLeads, setBatchLeads] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const data = await previewCSV(selectedFile);
      setPreviewData(data);
      setMappings(data.suggested_mappings || []);
      setStep(1);
      toast.success(`Loaded ${data.total_rows} rows from CSV`);
    } catch (err) {
      toast.error('Failed to parse CSV file');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Simulate file input
      const dt = new DataTransfer();
      dt.items.add(droppedFile);
      fileInputRef.current.files = dt.files;
      handleFileSelect({ target: { files: [droppedFile] } });
    }
  };

  const handleMappingChange = (internalField, csvColumn) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.internal_field === internalField
          ? { ...m, csv_column: csvColumn === '__none__' ? '' : csvColumn }
          : m
      )
    );
  };

  const handleCommit = async () => {
    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const result = await commitImport(file, mappings, source);
      setImportResult(result);

      // Fetch the freshly imported leads for the briefing
      try {
        const data = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/leads?import_batch_id=${encodeURIComponent(result.batch_id)}&page_size=200`
        ).then((r) => r.json());
        setBatchLeads(data.leads || []);
      } catch {
        // If partial fetch fails, briefing falls back to just the stats
        setBatchLeads([]);
      }

      setStep(3);
      toast.success(`Imported ${result.created} new leads`);
    } catch (err) {
      toast.error('Import failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mappedCount = mappings.filter((m) => m.csv_column).length;
  const requiredMapped = mappings
    .filter((m) => m.required)
    .every((m) => m.csv_column);

  return (
    <div className="p-4 lg:p-6 max-w-[1200px] mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  i === step
                    ? 'bg-primary text-primary-foreground'
                    : i < step
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {i < step ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-xs">
                    {i + 1}
                  </span>
                )}
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0: Upload */}
        {step === 0 && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="font-display text-xl">Import Leads from CSV</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a CSV file exported from Apollo, Sales Navigator, or similar tools.
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer',
                    'hover:border-sky-300 hover:bg-sky-50/30',
                    loading && 'opacity-50 pointer-events-none'
                  )}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid="csv-import-upload-input"
                  />
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-4" />
                      <p className="text-sm text-muted-foreground">Parsing CSV...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <Upload className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">Import Source</Label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="mt-1 h-8"
                    placeholder="e.g., Apollo Export, Sales Navigator"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 1: Map Columns */}
        {step === 1 && previewData && (
          <motion.div
            key="mapping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-xl">Map CSV Columns</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {file?.name} - {previewData.total_rows} rows detected.
                      Map your CSV columns to internal fields.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {mappedCount} / {mappings.length} mapped
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2" data-testid="csv-import-mapping-table">
                  {mappings.map((mapping) => {
                    const fieldDef = INTERNAL_FIELDS.find(
                      (f) => f.value === mapping.internal_field
                    );
                    return (
                      <div
                        key={mapping.internal_field}
                        className={cn(
                          'flex items-center gap-4 px-3 py-2 rounded-lg',
                          mapping.csv_column ? 'bg-emerald-50/50' : mapping.required ? 'bg-rose-50/50' : 'bg-secondary/30'
                        )}
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {fieldDef?.label || mapping.internal_field}
                          </span>
                          {mapping.required && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1">
                              Required
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="w-64">
                          <Select
                            value={mapping.csv_column || '__none__'}
                            onValueChange={(v) =>
                              handleMappingChange(mapping.internal_field, v)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">
                                <span className="text-muted-foreground">-- Skip --</span>
                              </SelectItem>
                              {previewData.columns.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {mapping.csv_column && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!requiredMapped}
                    className="gap-2"
                    data-testid="csv-import-next-button"
                  >
                    Preview Data
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && previewData && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Preview Import Data</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing first {previewData.sample_rows.length} of {previewData.total_rows} rows.
                  Verify mappings look correct before importing.
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/70">
                        {mappings
                          .filter((m) => m.csv_column)
                          .map((m) => (
                            <TableHead key={m.internal_field} className="text-xs font-medium whitespace-nowrap">
                              <div>
                                <div>{INTERNAL_FIELDS.find(f => f.value === m.internal_field)?.label}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {m.csv_column}
                                </div>
                              </div>
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.sample_rows.map((row, i) => (
                        <TableRow key={i}>
                          {mappings
                            .filter((m) => m.csv_column)
                            .map((m) => (
                              <TableCell key={m.internal_field} className="text-sm whitespace-nowrap max-w-[200px] truncate">
                                {row[m.csv_column] || <span className="text-muted-foreground">-</span>}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Mapping
                  </Button>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    className="gap-2"
                    disabled={loading}
                    data-testid="csv-import-confirm-button"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Import {previewData.total_rows} Leads
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Confirm Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Import</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to import {previewData.total_rows} leads from{' '}
                    <span className="font-medium text-foreground">{file?.name}</span>.
                    The system will normalize data, check for duplicates, and calculate
                    ICP fit and lead scores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCommit}>
                    Confirm Import
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        )}

        {/* Step 3: Intelligence Briefing */}
        {step === 3 && importResult && (
          <motion.div
            key="briefing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ImportBriefing
              importResult={importResult}
              batchLeads={batchLeads}
              onImportMore={() => {
                setStep(0);
                setFile(null);
                setPreviewData(null);
                setImportResult(null);
                setBatchLeads([]);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultStat({ label, value, color }) {
  return (
    <div className="text-center p-3 bg-secondary/50 rounded-lg">
      <p className={cn('text-2xl font-semibold font-display tabular-nums', color)}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
