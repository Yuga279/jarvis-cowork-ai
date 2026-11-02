import React, { useState } from 'react';
import { Dataset, DataColumn } from '../../types';
import {
  Upload,
  FileSpreadsheet,
  Brackets,
  Sparkles,
  X,
  FileText,
  Database,
  ArrowRight,
} from 'lucide-react';

interface DataImporterModalProps {
  isOpen: boolean;
  onImportDataset: (dataset: Dataset) => void;
  onClose: () => void;
}

export const SAMPLE_DATASETS: Dataset[] = [
  {
    id: 'sample_cloud_spend',
    name: 'Enterprise Cloud Spend & Margins 2026',
    type: 'tabular',
    columns: [
      { key: 'Quarter', label: 'Quarter', type: 'string' },
      { key: 'ComputeSpend', label: 'Compute ($K)', type: 'number' },
      { key: 'StorageSpend', label: 'Storage ($K)', type: 'number' },
      { key: 'AiGpuSpend', label: 'AI GPU Clusters ($K)', type: 'number' },
      { key: 'GrossMarginPct', label: 'Gross Margin %', type: 'number' },
    ],
    rows: [
      { Quarter: 'Q1-2025', ComputeSpend: 420, StorageSpend: 110, AiGpuSpend: 280, GrossMarginPct: 68.4 },
      { Quarter: 'Q2-2025', ComputeSpend: 460, StorageSpend: 125, AiGpuSpend: 390, GrossMarginPct: 71.2 },
      { Quarter: 'Q3-2025', ComputeSpend: 490, StorageSpend: 130, AiGpuSpend: 540, GrossMarginPct: 73.0 },
      { Quarter: 'Q4-2025', ComputeSpend: 530, StorageSpend: 145, AiGpuSpend: 720, GrossMarginPct: 74.8 },
      { Quarter: 'Q1-2026', ComputeSpend: 560, StorageSpend: 150, AiGpuSpend: 910, GrossMarginPct: 76.5 },
      { Quarter: 'Q2-2026', ComputeSpend: 610, StorageSpend: 165, AiGpuSpend: 1150, GrossMarginPct: 78.1 },
      { Quarter: 'Q3-2026', ComputeSpend: 670, StorageSpend: 180, AiGpuSpend: 1380, GrossMarginPct: 79.4 },
      { Quarter: 'Q4-2026', ComputeSpend: 740, StorageSpend: 195, AiGpuSpend: 1640, GrossMarginPct: 81.0 },
    ],
    chartConfig: {
      chartType: 'area',
      xAxisKey: 'Quarter',
      dataKeys: ['AiGpuSpend', 'ComputeSpend', 'StorageSpend'],
    },
    analysis: {
      summary: 'Cloud expenditure shows rapid acceleration in AI GPU infrastructure, expanding from $280K to $1.64M over 8 quarters while enterprise gross margin expanded to 81%.',
      keyMetrics: [
        { label: 'Peak GPU Spend', value: '$1.64M', trend: '+485% (2Y)', status: 'positive' },
        { label: 'Q4 Margin', value: '81.0%', trend: '+12.6 pts', status: 'positive' },
        { label: 'Total Cloud Incurred', value: '$8.89M', trend: 'Budget optimal', status: 'neutral' },
        { label: 'Compute Growth', value: '+76.1%', trend: 'Linear scaling', status: 'neutral' },
      ],
      insights: [
        'AI GPU workloads now represent over 63% of quarterly cloud expenditure, outpacing legacy compute 2.2x.',
        'Gross margins expanded consistently each quarter due to high-efficiency custom inference models.',
        'Recommended action: Lock in 3-year GPU reserved instances to reduce run rate by an estimated 28%.',
      ],
    },
  },
  {
    id: 'sample_ai_benchmarks',
    name: 'AI Foundation Models Benchmark 2026',
    type: 'tabular',
    columns: [
      { key: 'Model', label: 'Model', type: 'string' },
      { key: 'AccuracyMMLU', label: 'MMLU Pro (%)', type: 'number' },
      { key: 'LatencyMs', label: 'Time-to-First-Token (ms)', type: 'number' },
      { key: 'TokensPerSec', label: 'Throughput (tps)', type: 'number' },
      { key: 'CostPer1M', label: 'Blended Cost ($/1M Tok)', type: 'number' },
    ],
    rows: [
      { Model: 'Gemini 2.5 Flash', AccuracyMMLU: 88.2, LatencyMs: 140, TokensPerSec: 165, CostPer1M: 0.15 },
      { Model: 'Gemini 1.5 Pro', AccuracyMMLU: 90.8, LatencyMs: 310, TokensPerSec: 88, CostPer1M: 2.50 },
      { Model: 'Claude 3.5 Sonnet', AccuracyMMLU: 91.4, LatencyMs: 290, TokensPerSec: 92, CostPer1M: 3.00 },
      { Model: 'GPT-4o', AccuracyMMLU: 90.2, LatencyMs: 260, TokensPerSec: 110, CostPer1M: 2.50 },
      { Model: 'Llama 3.3 70B', AccuracyMMLU: 86.9, LatencyMs: 180, TokensPerSec: 140, CostPer1M: 0.70 },
      { Model: 'DeepSeek V3', AccuracyMMLU: 88.5, LatencyMs: 220, TokensPerSec: 125, CostPer1M: 0.35 },
    ],
    chartConfig: {
      chartType: 'bar',
      xAxisKey: 'Model',
      dataKeys: ['AccuracyMMLU', 'TokensPerSec'],
    },
    analysis: {
      summary: 'Comprehensive performance and cost frontier across flagship AI models. Gemini 2.5 Flash delivers the highest throughput (165 tps) at the lowest blended cost ($0.15/1M tokens).',
      keyMetrics: [
        { label: 'Highest Throughput', value: '165 tps', trend: 'Gemini 2.5 Flash', status: 'positive' },
        { label: 'Top Accuracy', value: '91.4%', trend: 'Claude 3.5 Sonnet', status: 'positive' },
        { label: 'Lowest Cost/1M', value: '$0.15', trend: '94% cheaper', status: 'positive' },
        { label: 'Average Latency', value: '233 ms', trend: 'Sub-300ms SLA', status: 'neutral' },
      ],
      insights: [
        'Gemini 2.5 Flash achieves a Pareto-optimal trade-off for high-volume agentic pipelines with 140ms first-token latency.',
        'Sonnet 3.5 leads in complex multi-step code synthesis benchmarks (91.4% MMLU Pro).',
        'Deploying dual-tier routing (Flash for extraction/planning + Sonnet/Pro for deep audits) cuts blended LLM spend by 72%.',
      ],
    },
  },
  {
    id: 'sample_workspace_activity',
    name: 'Google Workspace Velocity & Team Workload',
    type: 'tabular',
    columns: [
      { key: 'Department', label: 'Department', type: 'string' },
      { key: 'EmailsHandled', label: 'Emails Handled', type: 'number' },
      { key: 'DriveDocsCreated', label: 'Drive Files Created', type: 'number' },
      { key: 'SheetsAutomated', label: 'Sheets Automated', type: 'number' },
      { key: 'MeetingsScheduled', label: 'Meetings Booked', type: 'number' },
    ],
    rows: [
      { Department: 'Engineering', EmailsHandled: 1420, DriveDocsCreated: 380, SheetsAutomated: 124, MeetingsScheduled: 86 },
      { Department: 'Product', EmailsHandled: 2150, DriveDocsCreated: 520, SheetsAutomated: 92, MeetingsScheduled: 142 },
      { Department: 'Sales', EmailsHandled: 4890, DriveDocsCreated: 210, SheetsAutomated: 340, MeetingsScheduled: 310 },
      { Department: 'Marketing', EmailsHandled: 2670, DriveDocsCreated: 430, SheetsAutomated: 185, MeetingsScheduled: 115 },
      { Department: 'Customer Success', EmailsHandled: 3950, DriveDocsCreated: 190, SheetsAutomated: 270, MeetingsScheduled: 190 },
      { Department: 'Executive Ops', EmailsHandled: 1880, DriveDocsCreated: 260, SheetsAutomated: 310, MeetingsScheduled: 220 },
    ],
    chartConfig: {
      chartType: 'composed',
      xAxisKey: 'Department',
      dataKeys: ['EmailsHandled', 'MeetingsScheduled'],
    },
    analysis: {
      summary: 'Cross-functional workload distribution across Gmail, Google Drive, Sheets, and Calendar over the trailing 30 days.',
      keyMetrics: [
        { label: 'Total Emails', value: '16,960', trend: '+18.2% MoM', status: 'neutral' },
        { label: 'Drive Files', value: '1,990 docs', trend: 'High velocity', status: 'positive' },
        { label: 'Meetings Booked', value: '1,063', trend: 'Calendar density high', status: 'negative' },
        { label: 'Sheets Pipelines', value: '1,321 runs', trend: 'Autonomous sync active', status: 'positive' },
      ],
      insights: [
        'Sales and Customer Success teams account for 52% of email traffic, creating prime opportunities for Jarvis Inbox Zero automated replies.',
        'Executive Ops and Sales have the highest Google Sheets automation frequency (340 and 310 spreadsheets).',
        'Engineering has the lowest meeting density (86) and highest deep-work focus ratio.',
      ],
    },
  },
];

