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

function installHandlers() {
  if (handlerInstalled) return;
  handlerInstalled = true;

  document.addEventListener('mousedown', (e: MouseEvent) => {
    const target = e.target as Node;

    // If target is inside any popup, do nothing
    for (const p of popups) {
      if (p.ref.contains(target)) return;
    }

    // Close the deepest popup whose anchor does NOT contain the target
    const sorted = [...popups].sort((a, b) => b.level - a.level);
    for (const p of sorted) {
      if (!p.anchorEl?.contains(target)) {
        p.onClose();
        return;
      }
    }
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && popups.length > 0) {
      const sorted = [...popups].sort((a, b) => b.level - a.level);
      sorted[0]?.onClose();
    }
  });
}

export function registerPopup(
  ref: HTMLElement,
  anchorEl: HTMLElement | null,
  onClose: () => void,
  level: number
): number {
  installHandlers();
  const id = nextId++;
  popups.push({ id, ref, anchorEl, onClose, level });
  return id;
}

export function unregisterPopup(id: number): void {
  const idx = popups.findIndex((p) => p.id === id);
  if (idx !== -1) {
    popups.splice(idx, 1);
  }
}
