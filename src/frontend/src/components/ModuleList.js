// ModuleList.js
// Displays a list of available data manipulation modules and allows selection.

import React from 'react';
import { useModules } from '../api';
import { useNavigate } from 'react-router-dom';
import { getValidWindowGeometry, geometryToFeatures } from './windowUtils';

export default function ModuleList() {
  // Track window handles for opened module windows
  const windowRefs = React.useRef([]);

  // Track if main window is closing
  const isMainWindowClosing = React.useRef(false);
  // Close all opened module windows when main window is closed
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      isMainWindowClosing.current = true;
      windowRefs.current.forEach(win => {
        if (win && !win.closed) {
          win.close();
        }
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
  const { data: modules, isLoading, error } = useModules();
  const navigate = useNavigate();
  const [group, setGroup] = React.useState('');

const [openedModules, setOpenedModules] = React.useState(() => {
  try {
    return JSON.parse(localStorage.getItem('openedModules') || '[]');
  } catch {
    return [];
  }
});

// BroadcastChannel: listen for module close messages
React.useEffect(() => {
  if (!window.BroadcastChannel) return;
  const channel = new window.BroadcastChannel('module_window_channel');
  channel.onmessage = (event) => {
    if (event.data && event.data.type === 'close') {
      const { windowId } = event.data;
      setOpenedModules(prev => {
        const updated = prev.filter(x => x.windowId !== windowId);
        // Only update localStorage if not closing all windows from main
        if (!isMainWindowClosing.current) {
          localStorage.setItem('openedModules', JSON.stringify(updated));
        }
        return updated;
      });
    }
  };
  return () => channel.close();
}, []);

  if (isLoading) return <div>Loading modules...</div>;
  if (error) return <div style={{ color: 'red' }}>Error loading modules: {error.message}</div>;


const reopenModule = mod => {
  const url = mod.group
    ? `/module/${mod.module}?group=${encodeURIComponent(mod.group)}&windowId=${encodeURIComponent(mod.windowId)}`
    : `/module/${mod.module}?windowId=${encodeURIComponent(mod.windowId)}`;
  // Try to restore geometry for this windowId
  const geom = getValidWindowGeometry(mod.windowId);
  const features = geometryToFeatures(geom);
  const win = window.open(url, '_blank', features);
  if (win) {
    windowRefs.current.push(win);
  }
};

// Close a module window by windowId and remove from openedModules/localStorage
function closeModuleWindow(windowId) {
  // Try to close the window if it's open and tracked
  const winIdx = windowRefs.current.findIndex(w => w && !w.closed && w.name === windowId);
  if (winIdx !== -1) {
    try { windowRefs.current[winIdx].close(); } catch {}
    windowRefs.current.splice(winIdx, 1);
  }
  // Remove from openedModules
  setOpenedModules(prev => {
    const updated = prev.filter(x => x.windowId !== windowId);
    localStorage.setItem('openedModules', JSON.stringify(updated));
    return updated;
  });
  // Remove geometry
  localStorage.removeItem(`moduleWindow_${windowId}`);
}

// Reset all saved window positions/geometries
function resetAllWindowPositions() {
  openedModules.forEach(mod => {
    localStorage.removeItem(`moduleWindow_${mod.windowId}`);
  });
  alert('All module window positions have been reset.');
}

return (
  <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, textAlign: 'center' }}>
    <button onClick={resetAllWindowPositions} style={{ float: 'right', marginBottom: 10, background: '', border: '1px solid #aaa', color: '#222', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
      Reset Child Window Positions
    </button>
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
    {/* Previously opened modules */}
    {openedModules.length > 0 && (
      <div style={{ margin: '16px 0', textAlign: 'left' }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>Previously Opened Modules:</div>
        {openedModules.map((mod, i) => (
          <span key={mod.windowId} style={{ display: 'inline-block', position: 'relative' }}>
            <button
              style={{
                margin: '2px 6px 2px 0', padding: '6px 10px', borderRadius: 6, border: '1px solid #aaa', fontSize: 15,
                background: '#e3f2fd', cursor: 'pointer'
              }}
              onClick={() => reopenModule(mod)}
              title={`Opened at: ${mod.openedAt ? new Date(mod.openedAt).toLocaleString() : ''}`}
            >
              {mod.module}{mod.group ? ` (group: ${mod.group})` : ''} [{mod.windowId.slice(-5)}]
            </button>
            <button
              style={{
                position: 'absolute', right: 2, top: 2,
                border: 'none', background: 'transparent', color: '#b71c1c', fontWeight: 'bold', cursor: 'pointer', fontSize: 18,
                lineHeight: 1, padding: 0
              }}
              title="Close this module window"
              onClick={() => closeModuleWindow(mod.windowId)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    )}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
      {modules && modules.length > 0 ? (
        modules.map(mod => {
          // Generate a unique windowId for each opened instance
          const windowId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const url = group
            ? `/module/${mod.module}?group=${encodeURIComponent(group)}&windowId=${encodeURIComponent(windowId)}`
            : `/module/${mod.module}?windowId=${encodeURIComponent(windowId)}`;
          return (
            <button
              key={mod.module + windowId}
              style={{
                padding: '16px',
                fontSize: '18px',
                borderRadius: '8px',
                border: '1px solid #888',
                background: '#f7f7f7',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() => {
  // Try to restore geometry for this windowId
  const geom = getValidWindowGeometry(windowId);
  const features = geometryToFeatures(geom);
  const win = window.open(url, '_blank', features);
  if (win) {
    windowRefs.current.push(win);
  }
  // Save every opened instance with unique windowId
  let opened = [];
  try {
    opened = JSON.parse(localStorage.getItem('openedModules') || '[]');
  } catch {}
  opened.push({ module: mod.module, group, windowId, openedAt: Date.now() });
  localStorage.setItem('openedModules', JSON.stringify(opened));
  setOpenedModules(opened);
}}

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
