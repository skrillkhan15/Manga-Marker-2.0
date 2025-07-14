
"use client";

import React from 'react';

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#78716c'  // gray
];

const noColor = ''; // Represents clearing the color

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="p-2">
      <div className="grid grid-cols-7 gap-2 mb-4">
        <button
            onClick={() => onChange(noColor)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background hover:border-primary/50 ${!color ? 'border-primary' : 'border-transparent'}`}
            aria-label="No color"
        >
            <div className="w-4/5 h-px bg-red-500 transform rotate-45 absolute"></div>
        </button>
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-primary' : 'border-transparent'} hover:border-primary/50`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: color }}></div>
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#... or name"
          className="w-full p-1 text-sm border rounded bg-transparent"
        />
      </div>
    </div>
  );
}
