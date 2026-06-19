import { createContext, useEffect, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { usePortalPosition } from './hooks/usePortalPosition';
import { registerPopup, unregisterPopup } from './hooks/popupRegistry';

// --- MenuContext (kept for potential future use by nested components) ---

interface MenuContextValue {
  registerPopup: typeof registerPopup;
  unregisterPopup: typeof unregisterPopup;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

// --- CustomMenu ---

export interface CustomMenuProps {
  open?: boolean;
  anchorEl?: HTMLElement | null;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function CustomMenu({ open, anchorEl, onClose, className, children }: CustomMenuProps) {
  const { position, visible, portalRef } = usePortalPosition(anchorEl, open ?? false, {
    anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
    transformOrigin: { horizontal: 'left', vertical: 'top' },
    onClose,
  });

  // Register this popup in the shared registry for click-outside detection
  useEffect(() => {
    if (!open || !portalRef.current || !visible) return;
    const id = registerPopup(portalRef.current, anchorEl ?? null, onClose ?? (() => {}));
    return () => {
      unregisterPopup(id);
    };
  }, [open, anchorEl, onClose, portalRef.current, visible]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={portalRef}
      className={`lhasa_menu${className ? ' ' + className : ''}`}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        visibility: visible ? 'visible' : 'hidden',
        zIndex: 1400,
      }}
      role="menu"
    >
      {children}
    </div>,
    document.body
  );
}

// --- CustomMenuItem ---

export interface CustomMenuItemProps {
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  children?: React.ReactNode;
  onMouseEnter?: (event: React.MouseEvent) => void;
}

export const CustomMenuItem = forwardRef<HTMLDivElement, CustomMenuItemProps>(
  function CustomMenuItem({ onClick, children, onMouseEnter }, ref) {
    return (
      <div
        ref={ref}
        className="lhasa_menu_item"
        role="menuitem"
        tabIndex={0}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e);
          }
        }}
      >
        {children}
      </div>
    );
  }
);
