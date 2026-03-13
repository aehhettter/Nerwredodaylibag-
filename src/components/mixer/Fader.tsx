import React from 'react';

interface FaderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function Fader({ label, value, onChange }: FaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 flex-grow">
      <div className="w-1 h-32 bg-black/50 rounded-full flex justify-center py-1">
        <input
          type="range"
          min="0"
          max="127"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-8 h-full appearance-none bg-transparent cursor-pointer fader"
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
        />
      </div>
      <span className="font-mono text-xs text-neutral-400">{label}</span>
    </div>
  );
}
