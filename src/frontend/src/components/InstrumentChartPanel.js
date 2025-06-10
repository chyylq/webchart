import React, { useState, useEffect } from 'react';

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
  // State for filter visibility with localStorage persistence
  const [showFilters, setShowFilters] = useState(() => {
    const saved = localStorage.getItem('chartFiltersVisible');
    return saved !== null ? JSON.parse(saved) : true; // Default to visible
  });
  
  // Save visibility preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chartFiltersVisible', JSON.stringify(showFilters));
  }, [showFilters]);
  
  // Toggle filter visibility
  const toggleFilters = () => setShowFilters(prev => !prev);
  return (
    <div style={{ margin: 0, padding: 0 }}>

      {/* Always visible minimal row with toggle button when filters are hidden */}
      {!showFilters && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 1 }}>
          <button 
            onClick={toggleFilters} 
            title="Show filters"
            style={{ 
              fontSize: 10, 
              padding: '0px 3px', 
              cursor: 'pointer',
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: 3,
              height: 16,
              width: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            +
          </button>
        </div>
      )}
      
      {/* Filter row with all controls */}
      {showFilters && <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        marginBottom: 1,
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        fontSize: 11,
        padding: 0
      }}>
        {/* Frequency selector (common) */}
        {filters.instruments && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            Freq:
            <select value={filters.frequency} onChange={e => onFilterChange({ ...filters, frequency: e.target.value })} style={{ minWidth: 60, height: 20, fontSize: 11 }}>
              {Object.keys(filters.instruments).map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </label>
        )}
        {/* Source is now controlled by backend module defaults only */}
        {/* Instrument input (common) */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          Instrument:
          <input
            type="text"
            value={filters.instrumentInput}
            onChange={e => onFilterChange({ ...filters, instrumentInput: e.target.value.toUpperCase() })}
            onKeyDown={e => {
              if (e.key === 'Enter') onFilterChange({ ...filters, instrument: filters.instrumentInput.toUpperCase() });
            }}
            style={{ width: 80, height: 18, fontSize: 11 }}
            placeholder="Ticker"
          />
        </label>
        {/* Date range: Only for line charts */}
        {chartType === 'line' && (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              Start:
              <input type="date" value={filters.dateRange?.start || ''} onChange={e => onFilterChange({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })} style={{ height: 18, fontSize: 11 }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              End:
              <input type="date" value={filters.dateRange?.end || ''} onChange={e => onFilterChange({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })} style={{ height: 18, fontSize: 11 }} />
            </label>
          </>
        )}
        
        {/* Group input: always visible for all chart types */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          Group:
          <input
            type="text"
            value={filters.group || ''}
            onChange={e => onFilterChange({ ...filters, group: e.target.value })}
            placeholder="None"
            style={{ width: 60, height: 18, fontSize: 11 }}
          />
        </label>
        {chartType === 'line' && (
          <>
            {/* Overlay module selector */}
            {filters.modules && filters.overlayOptions && filters.overlaySelect && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                Overlay:
                <div style={{ minWidth: 140 }}>
                  {filters.overlaySelect}
                </div>
              </span>
            )}
            {/* Signal overlay selector */}
            {filters.signalOverlayOptions && filters.signalOverlaySelect && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                Signal:
                <div style={{ minWidth: 140 }}>
                  {filters.signalOverlaySelect}
                </div>
              </span>
            )}
          </>
        )}
        {/* Heatmap specific filters would go here if needed */}
        
        {/* Size control: for adjusting chart elements size (last position) */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          Size:
          <select 
            value={filters.chartSize || 'medium'} 
            onChange={e => onFilterChange({ ...filters, chartSize: e.target.value })} 
            style={{ minWidth: 60, height: 20, fontSize: 11 }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>
        
        {/* Toggle button - integrated in filter row when visible */}
        <button 
          onClick={toggleFilters} 
          title="Hide filters"
          style={{ 
            fontSize: 10, 
            padding: '0px 3px', 
            cursor: 'pointer',
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: 3,
            height: 16,
            width: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto'
          }}
        >
          −
        </button>
      </div>}
      <div style={{ minHeight: 200 }}>
        {children}
      </div>
    </div>
  );
}
