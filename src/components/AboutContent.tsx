"use client";

import { AlertCircle, Terminal, Cpu, Music, MessageSquare, ExternalLink, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AboutContentInner() {
  const musicSample = `{
    "count": 1,
    "musicinfo": [
      {
        "id": "音乐id",
        "title": "歌曲名",
        "duration": "时长秒",
        "album": "专辑名",
        "artist": "歌手",
        "url": "歌曲链接（chrome直接播放或下载）"
      }
    ]
  }`;

  const searchParams = useSearchParams();
  const ipParam = searchParams.get("ip");

  const getFullHref = (href: string) => {
    if (!ipParam) return href;
    const url = new URL(href, "http://dummy.com");
    url.searchParams.set("ip", ipParam);
    return url.pathname + url.search;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-4 pt-10">
      {/* 1. Ownership & License */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">版权与免责声明</h2>
        </div>
        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardContent className="p-6 space-y-4">
            <p className="text-neutral-300 leading-relaxed">
              本软件系由作者 <a href="https://github.com/ring1012" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline font-medium">ring1012</a> 开发（闲鱼唯一账号：<span className="text-white font-mono">ring10121783</span>）。
            </p>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
              <div className="text-rose-400 font-bold mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                严正警示
              </div>
              <p className="text-rose-300/90 text-sm">
                未经作者许可，严禁用于商业用途。
                <strong className="text-rose-400">如付费购买本软件，请立即申请退款！</strong>
              </p>
            </div>
            <div className="pt-2">
              <p className="text-neutral-400 text-sm mb-2">本软件参考并使用的部分开源软件：</p>
              <div className="flex flex-wrap gap-3">
                <a href="https://github.com/UnblockNeteaseMusic/server" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full transition-colors">
                  <ExternalLink className="w-3 h-3" /> UnblockNeteaseMusic
                </a>
                <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full transition-colors">
                  <ExternalLink className="w-3 h-3" /> yt-dlp
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. Prerequisites */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">使用前提</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-neutral-200">支持设备范围</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-neutral-400">
                  <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  仅支持未拆未刷的 <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none px-1.5">8443版本</Badge> 的小讯设备
                </li>
                <li className="flex gap-3 text-sm text-neutral-400">
                  <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  仅兼容 <a href="https://github.com/ring1012/r1-dummy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">r1-dummy</a> 提供的所有 APK
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900/50 border-rose-900/30 backdrop-blur-md opacity-80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> 不兼容说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-neutral-400 italic font-mono">
                不兼容其他开发者的 APK（如 new_EchoService*.apk）
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                <span>✕ Root版</span>
                <span>✕ 修改版</span>
                <span>✕ 小爱版</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Control Interface */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">小讯控制</h2>
        </div>
        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-md group hover:border-emerald-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-neutral-300">
                  通过管理页面发送指令到小讯。浏览器可能会提示是否允许访问本地网络，请点击 <span className="text-emerald-400 font-bold">允许</span>。
                </p>
                <code className="block w-full p-2 bg-neutral-950 rounded border border-neutral-800 text-emerald-400 text-xs text-center md:text-left">
                  {ipParam ? `/message?ip=${ipParam}` : "/message?ip=xxxxx"}
                </code>
              </div>
              <Link href={getFullHref("/message")} className="shrink-0">
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center gap-2">
                  进入控制页 <ExternalLink className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. AI Services */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">AI服务部署</h2>
        </div>
        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-md">
          <CardContent className="p-6 space-y-4">
            <p className="text-neutral-300">
              提供默认音乐服务。如需功能扩展（故事、广播、AI 大模型问答等），请启用 AI 服务。
            </p>
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
              <div className="p-3 bg-indigo-500/10 rounded-full">
                <svg className="w-8 h-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-5" /></svg>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-white font-medium">目前仅支持 Docker 部署</div>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <span>参考项目：</span>
                  <a href="https://github.com/ring1012/r1-iot-java" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                    r1-iot-java <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Custom Music Service */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="flex items-center gap-2 mb-2">
          <Music className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">自定义音乐服务</h2>
        </div>
        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-md">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <p className="text-neutral-300">
                支持更换音乐服务源：在控制页选择 <Badge variant="outline" className="text-amber-400 border-amber-400 sm:px-2 px-1">指令 - 更换音乐源</Badge>，在 <code className="bg-neutral-800 px-1 rounded text-amber-300">obj</code> 中填写你的 URL。
              </p>
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-500">
                系统将自动在你的地址后追加： <span className="text-amber-500">/search?keyword={"{keyword}"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">返回数据结构示例 (Sample Response)</div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none">JSON</Badge>
              </div>
              <pre className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-[13px] leading-relaxed text-amber-500/90 font-mono">
                <code>{musicSample}</code>
              </pre>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400/90 italic">
                💡 建议：Chrome 浏览器打开应能直接播放 or 下载。暂不建议使用无损音源。
              </div>
            </div>
          </CardContent>
        </Card>
      </section>


    </div>
  );
}

export default function AboutContent() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-neutral-500">加载文档中...</div>}>
      <AboutContentInner />
    </Suspense>
  );
}
