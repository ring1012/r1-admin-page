"use client";

import { PageLayout } from '@/components/layout';
import SupportSection from '@/components/SupportSection';
import Link from 'next/link';
import { BookOpen, Settings, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const ipParam = searchParams.get("ip");

  const getFullHref = (href: string) => {
    if (!ipParam) return href;
    return `${href}?ip=${ipParam}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20 px-4 pt-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-8">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
          欢迎使用 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">小讯后台管理</span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          为裴讯 R1 音箱量身定制的轻量级管理工具。
        </p>
      </section>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* About Guide Card */}
        <Link href={getFullHref("/about")} className="group">
          <div className="h-full bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 hover:bg-neutral-800/40 hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group-hover:shadow-[0_0_50px_rgba(168,85,247,0.15)]">
            <div className="absolute top-0 right-0 p-8 transform group-hover:rotate-12 transition-transform opacity-20 group-hover:opacity-40">
              <BookOpen className="w-24 h-24 text-purple-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-white group-hover:text-purple-300 transition-colors">功能指引</h2>
              <p className="text-neutral-400 leading-relaxed text-sm">
                了解软件的使用前提、兼容状态、AI服务部署方案以及如何自定义音乐源。在开始控制前，建议先阅读此指引。
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-purple-400 font-bold group-hover:gap-3 transition-all relative z-10">
              准备就绪，查看攻略 <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* Message Controller Card */}
        <Link href={getFullHref("/message")} className="group">
          <div className="h-full bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 hover:bg-neutral-800/40 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group-hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]">
            <div className="absolute top-0 right-0 p-8 transform group-hover:-rotate-6 transition-transform opacity-20 group-hover:opacity-40">
              <Settings className="w-24 h-24 text-blue-400" />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">小讯控制器</h2>
              <p className="text-neutral-400 leading-relaxed text-sm">
                直接向音箱发送控制命令：包括更换音乐源、音量控制、曲目切换等核心功能。即刻开始管理你的 R1 设备。
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-blue-400 font-bold group-hover:gap-3 transition-all relative z-10">
              即刻进入，开始控制 <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </div>

      {/* Support Section */}
      <div className="pt-8">
        <SupportSection />
      </div>

      <footer className="pt-10 text-center border-t border-neutral-800/50">
        <div className="text-neutral-600 text-sm">
          &copy; {new Date().getFullYear()} ring1012. Built with passion for R1.
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <PageLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-neutral-400">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
          <p className="font-medium tracking-wide">加载中...</p>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </PageLayout>
  );
}
