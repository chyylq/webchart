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
// Accept chartTypes as a prop for flexibility, fallback to data.chart_types if present
export default function InstrumentChart({ data, plotColumns, chartTypes = null, signalOverlays = [], signalOverlayQueries = [] }) {
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    if (!data || !chartRef.current) return;
    // --- HEATMAP SUPPORT ---
    const chart_types = chartTypes || (data && data.chart_types) || {};
    if (chart_types && Object.values(chart_types).includes('heatmap')) {
      // Assume backend provides: data, x, y, heatmap_meta
      // Use integer indices for x/y and ticktext for axis labels, so matrix is categorical and not scaled
      const xLabels = data.x_labels || data.x;
      const yLabels = data.y_labels || data.y;
      const z = data.data;
      const xIndices = xLabels.map((_, i) => i);
      const yIndices = yLabels.map((_, i) => i);
      const trace = {
        z: z, // 2D array
        x: xIndices,
        y: yIndices,
        type: 'heatmap',
        colorscale: [[0, 'green'], [1, 'red']], // green to red
        // No reversescale needed; explicit colorscale
        colorbar: {
          title: (data.heatmap_meta && data.heatmap_meta.zlabel) || 'Value'
        },
        name: 'IV Surface',
        text: data.data.map(row => row.map(v => (v == null ? '' : v.toFixed(1)))), // show values
        texttemplate: '%{text}',
        textfont: { color: 'black', size: 11 },
        showscale: true
      };
      const layout = {
        title: 'IV Surface Heatmap',
        xaxis: {
          title: (data.heatmap_meta && data.heatmap_meta.xlabel) || 'X',
          tickvals: xIndices,
          ticktext: xLabels,
          automargin: true
        },
        yaxis: {
          title: (data.heatmap_meta && data.heatmap_meta.ylabel) || 'Y',
          tickvals: yIndices,
          ticktext: yLabels,
          automargin: true
        },
        autosize: true,
        margin: { t: 40, l: 60, r: 60, b: 50 },
        hovermode: 'closest',
        hoverlabel: { bgcolor: '#fff', bordercolor: '#1976d2', font: { color: '#222', size: 11 } },
      };
      Plotly.newPlot(chartRef.current, [trace], layout, {responsive: true});
      return;
    }
    // --- END HEATMAP SUPPORT ---
    if (!data || data.length === 0) return;
    const columns = plotColumns && plotColumns.length > 0 ? plotColumns : [{ key: 'close', label: 'Close', yAxis: 'left' }];
    const colors = ['#007bff', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
    const traces = [];
    let hasRightAxis = false;
    // Determine chart types for each column
    columns.forEach((col, idx) => {
      const key = typeof col === 'string' ? col : col.key;
      const label = typeof col === 'string' ? col : col.label;
      const yAxis = (typeof col === 'object' && col.yAxis === 'right') ? 'y2' : 'y';
      if (yAxis === 'y2') hasRightAxis = true;
      const chartType = chart_types[key] || 'line';
      if (chartType === 'bar') {
        traces.push({
          x: data.map(row => row.date),
          y: data.map(row => row[key]),
          type: 'bar',
          name: label,
          marker: { color: colors[idx % colors.length] },
          showlegend: true,
          yaxis: yAxis,
        });
      } else {
        // Default to line
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
      }
    });
    // --- Signal overlays as vertical lines ---
    // Overlays are added incrementally as their data loads
    const shapes = [];
    const signalLegend = [];
    signalOverlayQueries.forEach((q, i) => {
      if (!q.data || !Array.isArray(q.data)) return;
      const overlayConfig = signalOverlays[i];
      const signalName = overlayConfig && overlayConfig.signal;
      const colorMap = { 1: '#2ca02c', '-1': '#d62728' };
      q.data.forEach(ev => {
        if (!ev.date || ev.signal === undefined || ev.signal === 0) return;
        const color = colorMap[ev.signal] || '#888';
        shapes.push({
          type: 'line',
          xref: 'x',
          yref: 'paper',
          x0: ev.date,
          x1: ev.date,
          y0: 0,
          y1: 1,
          line: { color, width: 1, dash: 'dot' },
          name: signalName,
        });
      });
      // Add legend entry for this signal (one per overlay)
      signalLegend.push({
        color: colorMap[1], label: (signalName || 'Signal') + ' (Buy)', type: 'line' });
      signalLegend.push({
        color: colorMap[-1], label: (signalName || 'Signal') + ' (Sell)', type: 'line' });
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
      shapes,
    };
    if (hasRightAxis) {
      layout.yaxis2 = {
        title: 'Value (Right Y)',
        overlaying: 'y',
        side: 'right',
        showgrid: false,
      };
    }
    if (!chartRef.current.plotly) {
      Plotly.newPlot(chartRef.current, traces, layout, {responsive: true});
    } else {
      Plotly.react(chartRef.current, traces, layout);
    }

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
    };
  }, [data, plotColumns, signalOverlayQueries, signalOverlays]);

  React.useEffect(() => {
    if (!chartRef.current) return;
    if (chartRef.current.plotly) {
      Plotly.purge(chartRef.current);
    }
  }, []);

  return (
    <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
  );
}
