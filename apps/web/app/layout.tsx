import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvidor } from './../src/context/session';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Manga Reader',
  description: 'A manga reader built with Next.js and Tailwind CSS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen w-full overflow-hidden bg-gray-900 items-center flex justify-center flex-col`}
      >
        <SessionProvidor>
          <div className='flex grow text-white w-full h-full overflow-hidden flex-col'>
            {children}
          </div>
        </SessionProvidor>
      </body>
    </html>
  );
}
