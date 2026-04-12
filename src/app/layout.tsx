import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { MusicProvider } from "@/components/MusicContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "小讯后台管理",
  description: "Using Next.js to build high-performance, scalable Web applications on EdgeOne Pages. Demonstrating SSR, ISR, SSG, Node Functions, and Edge Functions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-black text-white antialiased">
        <NextTopLoader
          color="#3b82f6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #3b82f6, 0 0 5px #3b82f6"
          zIndex={9999}
        />
        <Suspense fallback={null}>
          <MusicProvider>
            {children}
            <MiniPlayer />
          </MusicProvider>
        </Suspense>
      </body>
    </html>
  );
}
