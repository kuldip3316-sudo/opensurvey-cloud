import React from 'react';

export default function GridQuestion({
  title,
  subtitle,
  rows,
  columns,
  values = {},
  onChange,
  required = true
}) {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="py-3 px-4 w-2/5">Category / Provider</th>
              {columns.map(col => (
                <th key={col.code} className="py-3 px-2 text-center text-xs w-28">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const rowKey = typeof row === 'string' ? row : row.name;
              const rowId = typeof row === 'string' ? row : row.id || row.name;
              const currentValue = values[rowKey];

              return (
                <tr
                  key={rowId}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-slate-800 text-sm">
                    {rowKey}
                    {row.category && (
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">
                        {row.category}
                      </span>
                    )}
                  </td>
                  {columns.map(col => {
                    const isSelected = currentValue === col.label || currentValue === col.code;
                    return (
                      <td key={col.code} className="py-3 px-2 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                          <input
                            type="radio"
                            name={`grid_row_${rowId}`}
                            checked={isSelected}
                            onChange={() => onChange(rowKey, col.label)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {rows.map(row => {
          const rowKey = typeof row === 'string' ? row : row.name;
          const rowId = typeof row === 'string' ? row : row.id || row.name;
          const currentValue = values[rowKey];

          return (
            <div
              key={rowId}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
            >
              <div className="font-semibold text-slate-800 text-sm">
                {rowKey}
                {row.category && (
                  <span className="block text-xs font-normal text-slate-400 mt-0.5">
                    {row.category}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {columns.map(col => {
                  const isSelected = currentValue === col.label || currentValue === col.code;
                  return (
                    <label
                      key={col.code}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 font-semibold text-blue-900'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <span>{col.label}</span>
                      <input
                        type="radio"
                        name={`mobile_grid_${rowId}`}
                        checked={isSelected}
                        onChange={() => onChange(rowKey, col.label)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
