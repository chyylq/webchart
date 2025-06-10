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
// Accept chartType as a string prop for clarity and contract consistency
export default function InstrumentChart({ data, plotColumns, chartType = null, signalOverlays = [], signalOverlayQueries = [], chartSize = 'medium' }) {
  // DEBUG: Log all props on every render
  console.log('[InstrumentChart RENDER]', { data, plotColumns, chartType, signalOverlays, signalOverlayQueries, chartSize });
  const chartRef = React.useRef(null);
  
  // Helper function to get size values based on chartSize
  const getSizeValues = () => {
    switch(chartSize) {
      case 'small':
        return {
          textSize: 6,
          titleSize: 9,
          tickSize: 5,
          legendSize: 6,
          margin: { t: 10, l: 30, r: 20, b: 20 }
        };
      case 'large':
        return {
          textSize: 11,
          titleSize: 15,
          tickSize: 10,
          legendSize: 11,
          margin: { t: 20, l: 50, r: 30, b: 30 }
        };
      case 'medium':
      default:
        return {
          textSize: 9,
          titleSize: 12,
          tickSize: 8,
          legendSize: 9,
          margin: { t: 15, l: 40, r: 25, b: 25 }
        };
    }
  };

  // Helper function to format dates as YYYYmmdd if the input is a date string
  const formatDateIfNeeded = (label) => {
    if (typeof label !== 'string') return label;
    
    // Check if the label matches YYYY-MM-DD format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(label)) {
      // Convert from YYYY-MM-DD to YYYYMMDD
      return label.replace(/-/g, '');
    }
    return label;
  };

  React.useEffect(() => {
    console.log('[InstrumentChart EFFECT] running', { data, chartType });
    if (!data || !chartRef.current) return;
    // If data is an array (matrix), this means the parent is passing the matrix directly, not the full instrumentData object
    if (Array.isArray(data)) {
      console.error('[InstrumentChart ERROR] "data" prop is an array, expected instrumentData object. Received:', data);
      return;
    }
    // --- HEATMAP SUPPORT ---
    // Log the full instrument data object
    console.log('[InstrumentChart EFFECT] FULL DATA:', data);
    // Assume chartType is a string (new contract)
    const isHeatmap = (chartType === 'heatmap') || (data && data.chart_type === 'heatmap');
    console.log('[InstrumentChart EFFECT] isHeatmap:', isHeatmap);
    if (isHeatmap) {
      // Support being passed either instrumentData or just the matrix
      let xLabels, yLabels, z;
      if (data && data.data_type === 'matrix') {
        // Passed instrumentData directly
        xLabels = data.x;
        yLabels = data.y_labels;
        z = data.data;
      } else {
        // Fallback (shouldn't happen for heatmap modules)
        xLabels = data.x;
        yLabels = data.y_labels;
        z = data.data;
      }
      // Defensive checks
      console.log('[Heatmap CHECK] typeof xLabels:', typeof xLabels, 'Array?', Array.isArray(xLabels), 'xLabels:', xLabels);
      console.log('[Heatmap CHECK] typeof yLabels:', typeof yLabels, 'Array?', Array.isArray(yLabels), 'yLabels:', yLabels);
      console.log('[Heatmap CHECK] typeof z:', typeof z, 'Array?', Array.isArray(z), 'z:', z);
      if (!Array.isArray(xLabels) || !Array.isArray(yLabels) || !Array.isArray(z)) {
        console.warn('[Heatmap WARNING] Missing or invalid xLabels, yLabels, or z', { xLabels, yLabels, z, data });
        return;
      }
      
      // Format date labels if they appear to be dates (YYYY-MM-DD)
      xLabels = xLabels.map(label => formatDateIfNeeded(label));
      yLabels = yLabels.map(label => formatDateIfNeeded(label));
      // DEBUG LOGGING
      console.log('[Heatmap DEBUG]', {
        chartType: chartType || (data && data.chart_type),
        xLabels,
        yLabels,
        z,
        data
      });
      const xIndices = xLabels.map((_, i) => i);
      const yIndices = yLabels.map((_, i) => i);
      // Get size values based on chartSize
      const sizeValues = getSizeValues();
      
      const trace = {
        z: z, // 2D array
        x: xIndices,
        y: yIndices,
        type: 'heatmap',
        colorscale: [[0, 'green'], [1, 'red']], // green to red
        // No reversescale needed; explicit colorscale
        colorbar: {
          title: (data.heatmap_meta && data.heatmap_meta.zlabel) || 'Value',
          titlefont: { size: sizeValues.titleSize },
          tickfont: { size: sizeValues.tickSize }
        },
        name: 'IV Surface',
        text: data.data.map(row => row.map(v => (v == null ? '' : v.toFixed(1)))), // show values
        texttemplate: '%{text}',
        textfont: { color: 'black', size: sizeValues.textSize },
        showscale: false // Hide the colorbar
      };
      const layout = {
        xaxis: {
          tickvals: xIndices,
          ticktext: xLabels,
          tickfont: { size: sizeValues.tickSize },
          automargin: false,  // Disable auto margin to make it more compact
          showline: true,
          ticks: 'outside',
          ticklen: 2
        },
        yaxis: {
          tickvals: yIndices,
          ticktext: yLabels,
          tickfont: { size: sizeValues.tickSize },
          automargin: false,  // Disable auto margin to make it more compact
          showline: true,
          ticks: 'outside',
          ticklen: 2
        },
        autosize: true,
        margin: sizeValues.margin,
        hovermode: 'closest',
        hoverlabel: { bgcolor: '#fff', bordercolor: '#1976d2', font: { color: '#222', size: sizeValues.textSize } },
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
    
    // Get size values based on chartSize for all chart types
    const sizeValues = getSizeValues();
    // Use the global chartType (string) for all columns
    columns.forEach((col, idx) => {
      const key = typeof col === 'string' ? col : col.key;
      const label = typeof col === 'string' ? col : col.label;
      const yAxis = (typeof col === 'object' && col.yAxis === 'right') ? 'y2' : 'y';
      if (yAxis === 'y2') hasRightAxis = true;
      const chartTypeToUse = chartType || (data && data.chart_type) || 'line';
      if (chartTypeToUse === 'bar') {
        traces.push({
          x: data.map(row => row.date),
          y: data.map(row => row[key]),
          type: 'bar',
          name: label,
          marker: { color: colors[idx % colors.length] },
          showlegend: true,
          yaxis: yAxis,
          textfont: { size: sizeValues.textSize },
        });
      } else {
        // Default to line
        traces.push({
          x: data.map(row => row.date),
          y: data.map(row => row[key]),
          type: 'scatter',
          mode: 'lines',
          name: label,
          line: { color: colors[idx % colors.length], width: chartSize === 'small' ? 1 : (chartSize === 'large' ? 2 : 1.5) },
          showlegend: true,
          yaxis: yAxis,
          textfont: { size: sizeValues.textSize },
        });
        // End marker trace
        if (data.length > 0) {
          traces.push({
            x: [data[data.length - 1].date],
            y: [data[data.length - 1][key]],
            type: 'scatter',
            mode: 'markers',
            marker: { color: colors[idx % colors.length], size: chartSize === 'small' ? 3 : (chartSize === 'large' ? 6 : 4), symbol: 'circle' },
            name: label + ' (end)',
            showlegend: false,
            hoverinfo: 'x+y+name',
            yaxis: yAxis,
            textfont: { size: sizeValues.textSize },
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
          line: { color, width: chartSize === 'small' ? 1 : (chartSize === 'large' ? 2 : 1.5), dash: 'dot' },
          name: signalName,
        });
      });
      // Add legend entry for this signal (one per overlay)
      signalLegend.push({
        color: colorMap[1], label: (signalName || 'Signal') + ' (Buy)', type: 'line' });
      signalLegend.push({
        color: colorMap[-1], label: (signalName || 'Signal') + ' (Sell)', type: 'line' });
    });

    // Use the already defined sizeValues from above
    const layout = {
      xaxis: {
        tickfont: { size: sizeValues.tickSize },
        automargin: false,  // Disable auto margin to make it more compact
        showline: true,
        ticks: 'outside',
        ticklen: 2
      },
      yaxis: { 
        side: 'left',
        tickfont: { size: sizeValues.tickSize },
        automargin: false,  // Disable auto margin to make it more compact
        showline: true,
        ticks: 'outside',
        ticklen: 2
      },
      margin: sizeValues.margin,
      autosize: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.13,
        font: { size: sizeValues.legendSize },
        itemwidth: 80,
        borderwidth: 0,
      },
      hovermode: 'x unified', // Show all values at the same x (date)
      hoverlabel: { bgcolor: '#fff', bordercolor: '#1976d2', font: { color: '#222', size: sizeValues.textSize } },
      shapes,
    };
    if (hasRightAxis) {
      layout.yaxis2 = {
        title: {
          text: 'Value (Right Y)',
          font: { size: sizeValues.titleSize }
        },
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        tickfont: { size: sizeValues.tickSize }
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
