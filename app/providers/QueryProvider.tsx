// app/providers/QueryProvider.tsx
'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const isBrowser = typeof window !== 'undefined';

// Deriva el tipo del storage desde la firma de la función (no importes AsyncStorage)
type StorageLike = Parameters<typeof createAsyncStoragePersister>[0]['storage'];

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 min
            gcTime: 24 * 60 * 60 * 1000, // 24 h
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  // SSR/Edge: sin persistencia
  if (!isBrowser) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  // Wrapper async sobre localStorage que cumple con el tipo esperado
  const asyncLocalStorage: StorageLike = {
    getItem: async (key) => window.localStorage.getItem(key),
    setItem: async (key, value) => {
      window.localStorage.setItem(key, value);
    },
    removeItem: async (key) => {
      window.localStorage.removeItem(key);
    },
  };

  const persister = createAsyncStoragePersister({
    storage: asyncLocalStorage,
    key: 'rq-cantos-v1',
    throttleTime: 1000,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: 'cantos-v1',
        maxAge: 24 * 60 * 60 * 1000,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}