// Shared popup registry for click-outside and Escape handling.
// Used by both CustomMenu and CustomPopover so that nesting between
// the two component types works correctly.

interface PopupEntry {
  id: number;
  ref: HTMLElement;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  level: number;
}

let nextId = 0;
const popups: PopupEntry[] = [];
let handlerInstalled = false;
let onMouseDown: ((e: MouseEvent) => void) | null = null;
let onKeyDown: ((e: KeyboardEvent) => void) | null = null;

function installHandlers() {
  if (handlerInstalled) return;
  handlerInstalled = true;

  onMouseDown = (e: MouseEvent) => {
    const target = e.target as Node;

    // If target is inside any popup, do nothing
    for (const p of popups) {
      if (p.ref.contains(target)) return;
    }

    // Close every popup the click fell outside of (outside both the popup and
    // its anchor/trigger). Deepest first so children close before their parents.
    const sorted = [...popups].sort((a, b) => b.level - a.level);
    for (const p of sorted) {
      if (!p.anchorEl?.contains(target)) {
        p.onClose();
      }
    }
  };

  onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && popups.length > 0) {
      const sorted = [...popups].sort((a, b) => b.level - a.level);
      sorted[0]?.onClose();
    }
  };

  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('keydown', onKeyDown);
}

// Remove global listeners — call on HMR dispose or app teardown
export function disposePopupRegistry(): void {
  if (!handlerInstalled) return;
  if (onMouseDown) document.removeEventListener('mousedown', onMouseDown);
  if (onKeyDown) document.removeEventListener('keydown', onKeyDown);
  onMouseDown = null;
  onKeyDown = null;
  handlerInstalled = false;
}

// HMR cleanup (Vite)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposePopupRegistry();
  });
}

export function registerPopup(
  ref: HTMLElement,
  anchorEl: HTMLElement | null,
  onClose: () => void
): number {
  installHandlers();
  const id = nextId++;
  // Derive nesting depth from the DOM: a nested popup's anchor (e.g. a menu item)
  // lives inside its parent popup's portal, so this popup sits one level deeper
  // than the deepest already-open popup whose portal contains the anchor.
  let level = 0;
  if (anchorEl) {
    for (const p of popups) {
      if (p.ref.contains(anchorEl)) {
        level = Math.max(level, p.level + 1);
      }
    }
  }
  popups.push({ id, ref, anchorEl, onClose, level });
  return id;
}

export function unregisterPopup(id: number): void {
  const idx = popups.findIndex((p) => p.id === id);
  if (idx !== -1) {
    popups.splice(idx, 1);
  }
}
