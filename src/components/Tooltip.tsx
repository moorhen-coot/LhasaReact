import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  title: string | React.ReactNode;
  enterDelay?: number;
  enterNextDelay?: number;
  disableInteractive?: boolean;
  children?: React.ReactNode;
}

export function Tooltip({
  title,
  enterDelay = 1000,
  enterNextDelay = 1000,
  disableInteractive,
  children,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [tipCoords, setTipCoords] = useState<{ top: number; left: number } | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const clearTimers = useCallback(() => {
    if (enterTimerRef.current !== null) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  // When the portal DOM node appears, measure and position
  const tipRefCallback = useCallback((node: HTMLDivElement | null) => {
    tipRef.current = node;
    if (node && wrapperRef.current) {
      // Wait for layout
      requestAnimationFrame(() => {
        if (!node || !wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const tipHeight = node.offsetHeight;
        const tipWidth = node.offsetWidth;

        let top = rect.top + window.scrollY - tipHeight - 4;
        let left = rect.left + window.scrollX + rect.width / 2 - tipWidth / 2;

        if (top < window.scrollY + 4) {
          top = rect.bottom + window.scrollY + 4;
        }
        if (left < window.scrollX + 4) {
          left = window.scrollX + 4;
        }
        if (left + tipWidth > window.innerWidth + window.scrollX - 4) {
          left = window.innerWidth + window.scrollX - tipWidth - 4;
        }

        setTipCoords({ top, left });
      });
    }
  }, []);

  const show = useCallback(() => {
    clearTimers();
    enterTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, enterDelay);
  }, [enterDelay, clearTimers]);

  const showNext = useCallback(() => {
    clearTimers();
    enterTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, enterNextDelay);
  }, [enterNextDelay, clearTimers]);

  const dismiss = useCallback(() => {
    clearTimers();
    setVisible(false);
    setTipCoords(null);
  }, [clearTimers]);

  const hide = useCallback(() => {
    clearTimers();
    leaveTimerRef.current = setTimeout(dismiss, 100);
  }, [clearTimers, dismiss]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const offScreen = tipCoords === null;

  return (
    <span
      ref={wrapperRef}
      className="lhasa_tooltip_wrapper"
      onMouseEnter={visible ? showNext : show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tipRefCallback}
            className={`lhasa_tooltip_popup${disableInteractive ? ' lhasa_tooltip_noninteractive' : ''}`}
            style={{
              position: 'absolute',
              top: offScreen ? -9999 : tipCoords.top,
              left: offScreen ? -9999 : tipCoords.left,
              visibility: offScreen ? 'hidden' : 'visible',
              zIndex: 1500,
            }}
            onMouseEnter={() => {
              if (!disableInteractive) clearTimers();
            }}
            onMouseLeave={hide}
          >
            <div className="lhasa_tooltip_content">{title}</div>
          </div>,
          document.body
        )}
    </span>
  );
}
