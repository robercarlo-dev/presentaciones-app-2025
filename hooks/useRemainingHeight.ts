// hooks/useRemainingHeight.ts
import { useEffect, useState, RefObject } from 'react';

interface UseRemainingHeightOptions {
  minHeight?: number;
  offset?: number;
}

export function useRemainingHeight(
  ref: RefObject<HTMLElement | null>, // ✅ Permitir null
  options: UseRemainingHeightOptions = {}
) {
  const { minHeight = 0, offset = 0 } = options;
  const [height, setHeight] = useState<string>('100vh');

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        let remainingHeight = window.innerHeight - rect.top - offset;
        
        if (minHeight > 0 && remainingHeight < minHeight) {
          remainingHeight = minHeight;
        }
        
        setHeight(`${remainingHeight}px`);
      }
    };

    updateHeight();
    
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateHeight, 100);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [ref, minHeight, offset]);

  return height;
}