import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = "", showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 48, text: 'text-2xl' },
    lg: { icon: 64, text: 'text-4xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pin Shape */}
        <path
          d="M50 15C36.2 15 25 26.2 25 40C25 55 50 80 50 80C50 80 75 55 75 40C75 26.2 63.8 15 50 15ZM50 55C41.7 55 35 48.3 35 40C35 31.7 41.7 25 50 25C58.3 25 65 31.7 65 40C65 48.3 58.3 55 50 55Z"
          fill="#003B5C"
        />

        {/* Shopping Bag inside Pin */}
        <path
          d="M44 35H56V37C56 40.3 53.3 43 50 43C46.7 43 44 40.3 44 37V35ZM42 33V40C42 44.4 45.6 48 50 48C54.4 48 58 44.4 58 40V33H42Z"
          fill="#FFB81C"
        />
        <path
          d="M40 33H60V42C60 47.5 55.5 52 50 52C44.5 52 40 47.5 40 42V33Z"
          stroke="#FFB81C"
          strokeWidth="2"
          fill="none"
        />

        {/* Waves at the bottom */}
        <path
          d="M20 70C30 65 40 75 50 70C60 65 70 75 80 70"
          stroke="#003B5C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M25 75C35 70 45 80 55 75C65 70 75 80 85 75"
          stroke="#FFB81C"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col items-center leading-none mt-1">
          <span className={`${currentSize.text} font-black tracking-tighter text-[#003B5C]`}>PARNAÍBA</span>
          <span className="text-[0.5em] font-bold tracking-[0.3em] text-[#003B5C] uppercase">Delivery</span>
        </div>
      )}
    </div>
  );
}
