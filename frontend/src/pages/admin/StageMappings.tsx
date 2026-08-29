import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../../lib/axios';
import { toast } from 'sonner';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Terminal } from '@phosphor-icons/react';

interface StageFormatProfile {
  id: number;
  key: string;
  display_name: string;
  competition_level: string;
  evidence_cap: number;
  mappings_count: number;
}

interface StageMapping {
  id: number;
  stage_format_profile_id: number;
  raw_label: string;
  label_operator: 'exact' | 'contains' | 'regex' | 'default';
  normalized_stage: string;
  phase: string | null;
  bracket: string | null;
  round_number: number | null;
  is_elimination_match: boolean;
  is_qualification_match: boolean;
  quality_weight: number;
  consistency_evidence_weight: number;
  priority: number;
  source: string;
  is_active: boolean;
  matches_count: number;
  profile: StageFormatProfile;
}

interface ObservedLabel {
  profile: string | null;
  raw_stage_label: string;
  stage_resolution_source: string | null;
  normalized_stage: string | null;
  matches_count: number;
}

interface MappingForm {
  stage_format_profile_id: number;
  raw_label: string;
  label_operator: StageMapping['label_operator'];
  normalized_stage: string;
  phase: string;
  bracket: string;
  round_number: number | null;
  is_elimination_match: boolean;
  is_qualification_match: boolean;
  quality_weight: number;
  consistency_evidence_weight: number;
  priority: number;
}

const columnHelper = createColumnHelper<StageMapping>();
const currentSeason = new Date().getFullYear();
const ruleTypeLabels: Record<StageMapping['label_operator'], string> = {
  exact: 'Exact label',
  contains: 'Contains text',
  regex: 'Pattern rule',
  default: 'Fallback rule',
};

