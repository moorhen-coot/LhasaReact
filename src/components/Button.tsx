import { forwardRef } from 'react';

export interface ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  primary?: boolean;
  outlined?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ onClick, disabled, primary, outlined, children }, ref) {
    const className = primary
      ? 'lhasa_button_primary'
      : outlined
        ? 'lhasa_button_outlined'
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
