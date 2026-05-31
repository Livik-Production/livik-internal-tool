import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import ReduxProviderClient from './components/ReduxProviderClient';
import AuthBootstrap from './components/AuthBootstrap';
import ToastProvider from './components/Toast';

import FontScaleHandler from './components/FontScaleHandler';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'Livik Software Solutions | Tool',
  description: 'Smart, scalable, and secure digital products',
  icons: {
    icon: '/asset/livik-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} font-inter m-0 p-0 bg-gradient-to-br from-[#1a3a4a] to-[#2d5266] min-h-screen min-w-screen flex items-center justify-center px-5`}
      >
        <ReduxProviderClient>
          <FontScaleHandler />
          <AuthBootstrap>{children}</AuthBootstrap>
          <ToastProvider />
        </ReduxProviderClient>
      </body>
    </html>
  );
}
