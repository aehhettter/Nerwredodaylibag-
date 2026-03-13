import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-neutral-800 border border-neutral-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {text}
      </div>
    </div>
  );
}
