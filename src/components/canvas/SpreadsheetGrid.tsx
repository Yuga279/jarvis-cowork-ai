import React, { useState, useMemo } from 'react';
import { Dataset, DataColumn } from '../../types';
import {
  Search,
  ArrowUpDown,
  Download,
  Plus,
  FileSpreadsheet,
  Check,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Calculator,
} from 'lucide-react';

interface SpreadsheetGridProps {
  dataset: Dataset;
  onUpdateRows?: (updatedRows: Record<string, any>[]) => void;
  onExportToGoogleSheets?: (dataset: Dataset) => void;
}

export const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  dataset,
  onUpdateRows,
  onExportToGoogleSheets,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Handle Sort
  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  // Filter and Sort rows
  const filteredRows = useMemo(() => {
    let result = [...dataset.rows];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return result;
  }, [dataset.rows, searchTerm, sortColumn, sortDirection]);

  // Paginated Rows
  const paginatedRows = useMemo(() => {
    const start = page * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  // Cell Editing Handlers
  const startEdit = (rowIdx: number, colKey: string, currentVal: any) => {
    setEditingCell({ rowIdx, colKey });
    setEditValue(String(currentVal ?? ''));
  };

  const saveEdit = (rowAbsoluteIdx: number) => {
    if (!editingCell) return;
    const newRows = [...dataset.rows];
    const col = dataset.columns.find((c) => c.key === editingCell.colKey);
    const parsedVal = col?.type === 'number' ? parseFloat(editValue) || 0 : editValue;
    newRows[rowAbsoluteIdx] = { ...newRows[rowAbsoluteIdx], [editingCell.colKey]: parsedVal };
    onUpdateRows?.(newRows);
    setEditingCell(null);
  };

  // Add Row
  const handleAddRow = () => {
    const blankRow: Record<string, any> = {};
    dataset.columns.forEach((c) => {
      blankRow[c.key] = c.type === 'number' ? 0 : 'New Item';
    });
    const newRows = [blankRow, ...dataset.rows];
    onUpdateRows?.(newRows);
  };

  // Export CSV
  const handleDownloadCsv = () => {
    const headers = dataset.columns.map((c) => `"${c.label}"`).join(',');
    const rows = dataset.rows.map((r) =>
      dataset.columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Column summary stats
  const columnStats = useMemo(() => {
    const stats: Record<string, { sum?: number; avg?: number }> = {};
    dataset.columns.forEach((col) => {
      if (col.type === 'number') {
        const nums = dataset.rows.map((r) => parseFloat(r[col.key])).filter((v) => !isNaN(v));
        if (nums.length > 0) {
          const sum = nums.reduce((a, b) => a + b, 0);
          stats[col.key] = {
            sum,
            avg: sum / nums.length,
          };
        }
      }
    });
    return stats;
  }, [dataset.rows, dataset.columns]);

  return (
    <div className="flex flex-col h-full bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search table values across all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder:text-slate-500 outline-none font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            Add Row
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download table as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>
          {onExportToGoogleSheets && (
            <button
              onClick={() => onExportToGoogleSheets(dataset)}
              className="px-3.5 py-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Sync to real Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Push to Sheets
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-xs text-left">
          <thead className="bg-slate-950/90 text-slate-400 font-mono text-[11px] sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center text-slate-600">#</th>
              {dataset.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="py-2.5 px-3 font-semibold text-slate-300 hover:text-white cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    <span className="text-[9px] text-cyan-400/80 font-normal">({col.type})</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
            {paginatedRows.map((row, rowIdx) => {
              const absIdx = page * pageSize + rowIdx;
              return (
                <tr key={absIdx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-500 select-none text-[10px]">
                    {absIdx + 1}
                  </td>
                  {dataset.columns.map((col) => {
                    const isEditing = editingCell?.rowIdx === absIdx && editingCell?.colKey === col.key;
                    const val = row[col.key];

                    return (
                      <td
                        key={col.key}
                        onDoubleClick={() => startEdit(absIdx, col.key, val)}
                        className="py-2 px-3 relative group"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type={col.type === 'number' ? 'number' : 'text'}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(absIdx)}
                              autoFocus
                              className="w-full bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                            />
                            <button
                              onClick={() => saveEdit(absIdx)}
                              className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate max-w-[280px]">
                              {typeof val === 'number'
                                ? val.toLocaleString()
                                : val !== undefined && val !== null
                                ? String(val)
                                : '—'}
                            </span>
                            <button
                              onClick={() => startEdit(absIdx, col.key, val)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-cyan-400 rounded cursor-pointer transition-opacity"
                              title="Edit cell value"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* Sticky Summary Stats Footer for numeric columns */}
          <tfoot className="bg-slate-950 text-slate-400 font-mono text-[10px] border-t border-slate-800 sticky bottom-0 z-10">
            <tr>
              <td className="py-2 px-3 text-center font-bold text-cyan-400">
                <Calculator className="w-3.5 h-3.5 inline" />
              </td>
              {dataset.columns.map((col) => {
                const stat = columnStats[col.key];
                return (
                  <td key={col.key} className="py-2 px-3">
                    {stat ? (
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold">
                          Σ: {stat.sum ? (stat.sum > 1000000 ? `$${(stat.sum / 1000000).toFixed(1)}M` : stat.sum.toLocaleString()) : '0'}
                        </span>
                        <span className="text-slate-500 text-[9px]">
                          μ: {stat.avg ? stat.avg.toFixed(1) : '0'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>
          Showing {filteredRows.length > 0 ? page * pageSize + 1 : 0} to{' '}
          {Math.min((page + 1) * pageSize, filteredRows.length)} of {filteredRows.length} rows
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 outline-none text-xs"
          >
            <option value={10}>10 rows</option>
            <option value={15}>15 rows</option>
            <option value={30}>30 rows</option>
            <option value={50}>50 rows</option>
          </select>

          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
