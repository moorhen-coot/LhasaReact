import { useCallback, useRef } from 'react';

export interface TabsProps {
  value?: number;
  onChange?: (event: React.SyntheticEvent, value: number) => void;
  children?: React.ReactNode;
}

export function Tabs({ value, onChange, children }: TabsProps) {
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent, tabValues: number[]) => {
      const currentIdx = value !== undefined ? tabValues.indexOf(value) : -1;
      let nextIdx = currentIdx;
      if (e.key === 'ArrowRight') {
        nextIdx = (currentIdx + 1) % tabValues.length;
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (currentIdx - 1 + tabValues.length) % tabValues.length;
      } else {
        return;
      }
      e.preventDefault();
      const nextValue = tabValues[nextIdx];
      if (onChange) onChange(e, nextValue);
      tabRefs.current.get(nextValue)?.focus();
    },
    [value, onChange]
  );

  const tabValues: number[] = [];
  const tabs = Array.isArray(children) ? children : [children];
  for (const tab of tabs) {
    if (tab && typeof tab === 'object' && 'props' in tab) {
      const tabValue = (tab as React.ReactElement<{ value?: number }>).props.value;
      if (tabValue !== undefined) {
        tabValues.push(tabValue);
      }
    }
  }

  return (
    <div className="lhasa_tabs" role="tablist" onKeyDown={(e) => onKeyDown(e, tabValues)}>
      {tabs.map((tab, i) => {
        if (!tab || typeof tab !== 'object' || !('props' in tab)) return tab;
        const tabEl = tab as React.ReactElement<{ value?: number; label?: string }>;
        const tabValue = tabEl.props.value ?? i;
        const isActive = value === tabValue;
        return (
          <button
            key={tabValue}
            ref={(el) => {
              if (el) tabRefs.current.set(tabValue, el);
              else tabRefs.current.delete(tabValue);
            }}
            role="tab"
            aria-selected={isActive}
            className={`lhasa_tab${isActive ? ' lhasa_tab_active' : ''}`}
            onClick={(e) => {
              if (onChange) onChange(e, tabValue);
            }}
            tabIndex={isActive ? 0 : -1}
          >
            {tabEl.props.label ?? String(tabValue)}
          </button>
        );
      })}
    </div>
  );
}

export interface TabProps {
  value?: number;
  label?: string;
}

export function Tab(_props: TabProps) {
  // Tab props are extracted by the parent Tabs component
  // Tab itself doesn't render — Tabs reads its props and renders buttons
  return null;
}
