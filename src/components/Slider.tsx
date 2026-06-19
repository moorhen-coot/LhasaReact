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

  // Compute the fractional position (0 to 1) accounting for optional scale function
  const scaleMin = scale ? scale(min) : min;
  const scaleMax = scale ? scale(max) : max;
  const scaleVal = scale ? scale(currentValue) : currentValue;
  const fraction = (scaleVal - scaleMin) / (scaleMax - scaleMin);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return currentValueRef.current;
      const rect = trackRef.current.getBoundingClientRect();
      let posFrac = (clientX - rect.left) / rect.width;
      posFrac = Math.max(0, Math.min(1, posFrac));

      // Reverse the scale mapping if present
      const scaleMin_ = scale ? scale(min) : min;
      const scaleMax_ = scale ? scale(max) : max;
      const rawScaleVal = scaleMin_ + posFrac * (scaleMax_ - scaleMin_);

      let rawValue: number;
      if (scale) {
        // Binary search to invert the scale function (it's monotonic)
        let lo = min;
        let hi = max;
        for (let i = 0; i < 30; i++) {
          const mid = (lo + hi) / 2;
          const sv = scale(mid);
          if (sv < rawScaleVal) lo = mid;
          else hi = mid;
        }
        rawValue = (lo + hi) / 2;
      } else {
        rawValue = rawScaleVal;
      }

      // Snap to step
      const stepped = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step, scale]
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
        aria-valuetext={currentValue.toFixed(2)}
        style={{ left: `${fraction * 100}%` }}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
