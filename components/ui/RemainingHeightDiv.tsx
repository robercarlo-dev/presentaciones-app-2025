// components/RemainingHeightDiv.tsx
'use client';

import { useRef, ReactNode, useState, useEffect } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const height = useRemainingHeight(ref, { minHeight, offset });
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && ref.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = ref.current.clientHeight;
        setIsOverflowing(contentHeight > containerHeight);
      }
    };

    checkOverflow();

    // Opcional: Observar cambios en el contenido
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [height, children]); // Se ejecuta cuando cambia la altura o los children

  return (
    <div 
      ref={ref}
      style={{ height }}
      className={`relative ${className}`}
    >
      <div ref={contentRef} className="h-full">
        {children}
      </div>
      
      {isOverflowing && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-background bg-black/50 p-1 text-sm opacity-50">
          Desplázate para ver más contenido
        </div>
      )}
    </div>
  );
}