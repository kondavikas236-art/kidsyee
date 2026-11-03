import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Kidsyee - The Smart Screen Time Guardian',
  description: 'Kidsyee helps children build healthy digital habits. Protect vision with AI-powered breaks, foster reflection with the AI Diary Buddy, and gamify wellness with fun eye-health missions.',
  applicationName: 'Kidsyee',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kidsyee',
    startupImage: [
      'https://picsum.photos/seed/splash/2048/2732',
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  }
};

export const viewport: Viewport = {
  themeColor: '#1996C5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/kidsyee-icon-1/180/180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kidsyee" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-[#F8FAFC] select-none touch-pan-y">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
