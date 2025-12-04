// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import BarradeNavegacion from '../components/layout/BarraDeNavegacion';
import localFont from 'next/font/local';
import HojaPreview from '@/components/features/HojaPreview';
import { Toaster } from 'react-hot-toast';
import RootProvider from './RootProvider';

const gotham = localFont({
  src: [
    { path: '../public/fonts/GothamBook.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/GothamMedium.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/GothamBold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-gotham',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={gotham.variable}>
      <body className="font-sans">
        <RootProvider>
            <header>
              <BarradeNavegacion />
            </header>
            <HojaPreview />
            <main>{children}</main>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
        </RootProvider>
      </body>
    </html>
  );
}