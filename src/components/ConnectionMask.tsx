"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Play, ShieldAlert, Globe, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ConnectionMaskProps {
  isConnected: boolean;
  isConnecting: boolean;
  ip: string | null;
  onConnect: () => void;
  title?: string;
  protocolError?: string | null;
  permissionRequired?: boolean;
  onGrantPermission?: () => void;
}

export function ConnectionMask({ 
  isConnected, 
  isConnecting, 
  ip, 
  onConnect,
  title = "设备未连接",
  protocolError,
  permissionRequired,
  onGrantPermission,
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
  }, []);

  // Auto-reconnect timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!isConnected && !isConnecting && ip && !permissionRequired) {
      timer = setInterval(() => {
        onConnect();
      }, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected, isConnecting, ip, onConnect, permissionRequired]);

  if (isConnected) return null;

  const getSettingsLink = () => {
    const site = window.location.origin;
    const encodedSite = encodeURIComponent(site);
    if (browserInfo.isChrome || browserInfo.is360) return `chrome://settings/content/siteDetails?site=${encodedSite}`;
    if (browserInfo.isEdge) return `edge://settings/content/siteDetails?site=${encodedSite}`;
    return null;
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6 bg-neutral-950">
      <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-8 animate-pulse border border-red-500/20 relative">
        <Settings className="w-12 h-12" />
        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg">
          <ShieldAlert className="w-4 h-4" />
        </div>
      </div>
      
      {protocolError && (
        <div className="w-full max-w-2xl mb-8 bg-red-500/10 border-2 border-red-500/50 rounded-[24px] p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-red-400 mb-2">需要本地网络权限</h3>
              <p className="text-sm text-red-300/80 leading-relaxed mb-4">
                {protocolError}
              </p>
              <div className="bg-red-950/50 border border-red-500/20 rounded-2xl p-4 mb-4 space-y-2">
                <p className="text-xs text-red-300/70 font-medium">请确保：</p>
                <ol className="text-xs text-red-300/60 space-y-1.5 list-decimal list-inside">
                  <li>浏览器已允许此网站访问本地网络设备（浏览器地址栏左侧锁图标 → 网站设置 → 本地网络访问 → 允许）</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onGrantPermission}
                  disabled={isConnecting}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 disabled:bg-red-800 disabled:text-red-400 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isConnecting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  {isConnecting ? "正在连接..." : "我已确认，开始连接"}
                </button>
                <button
                  onClick={onConnect}
                  disabled={isConnecting}
                  className="h-12 px-6 bg-red-950/50 border border-red-500/30 hover:bg-red-950 text-red-400 font-bold rounded-2xl transition-all text-xs"
                >
                  跳过，直接重试
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">{title}</h2>
      <p className="text-neutral-400 max-w-lg mb-8 text-lg leading-relaxed">
        无法连接到 R1 音箱。现代浏览器出于安全考虑，限制了网页对本地网络设备的访问权限。
      </p>

      <div className="bg-amber-500/10 border border-amber-500/50 rounded-[20px] p-5 mb-10 max-w-lg w-full flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0 animate-pulse" />
        <span className="text-amber-400 font-bold text-lg tracking-wide">
          如果长时间无法连接，请尝试 <span className="text-amber-300 font-black border-b-2 border-amber-500/50 pb-0.5">手动重启音箱</span>
        </span>
      </div>
      <div className="max-w-2xl w-full mb-12">
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
      </div>

      {/* Auto-reconnect status */}
      {!isConnected && !isConnecting && !permissionRequired && (
        <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 animate-pulse">
           Auto-reconnect active: Retrying in 3s...
        </div>
      )}

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
    </div>
  );
}
