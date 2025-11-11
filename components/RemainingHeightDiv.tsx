// components/RemainingHeightDiv.tsx
'use client';

import { useRef, ReactNode } from 'react';
import { useRemainingHeight } from '@/hooks/useRemainingHeight';

interface RemainingHeightDivProps {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  offset?: number;
}

export default function RemainingHeightDiv({
  children,
  className = '',
  minHeight = 0,
  offset = 0
}: RemainingHeightDivProps) {
  const ref = useRef<HTMLDivElement>(null);
  const height = useRemainingHeight(ref, { minHeight, offset });

  return (
    <div 
      ref={ref}
      style={{ height }}
      className={className}
    >
      {children}
    </div>
  );
}