import { forwardRef } from 'react';

export interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  primary?: boolean;
  outlined?: boolean;
  /** Borderless, primary-colored button — MUI's default Button variant. Used for menu-bar triggers. */
  borderless?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ onClick, disabled, primary, outlined, borderless, children }, ref) {
    const className = primary
      ? 'lhasa_button_primary'
      : outlined
        ? 'lhasa_button_outlined'
        : borderless
          ? 'lhasa_button_borderless'
          : 'lhasa_button';
    return (
      <button
        ref={ref}
        className={className}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
);

export interface IconButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  'aria-label'?: string;
  children?: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ onClick, 'aria-label': ariaLabel, children }, ref) {
    return (
      <button
        ref={ref}
        className="lhasa_icon_button"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }
);
