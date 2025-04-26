// App.js
// Main dashboard for selecting and viewing financial instrument data

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ModuleList from './components/ModuleList';
import ModuleDashboard from './ModuleDashboard';
import { useInstruments, useInstrumentData } from './api';
import InstrumentChart from './components/InstrumentChart';
import InstrumentTable from './components/InstrumentTable';

const queryClient = new QueryClient();

/**
 * Dashboard
 * Purpose: Main dashboard component for selecting instrument, frequency, and date range,
 *          and for displaying the instrument chart and table.
 * Called from: src/frontend/src/App.js (as the main content inside the QueryClientProvider).
 */
function Dashboard() {
  const { data: instruments, isLoading, error } = useInstruments();
  const [frequency, setFrequency] = React.useState('daily');
  const [instrument, setInstrument] = React.useState('');
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });

  // Update instrument list when frequency changes
  React.useEffect(() => {
    setInstrument('');
  }, [frequency]);

  const {
    data: instrumentData,
    isLoading: loadingData,
    error: dataError
  } = useInstrumentData(frequency, instrument, dateRange);

  // instrumentData is now { data: [...], plot_columns: [...] }
  const processedData = instrumentData?.data || [];
  const plotColumns = instrumentData?.plot_columns || [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h2>Financial Instrument Viewer</h2>
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
      {processedData.length > 0 && (
        <>
          <InstrumentChart data={processedData} plotColumns={plotColumns} />
          <InstrumentTable data={processedData} />
        </>
      )}
      {processedData.length === 0 && (
        <div>No data found for selected instrument and date range.</div>
      )}
    </div>
  );
}

/**
 * App
 * Purpose: Root component that provides the React Query client context and renders the Dashboard.
 * Called from: src/frontend/src/index.js as the entry point for the React application.
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModuleList />} />
          <Route path="/module/:moduleName" element={<ModuleDashboard />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

