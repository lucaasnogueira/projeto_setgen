"use client";

import * as React from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (val: number[]) => void;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value = [0],
  onValueChange,
  className = "",
  disabled = false,
}: SliderProps) {
  const currentVal = value[0] ?? min;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.([Number(e.target.value)]);
  };

  return (
    <div className={`relative flex w-full touch-none select-none items-center ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        disabled={disabled}
        onChange={handleChange}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
      />
    </div>
  );
}

