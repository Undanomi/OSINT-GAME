import React from 'react';

interface GogglesMailIconProps {
  size?: number;
  className?: string;
}

export const GogglesMailIcon: React.FC<GogglesMailIconProps> = ({ 
  size = 20, 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* メールの外枠 */}
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* メールの折り目 */}
      <path
        d="M2 8l10 6 10-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};