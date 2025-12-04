// hooks/useForceUpdate.ts
import { useState, useCallback } from 'react';

export const useForceUpdate = () => {
  const [_, setValue] = useState(0);
  return useCallback(() => setValue(value => value + 1), []);
};