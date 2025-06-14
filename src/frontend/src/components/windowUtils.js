// windowUtils.js
// Utilities for saving, validating, and restoring window position and size

/**
 * Save the current window's position and size to localStorage under a unique key.
 * @param {string} windowId - Unique identifier for the window instance.
 */
export function saveWindowGeometry(windowId, group) {
  if (!windowId) return;
  const geometry = {
    left: window.screenX,
    top: window.screenY,
    width: window.outerWidth,
    height: window.outerHeight,
    screenWidth: window.screen.availWidth,
    screenHeight: window.screen.availHeight,
    savedAt: Date.now(),
    group: group || undefined,
  };
  localStorage.setItem(`moduleWindow_${windowId}`, JSON.stringify(geometry));
}

/**
 * Retrieve and validate saved geometry for a window. If invalid or off-screen, return null.
 * @param {string} windowId - Unique identifier for the window instance.
 * @returns {object|null} Validated geometry or null if not found/invalid.
 */
export function getValidWindowGeometry(windowId) {
  if (!windowId) return null;
  let geom;
  try {
    geom = JSON.parse(localStorage.getItem(`moduleWindow_${windowId}`));
  } catch { return null; }
  if (!geom || typeof geom !== 'object') return null;
  // Validate against current screen
  const {
    left, top, width, height, screenWidth, screenHeight
  } = geom;
  const curScreenW = window.screen.availWidth;
  const curScreenH = window.screen.availHeight;
  // If screen size changed significantly, ignore saved position
  if (Math.abs(curScreenW - screenWidth) > 100 || Math.abs(curScreenH - screenHeight) > 100) return null;
  // Ensure window fits on screen
  const safeLeft = Math.max(0, Math.min(left, curScreenW - 50));
  const safeTop = Math.max(0, Math.min(top, curScreenH - 50));
  const safeWidth = Math.min(width, curScreenW);
  const safeHeight = Math.min(height, curScreenH);
  // Return group if present (for restoration)
  const result = { left: safeLeft, top: safeTop, width: safeWidth, height: safeHeight };
  if ('group' in geom) result.group = geom.group;
  return result;
}

/**
 * Convert geometry object to a window.open features string.
 * @param {object} geom - { left, top, width, height }
 * @returns {string} Features string for window.open
 */
export function geometryToFeatures(geom) {
  if (!geom) return 'width=1000,height=800,left=100,top=100';
  const { left, top, width, height } = geom;
  return `width=${width},height=${height},left=${left},top=${top}`;
}
