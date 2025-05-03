// ModuleList.js
// Displays a list of available data manipulation modules and allows selection.

import React from 'react';
import { useModules } from '../api';
import { useNavigate } from 'react-router-dom';

export default function ModuleList() {
  const { data: modules, isLoading, error } = useModules();
  const navigate = useNavigate();
  const [group, setGroup] = React.useState('');

  if (isLoading) return <div>Loading modules...</div>;
  if (error) return <div style={{ color: 'red' }}>Error loading modules: {error.message}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, textAlign: 'center' }}>
      <h2>Select a Data Manipulation Module</h2>
      <div style={{ margin: '24px 0' }}>
        <label>
          <span style={{ marginRight: 8 }}>Group (optional, for linking):</span>
          <input
            type="text"
            value={group}
            onChange={e => setGroup(e.target.value)}
            placeholder="Enter group name"
            style={{ padding: '6px', borderRadius: 4, border: '1px solid #aaa', minWidth: 120 }}
          />
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
        {modules && modules.length > 0 ? (
          modules.map(mod => {
            const url = group ? `/module/${mod.module}?group=${encodeURIComponent(group)}` : `/module/${mod.module}`;
            return (
              <button
                key={mod.module}
                style={{
                  padding: '16px',
                  fontSize: '18px',
                  borderRadius: '8px',
                  border: '1px solid #888',
                  background: '#f7f7f7',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => window.open(url, '_blank')}
              >
                {mod.display_name}
              </button>
            );
          })
        ) : (
          <div>No modules found.</div>
        )}
      </div>
    </div>
  );
}
