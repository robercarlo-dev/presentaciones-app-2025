import { useEffect, useRef } from 'react';

// Agrega este hook para ver qué está causando los renders
export const useRenderCounter = (componentName: string) => {
    const renderCount = useRef(0);
    
    useEffect(() => {
      renderCount.current += 1;
      console.log(`${componentName} render #${renderCount.current}`);
      
      return () => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} se desmontó`);
        }
      };
    });
  };