import { useEffect, useRef, useState, useCallback } from 'react';

export interface AnchorOrigin {
  horizontal: 'left' | 'center' | 'right';
  vertical: 'top' | 'center' | 'bottom';
}

export interface UsePortalPositionOptions {
  anchorOrigin?: AnchorOrigin;
  transformOrigin?: AnchorOrigin;
  onClose?: () => void;
  level?: number;
}

type Position = { top: number; left: number };

export function usePortalPosition(
  anchorEl: HTMLElement | null | undefined,
  open: boolean,
  options: UsePortalPositionOptions = {}
) {
  const {
    anchorOrigin = { horizontal: 'left', vertical: 'bottom' },
    transformOrigin = { horizontal: 'left', vertical: 'top' },
  } = options;

  const [position, setPosition] = useState<Position | null>(null);
  const [visible, setVisible] = useState(false);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const measuringRef = useRef(false);

  const computePosition = useCallback(() => {
    if (!portalRef.current) return;

    const portalWidth = portalRef.current.offsetWidth;
    const portalHeight = portalRef.current.offsetHeight;

    let top: number;
    let left: number;

    if (anchorEl) {
      const anchorRect = anchorEl.getBoundingClientRect();

      // Compute top based on anchorOrigin.vertical
      switch (anchorOrigin.vertical) {
        case 'top':
          top = anchorRect.top;
          break;
        case 'center':
          top = anchorRect.top + anchorRect.height / 2;
          break;
        case 'bottom':
        default:
          top = anchorRect.bottom;
          break;
      }

      // Compute left based on anchorOrigin.horizontal
      switch (anchorOrigin.horizontal) {
        case 'left':
          left = anchorRect.left;
          break;
        case 'center':
          left = anchorRect.left + anchorRect.width / 2;
          break;
        case 'right':
          left = anchorRect.right;
          break;
      }
    } else {
      // No anchor — center on viewport
      top = window.innerHeight / 2 + window.scrollY;
      left = window.innerWidth / 2 + window.scrollX;
    }

    // Adjust based on transformOrigin
    switch (transformOrigin.vertical) {
      case 'top':
        break;
      case 'center':
        top -= portalHeight / 2;
        break;
      case 'bottom':
        top -= portalHeight;
        break;
    }

    switch (transformOrigin.horizontal) {
      case 'left':
        break;
      case 'center':
        left -= portalWidth / 2;
        break;
      case 'right':
        left -= portalWidth;
        break;
    }

    // Add scroll offsets (portal renders in document.body coordinates)
    top += window.scrollY;
    left += window.scrollX;

    // Viewport edge detection with a small margin.
    // For edge-anchored popups, flip to the opposite side of the anchor.
    // For center-anchored (or no-anchor) popups, just clamp to the viewport edge.
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;
    const isCenteredH = !anchorEl || anchorOrigin.horizontal === 'center';
    const isCenteredV = !anchorEl || anchorOrigin.vertical === 'center';

    if (left + portalWidth > viewportWidth + window.scrollX - margin) {
      if (isCenteredH) {
        left = viewportWidth + window.scrollX - portalWidth - margin;
      } else {
        left = anchorEl!.getBoundingClientRect().right - portalWidth + window.scrollX;
        if (left < window.scrollX + margin) left = window.scrollX + margin;
      }
    }
    if (left < window.scrollX + margin) {
      if (isCenteredH) {
        left = window.scrollX + margin;
      } else {
        left = anchorEl!.getBoundingClientRect().left + window.scrollX;
        if (left + portalWidth > viewportWidth + window.scrollX - margin) left = viewportWidth + window.scrollX - portalWidth - margin;
      }
    }

    if (top + portalHeight > viewportHeight + window.scrollY - margin) {
      if (isCenteredV) {
        top = viewportHeight + window.scrollY - portalHeight - margin;
      } else {
        top = anchorEl!.getBoundingClientRect().top - portalHeight + window.scrollY;
        if (top < window.scrollY + margin) top = window.scrollY + margin;
      }
    }
    if (top < window.scrollY + margin) {
      if (isCenteredV) {
        top = window.scrollY + margin;
      } else {
        top = anchorEl!.getBoundingClientRect().bottom + window.scrollY;
        if (top + portalHeight > viewportHeight + window.scrollY - margin) top = viewportHeight + window.scrollY - portalHeight - margin;
      }
    }

    setPosition({ top, left });
    setVisible(true);
  }, [anchorEl, anchorOrigin, transformOrigin]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      setVisible(false);
      measuringRef.current = false;
      return;
    }

    // When opening, mark as measuring so the portal renders off-screen.
    // The portal will render with visibility:hidden, allowing us to measure it.
    measuringRef.current = true;
    // Force a render with the portal in the DOM (off-screen)
    setPosition({ top: 0, left: 0 });
    setVisible(false);
  }, [open]);

  // After render (when portalRef is attached), compute the actual position
  useEffect(() => {
    if (open && measuringRef.current && portalRef.current) {
      measuringRef.current = false;
      // Use requestAnimationFrame so the browser has applied layout
      const raf = requestAnimationFrame(() => {
        computePosition();
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [open, position, computePosition]);

  // Re-position on scroll/resize while open
  useEffect(() => {
    if (!open || !visible) return;

    const onScroll = () => computePosition();
    const onResize = () => computePosition();

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, visible, computePosition]);

  // Re-position when the portal's own size changes (e.g., Bansu workflow steps)
  useEffect(() => {
    if (!open || !visible || !portalRef.current) return;

    const observer = new ResizeObserver(() => {
      computePosition();
    });
    observer.observe(portalRef.current);

    return () => {
      observer.disconnect();
    };
  }, [open, visible, computePosition, portalRef.current]);

  return { position, visible, portalRef };
}
