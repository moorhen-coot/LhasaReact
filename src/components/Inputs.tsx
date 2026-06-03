import { forwardRef, useId } from 'react';

export interface TextFieldProps {
  label?: string;
  id?: string;
  error?: string | null;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  type?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  standard?: boolean;
  min?: number;
  max?: number;
  defaultValue?: string;
  placeholder?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      id: idProp,
      error,
      value,
      onChange,
      onFocus,
      onBlur,
      style,
      type,
      disabled,
      size,
      standard,
      min,
      max,
      defaultValue,
      placeholder,
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = idProp ?? generatedId;
    const sizeClass = size === 'small' ? ' lhasa_textfield_small' : '';
    const variantClass = standard ? ' lhasa_textfield_standard' : ' lhasa_textfield_outlined';

    return (
      <div
        className={`lhasa_textfield${sizeClass}${variantClass}${error ? ' lhasa_textfield_error' : ''}`}
        style={style}
      >
        {label && (
          <label className="lhasa_textfield_label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className="lhasa_textfield_input"
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          min={min}
          max={max}
        />
        {error && <span className="lhasa_textfield_helper">{error}</span>}
      </div>
    );
  }
);

export interface InputProps {
  defaultValue?: string;
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ defaultValue, placeholder, onChange }, ref) {
    return (
      <input
        ref={ref}
        className="lhasa_input"
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  }
);

export interface SwitchProps {
  checked?: boolean;
  onChange?: (event: React.MouseEvent<HTMLButtonElement> | React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Switch({ checked, onChange, disabled, style }: SwitchProps) {
  return (
    <button
      role="switch"
      type="button"
      aria-checked={checked ?? false}
      className={`lhasa_switch${checked ? ' lhasa_switch_checked' : ''}`}
      onClick={(e) => {
        if (onChange) {
          // Adapt the MouseEvent to look like a ChangeEvent for compatibility
          onChange(e);
        }
      }}
      disabled={disabled}
      style={style}
    >
      <span className="lhasa_switch_thumb" />
    </button>
  );
}

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  style?: React.CSSProperties;
}

export function Checkbox({ checked, onChange, disabled, size, style }: CheckboxProps) {
  const sizeClass = size === 'small' ? ' lhasa_checkbox_small' : '';
  return (
    <input
      type="checkbox"
      className={`lhasa_checkbox${sizeClass}`}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      style={style}
    />
  );
}

export interface RadioProps {
  value?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Radio({ value, checked, onChange }: RadioProps) {
  return (
    <input
      type="radio"
      className="lhasa_radio"
      value={value}
      checked={checked}
      onChange={onChange}
    />
  );
}
