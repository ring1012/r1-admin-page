"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Play, ShieldAlert, Globe, Monitor, Smartphone, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ConnectionMaskProps {
  isConnected: boolean;
  isConnecting: boolean;
  ip: string | null;
  onConnect: () => void;
  title?: string;
}

export function ConnectionMask({ 
  isConnected, 
  isConnecting, 
  ip, 
  onConnect,
  title = "设备未连接"
}: ConnectionMaskProps) {
  const [browserInfo, setBrowserInfo] = useState<{
    name: string;
    isChrome: boolean;
    isEdge: boolean;
    isFirefox: boolean;
    is360: boolean;
    isMobile: boolean;
  }>({
    name: 'Unknown',
    isChrome: false,
    isEdge: false,
    isFirefox: false,
    is360: false,
    isMobile: false
  });

  const [currentUrlInfo, setCurrentUrlInfo] = useState({
    protocol: '',
    host: '',
    isRecommended: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = ua ? /iPhone|iPad|iPod|Android/i.test(ua) : false;
    const isEdge = ua.indexOf('Edg/') > -1;
    const isFirefox = ua.indexOf('Firefox/') > -1;
    const is360 = ua.indexOf('QIHU 360') > -1 || (ua.indexOf('Chrome') > -1 && !isEdge && (window as any).chrome && (window as any).chrome.webstore === undefined && (navigator as any).mimeTypes && (navigator as any).mimeTypes.length > 30);
    const isChrome = ua.indexOf('Chrome/') > -1 && !isEdge && !is360;
    
    let name = '其他浏览器';
    if (isEdge) name = 'Edge';
    else if (is360) name = '360浏览器';
    else if (isChrome) name = 'Chrome';
    else if (isFirefox) name = 'Firefox';

    setBrowserInfo({ 
      name, 
      isChrome, 
      isEdge, 
      isFirefox, 
      isMobile,
      is360: !!is360
    });

    const protocol = window.location.protocol;
    const host = window.location.host;
    
    // Recommended settings
    const recommendedHost = 'r1.huan.dedyn.io';
    const recommendedHttpHost = 'r1-web.huan.dedyn.io:8080';
    
    const isRecommended = isMobile 
      ? (protocol === 'http:' && host === recommendedHttpHost)
      : (protocol === 'https:' && host === recommendedHost);

    setCurrentUrlInfo({ protocol, host, isRecommended });
  }, []);

  if (isConnected) return null;

  const getSettingsLink = () => {
    const site = "https://r1.huan.dedyn.io";
    const encodedSite = encodeURIComponent(site);
    if (browserInfo.isChrome || browserInfo.is360) return `chrome://settings/content/siteDetails?site=${encodedSite}`;
    if (browserInfo.isEdge) return `edge://settings/content/siteDetails?site=${encodedSite}`;
    return null;
  };

  const recommendedLink = browserInfo.isMobile 
    ? `http://r1-web.huan.dedyn.io:8080${window.location.pathname}${window.location.search}`
    : `https://r1.huan.dedyn.io${window.location.pathname}${window.location.search}`;

  const altLink = !browserInfo.isMobile
    ? `http://r1-web.huan.dedyn.io:8080${window.location.pathname}${window.location.search}`
    : `https://r1.huan.dedyn.io${window.location.pathname}${window.location.search}`;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6 bg-neutral-950">
      <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-8 animate-pulse border border-red-500/20 relative">
        <Settings className="w-12 h-12" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
          <ShieldAlert className="w-4 h-4" />
        </div>
      </div>
      
      <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">{title}</h2>
      <p className="text-neutral-400 max-w-lg mb-10 text-lg leading-relaxed">
        无法连接到 R1 音箱。现代浏览器出于安全考虑，限制了网页对本地网络设备的访问权限。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-12">
        {/* Method 1: Browser Settings */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8 text-left backdrop-blur-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">授权本地访问</h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Browser Permissions</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <p className="text-sm text-neutral-400 leading-relaxed">
              检测到您正在使用 <span className="text-white font-bold">{browserInfo.name}</span>。请开启“本地网络访问”权限：
            </p>
            
            {browserInfo.isChrome || browserInfo.isEdge ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  复制下方链接到地址栏并打开，找到 <span className="text-blue-400 font-bold">“本地网络访问”</span> (Private Network Access) 并设为 <span className="text-emerald-400 font-bold">“允许”</span>。
                </p>
                <div className="flex items-center gap-2 group">
                  <code className="text-[10px] bg-white/5 px-3 py-2 rounded-xl text-neutral-400 flex-1 truncate font-mono border border-white/5">
                    {getSettingsLink()}
                  </code>
                </div>
              </div>
            ) : browserInfo.isFirefox ? (
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <p className="text-xs text-neutral-400">
                  火狐用户通常需要在 <code className="text-orange-400">about:config</code> 中将 <code className="text-orange-400">network.websocket.allowInsecureFromHTTPS</code> 设置为 <span className="text-emerald-400">true</span>。
                </p>
              </div>
            ) : (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
                <p className="text-xs text-yellow-500/80 italic">
                  建议在设置中搜索“本地网络”、“私有网络”或“混合内容”相关的权限开关。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Method 2: Recommended URL */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-8 text-left backdrop-blur-xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              {browserInfo.isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-white font-bold">切换访问域名</h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black">Alternative Links</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-sm text-neutral-400 leading-relaxed">
              不同设备对网络协议的要求不同，推荐尝试以下专为 {browserInfo.isMobile ? '移动端' : '电脑端'} 优化的链接：
            </p>
            
            <div className="space-y-3">
              <a 
                href={recommendedLink}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${currentUrlInfo.isRecommended ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-white'}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">推荐链接 (Recommended)</span>
                  <span className="text-sm font-bold font-mono">{recommendedLink.split('?')[0].replace('https://','').replace('http://','')}</span>
                </div>
                {currentUrlInfo.isRecommended ? <div className="text-[8px] bg-emerald-500 text-white px-2 py-1 rounded-md font-black">正在使用</div> : <ExternalLink className="w-4 h-4 opacity-40" />}
              </a>

              <a 
                href={altLink}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-white transition-all transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">备选链接 (Alternative)</span>
                  <span className="text-sm font-bold font-mono">{altLink.split('?')[0].replace('https://','').replace('http://','')}</span>
                </div>
                <ExternalLink className="w-4 h-4 opacity-40" />
              </a>
            </div>
            
            {!currentUrlInfo.isRecommended && (
              <div className="flex items-start gap-2 text-[10px] text-amber-500/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>检测到您当前使用的链接可能在当前设备上存在兼容性限制。</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex-1 h-16 bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-[28px] transition-all font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 group"
        >
          {isConnecting ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />}
          {isConnecting ? "正在连接..." : "立即尝试重连"}
        </button>
        <Link
          href={ip ? `/?ip=${ip}` : '/'}
          className="px-10 h-16 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white rounded-[28px] transition-all border border-neutral-800 font-bold"
        >
          返回主页
        </Link>
      </div>
      
      <div className="mt-12 text-neutral-600 text-[10px] font-medium tracking-[0.2em] uppercase">
        Target IP: <span className="text-neutral-500">{ip || 'Unknown'}</span> | Device: <span className="text-neutral-500">{browserInfo.isMobile ? 'Mobile' : 'Desktop'}</span>
      </div>
    </div>
  );
}
