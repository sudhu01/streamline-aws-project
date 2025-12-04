'use client';

import { useState } from 'react';

type ToggleState = 'available' | 'connected';

interface StatusToggleProps {
  initialState?: ToggleState;
  onToggle?: (newState: ToggleState) => void;
}

export default function StatusToggle({
  initialState = 'available',
  onToggle,
}: StatusToggleProps) {
  const [status, setStatus] = useState<ToggleState>(initialState);
  const isConnected = status === 'connected';

  const handleToggle = (selectedState: ToggleState) => {
    if (status !== selectedState) {
      setStatus(selectedState);
      if (onToggle) onToggle(selectedState);
    }
  };

  return (
    <div 
      className="relative left-2 inline-flex h-12 w-64 items-center rounded-full bg-slate-200 p-1 hover:cursor-pointer"
      role="radiogroup"
    >
      {/* The Sliding Background Pill 
        - Moves using translate-x-full
        - Changes color based on state
      */}
      <div
        className={`
          absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]
          ${isConnected 
            ? 'translate-x-full bg-emerald-500' 
            : 'translate-x-0 bg-white'
          }
        `}
      />

      {/* 'Available' Button */}
      <button
        type="button"
        onClick={() => handleToggle('available')}
        role="radio"
        aria-checked={!isConnected}
        className={`
          z-10 flex-1 text-sm font-medium transition-colors duration-300
          ${!isConnected ? 'text-slate-800' : 'text-slate-500 hover:text-slate-600'}
        `}
      >
        Available
      </button>

      {/* 'Connected' Button */}
      <button
        type="button"
        onClick={() => handleToggle('connected')}
        role="radio"
        aria-checked={isConnected}
        className={`
          z-10 flex-1 text-sm font-medium transition-colors duration-300
          ${isConnected ? 'text-white' : 'text-slate-500 hover:text-slate-600'}
        `}
      >
        Connected
      </button>
    </div>
  );
}