// ModuleDashboard.js
// Dashboard for a specific data manipulation module

import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInstruments, useInstrumentData, useModules } from './api';
import { useQueries } from '@tanstack/react-query';
import InstrumentChart from './components/InstrumentChart';
import InstrumentTable from './components/InstrumentTable';
import Select from 'react-select';

export default function ModuleDashboard() {
  const { moduleName } = useParams();
  // Fetch available modules for overlay selection
  const { data: modules, isLoading: modulesLoading, error: modulesError } = useModules();
  // State for overlay modules: [{module: string, yAxis: 'left'|'right'}]
  const [overlayModules, setOverlayModules] = React.useState([]);

  // Helper: get available overlay modules (exclude main)
  const availableOverlayModules = React.useMemo(() => {
    if (!modules) return [];
    return modules.filter(m => m.module !== moduleName);
  }, [modules, moduleName]);

  // Handler for react-select multi-select
  const handleOverlayChange = (selectedOptions) => {
    const selected = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setOverlayModules(prev => selected.map(mod => {
      const found = prev.find(x => x.module === mod);
      return found ? found : { module: mod, yAxis: 'right' };
    }));
  };

  // For react-select: map modules to {value, label}
  const overlayOptions = availableOverlayModules.map(m => ({ value: m.module, label: m.display_name }));
  const overlayValue = overlayModules.map(x => {
    const mod = availableOverlayModules.find(m => m.module === x.module);
    return mod ? { value: mod.module, label: mod.display_name } : { value: x.module, label: x.module };
  });

  // Handler for Y-axis assignment
  const handleYAxisChange = (mod, yAxis) => {
    setOverlayModules(prev => prev.map(x => x.module === mod ? { ...x, yAxis } : x));
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const { data: instruments, isLoading, error } = useInstruments();
  const [frequency, setFrequency] = React.useState('daily');
  const [instrument, setInstrument] = React.useState('');
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [group, setGroup] = React.useState(searchParams.get('group') || '');

  // BroadcastChannel for instrument sync
  const channelRef = React.useRef(null);

  // Setup and cleanup BroadcastChannel
  React.useEffect(() => {
    if (!window.BroadcastChannel) return;
    if (channelRef.current) channelRef.current.close();
    channelRef.current = new window.BroadcastChannel('module_instrument_sync');
    const handler = (event) => {
      const msg = event.data;
      if (msg && msg.type === 'sync-instrument' && msg.group === group && msg.instrument !== instrument) {
        setInstrument(msg.instrument);
      }
    };
    channelRef.current.addEventListener('message', handler);
    return () => {
      channelRef.current && channelRef.current.close();
    };
  }, [group, instrument]);

  // Broadcast instrument changes
  React.useEffect(() => {
    if (!window.BroadcastChannel || !group) return;
    if (!channelRef.current) return;
    channelRef.current.postMessage({ type: 'sync-instrument', group, instrument });
    // eslint-disable-next-line
  }, [instrument, group]);

  React.useEffect(() => { setInstrument(''); }, [frequency]);

  // Keep URL in sync with group state
  React.useEffect(() => {
    if (group) {
      searchParams.set('group', group);
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete('group');
      setSearchParams(searchParams, { replace: true });
    }
  }, [group]);

  const {
    data: instrumentData,
    isLoading: loadingData,
    error: dataError
  } = useInstrumentData(frequency, instrument, { ...dateRange, module: moduleName });

  // Step 2: Fetch overlay module data in parallel using useQueries
// Custom hook for overlay module data
function useOverlayModuleData(overlayModules, frequency, instrument, dateRange) {
  return useQueries({
    queries: overlayModules.map(overlay => ({
      queryKey: ['data', frequency, instrument, dateRange.start, dateRange.end, overlay.module],
      queryFn: async () => {
        if (!frequency || !instrument) return [];
        const url = new URL(`http://localhost:8000/data/${frequency}/${instrument}`);
        if (dateRange.start) url.searchParams.append('start', dateRange.start);
        if (dateRange.end) url.searchParams.append('end', dateRange.end);
        if (overlay.module) url.searchParams.append('module', overlay.module);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      },
      enabled: !!frequency && !!instrument && !!overlay.module,
    }))
  });
}
// Use useOverlayModuleData only inside component
const overlayQueries = useOverlayModuleData(overlayModules, frequency, instrument, dateRange);

  // Merge all data on date
  const mergedData = React.useMemo(() => {
    if (!instrumentData || !instrumentData.data) return [];
    // Start with main module data
    let merged = [...instrumentData.data];
    // For each overlay, merge by date
    overlayQueries.forEach((q, i) => {
      if (!q.data || !q.data.data) return;
      const overlayData = q.data.data;
      // Merge overlayData into merged by date
      const overlayCols = q.data.plot_columns || [];
      merged = merged.map(row => {
        const overlayRow = overlayData.find(orow => orow.date === row.date);
        if (!overlayRow) return row;
        // Add each overlay column to this row
        const newRow = { ...row };
        overlayCols.forEach(col => {
          // Use unique column name: module_col
          newRow[`${overlayModules[i].module}__${col}`] = overlayRow[col];
        });
        return newRow;
      });
    });
    return merged;
  }, [instrumentData, overlayQueries, overlayModules]);

  // Build plotColumns array with yAxis info
  const combinedPlotColumns = React.useMemo(() => {
    if (!instrumentData || !instrumentData.plot_columns) return [];
    let result = instrumentData.plot_columns.map(col => ({
      key: col,
      label: modules?.find(m => m.module === moduleName)?.display_name + ' - ' + col,
      yAxis: 'left',
    }));
    overlayQueries.forEach((q, i) => {
      if (!q.data || !q.data.plot_columns) return;
      q.data.plot_columns.forEach(col => {
        result.push({
          key: `${overlayModules[i].module}__${col}`,
          label: (modules?.find(m => m.module === overlayModules[i].module)?.display_name || overlayModules[i].module) + ' - ' + col,
          yAxis: overlayModules[i].yAxis,
        });
      });
    });
    return result;
  }, [instrumentData, overlayQueries, overlayModules, modules, moduleName]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h2>Module: <span style={{ color: '#1976d2' }}>{moduleName}</span></h2>
      <div style={{ marginBottom: 18 }}>
        <label>
          <span style={{ marginRight: 8 }}>Group:</span>
          <input
            type="text"
            value={group}
            onChange={e => setGroup(e.target.value)}
            placeholder="None"
            style={{ padding: '6px', borderRadius: 4, border: '1px solid #aaa', minWidth: 120 }}
          />
        </label>
        {group && <span style={{ marginLeft: 12, color: '#1976d2' }}>(Linked group: {group})</span>}
      </div>
      {modulesLoading && <div>Loading modules...</div>}
      {modulesError && <div style={{ color: 'red' }}>Error loading modules: {modulesError.message}</div>}
      {/* Multi-series overlay UI */}
      {modules && (
        <div style={{ marginBottom: 18 }}>
          <label>
            <span style={{ marginRight: 8 }}>Overlay Modules:</span>
            <div style={{ display: 'inline-block', minWidth: 240, verticalAlign: 'middle' }}>
              <Select
                isMulti
                options={overlayOptions}
                value={overlayValue}
                onChange={handleOverlayChange}
                placeholder="Select overlay modules..."
                closeMenuOnSelect={false}
                styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
          </label>
          {/* Y-axis assignment for each selected overlay */}
          {overlayModules.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {overlayModules.map(x => (
                <div key={x.module} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ minWidth: 120 }}>{modules.find(m => m.module === x.module)?.display_name || x.module}</span>
                  <button
                    type="button"
                    onClick={() => handleYAxisChange(x.module, x.yAxis === 'left' ? 'right' : 'left')}
                    style={{
                      marginLeft: 12,
                      padding: '4px 12px',
                      borderRadius: 16,
                      border: '1px solid #888',
                      background: x.yAxis === 'left' ? '#e3f2fd' : '#ffe0b2',
                      color: '#333',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'background 0.2s',
                    }}
                  >
                    {x.yAxis === 'left' ? 'Left Y-axis' : 'Right Y-axis'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {isLoading && <div>Loading instruments...</div>}
      {error && <div style={{ color: 'red' }}>Error loading instruments: {error.message}</div>}
      {instruments && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <label>
            Frequency:
            <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ marginLeft: 8 }}>
              {Object.keys(instruments).map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </label>
          <label>
            Instrument:
            <select value={instrument} onChange={e => setInstrument(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">Select...</option>
              {instruments[frequency].map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
            {group && <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>(Synced in group)</span>}
          </label>
          <label>
            Start Date:
            <input type="date" value={dateRange.start} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))} style={{ marginLeft: 8 }} />
          </label>
          <label>
            End Date:
            <input type="date" value={dateRange.end} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))} style={{ marginLeft: 8 }} />
          </label>
        </div>
      )}
      {loadingData && <div>Loading data...</div>}
      {dataError && <div style={{ color: 'red' }}>Error loading data: {dataError.message}</div>}
      {mergedData.length > 0 && (
        <>
          <InstrumentChart data={mergedData} plotColumns={combinedPlotColumns} />
          {/* Data status below the chart, above the grid/table */}
          <div style={{ margin: '16px 0 0 0', fontWeight: 500, color: (loadingData || overlayQueries.some(q => q.isLoading)) ? '#888' : '#1976d2' }}>
            {(loadingData || overlayQueries.some(q => q.isLoading)) ? 'Fetching data' : (mergedData.length > 0 ? 'Data ready' : '')}
          </div>
          <InstrumentTable data={mergedData} />
        </>
      )}
      {mergedData.length === 0 && (
        <div>No data found for selected instrument and date range.</div>
      )}
    </div>
  );
}
