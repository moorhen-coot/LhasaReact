import { useState, useCallback } from 'react';

export interface AccordionProps {
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

export function Accordion({ defaultExpanded = true, children }: AccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Find AccordionSummary and AccordionDetails children to render them properly
  const childrenArr = Array.isArray(children) ? children : [children];
  let summary: React.ReactNode = null;
  let details: React.ReactNode = null;

  for (const child of childrenArr) {
    if (child && typeof child === 'object' && 'type' in child) {
      const childType = (child as React.ReactElement).type;
      if (childType === AccordionSummary) {
        summary = child;
      } else if (childType === AccordionDetails) {
        details = child;
      }
    }
  }

  return (
    <div className={`lhasa_accordion${expanded ? ' lhasa_accordion_expanded' : ''}`}>
      <div
        className="lhasa_accordion_summary_wrapper"
        onClick={toggle}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {summary}
        <span className={`lhasa_accordion_arrow${expanded ? ' lhasa_accordion_arrow_expanded' : ''}`}>
          ▼
        </span>
      </div>
      <div className={`lhasa_accordion_details_wrapper${expanded ? ' lhasa_accordion_details_open' : ''}`}>
        <div className="lhasa_accordion_details_inner">{details}</div>
      </div>
    </div>
  );
}

export interface AccordionSummaryProps {
  children?: React.ReactNode;
}

export function AccordionSummary({ children }: AccordionSummaryProps) {
  return <div className="lhasa_accordion_summary">{children}</div>;
}

export interface AccordionDetailsProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function AccordionDetails({ children, style }: AccordionDetailsProps) {
  return (
    <div className="lhasa_accordion_details" style={style}>
      {children}
    </div>
  );
}
