import React from 'react';

/**
 * InstrumentChartPanel
 *
 * A reusable panel for rendering instrument charts (line chart, heatmap, etc.) with compact, customizable filter headers.
 *
 * Props:
 *   chartType: 'line' | 'heatmap' // Provided by backend/module data
 *   filters: object with filter state (instrument, dateRange, overlays, etc.)
 *   onFilterChange: function to update filters
 *   children: chart component(s) to render
 *
 * The panel is designed for minimal vertical space usage. Header filters are tightly grouped.
 */
export default function InstrumentChartPanel({
  chartType,
  onChartTypeChange,
  filters,
  onFilterChange,
  children
}) {
  return (
    <div style={{ margin: 0, padding: 0 }}>
       <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        fontSize: 13,
        padding: 0
      }}>
        {/* Frequency selector (common) */}
        {filters.instruments && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Freq:
            <select value={filters.frequency} onChange={e => onFilterChange({ ...filters, frequency: e.target.value })} style={{ minWidth: 70 }}>
              {Object.keys(filters.instruments).map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </label>
        )}
        {/* Source selector (common) */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Source:
          <label style={{ display: 'flex', alignItems: 'center', gap: 2, margin: 0 }}>
            <input type="radio" name="source" value="local" checked={filters.source === 'local'} onChange={() => onFilterChange({ ...filters, source: 'local' })} /> Local
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 2, margin: 0 }}>
            <input type="radio" name="source" value="remote" checked={filters.source === 'remote'} onChange={() => onFilterChange({ ...filters, source: 'remote' })} /> Remote
          </label>
        </label>
        {/* Instrument input (common) */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Instrument:
          <input
            type="text"
            value={filters.instrumentInput}
            onChange={e => onFilterChange({ ...filters, instrumentInput: e.target.value.toUpperCase() })}
            onKeyDown={e => {
              if (e.key === 'Enter') onFilterChange({ ...filters, instrument: filters.instrumentInput.toUpperCase() });
            }}
            style={{ width: 90 }}
            placeholder="Ticker"
          />
        </label>
        {/* Date range: Only for line charts */}
        {chartType === 'line' && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Start:
              <input type="date" value={filters.dateRange?.start || ''} onChange={e => onFilterChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              End:
              <input type="date" value={filters.dateRange?.end || ''} onChange={e => onFilterChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })} />
            </label>
          </>
        )}
        {/* Group input: always visible for all chart types */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Group:
          <input
            type="text"
            value={filters.group || ''}
            onChange={e => onFilterChange({ ...filters, group: e.target.value })}
            placeholder="None"
            style={{ width: 70 }}
          />
        </label>
        {chartType === 'line' && (
          <>
            {/* Overlay module selector */}
            {filters.modules && filters.overlayOptions && filters.overlaySelect && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Overlay:
                <div style={{ minWidth: 160 }}>
                  {filters.overlaySelect}
                </div>
              </span>
            )}
            {/* Signal overlay selector */}
            {filters.signalOverlayOptions && filters.signalOverlaySelect && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                Signal:
                <div style={{ minWidth: 160 }}>
                  {filters.signalOverlaySelect}
                </div>
              </span>
            )}
          </>
        )}
        {chartType === 'heatmap' && (
          <span style={{ color: '#888', fontSize: 13 }}>[Heatmap chart specific filters here]</span>
        )}
      </div>
      <div style={{ minHeight: 300 }}>
        {children}
      </div>
    </div>
  );
}
