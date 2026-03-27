"use client";

import { Heart, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SupportSectionInner() {
  const searchParams = useSearchParams();
  const ipParam = searchParams.get("ip");

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-6 h-6 text-rose-500" />
        <h2 className="text-2xl font-bold text-white uppercase tracking-tight">支持与致谢</h2>
      </div>
      <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-md overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
        <CardContent className="p-8 space-y-6 text-center relative z-10">
          <div className="space-y-2">
            <p className="text-neutral-200 text-lg font-medium leading-relaxed">
              本软件开发占用大量业余时间，目前仍在持续迭代中。
            </p>
            <a href="https://github.com/users/ring1012/projects/1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors py-1 border-b border-rose-500/30 hover:border-rose-400">
              查看实时开发进度 <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-neutral-400 max-w-lg mx-auto">
            如果你觉得本软件对你有帮助，欢迎打赏支持作者，你的支持是我持续更新的动力。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
            <div className="space-y-2 group shrink-0">
              <div className="w-48 h-48 bg-white p-1 rounded-xl overflow-hidden ring-4 ring-neutral-800 group-hover:ring-blue-500 transition-all shadow-2xl">
                <img src="/alipay.jpg" alt="支付宝打赏" className="w-full h-full object-cover" />
              </div>
              <div className="text-sm font-bold text-blue-400 tracking-widest uppercase text-center">支付宝</div>
            </div>
            <div className="space-y-2 group shrink-0">
              <div className="w-48 h-48 bg-white p-1 rounded-xl overflow-hidden ring-4 ring-neutral-800 group-hover:ring-emerald-500 transition-all shadow-2xl">
                <img src="/weixin.jpg" alt="微信打赏" className="w-full h-full object-cover" />
              </div>
              <div className="text-sm font-bold text-emerald-400 tracking-widest uppercase text-center">微信支付</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function SupportSection() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center text-neutral-500">加载支持信息...</div>}>
      <SupportSectionInner />
    </Suspense>
  );
}
