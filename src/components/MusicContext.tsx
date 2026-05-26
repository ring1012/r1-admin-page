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
  volume: number; // Volume 0-15
  isConnected: boolean;
  ip: string | null;
  play: (index?: number) => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setMode: (mode: number) => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  aiConfig: any;
  isAiEnabled: boolean;
  queryAiConfig: () => void;
  saveAiConfig: (config: any, enabled: boolean) => void;
  connectDevice: () => void;
  isConnecting: boolean;
  protocolError: string | null;
  permissionRequired: boolean;
  grantPermission: () => void;
  searchMusic: (keyword: string) => void;
  searchResult: any;
  serial: string | null;
  playList: (data: { index: number; itemList: PlaySong[]; pageIndex: number; totalPage: number }) => Promise<void>;
  weatherConfig: any;
  queryWeatherConfig: () => void;
  saveWeatherConfig: (config: any) => void;
  musicServiceConfig: any;
  queryMusicServiceConfig: () => void;
  saveMusicServiceConfig: (config: any) => void;
  storyServiceConfig: any;
  queryStoryServiceConfig: () => void;
  saveStoryServiceConfig: (config: any) => void;
  eqData: any;
  queryEq: () => void;
  setEq: (data: any) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<PlayPositionInfo | null>(null);
  const [states, setStates] = useState<PlayAllStates | null>(null);
  const [volume, setVolumeState] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [weatherConfig, setWeatherConfig] = useState<any>(null);
  const [musicServiceConfig, setMusicServiceConfig] = useState<any>(null);
  const [storyServiceConfig, setStoryServiceConfig] = useState<any>(null);
  const searchParams = useSearchParams();
  const ip = searchParams.get('ip');
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [protocolError, setProtocolError] = useState<string | null>(null);
  const [permissionRequired, setPermissionRequired] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [serial, setSerialState] = useState<string | null>(null);
  const [eqData, setEqData] = useState<any>(null);

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

        if (data.action === "weather" && data.data) {
          try {
            const parsed = typeof data.data.config === 'string' ? JSON.parse(data.data.config) : data.data.config;
            setWeatherConfig(parsed);
          } catch (e) {
            setWeatherConfig(data.data.config);
          }
        }

        if (data.action === "music_service" && data.data) {
          try {
            const parsed = typeof data.data.config === 'string' ? JSON.parse(data.data.config) : data.data.config;
            setMusicServiceConfig(parsed);
          } catch (e) {
            setMusicServiceConfig(data.data.config);
          }
        }

        if (data.action === "story_service" && data.data) {
          try {
            const parsed = typeof data.data.config === 'string' ? JSON.parse(data.data.config) : data.data.config;
            setStoryServiceConfig(parsed);
          } catch (e) {
            setStoryServiceConfig(data.data.config);
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

        if (data.action === "eq" && data.data) {
          setEqData(data.data);
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

  const grantPermission = () => {
    setPermissionRequired(false);
    setProtocolError(null);
    localStorage.setItem('r1_ws_permission', 'granted');
    connectDevice();
  };

  // Auto-connect logic on IP initialization
  useEffect(() => {
    if (ip) {
      const alreadyGranted = localStorage.getItem('r1_ws_permission') === 'granted';
      if (alreadyGranted) {
        connectDevice();
      } else {
        setPermissionRequired(true);
        setProtocolError('需要您确认允许网站访问本地网络设备，才能连接 R1 音箱');
      }
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
  const seek = async (positionMs: number) => sendWsCommand('seek', { position: positionMs });

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

  const queryWeatherConfig = () => sendWsCommand('weather', { type: 'query' });

  const saveWeatherConfig = (config: any) => {
    sendWsCommand('weather', {
      type: 'save',
      config: JSON.stringify(config)
    });
  };

  const queryMusicServiceConfig = () => sendWsCommand('music_service', { type: 'query' });

  const saveMusicServiceConfig = (config: any) => {
    sendWsCommand('music_service', {
      type: 'save',
      config: JSON.stringify(config)
    });
  };

  const queryStoryServiceConfig = () => sendWsCommand('story_service', { type: 'query' });

  const saveStoryServiceConfig = (config: any) => {
    sendWsCommand('story_service', {
      type: 'save',
      config: JSON.stringify(config)
    });
  };

  const queryEq = () => sendWsCommand('eq', { type: 'query' });
  const setEq = (data: any) => {
    // Optimistic update
    setEqData((prev: any) => ({ ...prev, ...data }));
    sendWsCommand('eq', { type: 'set', ...data });
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
      seek,
      aiConfig,
      isAiEnabled,
      queryAiConfig,
      saveAiConfig,
      connectDevice,
      isConnecting,
      protocolError,
      permissionRequired,
      grantPermission,
      searchMusic,
      searchResult,
      serial,
      playList,
      weatherConfig,
      queryWeatherConfig,
      saveWeatherConfig,
      musicServiceConfig,
      queryMusicServiceConfig,
      saveMusicServiceConfig,
      storyServiceConfig,
      queryStoryServiceConfig,
      saveStoryServiceConfig,
      eqData,
      queryEq,
      setEq,
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