export const DataImporterModal: React.FC<DataImporterModalProps> = ({
  isOpen,
  onImportDataset,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'sample' | 'paste' | 'file'>('sample');
  const [pastedText, setPastedText] = useState('');
  const [datasetName, setDatasetName] = useState('Custom Dataset');
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse CSV or JSON text
  const parseRawData = (text: string, name: string) => {
    try {
      setParseError(null);
      const trimmed = text.trim();

      // Check if JSON
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        if (!rows.length) throw new Error('JSON array is empty');

        const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
        const columns: DataColumn[] = keys.map((k) => {
          const sampleVal = rows.find((r) => r[k] !== undefined && r[k] !== null)?.[k];
          const isNum = typeof sampleVal === 'number' || (!isNaN(Number(sampleVal)) && sampleVal !== '');
          return {
            key: k,
            label: k.charAt(0).toUpperCase() + k.slice(1),
            type: isNum ? 'number' : 'string',
          };
        });

        const dataset: Dataset = {
          id: `custom_${Date.now()}`,
          name: name || 'Imported JSON Dataset',
          type: 'tabular',
          columns,
          rows: rows.map((r) => {
            const rowCopy: Record<string, any> = { ...r };
            columns.forEach((col) => {
              if (col.type === 'number') {
                rowCopy[col.key] = parseFloat(String(rowCopy[col.key])) || 0;
              }
            });
            return rowCopy;
          }),
          chartConfig: {
            chartType: 'bar',
            xAxisKey: columns[0]?.key || '',
            dataKeys: columns.filter((c) => c.type === 'number').map((c) => c.key),
          },
        };

        onImportDataset(dataset);
        onClose();
        return;
      }

      // Parse CSV / TSV
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and 1 data row');
      }

      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headerParts = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());

      const dataRows = lines.slice(1).map((line) => {
        const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
        const rowObj: Record<string, any> = {};
        headerParts.forEach((h, i) => {
          rowObj[h] = parts[i] ?? '';
        });
        return rowObj;
      });

      const columns: DataColumn[] = headerParts.map((h) => {
        const firstVal = dataRows[0]?.[h];
        const isNum = !isNaN(Number(firstVal)) && firstVal !== '';
        return {
          key: h,
          label: h,
          type: isNum ? 'number' : 'string',
        };
      });

      const cleanedRows = dataRows.map((r) => {
        const rowCopy: Record<string, any> = {};
        columns.forEach((col) => {
          rowCopy[col.key] = col.type === 'number' ? parseFloat(r[col.key]) || 0 : r[col.key];
        });
        return rowCopy;
      });

      const dataset: Dataset = {
        id: `csv_${Date.now()}`,
        name: name || 'Imported CSV Dataset',
        type: 'tabular',
        columns,
        rows: cleanedRows,
        chartConfig: {
          chartType: 'bar',
          xAxisKey: columns[0]?.key || '',
          dataKeys: columns.filter((c) => c.type === 'number').map((c) => c.key),
        },
      };

      onImportDataset(dataset);
      onClose();
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse data format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseRawData(content, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl shadow-cyan-500/10 text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Data Hub & Multi-Type Importer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  CSV • JSON • Sheets
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Load enterprise benchmarks or import your own data for automated visualization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('sample')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sample'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Preset Enterprise Datasets
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste CSV or JSON
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'sample' && (
          <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {SAMPLE_DATASETS.map((sample) => (
              <div
                key={sample.id}
                onClick={() => {
                  onImportDataset(sample);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/60 transition-all cursor-pointer group flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {sample.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                      {sample.rows.length} rows • {sample.columns.length} columns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sample.analysis?.summary || 'Comprehensive multi-variable tabular dataset with automatic chart mapping.'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'paste' && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Dataset Name (e.g. Sales Metrics Q4)"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
            />
            <textarea
              rows={8}
              placeholder="Paste raw CSV or JSON data here... Example:&#10;Month,Revenue,Expenses&#10;Jan,12000,8000&#10;Feb,15000,9200&#10;Mar,18500,10400"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono resize-none custom-scrollbar"
            />
            {parseError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-[11px]">
                {parseError}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => parseRawData(pastedText, datasetName)}
                disabled={!pastedText.trim()}
                className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-40"
              >
                Import & Visualize
              </button>
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl bg-slate-950/60 transition-colors">
            <Upload className="w-10 h-10 text-cyan-400 mb-3" />
            <span className="text-xs font-semibold text-slate-200">Upload CSV or JSON file</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Supports .csv, .tsv, .json formats</span>
            <label className="mt-4 px-4 py-2 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all">
              Choose File
              <input type="file" accept=".csv,.tsv,.json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
