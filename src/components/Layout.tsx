import { useEffect, useRef, useState } from 'react';

export interface GridProps {
  container?: boolean;
  columns?: number;
  size?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Grid({ container, columns, size, children, style }: GridProps) {
  if (container) {
    const cols = columns ?? 12;
    return (
      <div
        className="lhasa_grid_container"
        style={{
          ...style,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {children}
      </div>
    );
  }

  // Grid item
  const colSpan = size ?? 1;
  return (
    <div className="lhasa_grid_item" style={{ gridColumn: `span ${colSpan}`, ...style }}>
      {children}
    </div>
  );
}

export interface CollapseProps {
  in?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Collapse({ in: open, children, style }: CollapseProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const isOpen = open ?? false;

  useEffect(() => {
    if (isOpen && innerRef.current) {
      setHeight(innerRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen, children]);

  return (
    <div
      className={`lhasa_collapse${isOpen ? ' lhasa_collapse_open' : ''}`}
      style={{
        maxHeight: isOpen ? `${height}px` : '0px',
        overflow: 'hidden',
        transition: 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isOpen ? 1 : 0,
        ...style,
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

export interface LinearProgressProps {
  variant?: 'determinate';
  value?: number;
}

export function LinearProgress({ variant: _variant, value }: LinearProgressProps) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="lhasa_linear_progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="lhasa_linear_progress_bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
