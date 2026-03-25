"use client";

import { PageLayout } from "@/components/layout";
import AboutContent from "@/components/AboutContent";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function AboutPageContent() {
  return (
    <PageLayout>
      <div className="relative min-h-screen bg-neutral-950">
        {/* Background Gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] opacity-70 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] opacity-70 animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 pt-16">
          <div className="container mx-auto px-4 text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
              关于项目
            </h1>
            <p className="text-neutral-500 font-medium tracking-widest uppercase text-xs">
              Project Documentation & About
            </p>
          </div>
          <AboutContent />
        </div>
      </div>
    </PageLayout>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-neutral-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="font-medium tracking-wide">加载中...</p>
      </div>
    }>
      <AboutPageContent />
    </Suspense>
  );
}
