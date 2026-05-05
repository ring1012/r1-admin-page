"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, ArrowUpCircle, Info } from "lucide-react";
import { useMusic } from "@/components/MusicContext";
import { ConnectionMask } from "@/components/ConnectionMask";
import { PageLayout } from '@/components/layout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function VersionsPageContent() {
  const { isConnected, isConnecting, connectDevice } = useMusic();
  const searchParams = useSearchParams();
  const ip = searchParams.get("ip");

  const [currentVersions, setCurrentVersions] = useState<{ echo: number | null, unisound: number | null }>({ echo: null, unisound: null });
  const [latestVersions, setLatestVersions] = useState<{ echo: number | null, unisound: number | null }>({ echo: null, unisound: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const fetchCurrentVersions = () => {
    if (!ip) return Promise.resolve();
    
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://${ip}/ws/status`);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Timeout waiting for device response"));
      }, 5000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: "get_versions" }));
      };

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          if (res.action === "get_versions" && res.data) {
            setCurrentVersions({
              echo: res.data.echo,
              unisound: res.data.unisound
            });
            clearTimeout(timeout);
            ws.close();
            resolve();
          }
        } catch (e) {
          console.error("Parse WS message error", e);
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket connection failed"));
      };
    });
  };

  const fetchLatestVersions = async () => {
    try {
      const [echoRes, uniRes] = await Promise.all([
        fetch(`/api/bridge?url=${encodeURIComponent('https://file.huan.dedyn.io/xiaoxun/controller_vers.txt')}`),
        fetch(`/api/bridge?url=${encodeURIComponent('https://file.huan.dedyn.io/xiaoxun/unisound_vers.txt')}`)
      ]);
      
      const [echoText, uniText] = await Promise.all([
        echoRes.text(),
        uniRes.text()
      ]);

      setLatestVersions({
        echo: parseInt(echoText.trim()),
        unisound: parseInt(uniText.trim())
      });
    } catch (error) {
      console.error("Failed to fetch latest versions:", error);
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchCurrentVersions(), fetchLatestVersions()]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && ip) {
      refreshAll();
    }
  }, [isConnected, ip]);

  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Load cooldowns from localStorage
    const saved = localStorage.getItem('upgrade_cooldowns');
    if (saved) {
      try {
        setCooldowns(JSON.parse(saved));
      } catch (e) {}
    }

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUpgrade = async (type: 'echo' | 'unisound') => {
    if (!ip) return;
    setIsUpgrading(type);
    
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://${ip}/ws/status`);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error("Timeout waiting for device response"));
        }, 5000);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            action: "upgrade",
            data: {
              apkName: type === 'echo' ? "new_echo.apk" : "new_uni.apk",
              version: String(latestVersions[type])
            }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const res = JSON.parse(event.data);
            if (res.action === "upgrade") {
              clearTimeout(timeout);
              ws.close();
              if (res.status === "ok") resolve();
              else reject(new Error(res.error || "Unknown server error"));
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("WebSocket connection failed"));
        };
      });

      // Set 5 minute cooldown
      const newCooldowns = { ...cooldowns, [type]: Date.now() + 5 * 60 * 1000 };
      setCooldowns(newCooldowns);
      localStorage.setItem('upgrade_cooldowns', JSON.stringify(newCooldowns));

      alert("升级指令已发送成功，设备即将开始下载并安装。");
    } catch (error: any) {
      alert("升级失败: " + error.message);
    } finally {
      setIsUpgrading(null);
    }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <ConnectionMask 
          isConnected={isConnected} 
          isConnecting={isConnecting} 
          ip={ip} 
          onConnect={connectDevice}
          title="版本管理 - 设备未连接"
        />
      </PageLayout>
    );
  }

  const renderVersionCard = (title: string, type: 'echo' | 'unisound', desc: string, upgradeTime: string) => {
    const current = currentVersions[type];
    const latest = latestVersions[type];
    const hasUpdate = current !== null && latest !== null && current < latest;
    
    const cooldownTime = cooldowns[type] || 0;
    const isCoolingDown = now < cooldownTime;
    const secondsRemaining = Math.ceil((cooldownTime - now) / 1000);
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;

    return (
      <Card className="bg-neutral-900/80 backdrop-blur-xl border-neutral-800 text-neutral-100 overflow-hidden group">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <CardDescription className="mt-1 text-neutral-400">{desc}</CardDescription>
            </div>
            {hasUpdate && !isCoolingDown && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
                有新版本
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/50">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">当前版本</p>
              <p className="text-sm sm:text-xl font-mono text-neutral-200 truncate">{current || '---'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/50">
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">最新版本</p>
              <p className="text-sm sm:text-xl font-mono text-neutral-200 truncate">{latest || '---'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-300/80 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            <p>升级过程将重启设备，预计耗时约 {upgradeTime}。</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button 
                className="w-full h-12 font-bold tracking-wide" 
                disabled={!hasUpdate || isUpgrading === type || isCoolingDown}
                variant={hasUpdate && !isCoolingDown ? "default" : "secondary"}
              >
                {isUpgrading === type ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : isCoolingDown ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2 opacity-50" />
                ) : (
                  <ArrowUpCircle className="w-5 h-5 mr-2" />
                )}
                {isCoolingDown 
                  ? `冷却中 (${minutes}:${seconds.toString().padStart(2, '0')})`
                  : isUpgrading === type ? "处理中..." : (hasUpdate ? "立即升级" : "已是最新")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
              <DialogHeader>
                <DialogTitle>确认升级 {title}?</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  您确定要升级到版本 {latest} 吗？
                  <br /><br />
                  <span className="text-rose-400 font-semibold">警告：升级过程中音箱将会自动重启，请确保升级期间不要断电。</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-6 gap-3">
                <DialogClose asChild>
                  <Button variant="ghost" className="hover:bg-neutral-800">取消</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    onClick={() => handleUpgrade(type)}
                  >
                    确认并升级
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-4 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-full h-full bg-blue-500/5 rounded-full blur-[120px] opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-full h-full bg-purple-500/5 rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">版本管理</h1>
              <p className="text-neutral-400 mt-2 font-medium">检查并升级 R1 音箱的系统与引擎版本。</p>
            </div>
            <Button 
              variant="outline" 
              onClick={refreshAll} 
              disabled={isLoading}
              className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-200"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              刷新状态
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-neutral-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="font-medium animate-pulse">正在获取版本信息...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {renderVersionCard("Echo 系统", "echo", "音箱核心控制程序", "3 分钟")}
              {renderVersionCard("Unisound 引擎", "unisound", "语音识别与合成引擎", "6 分钟")}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default function VersionsPage() {
  return (
    <Suspense fallback={null}>
      <VersionsPageContent />
    </Suspense>
  );
}
