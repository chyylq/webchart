// InstrumentTable.js
// Renders a React Table for instrument data

import React from 'react';
import { useTable } from 'react-table';

/**
 * InstrumentTable
 * Purpose: Renders a React Table for the selected instrument's time series data.
 * Called from: src/frontend/src/App.js (Dashboard component) to display the instrument data in tabular form.
 *
 * @param {Array} data - The instrument data to display (array of objects).
 */
export default function InstrumentTable({ data }) {
  // Use the keys of the first row as columns
  const columns = React.useMemo(() =>
    (data && data.length > 0)
      ? Object.keys(data[0]).map(key => ({ Header: key, accessor: key }))
      : [],
    [data]
  );

  const tableInstance = useTable({ columns, data: data || [] });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  // If no data, render nothing
  if (!data || data.length === 0) return <div>No data to display.</div>;

  return (
    <table {...getTableProps()} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()} style={{ borderBottom: '2px solid #ccc', padding: 6, background: '#f8f9fa' }}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()} style={{ border: '1px solid #eee', padding: 6 }}>{cell.render('Cell')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
