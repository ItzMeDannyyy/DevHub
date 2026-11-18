import React from 'react';

interface VsCodeIconProps {
  size?: number;
  className?: string;
  fill?: string;
}

/**
 * Clean vector SVG Visual Studio Code icon.
 * Follows 24x24 viewBox grid with currentColor fill.
 */
export const VsCodeIcon: React.FC<VsCodeIconProps> = ({
  size = 14,
  className = '',
  fill = 'currentColor',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M23.15 2.587L18.21.21a1.385 1.385 0 0 0-1.57.268L6.82 9.948 2.215 6.425a1.11 1.11 0 0 0-1.417.063L.29 7.422a1.112 1.112 0 0 0-.01 1.643l4.316 3.738L.28 16.54a1.112 1.112 0 0 0 .01 1.643l.508.934a1.11 1.11 0 0 0 1.417.063l4.605-3.523 9.82 9.47a1.385 1.385 0 0 0 1.57.268l4.94-2.377A1.384 1.384 0 0 0 24 20.89v-17.78a1.384 1.384 0 0 0-.85-1.273zM18.17 17.78l-5.46-4.995 5.46-4.996v9.991z" />
    </svg>
  );
};
