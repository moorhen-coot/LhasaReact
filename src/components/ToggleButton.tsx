export interface ToggleButtonProps {
  pressed?: boolean;
  selected?: boolean;
  onChange?: () => void;
  onClick?: () => void;
  value?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function ToggleButton({
  pressed,
  selected,
  onChange,
  onClick,
  value: _value,
  style,
  children,
}: ToggleButtonProps) {
  const isPressed = pressed ?? selected ?? false;
  const handleClick = onChange ?? onClick;

  return (
    <button
      aria-pressed={isPressed}
      className={`lhasa_toggle_button${isPressed ? ' lhasa_toggle_button_pressed' : ''}`}
      onClick={handleClick}
      style={{
        textTransform: 'none',
        padding: '0px',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
