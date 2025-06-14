// ModuleDashboard.js
// Dashboard for a specific data manipulation module

import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useInstruments, useInstrumentData, useModules, useModuleChartTypes } from './api';
import { useQueries } from '@tanstack/react-query';
import InstrumentChart from './components/InstrumentChart';
import InstrumentTable from './components/InstrumentTable';
import InstrumentChartPanel from './components/InstrumentChartPanel';
import { saveWindowGeometry } from './components/windowUtils';
import Select from 'react-select';

// --- Signal overlay state and helpers ---
import { useQuery } from '@tanstack/react-query';
// Fetch available signals from backend
import { API_BASE } from './api';

function useAvailableSignals() {
  return useQuery({
    queryKey: ['signals'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/signals`);
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

  // Get moduleName and group
  const { moduleName } = useParams();

  // Fetch module chart type mapping
  const { data: moduleChartTypes, isLoading: loadingModuleChartTypes, error: moduleChartTypesError } = useModuleChartTypes();

  // Determine static chart type for this module (before instrumentData loads)
  const staticChartType = React.useMemo(() => {
    if (moduleChartTypes && moduleName) {
      return moduleChartTypes[moduleName] || 'line';
    }
    return 'line';
  }, [moduleChartTypes, moduleName]);

  React.useEffect(() => {
    if (moduleName && moduleChartTypes) {
      console.log('DEBUG staticChartType for', moduleName, ':', staticChartType);
    }
  }, [moduleName, moduleChartTypes, staticChartType]);
  const [group, setGroup] = React.useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('group') || '';
  });

  // --- BroadcastChannel for window close notification ---
  // Read windowId from URL
  const windowId = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('windowId') || '';
  }, []);

  // Save window geometry on move/resize
  React.useEffect(() => {
    if (!windowId) return;
    let timeout;
    let lastX = window.screenX;
    let lastY = window.screenY;
    const save = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveWindowGeometry(windowId);
      }, 200);
    };
    window.addEventListener('resize', save);
    window.addEventListener('move', save); // Include the move event (for browsers that support it)
    // Poll for window move (since 'move' event is unreliable)
    const pollMove = setInterval(() => {
      if (window.screenX !== lastX || window.screenY !== lastY) {
        lastX = window.screenX;
        lastY = window.screenY;
        save();
      }
    }, 1000);
    return () => {
      window.removeEventListener('resize', save);
      window.removeEventListener('move', save);
      clearTimeout(timeout);
      clearInterval(pollMove);
    };
  }, [windowId]);
  React.useEffect(() => {
    if (!window.BroadcastChannel || !windowId) return;
    const channel = new window.BroadcastChannel('module_window_channel');
    const handleBeforeUnload = () => {
      channel.postMessage({ type: 'close', windowId });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.close();
    };
  }, [windowId]);

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
  const { data: instruments, isLoading, error } = useInstruments();  // State for filters
  const [frequency, setFrequency] = React.useState('daily');
  const [instrument, setInstrument] = React.useState('');
  const [instrumentInput, setInstrumentInput] = React.useState('');
  const [chartSize, setChartSize] = React.useState('medium'); // Control chart element sizes

  const [source, setSource] = React.useState(() => {
    if (!modules) return 'remote';
    const current = modules.find(m => m.module === moduleName);
    return current && current.default_source ? current.default_source : 'remote';
  });
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });  

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
  // Update source default if moduleName changes or modules are loaded
  React.useEffect(() => {
    if (!modules) return;
    const current = modules.find(m => m.module === moduleName);
    setSource(current && current.default_source ? current.default_source : 'remote');
    
    // Update the browser title with the module display name
    const displayName = current?.display_name || moduleName;
    document.title = displayName;
  }, [moduleName, modules]);

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

  // --- Auto-refresh state ---
  const [autoRefresh, setAutoRefresh] = React.useState(true); // default ON
  const [statusText, setStatusText] = React.useState('');

  const {
    data: instrumentData,
    isLoading: loadingData,
    error: dataError,
    isFetching,
    isSuccess
  } = useInstrumentData(
    frequency,
    instrument,
    { ...dateRange, module: moduleName, source },
    autoRefresh ? 10000 : false // 10s polling if enabled, else off
  );

  // DEBUG: Log main module data whenever it loads or updates
  React.useEffect(() => {
    console.log('DEBUG instrumentData:', instrumentData, 'loading:', loadingData, 'error:', dataError);
  }, [instrumentData, loadingData, dataError]);


  // Update status text on every successful refresh
  React.useEffect(() => {
    if (isFetching) return;
    if (isSuccess) {
      const now = new Date();
      setStatusText(`Data refreshed at ${now.toLocaleTimeString()}`);
    }
  }, [isFetching, isSuccess]);

  // Step 2: Fetch overlay module data in parallel using useQueries
// Custom hook for overlay module data
function useOverlayModuleData(overlayModules, frequency, instrument, dateRange) {
  return useQueries({
    queries: overlayModules.map(overlay => ({
      queryKey: ['data', frequency, instrument, dateRange.start, dateRange.end, overlay.module],
      queryFn: async () => {
        if (!frequency || !instrument) return [];
        const url = new URL(`${API_BASE}/data/${frequency}/${instrument}`);
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
        const url = new URL(`${API_BASE}/signal/${sigOverlay.signal}/${frequency}/${instrument}`);
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

  // Use staticChartType before data loads, then instrumentData.chart_type if present
  const effectiveChartType = React.useMemo(() => {
    if (instrumentData && instrumentData.chart_type) {
      return instrumentData.chart_type;
    }
    return staticChartType;
  }, [instrumentData, staticChartType]);

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
      {console.log('DEBUG InstrumentChartPanel props:', { chartType: effectiveChartType, filters: {
        frequency,
        instrument,
        instrumentInput,
        dateRange,
        source,
        group,
        modules,
        instruments,
        availableSignals,
        signalsLoading,
        signalsError,
        ...(effectiveChartType === 'line' && {
          overlayModules,
          overlayOptions,
          overlayValue,
          overlaySelect: (
            <Select
              isMulti
              options={overlayOptions}
              value={overlayValue}
              onChange={handleOverlayChange}
              placeholder="Select overlays"
              styles={{ container: base => ({ ...base, minWidth: 120, maxWidth: 220 }) }}
            />
          ),
          signalOverlays,
          signalOverlayOptions,
          signalOverlayValue,
          signalOverlaySelect: (
            <Select
              isMulti
              options={signalOverlayOptions}
              value={signalOverlayValue}
              onChange={handleSignalOverlayChange}
              placeholder="Select signals"
              styles={{ container: base => ({ ...base, minWidth: 120, maxWidth: 220 }) }}
            />
          )
        })
      } })}
      <InstrumentChartPanel
        chartType={effectiveChartType}
        filters={{
          frequency,
          instrument,
          instrumentInput,
          source,
          group,
          chartSize,
          modules,
          instruments,
          availableSignals,
          signalsLoading,
          signalsError,
          ...(effectiveChartType === 'line' && {
            overlayModules,
            overlayOptions,
            overlayValue,
            overlaySelect: (
              <Select
                isMulti
                options={overlayOptions}
                value={overlayValue}
                onChange={handleOverlayChange}
                placeholder="Select overlays"
                styles={{ container: base => ({ ...base, minWidth: 120, maxWidth: 220 }) }}
              />
            ),
            signalOverlays,
            signalOverlayOptions,
            signalOverlayValue,
            signalOverlaySelect: (
              <Select
                isMulti
                options={signalOverlayOptions}
                value={signalOverlayValue}
                onChange={handleSignalOverlayChange}
                placeholder="Select signals"
                styles={{ container: base => ({ ...base, minWidth: 120, maxWidth: 220 }) }}
              />
            ),
            // Add-on filters for line chart only
            dateRange
          })
        }}
        onFilterChange={({ frequency, instrument, instrumentInput, dateRange, group, chartSize, overlayModules, signalOverlays }) => {
          if (frequency !== undefined) setFrequency(frequency);
          if (instrument !== undefined) setInstrument(instrument);
          if (instrumentInput !== undefined) setInstrumentInput(instrumentInput);
          if (dateRange !== undefined) setDateRange(dateRange);
          // Source is now controlled only by backend module defaults
          if (group !== undefined) setGroup(group);
          if (chartSize !== undefined) setChartSize(chartSize);
          if (overlayModules !== undefined) setOverlayModules(overlayModules);
          if (signalOverlays !== undefined) setSignalOverlays(signalOverlays);
        }}
      >
        {mergedData.length > 0 && (
          <InstrumentChart
            data={instrumentData}
            plotColumns={combinedPlotColumns}
            overlays={overlayModules}
            signalOverlays={signalOverlays}
            chartType={effectiveChartType}
            chartSize={chartSize}
          />
        )}
      </InstrumentChartPanel>
      {/* Data status below the chart, above the grid/table */}
      <div style={{ margin: '8px 0 0 0', fontWeight: 500, color: (loadingData || overlayQueries.some(q => q.isLoading)) ? '#888' : '#1976d2', fontSize: 11 }}>
        {(loadingData || overlayQueries.some(q => q.isLoading)) ? 'Fetching data' : (mergedData.length > 0 ? 'Data ready' : '')}
      </div>
      <div style={{ margin: '4px 0', display: 'flex', gap: 32, alignItems: 'center', fontSize: 11 }}>
        <label style={{ cursor: 'pointer', fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={showTable}
            onChange={e => setShowTable(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Show Data Table
        </label>
        <label style={{ cursor: 'pointer', fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Auto-refresh (every 10s)
        </label>
      </div>
      {showTable && <InstrumentTable data={mergedData} />}
      {mergedData.length === 0 && (
        <div style={{ fontSize: 11 }}>No data found for selected instrument and date range.</div>
      )}
      {/* Status text area at the bottom */}
      <div style={{ marginTop: 16, padding: 8, borderTop: '1px solid #ccc', color: '#1976d2', fontWeight: 500, fontSize: 11 }}>
        {statusText}
      </div>
    </div>
  );
}
