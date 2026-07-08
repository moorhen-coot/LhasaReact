import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePortalPosition, AnchorOrigin } from './hooks/usePortalPosition';
import { registerPopup, unregisterPopup } from './hooks/popupRegistry';

export type { AnchorOrigin } from './hooks/usePortalPosition';

export interface CustomPopoverProps {
  open?: boolean;
  anchorEl?: HTMLElement | null;
  /// Element to position against, if different from `anchorEl`. `anchorEl` still
  /// defines the click-outside "exempt zone" (e.g. the toggle button), while this
  /// only drives placement. Use `anchorEl={null}` + `positionAnchorEl={...}` for a
  /// centered modal that dismisses on any click outside the popup itself.
  positionAnchorEl?: HTMLElement | null;
  anchorOrigin?: AnchorOrigin;
  transformOrigin?: AnchorOrigin;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function CustomPopover({
  open,
  anchorEl,
  positionAnchorEl,
  anchorOrigin,
  transformOrigin,
  onClose,
  className,
  children,
}: CustomPopoverProps) {
  const { position, visible, portalRef } = usePortalPosition(positionAnchorEl ?? anchorEl, open ?? false, {
    anchorOrigin: anchorOrigin ?? { horizontal: 'left', vertical: 'bottom' },
    transformOrigin: transformOrigin ?? { horizontal: 'left', vertical: 'top' },
    onClose,
  });

  // Register in the shared popup registry for click-outside detection
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
      className={`lhasa_popover${className ? ' ' + className : ''}`}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        visibility: visible ? 'visible' : 'hidden',
        zIndex: 1400,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
