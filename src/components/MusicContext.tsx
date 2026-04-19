"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PlayPositionInfo {
  music_id: string;
  play_time: number;
  status: number;
  timestamp: string;
  total_time: number;
}

export interface PlaySong {
  album: string;
  artist: string;
  itemId: string;
  itemType: number;
  title: string;
  url: string;
  imgUrl: string;
}

export interface PlayAllStates {
  playIndex: number;
  playList: PlaySong[];
  playMode: number;
  playState: number;
}

interface MusicContextType {
  position: PlayPositionInfo | null;
  states: PlayAllStates | null;
  volume: number; // Volume 0-10
  isConnected: boolean;
  ip: string | null;
  play: (index?: number) => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setMode: (mode: number) => Promise<void>;
  aiConfig: any;
  isAiEnabled: boolean;
  queryAiConfig: () => void;
  saveAiConfig: (config: any, enabled: boolean) => void;
  connectDevice: () => void;
  isConnecting: boolean;
  protocolError: string | null;
  searchMusic: (keyword: string) => void;
  searchResult: any;
  serial: string | null;
  playList: (data: { index: number; itemList: PlaySong[]; pageIndex: number; totalPage: number }) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<PlayPositionInfo | null>(null);
  const [states, setStates] = useState<PlayAllStates | null>(null);
  const [volume, setVolumeState] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const searchParams = useSearchParams();
  const ip = searchParams.get('ip');
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [protocolError, setProtocolError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [serial, setSerialState] = useState<string | null>(null);

  const [recommendation, setRecommendation] = useState<{ url: string; target: string } | null>(null);

  // Connection compatibility detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Skip recommendation if user already dismissed it in this session
    if (sessionStorage.getItem('r1_recommendation_dismissed')) return;

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = ua ? /iPhone|iPad|iPod|Android/i.test(ua) : false;
    const targetHost = isMobile ? 'r1-web.huan.dedyn.io:8080' : 'r1.huan.dedyn.io';
    const targetProtocol = isMobile ? 'http:' : 'https:';
    
    if (window.location.host !== targetHost || window.location.protocol !== targetProtocol) {
      const url = `${targetProtocol}//${targetHost}${window.location.pathname}${window.location.search}`;
      setRecommendation({ url, target: isMobile ? '移动端' : '电脑端' });
    }
  }, []);

  const handleAcceptRecommendation = () => {
    if (recommendation) {
      window.location.replace(recommendation.url);
    }
  };

  const handleDismissRecommendation = () => {
    setRecommendation(null);
    sessionStorage.setItem('r1_recommendation_dismissed', 'true');
  };

  const connectDevice = () => {
    if (!ip) return;
    
    setProtocolError(null);
    setIsConnecting(true);
    
    const sanitizedIp = ip.trim();
    const wsUrl = `ws://${sanitizedIp}/ws/status`;
    console.log(`[MusicContext] Manual attempt to connect: ${wsUrl}`);

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let heartbeatTimer: NodeJS.Timeout | null = null;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      console.log("WebSocket connected");
      heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ 
            action: "message", 
            data: { what: -1, arg1: -1, arg2: -1, obj: "keep alive" } 
          }));
        }
      }, 3000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.position) setPosition(data.position);
        if (data.states) setStates(data.states);
        if (data.volume !== undefined) setVolumeState(data.volume);
        if (data.serial) setSerialState(data.serial);
        
        // Restore AI config sync logic
        if (data.action === "ai" && data.data) {
          if (data.data.enabled !== undefined) setIsAiEnabled(data.data.enabled);
          if (data.data.config !== undefined) {
            try {
              const parsed = JSON.parse(data.data.config);
              setAiConfig(parsed);
            } catch (e) {
              setAiConfig(data.data.config);
            }
          }
        }

        if (data.action === "search_result" && data.data) {
          try {
            const parsed = JSON.parse(data.data);
            setSearchResult(parsed);
          } catch (e) {
            console.error("Failed to parse search result", e);
          }
        }
      } catch (e) {}
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
      setIsConnected(false);
      setIsConnecting(false);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setIsConnecting(false);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      console.warn(`WebSocket closed: code=${event.code}`);
    };
  };

  // Auto-connect attempt
  useEffect(() => {
    if (ip) {
      connectDevice();
    }
  }, [ip]);

  const sendWsCommand = (action: string, data?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, data }));
    } else {
      console.error(`Cannot send command ${action}, WebSocket is not connected`);
    }
  };

  const play = async (index?: number) => sendWsCommand('play', index !== undefined ? { index } : undefined);
  const pause = async () => sendWsCommand('pause');
  const next = async () => sendWsCommand('next');
  const prev = async () => sendWsCommand('prev');
  const setVolume = async (volume: number) => {
    // Optimistic UI update
    setVolumeState(volume);
    sendWsCommand('volume', { volume });
  };
  const setMode = async (mode: number) => sendWsCommand('mode', { mode });

  const queryAiConfig = () => sendWsCommand('ai', { type: 'query' });

  const saveAiConfig = (config: any, enabled: boolean) => {
    // 1. Send AI_ENABLE message (if needed, but user said obj is serialized config)
    // Actually the user provided a specific format for "ai" action save:
    // {"action":"ai","data":{ "what": 65536, "arg1": 2, "arg2": 3, "obj": ai配置序列化string}}

    // The target APK2 handles saving both enable and config via this message usually.
    // If not, we'd send two messages. Let's stick to what the user provided.

    sendWsCommand('ai', {
      type: 'save1', // our bridge uses this to recognize save
      what: 65536,
      arg1: 2,
      arg2: enabled ? 1 : 0,
      obj: "https://r1-py.thd.dpdns.org"
    });

    sendWsCommand('ai', {
      type: 'save2', // our bridge uses this to recognize save
      what: 65536,
      arg1: 2,
      arg2: 3,
      obj: JSON.stringify(config)
    });

    // Optionally also send enable status if it's separate?
    // User said "点了之后发送消息 ... obj: ai配置序列化string"
    // Usually AI_ENABLE is a separate SP key. 
    // If I need to send another message for enabled status:
    // sendWsCommand('ai', { what: 65536, arg1: 2, arg2: 1, obj: enabled ? "true" : "false" });
    // But let's follow the user's provided structure.
  };

  const searchMusic = (keyword: string) => {
    setSearchResult(null);
    sendWsCommand('search', { keyword });
  };

  const playList = async (data: { index: number; itemList: PlaySong[]; pageIndex: number; totalPage: number }) => {
    sendWsCommand('play_list', data);
  };

  return (
    <MusicContext.Provider value={{
      position,
      states,
      volume,
      isConnected,
      ip,
      play,
      pause,
      next,
      prev,
      setVolume,
      setMode,
      aiConfig,
      isAiEnabled,
      queryAiConfig,
      saveAiConfig,
      connectDevice,
      isConnecting,
      protocolError,
      searchMusic,
      searchResult,
      serial,
      playList
    }}>
      {children}
      
      {/* Recommendation Dialog */}
      {recommendation && (
        <Dialog open={!!recommendation} onOpenChange={(open) => !open && handleDismissRecommendation()}>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white rounded-[32px] max-w-sm sm:max-w-md">
            <DialogHeader className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-2">
                <Globe className="w-8 h-8" />
              </div>
              <DialogTitle className="text-2xl font-black text-center tracking-tighter">
                检测到访问环境优化建议
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-center text-base leading-relaxed">
                检测到您当前正在使用 <span className="text-white font-bold">{recommendation.target}</span> 访问，为了获得更稳定的连接体验，建议切换到以下地址：
                <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-2xl font-mono text-xs text-blue-400 break-all">
                  {recommendation.url}
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
              <button 
                onClick={handleDismissRecommendation}
                className="flex-1 h-14 rounded-2xl border border-neutral-800 text-neutral-400 font-bold hover:bg-neutral-800 transition-all"
              >
                留在当前页
              </button>
              <button 
                onClick={handleAcceptRecommendation}
                className="flex-[2] h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-lg"
              >
                立即跳转
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
