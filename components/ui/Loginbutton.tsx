import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return (
    <button
      className="relative px-6 py-2 hover:cursor-pointer bg-slate-950 text-cyan-400 font-medium border border-cyan-400/50 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all duration-200 group"
      onClick={onClick}
    >
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></span>
      <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyan-400"></span>
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyan-400"></span>
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></span>
      
      {/* Button text */}
      <span className="relative z-10">{text}</span>
    </button>
  );
}