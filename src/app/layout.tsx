import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { DatadogRUM } from "@/components/common/DatadogRUM";
import { Layout } from '@/components/layout/Layout';

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

export const metadata: Metadata = {
  title: "Datadog Hub",
  description: "Datadog Hub provides recommendations for various Dashboards and Monitors, and offers synchronization functionality for Dashboards and Monitors between accounts.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DatadogRUM />
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
