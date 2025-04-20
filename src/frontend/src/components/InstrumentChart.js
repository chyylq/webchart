// InstrumentChart.js
// Renders a Plotly.js chart for instrument data

import React from 'react';
import Plotly from 'plotly.js/dist/plotly';

/**
 * InstrumentChart
 * Purpose: Renders a Plotly.js chart for the selected instrument's time series data.
 * Called from: src/frontend/src/App.js (Dashboard component) to visualize the instrument's closing prices.
 *
 * @param {Array} data - The instrument data to plot (array of objects with date, close, etc.).
 */
export default function InstrumentChart({ data, plotColumns }) {
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;
    const columns = plotColumns && plotColumns.length > 0 ? plotColumns : ['close'];
    const colors = ['#007bff', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
    const traces = columns.map((col, idx) => ({
      x: data.map(row => row.date),
      y: data.map(row => row[col]),
      type: 'scatter',
      mode: 'lines+markers',
      name: col,
      line: { color: colors[idx % colors.length] },
    }));
    const layout = {
      title: 'Instrument Close Price and Moving Averages',
      xaxis: { title: 'Date' },
      yaxis: { title: 'Value' },
      margin: { t: 40, l: 60, r: 30, b: 50 },
      autosize: true,
    };
    Plotly.newPlot(chartRef.current, traces, layout, {responsive: true});
    return () => {
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
  }, [data, plotColumns]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
  );
}