function cleanPatternLabel(rawLabel: string): string {
  const literalOpenParenthesis = '\uE000';
  const literalCloseParenthesis = '\uE001';

  return rawLabel
    .trim()
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\\\(/g, literalOpenParenthesis)
    .replace(/\\\)/g, literalCloseParenthesis)
    .replace(/\.\*|\.\+/g, ' ')
    .replace(/\(([^()]*)\)/g, (_group, alternatives: string) => {
      const options = alternatives.split('|').map((option) => option.trim());
      const descriptiveOptions = options.filter((option) => !options.some(
        (candidate) => candidate !== option
          && candidate.toLocaleLowerCase().startsWith(option.toLocaleLowerCase()),
      ));

      return descriptiveOptions.join(' or ');
    })
    .replace(/\|/g, ' or ')
    .replace(/\\(.)/g, '$1')
    .split(literalOpenParenthesis).join('(')
    .split(literalCloseParenthesis).join(')')
    .replace(/\s*:\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayStageLabel(mapping: StageMapping): string {
  if (mapping.label_operator === 'default') {
    return 'All other stage labels';
  }

  if (mapping.label_operator === 'regex') {
    return cleanPatternLabel(mapping.raw_label) || 'Custom stage pattern';
  }

  return mapping.raw_label;
}

function emptyForm(profileId = 0): MappingForm {
  return {
    stage_format_profile_id: profileId,
    raw_label: '',
    label_operator: 'exact',
    normalized_stage: 'group_stage',
    phase: 'group',
    bracket: '',
    round_number: null,
    is_elimination_match: false,
    is_qualification_match: false,
    quality_weight: 1,
    consistency_evidence_weight: 0,
    priority: 100,
  };
}

export default function StageMappings() {
  const [profiles, setProfiles] = useState<StageFormatProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [mappings, setMappings] = useState<StageMapping[]>([]);
  const [observed, setObserved] = useState<ObservedLabel[]>([]);
  const [initialFetch, setInitialFetch] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MappingForm>(emptyForm());
  const [impact, setImpact] = useState<{ affected_matches: number; quality_delta_percent: number } | null>(null);
  const [season, setSeason] = useState(currentSeason);
  const [run, setRun] = useState<{ id: string; status: string; summary?: unknown; error?: string } | null>(null);

  const activeProfile = profiles.find((profile) => profile.key === selectedProfile);

  const fetchProfiles = useCallback(async () => {
    const response = await axios.get('/api/v1/admin/stage-format-profiles');
    const data = response.data as StageFormatProfile[];
    setProfiles(data);
    setSelectedProfile((current) => current || data[0]?.key || '');
    return data;
  }, []);

  const fetchProfileData = useCallback(async (profileKey: string) => {
    if (!profileKey) return;
    const [mappingResponse, observedResponse] = await Promise.all([
      axios.get('/api/v1/admin/stage-mappings', { params: { profile: profileKey } }),
      axios.get('/api/v1/admin/stage-mappings/observed-labels', { params: { profile: profileKey } }),
    ]);
    setMappings(mappingResponse.data);
    setObserved(observedResponse.data);
  }, []);

  useEffect(() => {
    fetchProfiles()
      .catch((error) => {
        console.error(error);
        toast.error('Failed to fetch stage profiles');
      })
      .finally(() => setInitialFetch(false));
  }, [fetchProfiles]);

  useEffect(() => {
    fetchProfileData(selectedProfile).catch((error) => {
      console.error(error);
      toast.error('Failed to fetch stage mappings');
    });
  }, [fetchProfileData, selectedProfile]);

  useEffect(() => {
    if (!run || !['queued', 'running'].includes(run.status)) return;
    const timer = window.setInterval(async () => {
      try {
        const response = await axios.get(`/api/v1/admin/metrics/runs/${run.id}`);
        setRun(response.data);
        if (response.data.status === 'completed') {
          toast.success('CQI v3 recalculation completed');
          fetchProfileData(selectedProfile);
        } else if (response.data.status === 'failed') {
          toast.error(`Calculation failed: ${response.data.error}`);
        }
      } catch (error) {
        console.error(error);
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [fetchProfileData, run, selectedProfile]);

  const openCreate = () => {
    setEditingId(null);
    setImpact(null);
    setForm(emptyForm(activeProfile?.id));
    setDialogOpen(true);
  };

  const openEdit = (mapping: StageMapping) => {
    setEditingId(mapping.id);
    setImpact(null);
    setForm({
      stage_format_profile_id: mapping.stage_format_profile_id,
      raw_label: mapping.raw_label,
      label_operator: mapping.label_operator,
      normalized_stage: mapping.normalized_stage,
      phase: mapping.phase || '',
      bracket: mapping.bracket || '',
      round_number: mapping.round_number,
      is_elimination_match: mapping.is_elimination_match,
      is_qualification_match: mapping.is_qualification_match,
      quality_weight: Number(mapping.quality_weight),
      consistency_evidence_weight: Number(mapping.consistency_evidence_weight),
      priority: mapping.priority,
    });
    setDialogOpen(true);
  };

  const payload = useMemo(() => ({
    ...form,
    phase: form.phase || null,
    bracket: form.bracket || null,
  }), [form]);

  const previewImpact = async () => {
    try {
      const response = await axios.post('/api/v1/admin/stage-mappings/preview-impact', payload);
      setImpact(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to preview impact');
    }
  };

  const saveMapping = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const toastId = toast.loading(editingId ? 'Updating stage rule...' : 'Creating stage rule...');
    try {
      if (editingId) {
        await axios.put(`/api/v1/admin/stage-mappings/${editingId}`, payload);
      } else {
        await axios.post('/api/v1/admin/stage-mappings', payload);
      }
      await Promise.all([fetchProfiles(), fetchProfileData(selectedProfile)]);
      toast.success('Stage mapping saved. Run Calculate All to apply it.', { id: toastId });
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const toggleMapping = async (mapping: StageMapping) => {
    try {
      await axios.patch(`/api/v1/admin/stage-mappings/${mapping.id}/toggle`);
      await fetchProfileData(selectedProfile);
      toast.success(mapping.is_active ? 'Rule disabled' : 'Rule enabled');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update rule');
    }
  };

  const calculateAll = async () => {
    try {
      const response = await axios.post('/api/v1/admin/metrics/recalculate', { season });
      setRun(response.data);
      toast.success(`CQI v3 calculation queued for ${season}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to queue calculation');
    }
  };

  const columns = [
    columnHelper.accessor('raw_label', {
      header: 'STAGE LABEL',
      cell: ({ row }) => (
        <div
          className="min-w-56"
          title={row.original.label_operator === 'regex' ? `Technical pattern: ${row.original.raw_label}` : undefined}
        >
          <div className="text-xs font-semibold leading-5 text-theme-text">{displayStageLabel(row.original)}</div>
          <span className="mt-1 inline-block border border-theme-border bg-gray-50 px-1.5 py-0.5 font-['JetBrains_Mono'] text-[8px] font-bold uppercase tracking-wider text-gray-500">
            {ruleTypeLabels[row.original.label_operator]}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor('normalized_stage', {
      header: 'NORMALIZED',
      cell: ({ row, getValue }) => (
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase">
          <div className="font-bold">{getValue()}</div>
          <div className="text-gray-500">{[row.original.phase, row.original.bracket].filter(Boolean).join(' / ') || 'Not set'}</div>
        </div>
      ),
    }),
    columnHelper.accessor('quality_weight', {
      header: 'QUALITY',
      cell: (info) => <span className="font-['JetBrains_Mono'] font-bold">{Number(info.getValue()).toFixed(2)}×</span>,
    }),
    columnHelper.accessor('consistency_evidence_weight', {
      header: 'EVIDENCE',
      cell: (info) => <span className="font-['JetBrains_Mono'] font-bold">{Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor('matches_count', {
      header: 'MATCHES',
      cell: (info) => <span className="font-['JetBrains_Mono']">{info.getValue()}</span>,
    }),
    columnHelper.accessor('source', {
      header: 'SOURCE',
      cell: (info) => <span className="font-['JetBrains_Mono'] text-[10px] uppercase">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(row.original)} className="border border-theme-border px-2 py-1 font-['JetBrains_Mono'] text-[9px] font-bold uppercase hover:bg-yellow-200">Edit</button>
          <button type="button" onClick={() => toggleMapping(row.original)} className={`border border-theme-border px-2 py-1 font-['JetBrains_Mono'] text-[9px] font-bold uppercase ${row.original.is_active ? 'bg-green-100' : 'bg-gray-200 text-gray-500'}`}>
            {row.original.is_active ? 'Active' : 'Disabled'}
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({ data: mappings, columns, getCoreRowModel: getCoreRowModel() });
  const needsReview = observed.filter((label) => ['unmapped', 'default'].includes(label.stage_resolution_source || 'unmapped'));

  return (
    <div className="font-['Inter']">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-theme-border pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Terminal weight="regular" size={18} />
            <h2 className="mt-1 font-['Archivo_Black'] text-2xl uppercase leading-none tracking-tight text-theme-text">Stage Mapping Engine</h2>
          </div>
          <p className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-widest text-gray-500">Profile-scoped CQI v3 stage quality and consistency evidence.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="number" min="2000" max="2100" value={season} onChange={(event) => setSeason(Number(event.target.value))} className="w-24 border-2 border-theme-border bg-theme-bg px-3 py-2 font-['JetBrains_Mono'] text-xs font-bold" />
          <button type="button" onClick={calculateAll} disabled={run?.status === 'queued' || run?.status === 'running'} className="border-2 border-theme-border bg-yellow-300 px-4 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase disabled:opacity-50">
            {run?.status === 'queued' || run?.status === 'running' ? `Calculate: ${run.status}` : 'Calculate All'}
          </button>
          <button type="button" onClick={openCreate} disabled={!activeProfile} className="flex items-center gap-2 border-2 border-theme-border bg-black px-4 py-2 font-['JetBrains_Mono'] text-[11px] font-bold uppercase text-white disabled:opacity-50"><Plus size={13} /> New Rule</button>
        </div>
      </div>

      {run?.status === 'failed' && <div className="mb-4 border-2 border-red-700 bg-red-50 p-3 font-['JetBrains_Mono'] text-xs text-red-800">{run.error}</div>}

      <div className="mb-6 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {profiles.map((profile) => (
          <button key={profile.id} type="button" onClick={() => setSelectedProfile(profile.key)} className={`border-2 p-4 text-left transition-colors ${selectedProfile === profile.key ? 'border-black bg-yellow-300' : 'border-theme-border bg-theme-bg hover:bg-yellow-50'}`}>
            <span className="block font-['JetBrains_Mono'] text-[9px] font-bold uppercase tracking-widest text-gray-500">{profile.competition_level}</span>
            <span className="mt-1 block font-['Archivo_Black'] text-sm uppercase leading-tight">{profile.display_name}</span>
            <span className="mt-3 block font-['JetBrains_Mono'] text-[10px]">{profile.mappings_count} RULES · CAP {Number(profile.evidence_cap).toFixed(1)}</span>
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-x-auto border border-theme-border bg-theme-bg">
          <Table className="min-w-[900px]">
            <TableHeader className="border-b border-theme-border bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 border-r border-theme-border px-3 font-['JetBrains_Mono'] text-[10px] font-bold text-theme-text last:border-r-0">{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {initialFetch ? Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}><TableCell colSpan={7}><Skeleton className="h-7 w-full rounded-none" /></TableCell></TableRow>
              )) : table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={`${row.original.is_active ? '' : 'opacity-50'} border-b border-theme-border last:border-0`}>
                  {row.getVisibleCells().map((cell) => <TableCell key={cell.id} className="border-r border-theme-border px-3 py-3 last:border-r-0">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="h-28 text-center font-['JetBrains_Mono'] text-xs text-gray-500">No mappings for this profile.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <aside className="border-2 border-theme-border bg-theme-bg p-4">
          <div className="mb-3 flex items-center justify-between border-b border-theme-border pb-3">
            <h3 className="font-['Archivo_Black'] text-sm uppercase">Needs Review</h3>
            <span className={`border border-theme-border px-2 py-0.5 font-['JetBrains_Mono'] text-xs font-bold ${needsReview.length ? 'bg-red-100' : 'bg-green-100'}`}>{needsReview.length}</span>
          </div>
          <div className="space-y-2">
            {needsReview.length ? needsReview.slice(0, 12).map((label) => (
              <div key={`${label.raw_stage_label}-${label.stage_resolution_source}`} className="border border-theme-border bg-gray-50 p-2">
                <div className="font-['JetBrains_Mono'] text-[10px] font-bold">{label.raw_stage_label}</div>
                <div className="mt-1 font-['JetBrains_Mono'] text-[9px] uppercase text-gray-500">{label.stage_resolution_source || 'unmapped'} · {label.matches_count} matches</div>
              </div>
            )) : <p className="font-['JetBrains_Mono'] text-[10px] leading-relaxed text-gray-500">All observed labels in this profile resolve without a neutral fallback.</p>}
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-theme-border bg-theme-bg p-0 sm:max-w-2xl">
          <div className="border-b-2 border-theme-border px-5 py-4"><DialogHeader><DialogTitle className="font-['Archivo_Black'] text-xl uppercase">{editingId ? 'Edit Stage Rule' : 'Create Stage Rule'}</DialogTitle></DialogHeader></div>
          <form onSubmit={saveMapping} className="grid gap-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Format Profile">
                <select value={form.stage_format_profile_id} onChange={(event) => setForm({ ...form, stage_format_profile_id: Number(event.target.value) })} className={inputClass} required>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.display_name}</option>)}</select>
              </Field>
              <Field label="Operator">
                <select value={form.label_operator} onChange={(event) => setForm({ ...form, label_operator: event.target.value as MappingForm['label_operator'] })} className={inputClass}><option value="exact">Exact</option><option value="contains">Contains</option><option value="regex">Regex</option><option value="default">Default</option></select>
              </Field>
            </div>
            <Field label="Raw label or pattern"><input value={form.raw_label} onChange={(event) => setForm({ ...form, raw_label: event.target.value })} className={inputClass} placeholder="e.g. ^Playoffs: Grand Final$" required /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Normalized Stage"><input value={form.normalized_stage} onChange={(event) => setForm({ ...form, normalized_stage: event.target.value })} className={inputClass} required /></Field>
              <Field label="Phase"><select value={form.phase} onChange={(event) => setForm({ ...form, phase: event.target.value })} className={inputClass}><option value="">None</option><option value="group">Group</option><option value="swiss">Swiss</option><option value="play_in">Play-In</option><option value="main_event">Main Event</option><option value="playoffs">Playoffs</option></select></Field>
              <Field label="Bracket"><select value={form.bracket} onChange={(event) => setForm({ ...form, bracket: event.target.value })} className={inputClass}><option value="">None</option><option value="upper">Upper</option><option value="middle">Middle</option><option value="lower">Lower</option></select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Round"><input type="number" min="1" max="50" value={form.round_number ?? ''} onChange={(event) => setForm({ ...form, round_number: event.target.value ? Number(event.target.value) : null })} className={inputClass} /></Field>
              <Field label="Quality"><input type="number" min="0.9" max="1.15" step="0.01" value={form.quality_weight} onChange={(event) => setForm({ ...form, quality_weight: Number(event.target.value) })} className={inputClass} required /></Field>
              <Field label="Evidence"><input type="number" min="0" max="4" step="0.05" value={form.consistency_evidence_weight} onChange={(event) => setForm({ ...form, consistency_evidence_weight: Number(event.target.value) })} className={inputClass} required /></Field>
              <Field label="Priority"><input type="number" min="0" max="10000" value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} className={inputClass} required /></Field>
            </div>
            <div className="flex flex-wrap gap-6 border-y border-theme-border py-3">
              <Check label="Elimination match" checked={form.is_elimination_match} onChange={(checked) => setForm({ ...form, is_elimination_match: checked })} />
              <Check label="Qualification match" checked={form.is_qualification_match} onChange={(checked) => setForm({ ...form, is_qualification_match: checked })} />
            </div>
            {impact && <div className="border border-theme-border bg-yellow-50 p-3 font-['JetBrains_Mono'] text-[11px]">{impact.affected_matches} matches affected · quality delta {impact.quality_delta_percent > 0 ? '+' : ''}{impact.quality_delta_percent}%</div>}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={previewImpact} className="border-2 border-theme-border px-4 py-3 font-['JetBrains_Mono'] text-xs font-bold uppercase">Preview Impact</button>
              <button type="submit" disabled={saving} className="border-2 border-theme-border bg-black px-4 py-3 font-['Archivo_Black'] text-sm uppercase text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Rule'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const inputClass = "w-full rounded-none border-2 border-theme-border bg-gray-50 px-3 py-2 font-['JetBrains_Mono'] text-xs focus:bg-theme-bg focus:outline-none focus:ring-4 focus:ring-yellow-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-widest text-gray-600">{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] font-bold uppercase"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-black" />{label}</label>;
}
