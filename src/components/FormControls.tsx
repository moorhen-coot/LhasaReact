import { Children, cloneElement, isValidElement } from 'react';

export interface FormControlLabelProps {
  label: string | React.ReactNode;
  control: React.ReactNode;
  checked?: boolean;
  onChange?: (event: React.SyntheticEvent) => void;
  value?: string;
}

export function FormControlLabel({ label, control, checked, onChange, value }: FormControlLabelProps) {
  // Pass checked/onChange/value through to the control element
  let injectedControl = control;
  if (isValidElement(control)) {
    const props: Record<string, unknown> = {};
    if (checked !== undefined) props.checked = checked;
    if (onChange !== undefined) props.onChange = onChange;
    if (value !== undefined) props.value = value;
    if (Object.keys(props).length > 0) {
      injectedControl = cloneElement(control, props);
    }
  }

  return (
    <label className="lhasa_form_control_label">
      <span className="lhasa_form_control_label_control">{injectedControl}</span>
      <span className="lhasa_form_control_label_text">{label}</span>
    </label>
  );
}

export interface FormGroupProps {
  children?: React.ReactNode;
}

export function FormGroup({ children }: FormGroupProps) {
  return <div className="lhasa_form_group">{children}</div>;
}

export interface FormControlProps {
  children?: React.ReactNode;
}

export function FormControl({ children }: FormControlProps) {
  return <div className="lhasa_form_control">{children}</div>;
}

export interface RadioGroupProps {
  name?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  children?: React.ReactNode;
}

export function RadioGroup({ name, value, onChange, children }: RadioGroupProps) {
  return (
    <div className="lhasa_radio_group" role="radiogroup">
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        // Inject name, checked state, and onChange into FormControlLabel
        // which will further pass them to the Radio control
        const childValue = (child.props as Record<string, unknown>).value as string | undefined;
        const injectedProps: Record<string, unknown> = {};
        if (name !== undefined) injectedProps.name = name;
        if (childValue !== undefined) {
          injectedProps.checked = value === childValue;
        }
        injectedProps.onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          if (onChange && childValue !== undefined) {
            onChange(e, childValue);
          }
        };
        return cloneElement(child, injectedProps);
      })}
    </div>
  );
}
