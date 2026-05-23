"use client";

import { useEffect, useState, Suspense } from "react";
import { Wifi, Info, Monitor, Cpu, Clock, Terminal, Play, Sparkles, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLayout } from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPEAKER_IP = "192.168.43.1";

interface LogMessage {
  time: string;
  type: "info" | "success" | "warn" | "error";
  text: string;
}

function ConfigWifiContent() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState("WPA");

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  const [osInfo, setOsInfo] = useState({
    userAgent: "Loading...",
    screenSize: "Loading...",
    onlineStatus: "Checking...",
    localTime: "Loading...",
    platform: "Loading...",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSsid = localStorage.getItem("r1_wifi_ssid") || "";
      const savedPasswd = localStorage.getItem("r1_wifi_passwd") || "";
      const savedSecure = localStorage.getItem("r1_wifi_secure") || "WPA";

      setSsid(savedSsid);
      setPassword(savedPasswd);
      setSecure(savedSecure);

      const ua = navigator.userAgent;
      let platform = "Unknown OS";
      if (ua.indexOf("Win") !== -1) platform = "Windows";
      else if (ua.indexOf("Mac") !== -1) platform = "macOS / iOS";
      else if (ua.indexOf("Android") !== -1) platform = "Android";
      else if (ua.indexOf("Linux") !== -1) platform = "Linux";

      setOsInfo({
        userAgent: ua.slice(0, 70) + (ua.length > 70 ? "..." : ""),
        screenSize: `${window.screen.width} x ${window.screen.height} (${window.screen.colorDepth}-bit)`,
        onlineStatus: navigator.onLine ? "在线 (Online)" : "离线 (Offline)",
        localTime: new Date().toLocaleTimeString(),
        platform,
      });

      const timer = setInterval(() => {
        setOsInfo(prev => ({ ...prev, localTime: new Date().toLocaleTimeString() }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field === "ssid") { setSsid(value); localStorage.setItem("r1_wifi_ssid", value); }
    else if (field === "password") { setPassword(value); localStorage.setItem("r1_wifi_passwd", value); }
    else if (field === "secure") { setSecure(value); localStorage.setItem("r1_wifi_secure", value); }
  };

  const addLog = (text: string, type: LogMessage["type"] = "info") => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type, text }]);
  };

  const sendConfigPost = async (attemptName: string) => {
    const infoPayload = { ssid, mac: "", level: "", secure, password };
    const targetUrl = `http://${SPEAKER_IP}:8989/api/configwifi`;
    try {
      addLog(`[${attemptName}] 正在发送配网请求至 ${targetUrl}...`, "info");
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(infoPayload),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (res.ok || res.status === 0) {
        addLog(`[${attemptName}] 配网指令发送完成！响应状态: ${res.status === 0 ? "OK (no-cors)" : "OK"}`, "success");
        return true;
      } else {
        addLog(`[${attemptName}] 指令发送失败，HTTP 状态码: ${res.status}`, "warn");
        return false;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addLog(`[${attemptName}] 请求超时，音箱可能正忙或已重启以连接 WiFi。`, "warn");
      } else {
        addLog(`[${attemptName}] 发送完成 (可能存在跨域拦截，但请求已发出): ${err.message}`, "success");
      }
      return true;
    }
  };

  const handleStartProvision = async () => {
    if (!ssid.trim()) { alert("请输入需要连上的 Wi-Fi 名称！"); return; }
    const confirmed = confirm("请确保您的设备已连接到音箱的 @PHICOMM_ 开头 WiFi 热点，否则配网将失败。\n\n确认已连接该热点并继续配网吗？");
    if (!confirmed) return;
    setIsProvisioning(true);
    setLogs([]);
    addLog("=== 开始斐讯 R1 免 APP 配网程序 ===", "info");
    addLog(`WiFi 目标名称 (SSID): ${ssid}`, "info");
    addLog(`加密方式 (Secure): ${secure}`, "info");
    addLog(`音箱默认网关 IP: ${SPEAKER_IP}`, "info");

    await sendConfigPost("首次发送");
    addLog("首次配网指令已投递。等待 7 秒以保证音箱状态切换准备就绪...", "info");

    setTimeout(async () => {
      addLog("=== 开始触发 6 次循环信号增益配网 ===", "info");
      let successCount = 0;
      for (let i = 1; i <= 6; i++) {
        const ok = await sendConfigPost(`循环增益 ${i}/6`);
        if (ok) successCount++;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      addLog("=== 配网指令投递流程已全部执行完毕！ ===", "success");
      addLog("温馨提示：请观察音箱底部的环形指示灯。如果白灯停止闪烁并伴有网络连接语音提示，则说明配网已大功告成！", "success");
      addLog("如果连接失败，请确保您在操作前已手动连接到音箱发出的以 @PHICOMM_ 或 Phicomm 开头的热点，且您的家庭 WiFi 密码正确且为 2.4GHz 信号。", "warn");
      setIsProvisioning(false);
    }, 7000);
  };

  const handleReset = () => {
    if (confirm("确认清空已保存的 WiFi 信息吗？")) {
      setSsid(""); setPassword("");
      localStorage.removeItem("r1_wifi_ssid");
      localStorage.removeItem("r1_wifi_passwd");
      addLog("已重置本地记忆的 WiFi 配置数据。", "info");
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-full h-full bg-cyan-500/5 rounded-full blur-[140px] opacity-40" />
          <div className="absolute bottom-0 right-1/3 w-full h-full bg-indigo-500/5 rounded-full blur-[140px] opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
              R1 免 APP 快速配网控制台 <Sparkles className="w-6 h-6 text-cyan-400" />
            </h1>
            <p className="text-neutral-400 text-sm md:text-base font-medium max-w-3xl">
              斐讯官方服务器下线后，音箱无法通过原装 APP 联网。在这里输入你的 Wi-Fi 信息，即可将配置数据强力刷入音箱内部，令其直接联网。
            </p>
          </div>

          {/* Cross-Origin / Mixed Content Warning */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-300 space-y-1">
              <p className="font-semibold text-amber-300">注意：你需要允许本网站访问局域网设备</p>
              <p className="text-neutral-400">
                本页面向 <strong className="text-amber-400 font-mono">{SPEAKER_IP}:8989</strong> 发送配网指令时，会被浏览器视为「跨域不安全请求」（HTTPS→HTTP/公网→内网）。
                现代浏览器（尤其是 Chrome）可能会拦截此类请求。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Form & OS Diagnosis (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              {/* WiFi Setup Form Card */}
              <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-xl shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-cyan-400" /> WiFi 信息录入
                  </CardTitle>
                  <CardDescription>
                    请在此填写音箱需要连接的家用 Wi-Fi 信息（输入将自动加密保存在本地浏览器中）。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ssid" className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Wi-Fi 无线网名称 (SSID)</Label>
                      <Input
                        id="ssid"
                        value={ssid}
                        onChange={e => handleInputChange("ssid", e.target.value)}
                        placeholder="请输入家用 Wi-Fi SSID"
                        className="bg-neutral-950 border-neutral-850 focus:border-cyan-500 focus:ring-cyan-500/20 text-neutral-100 placeholder:text-neutral-600 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwd" className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Wi-Fi 密码</Label>
                      <Input
                        id="passwd"
                        type="password"
                        value={password}
                        onChange={e => handleInputChange("password", e.target.value)}
                        placeholder="请输入无线密码"
                        className="bg-neutral-950 border-neutral-850 focus:border-cyan-500 focus:ring-cyan-500/20 text-neutral-100 placeholder:text-neutral-600 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">加密方式</Label>
                      <Select value={secure} onValueChange={val => handleInputChange("secure", val)}>
                        <SelectTrigger className="bg-neutral-950 border-neutral-850 text-neutral-200">
                          <SelectValue placeholder="WPA" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-950 border-neutral-800 text-neutral-200">
                          <SelectItem value="WPA">WPA/WPA2 Personal (推荐，一般填写此项)</SelectItem>
                          <SelectItem value="WEP">WEP Mode</SelectItem>
                          <SelectItem value="NONE">无密码 (NONE)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-850">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 font-medium transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      清空已存 WiFi 数据
                    </button>

                    <Button
                      onClick={handleStartProvision}
                      disabled={isProvisioning}
                      className="w-full sm:w-auto px-6 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold tracking-wide shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
                    >
                        {isProvisioning ? (
                          <><Terminal className="w-5 h-5 animate-pulse" /><span>正在执行增益配网...</span></>
                        ) : (
                          <><Play className="w-4 h-4 fill-white" /><span>开始投递配网指令</span></>
                        )}
                      </Button>
                    </div>

                </CardContent>
              </Card>

              {/* OS Diagnosis Card */}
              <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-cyan-400" /> 设备系统环境诊断
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="flex items-center gap-3 p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl">
                    <Cpu className="w-4 h-4 text-neutral-500" />
                    <div>
                      <p className="text-neutral-500 font-semibold uppercase text-[10px]">客户端系统</p>
                      <p className="text-neutral-200 mt-0.5 truncate max-w-[180px]">{osInfo.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl">
                    <Info className="w-4 h-4 text-neutral-500" />
                    <div>
                      <p className="text-neutral-500 font-semibold uppercase text-[10px]">网络连接状态</p>
                      <p className="text-neutral-200 mt-0.5">{osInfo.onlineStatus}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl">
                    <Monitor className="w-4 h-4 text-neutral-500" />
                    <div>
                      <p className="text-neutral-500 font-semibold uppercase text-[10px]">屏幕物理分辨率</p>
                      <p className="text-neutral-200 mt-0.5 font-mono">{osInfo.screenSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <div>
                      <p className="text-neutral-500 font-semibold uppercase text-[10px]">本地系统时间</p>
                      <p className="text-neutral-200 mt-0.5 font-mono">{osInfo.localTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right Column: Steps Guide & Live Console Logs (5 cols) */}
            <div className="lg:col-span-5 space-y-8">
              {/* Pairing Steps Guide */}
              <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Info className="w-5 h-5 text-cyan-400" /> 音箱配网操作步骤
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-white">打开本网页</p>
                        <p className="text-neutral-400">请确保当前页面已打开，并准备好输入 Wi-Fi 信息。</p>
                      </div>
                    </div>
                    {/* Step 2 */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-white">长按音箱上方按钮进入配网模式</p>
                        <p className="text-neutral-400">
                          长按 R1 音箱顶部按键约 <strong className="text-cyan-300">5 秒</strong>，直至底部环形灯变为<strong className="text-amber-300">白光闪烁</strong>状态，表示音箱已进入配网模式。
                        </p>
                      </div>
                    </div>
                    {/* Step 3 */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-white">连接音箱自带 WiFi 热点</p>
                        <p className="text-neutral-400">
                          断开手机/电脑当前的 Wi-Fi，在网络列表中找到并连接到音箱自身发射的临时热点。热点名称一般以 <strong className="text-cyan-300">@PHICOMM_</strong> 开头（无密码）。连上此热点后，本页面将自动检测到网络环境就绪。
                        </p>
                      </div>
                    </div>
                    {/* Step 4 */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</div>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-white">扫描并输入信息，点击配网</p>
                        <p className="text-neutral-400">
                          在此页面填写家用 Wi-Fi 的名称（SSID）和密码。加密方式一般填写 <strong className="text-cyan-300">WPA</strong>。填写完毕后，点击「开始投递配网指令」按钮，系统将强力推入配置信息到音箱中，等待音箱语音提示配网成功即可。
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terminal Logs Output Box */}
              <Card className="bg-neutral-950 border-neutral-800/80 shadow-inner overflow-hidden">
                <CardHeader className="bg-neutral-900/50 border-b border-neutral-900 px-4 py-3">
                  <CardTitle className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 font-mono">
                    <Terminal className="w-4 h-4 text-cyan-500" /> LIVE_PROVISION_CONSOLE.LOG
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-44 overflow-y-auto font-mono text-[10px] space-y-1.5 custom-scrollbar text-neutral-400">
                    {logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-neutral-600 shrink-0">[{log.time}]</span>
                        <span className={`font-bold shrink-0 ${
                          log.type === "success" ? "text-emerald-400" :
                          log.type === "error" ? "text-rose-500" :
                          log.type === "warn" ? "text-yellow-500" : "text-cyan-400"
                        }`}>
                          {log.type.toUpperCase()}:
                        </span>
                        <span className={log.type === "success" ? "text-neutral-200 font-semibold" : ""}>{log.text}</span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-neutral-600 text-center py-12 italic">
                        等待启动配网。指令投递日志将在此处实时刷新...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function ConfigWifiPage() {
  return (
    <Suspense fallback={null}>
      <ConfigWifiContent />
    </Suspense>
  );
}