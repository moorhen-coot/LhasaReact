// SVG icon components with paths sourced from Material Design icons.

interface SvgIconProps {
  className?: string;
}

function SvgIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function ChevronRight(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </SvgIcon>
  );
}

export function FileDownload(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M19 9h-4V3H9v6H5l7 7zM5 18v2h14v-2z" />
    </SvgIcon>
  );
}

export function FileUpload(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
    </SvgIcon>
  );
}

export function Image(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2M8.5 13.5l2.5 3.01L14.5 12l4.5 6H5z" />
    </SvgIcon>
  );
}

export function Redo(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7z" />
    </SvgIcon>
  );
}

export function Undo(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8" />
    </SvgIcon>
  );
}
