// ModuleDashboard.js
// Dashboard for a specific data manipulation module

import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInstruments, useInstrumentData, useModules } from './api';
import { useQueries } from '@tanstack/react-query';
import InstrumentChart from './components/InstrumentChart';
import InstrumentTable from './components/InstrumentTable';
import Select from 'react-select';

// --- Signal overlay state and helpers ---
import { useQuery } from '@tanstack/react-query';

// Fetch available signals from backend
function useAvailableSignals() {
  return useQuery({
    queryKey: ['signals'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/signals');
      if (!res.ok) throw new Error('Failed to fetch signals');
      return res.json();
    }
  });
}

export default function ModuleDashboard() {
  // Table visibility state
  const [showTable, setShowTable] = React.useState(false);
  // --- Signal overlay state ---
  const [signalOverlays, setSignalOverlays] = React.useState([]); // [{signal: string, params: {}}]

  // Fetch signals from backend
  const { data: availableSignals, isLoading: signalsLoading, error: signalsError } = useAvailableSignals();

  // Handler for signal overlay selection
  const handleSignalOverlayChange = (selectedOptions) => {
    const selected = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setSignalOverlays(prev => selected.map(sig => {
      const found = prev.find(x => x.signal === sig);
      return found ? found : { signal: sig, params: {} };
    }));
  };

  const signalOverlayOptions = (availableSignals || []).map(s => ({ value: s.value, label: s.label }));
  const signalOverlayValue = signalOverlays.map(x => {
    const sig = (availableSignals || []).find(s => s.value === x.signal);
    return sig ? { value: sig.value, label: sig.label } : { value: x.signal, label: x.signal };
  });

  // Handler for signal parameter change
  const handleSignalParamChange = (signal, key, value) => {
    setSignalOverlays(prev => prev.map(x => x.signal === signal ? {
      ...x,
      params: { ...x.params, [key]: value }
    } : x));
  };

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
  const [instrumentInput, setInstrumentInput] = React.useState('');
  // Default to 'remote' for surface_d2e_iv_chart, otherwise 'local'
  const [source, setSource] = React.useState(() => (moduleName === 'surface_d2e_iv_chart' ? 'remote' : 'local'));
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

  // Sync instrumentInput with instrument when instrument changes (for group sync or after fetch)
  React.useEffect(() => { setInstrumentInput(instrument); }, [instrument]);
  // Update source default if moduleName changes
  React.useEffect(() => {
    setSource(moduleName === 'surface_d2e_iv_chart' ? 'remote' : 'local');
  }, [moduleName]);

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
  } = useInstrumentData(frequency, instrument, { ...dateRange, module: moduleName, source });

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

// --- Custom hook for signal overlay data ---
function useSignalOverlayData(signalOverlays, frequency, instrument, dateRange) {
  return useQueries({
    queries: signalOverlays.map(sigOverlay => ({
      queryKey: [
        'signal',
        sigOverlay.signal,
        frequency,
        instrument,
        dateRange.start,
        dateRange.end,
        ...Object.entries(sigOverlay.params).flat()
      ],
      queryFn: async () => {
        if (!frequency || !instrument || !sigOverlay.signal) return [];
        const url = new URL(`http://localhost:8000/signal/${sigOverlay.signal}/${frequency}/${instrument}`);
        if (dateRange.start) url.searchParams.append('start', dateRange.start);
        if (dateRange.end) url.searchParams.append('end', dateRange.end);
        // Add signal-specific params
        Object.entries(sigOverlay.params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
        });
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch signal data');
        return res.json();
      },
      enabled: !!frequency && !!instrument && !!sigOverlay.signal,
    }))
  });
}
// Use useSignalOverlayData only inside component
const signalOverlayQueries = useSignalOverlayData(signalOverlays, frequency, instrument, dateRange);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
  <label style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
    Source:
    <span style={{ display: 'flex', gap: 10, marginLeft: 10 }}>
      <label style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
        <input
          type="radio"
          name="source"
          value="local"
          checked={source === 'local'}
          onChange={() => setSource('local')}
          style={{ marginRight: 4 }}
        /> Local
      </label>
      <label style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
        <input
          type="radio"
          name="source"
          value="remote"
          checked={source === 'remote'}
          onChange={() => setSource('remote')}
          style={{ marginRight: 4 }}
        /> Remote
      </label>
    </span>
  </label>
  <label style={{ marginLeft: 20, display: 'flex', alignItems: 'center', marginBottom: 0 }}>
    Instrument:
    <input
      type="text"
      value={instrumentInput}
      onChange={e => setInstrumentInput(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') setInstrument(instrumentInput);
      }}
      style={{ marginLeft: 8, padding: '6px', borderRadius: 4, border: '1px solid #aaa', width: 110 }}
      placeholder="Enter ticker"
    />
    {group && <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>(Synced in group)</span>}
  </label>
