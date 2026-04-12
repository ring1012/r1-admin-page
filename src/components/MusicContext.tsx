"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

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

  // 1. Force HTTP redirect to allow insecure WebSocket and enforce specific domain
  useEffect(() => {
    const targetHost = 'r1-web.huan.dedyn.io:8080';
    const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!isLocal && typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const isWrongHost = window.location.host !== targetHost;

      if (isHttps || isWrongHost) {
        console.warn("Redirecting to authorized HTTP domain for compatibility...");
        const newUrl = `http://${targetHost}${window.location.pathname}${window.location.search}`;
        window.location.replace(newUrl);
      }
    }

  }, []);

  // 2. WebSocket Connection Logic
  useEffect(() => {
    // Skip if no IP or if we're still on HTTPS (redirect pending)
    if (!ip || (typeof window !== 'undefined' && window.location.protocol === 'https:' && window.location.hostname !== 'localhost')) {
      return;
    }

    let heartbeatTimer: NodeJS.Timeout | null = null;

    const connect = () => {
      const wsUrl = `ws://${ip}/ws/status`;
      console.log(`Connecting to ${wsUrl}...`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");

        // Start heartbeat to prevent server SocketTimeoutException (usually 5s on NanoHTTPD)
        heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              action: "message",
              data: {
                what: -1,
                arg1: -1,
                arg2: -1,
                obj: "keep alive",
              }
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
        } catch (e) {
          // Ignore non-JSON heartbeat responses
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error", error);
        setIsConnected(false);
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        console.log(`WebSocket closed: code=${event.code}, reason=${event.reason || 'none'}. Retrying in 3s...`);
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent retry loop on unmount
        wsRef.current.close();
      }
    };
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
      saveAiConfig
    }}>
      {children}
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
