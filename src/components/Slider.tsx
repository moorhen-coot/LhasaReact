import { useCallback, useRef, useState, useEffect } from 'react';

export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  scale?: (value: number) => number;
  onChange?: (event: Event | React.SyntheticEvent, value: number) => void;
}

export function Slider({ value, min = 0, max = 100, step = 1, scale, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const currentValue = value ?? min;
  // Ref copy so getValueFromPosition doesn't churn on every value change during drag
  const currentValueRef = useRef(currentValue);
  currentValueRef.current = currentValue;

  // Position and onChange operate purely in the raw [min, max] domain (linear),
  // matching MUI: `scale` only transforms the displayed/aria value, never the
  // thumb position or the value reported to onChange.
  const fraction = (currentValue - min) / (max - min);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return currentValueRef.current;
      const rect = trackRef.current.getBoundingClientRect();
      let posFrac = (clientX - rect.left) / rect.width;
      posFrac = Math.max(0, Math.min(1, posFrac));

      const rawValue = min + posFrac * (max - min);
      // Snap to step
      const stepped = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      const newVal = getValueFromPosition(e.clientX);
      if (onChange) onChange(e, newVal);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getValueFromPosition, onChange]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newVal = getValueFromPosition(e.clientX);
      if (onChange) onChange(e, newVal);
    },
    [dragging, getValueFromPosition, onChange]
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newVal = currentValue;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        newVal = Math.min(max, currentValue + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        newVal = Math.max(min, currentValue - step);
      } else {
        return;
      }
      e.preventDefault();
      if (onChange) onChange(e, newVal);
    },
    [currentValue, min, max, step, onChange]
  );

  // Cleanup pointer capture on unmount
  useEffect(() => {
    return () => {
      setDragging(false);
    };
  }, []);

  return (
    <div
      className={`lhasa_slider${dragging ? ' lhasa_slider_dragging' : ''}`}
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="lhasa_slider_track">
        <div
          className="lhasa_slider_fill"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <div
        className="lhasa_slider_thumb"
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        aria-valuetext={(scale ? scale(currentValue) : currentValue).toFixed(2)}
        style={{ left: `${fraction * 100}%` }}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
