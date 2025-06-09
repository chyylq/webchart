// api.js
// Utilities for fetching data from the FastAPI backend

import { useQuery } from '@tanstack/react-query';

const API_BASE = 'http://localhost:8000';

/**
 * useModuleChartTypes
 * Purpose: Fetches the mapping of module name to chart_type from the FastAPI backend.
 * Called from: ModuleDashboard or other components to determine chart type before data loads.
 */
export function useModuleChartTypes() {
  return useQuery({
    queryKey: ['module_chart_types'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/module_chart_types`);
      if (!res.ok) throw new Error('Failed to fetch module chart types');
      return res.json();
    }
  });
}

/**
 * useModules
 * Purpose: Fetches the list of available data manipulation modules from the FastAPI backend.
 * Called from: Main page to display module selection.
 */
export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/modules`);
      if (!res.ok) throw new Error('Failed to fetch modules');
      return res.json();
    }
  });
}

/**
 * useInstruments
 * Purpose: Fetches the list of available instruments (by frequency) from the FastAPI backend.
 * Called from: src/frontend/src/App.js (Dashboard component) to populate the frequency and instrument dropdowns.
 */
export function useInstruments() {
  return useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/instruments`);
      if (!res.ok) throw new Error('Failed to fetch instruments');
      return res.json();
    }
  });
}

/**
 * useInstrumentData
 * Purpose: Fetches time series data for the selected instrument and frequency from the FastAPI backend.
 * Called from: src/frontend/src/App.js (Dashboard component) whenever the user selects a frequency/instrument or changes date range.
 *
 * @param {string} frequency - The frequency of the data ('daily' or 'hourly').
 * @param {string} instrument - The selected instrument name.
 * @param {object} params - Optional date range (start, end).
 */
export function useInstrumentData(frequency, instrument, params = {}, refetchInterval = 10000) {
  return useQuery({
    queryKey: [
      'data',
      frequency,
      instrument,
      params.start,
      params.end,
      params.module,
      params.source // Ensure cache key includes source
    ],
    queryFn: async () => {
      if (!frequency || !instrument) return [];
      const url = new URL(`${API_BASE}/data/${frequency}/${instrument}`);
      if (params.start) url.searchParams.append('start', params.start);
      if (params.end) url.searchParams.append('end', params.end);
      if (params.module) url.searchParams.append('module', params.module);
      if (params.source) url.searchParams.append('source', params.source);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch data');
      // The backend now returns { data: [...], plot_columns: [...] }
      return res.json();
    },
    refetchInterval,
    enabled: !!frequency && !!instrument
  });
}
