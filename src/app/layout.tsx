import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DatadogRUM } from "@/components/common/DatadogRUM";
import { DatadogUserTracker } from "@/components/common/DatadogUserTracker";
import { Layout } from '@/components/layout/Layout';
import { Providers } from "./providers";
import { Inter } from 'next/font/google';

const geistSans = localFont({
  src: [
    {
      path: '../../public/fonts/GeistVF.woff',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: '--font-geist-sans',
});

const geistMono = localFont({
  src: [
    {
      path: '../../public/fonts/GeistMonoVF.woff',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: '--font-geist-mono',
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Datadog Hub",
  description: "Datadog Hub provides recommendations for various Dashboards and Monitors, and offers synchronization functionality for Dashboards and Monitors between accounts.",
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${inter.className}`}>
        <Providers>
          <DatadogRUM />
          <DatadogUserTracker />
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
