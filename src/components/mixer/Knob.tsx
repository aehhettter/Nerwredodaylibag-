import React from 'react';

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function Knob({ label, value, onChange }: KnobProps) {
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <input
        type="range"
        min="-100"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 h-4 appearance-none bg-neutral-700 rounded-full cursor-pointer"
      />
      <span className="font-mono text-xs text-neutral-400">{label}</span>
    </div>
  );
}
