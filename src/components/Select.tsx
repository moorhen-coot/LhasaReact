export interface SelectProps {
  value?: number | string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function Select({ value, onChange, disabled, className, style, children }: SelectProps) {
  return (
    <select
      className={`lhasa_select${className ? ' ' + className : ''}`}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={style}
    >
      {children}
    </select>
  );
}

export interface MenuItemProps {
  value: number | string;
  children?: React.ReactNode;
}

export function SelectMenuItem({ value, children }: MenuItemProps) {
  return <option value={value}>{children}</option>;
}