</div>
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
          {/* --- Signal Overlay UI --- */}
          <div style={{ marginTop: 24 }}>
            <label>
              <span style={{ marginRight: 8 }}>Signal Overlays:</span>
              <div style={{ display: 'inline-block', minWidth: 240, verticalAlign: 'middle' }}>
                {signalsLoading ? (
                  <div style={{ color: '#888', fontStyle: 'italic', padding: '6px 0' }}>Loading signals...</div>
                ) : signalsError ? (
                  <div style={{ color: 'red', fontStyle: 'italic', padding: '6px 0' }}>Error loading signals</div>
                ) : (
                  <Select
                    isMulti
                    options={signalOverlayOptions}
                    value={signalOverlayValue}
                    onChange={handleSignalOverlayChange}
                    placeholder={signalOverlayOptions.length === 0 ? 'No signals available' : 'Select signals...'}
                    closeMenuOnSelect={false}
                    styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
                  />
                )}
              </div>
            </label>
            {/* Signal parameter UI for each selected signal */}
            {signalOverlays.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {signalOverlays.map(x => {
                  const sig = (availableSignals || []).find(s => s.value === x.signal);
                  if (!sig) return null;
                  return (
                    <div key={x.signal} style={{ marginBottom: 8, paddingLeft: 16 }}>
                      <span style={{ fontWeight: 500 }}>{sig.label} parameters:</span>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        {sig.params.map(p => (
                          <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {p.label}:
                            <input
                              type={p.type}
                              value={x.params[p.key] !== undefined ? x.params[p.key] : p.default}
                              min={p.min}
                              max={p.max}
                              onChange={e => handleSignalParamChange(x.signal, p.key, e.target.value)}
                              style={{ width: 60, marginLeft: 4 }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* --- End Signal Overlay UI --- */}
        </div>
      )}
      {isLoading && <div>Loading instruments...</div>}
      {error && <div style={{ color: 'red' }}>Error loading instruments: {error.message}</div>}
      {loadingData && <div>Loading data...</div>}
      {dataError && <div style={{ color: 'red' }}>Error loading data: {dataError.message}</div>}
      {mergedData.length > 0 && (
        <>
           <InstrumentChart 
              data={mergedData} 
              plotColumns={combinedPlotColumns}
              chartTypes={instrumentData && instrumentData.chart_types}
              signalOverlays={signalOverlays}
              signalOverlayQueries={signalOverlayQueries}
            />
          {/* Data status below the chart, above the grid/table */}
          <div style={{ margin: '16px 0 0 0', fontWeight: 500, color: (loadingData || overlayQueries.some(q => q.isLoading)) ? '#888' : '#1976d2' }}>
            {(loadingData || overlayQueries.some(q => q.isLoading)) ? 'Fetching data' : (mergedData.length > 0 ? 'Data ready' : '')}
          </div>
          <div style={{ margin: '8px 0' }}>
            <label style={{ cursor: 'pointer', fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={showTable}
                onChange={e => setShowTable(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Show Data Table
            </label>
          </div>
          {showTable && <InstrumentTable data={mergedData} />}
        </>
      )}
      {mergedData.length === 0 && (
        <div>No data found for selected instrument and date range.</div>
      )}
    </div>
  );
}
