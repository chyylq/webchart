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
    const columns = plotColumns && plotColumns.length > 0 ? plotColumns : [{ key: 'close', label: 'Close', yAxis: 'left' }];
    const colors = ['#007bff', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
    const traces = [];
    let hasRightAxis = false;
    columns.forEach((col, idx) => {
      const key = typeof col === 'string' ? col : col.key;
      const label = typeof col === 'string' ? col : col.label;
      const yAxis = (typeof col === 'object' && col.yAxis === 'right') ? 'y2' : 'y';
      if (yAxis === 'y2') hasRightAxis = true;
      // Main line trace
      traces.push({
        x: data.map(row => row.date),
        y: data.map(row => row[key]),
        type: 'scatter',
        mode: 'lines',
        name: label,
        line: { color: colors[idx % colors.length], width: 1 },
        showlegend: true,
        yaxis: yAxis,
      });
      // End marker trace
      if (data.length > 0) {
        traces.push({
          x: [data[data.length - 1].date],
          y: [data[data.length - 1][key]],
          type: 'scatter',
          mode: 'markers',
          marker: { color: colors[idx % colors.length], size: 4, symbol: 'circle' },
          name: label + ' (end)',
          showlegend: false,
          hoverinfo: 'x+y+name',
          yaxis: yAxis,
        });
      }
    });
    const layout = {
      title: 'Instrument Multi-Series Chart',
      xaxis: { title: 'Date' },
      yaxis: { title: 'Value', side: 'left' },
      margin: { t: 40, l: 60, r: hasRightAxis ? 60 : 30, b: 50 },
      autosize: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.13,
        font: { size: 10 },
        itemwidth: 80,
        borderwidth: 0,
      },
      hovermode: 'x unified', // Show all values at the same x (date)
      hoverlabel: { bgcolor: '#fff', bordercolor: '#1976d2', font: { color: '#222', size: 11 } },
    };
    if (hasRightAxis) {
      layout.yaxis2 = {
        title: 'Value (Right Y)',
        overlaying: 'y',
        side: 'right',
        showgrid: false,
      };
    }
    Plotly.newPlot(chartRef.current, traces, layout, {responsive: true});

    // Add vertical dashed line on hover (via shapes)
    function handleHover(eventData) {
      const xVal = eventData.points[0].x;
      Plotly.relayout(chartRef.current, {
        shapes: [{
          type: 'line',
          xref: 'x',
          yref: 'paper',
          x0: xVal,
          x1: xVal,
          y0: 0,
          y1: 1,
          line: { color: '#888', width: 2, dash: 'dash' },
        }],
      });
    }
    function handleUnhover() {
      Plotly.relayout(chartRef.current, { shapes: [] });
    }
    const plotElem = chartRef.current;
    plotElem.addEventListener('plotly_hover', handleHover);
    plotElem.addEventListener('plotly_unhover', handleUnhover);
    return () => {
      plotElem.removeEventListener('plotly_hover', handleHover);
      plotElem.removeEventListener('plotly_unhover', handleUnhover);
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
    return () => {
      if (chartRef.current) Plotly.purge(chartRef.current);
    };
  }, [data, plotColumns]);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
  );
}
