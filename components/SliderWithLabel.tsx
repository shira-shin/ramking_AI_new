"use client";

import { ChangeEvent } from "react";

export type SliderWithLabelProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

export default function SliderWithLabel({
  label,
  value,
  min = 1,
  max = 5,
  step = 1,
  onChange,
}: SliderWithLabelProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value));
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-gray-600">
        <span>{label.toUpperCase()}</span>
        <span className="tabular-nums text-gray-500">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full accent-primary-600"
      />
    </div>
  );
}
