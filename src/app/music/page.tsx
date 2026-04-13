"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, ListMusic, Volume2, Settings, ArrowLeft, Disc, Music as MusicIcon, Repeat, Repeat1, Shuffle, FileText } from 'lucide-react';
import { useMusic } from '@/components/MusicContext';
import Link from 'next/link';
import { PageLayout } from '@/components/layout';
import { useSearchParams } from 'next/navigation';

export default function MusicDetailsPage() {
  const {
    position,
    states,
    volume,
    play,
    pause,
    next,
    prev,
    setVolume,
    setMode,
    isConnected,
    ip
  } = useMusic();
  const searchParams = useSearchParams();
  
  const currentSong = states?.playList?.[states?.playIndex] || null;
  
  // Extract params from currentSong.url or page URL
  const getSongParams = () => {
    if (!currentSong?.url) return { id: searchParams.get('id'), lyricsType: searchParams.get('lyricsType') };
    try {
      const url = new URL(currentSong.url.startsWith('http') ? currentSong.url : `http://dummy.com${currentSong.url}`);
      return {
        id: url.searchParams.get('id') || searchParams.get('id'),
        lyricsType: url.searchParams.get('lyricsType') || searchParams.get('lyricsType')
      };
    } catch (e) {
      return { id: searchParams.get('id'), lyricsType: searchParams.get('lyricsType') };
    }
  };

  const { id: effectiveId, lyricsType: effectiveLyricsType } = getSongParams();

  const [showPlaylist, setShowPlaylist] = useState(true);
  const [lyrics, setLyrics] = useState<any[]>([]);
  const [showLyricsInDisc, setShowLyricsInDisc] = useState(false);
  const [manualShowLyrics, setManualShowLyrics] = useState(false);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (effectiveId && effectiveLyricsType === 'kuwo') {
      const fetchLyrics = async () => {
        setIsLoadingLyrics(true);
        try {
          const res = await fetch(`/get-lyric?id=${effectiveId}&type=${effectiveLyricsType}`);
          const result = await res.json();
          if (result.code === 200 && result.data?.lrclist) {
            setLyrics(result.data.lrclist);
          }
        } catch (error) {
          console.error("Failed to fetch lyrics:", error);
        } finally {
          setIsLoadingLyrics(false);
        }
      };
      fetchLyrics();
    } else {
      setLyrics([]);
    }
  }, [effectiveId, effectiveLyricsType]);

  useEffect(() => {
    if (showLyricsInDisc && scrollRef.current) {
      const container = scrollRef.current;
      const currentLine = container.querySelector('.lyric-active') as HTMLElement;
      if (currentLine) {
        // Only scroll the internal container, avoiding page-level jumps
        const targetScrollTop = currentLine.offsetTop - (container.clientHeight / 2) + (currentLine.clientHeight / 2);
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [position?.play_time, showLyricsInDisc]);

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-neutral-950">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 animate-pulse border border-red-500/20">
            <Settings className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">设备未连接</h2>
          <p className="text-neutral-400 max-w-md mb-8">
            无法连接到 R1 音箱。请确保 IP 地址正确且音箱已升级到最新版本。
          </p>
          <Link
            href={ip ? `/?ip=${ip}` : '/'}
            className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl transition-all border border-neutral-700 font-bold"
          >
            返回主页
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isPlaying = position?.status === 1 || position?.status === 3;
  const progress = position ? (position.play_time / position.total_time) * 100 : 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const min = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getModeIcon = () => {
    if (states?.playMode === 3) return <Repeat1 className="w-5 h-5 text-neutral-400 group-hover:text-purple-400" />;
    if (states?.playMode === 2) return <Repeat className="w-5 h-5 text-neutral-400 group-hover:text-blue-400" />;
    return <Shuffle className="w-5 h-5 text-neutral-400 group-hover:text-amber-400" />;
  };

  const getModeText = () => {
    if (states?.playMode === 1) return '随机播放';
    if (states?.playMode === 2) return '顺序播放';
    if (states?.playMode === 3) return '单曲循环';
    return '未知模式';
  };

  const getStatusText = () => {
    switch (position?.status) {
      case 1: return "正在播放";
      case 2: return "已暂停";
      case 3: return "正在缓冲";
      default: return "停止";
    }
  };

  return (
    <PageLayout>
      <div className="relative min-h-[90vh] pb-24 overflow-hidden pt-8 px-4 sm:px-6">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">

          {/* Main Player Section (LHS) */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col items-center justify-center space-y-12">
            {/* Main Player Visual Section */}
            <div className="relative w-full flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
              {/* Spinning Disc (Visible when not showing lyrics) */}
              <div 
                onClick={() => setShowLyricsInDisc(true)}
                className={`relative group transition-all duration-700 transform ${showLyricsInDisc ? 'scale-75 opacity-0 pointer-events-none rotate-[-45deg] blur-2xl' : 'scale-100 opacity-100 rotate-0 blur-0'}`}
              >
                {/* Outer Glow */}
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-tr from-purple-500 via-blue-500 to-emerald-500 ${isPlaying ? 'animate-pulse' : ''}`} />

                {/* Spinning Disc Container */}
                <div className={`relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-8 border-neutral-900 shadow-2xl p-2 bg-neutral-950 overflow-hidden cursor-pointer ${isPlaying ? 'animate-spin-slow' : ''}`}>
                  <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentSong?.imgUrl ? `/api/img-proxy?url=${encodeURIComponent(currentSong.imgUrl)}` : "/default-album.png"}
                      alt="Album Art"
                      className="w-full h-full object-cover"
                    />
                    {/* Record texture overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
                    <div className="absolute inset-x-0 inset-y-0 border-[20px] border-black/10 rounded-full pointer-events-none" />

                    {/* Center Hole */}
                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-neutral-900 rounded-full border-4 border-neutral-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-neutral-700 rounded-full" />
                    </div>
                  </div>
                </div>
                
                {/* Interaction Hint */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                   <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">点击显示歌词</span>
                </div>
              </div>

              {/* Enhanced Lyrics Panel (Visible when toggled) */}
              <div 
                onClick={() => setShowLyricsInDisc(false)}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 transform ${showLyricsInDisc ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 pointer-events-none translate-y-12 blur-xl'}`}
              >
                <div className="w-full h-full bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/80 rounded-[40px] p-8 relative overflow-hidden shadow-2xl cursor-pointer hover:bg-neutral-900/50 transition-colors">
                  {/* Decorative background gradients */}
                  <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-500/5 blur-[100px] animate-pulse" />
                  <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-blue-500/5 blur-[100px]" />
                  
                  <div 
                    ref={scrollRef}
                    className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-48 pb-48 no-scrollbar scroll-smooth relative z-10"
                  >
                    {lyrics.map((line, index) => {
                      const lyricTime = parseFloat(line.time) * 1000;
                      const nextLineTime = lyrics[index + 1] ? parseFloat(lyrics[index + 1].time) * 1000 : Infinity;
                      const offset = 400; // 400ms offset to compensate for lag
                      const isCurrent = (position?.play_time || 0) + offset >= lyricTime && (position?.play_time || 0) + offset < nextLineTime;
                      
                      const gradients = [
                        'from-rose-400 via-pink-400 to-purple-500',
                        'from-cyan-400 via-blue-500 to-indigo-600',
                        'from-amber-400 via-orange-500 to-red-600',
                        'from-emerald-400 via-teal-500 to-cyan-600',
                        'from-violet-400 via-purple-500 to-fuchsia-600',
                        'from-lime-400 via-green-500 to-emerald-600',
                        'from-sky-400 via-blue-500 to-indigo-600',
                        'from-yellow-400 via-amber-500 to-orange-600',
                        'from-fuchsia-400 via-pink-500 to-rose-600',
                        'from-teal-400 via-cyan-500 to-sky-600',
                        'from-red-400 via-orange-500 to-yellow-500',
                        'from-indigo-400 via-violet-500 to-purple-600',
                        'from-rose-500 via-rose-300 to-purple-400',
                        'from-blue-400 via-cyan-300 to-emerald-400',
                        'from-orange-400 via-yellow-300 to-amber-500',
                        'from-purple-400 via-fuchsia-300 to-pink-500',
                        'from-green-400 via-lime-300 to-yellow-400',
                        'from-cyan-500 via-sky-300 to-blue-400',
                        'from-pink-400 via-rose-300 to-amber-400',
                        'from-teal-500 via-emerald-300 to-lime-400',
                        'from-violet-500 via-purple-300 to-indigo-400',
                        'from-amber-500 via-yellow-300 to-white',
                        'from-rose-400 via-white to-sky-400',
                        'from-emerald-400 via-white to-purple-400',
                        'from-orange-400 via-white to-blue-400',
                        'from-fuchsia-400 via-white to-emerald-400',
                        'from-blue-600 via-purple-500 to-pink-500',
                        'from-emerald-600 via-teal-500 to-cyan-500',
                        'from-yellow-600 via-orange-500 to-red-500',
                        'from-sky-600 via-indigo-500 to-violet-500'
                      ];
                      const currentGradient = gradients[index % gradients.length];
                      
                      const shadowColors = [
                        '#fb7185', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa',
                        '#a3e635', '#0ea5e9', '#facc15', '#e879f9', '#2dd4bf',
                        '#f87171', '#818cf8', '#f43f5e', '#60a5fa', '#fb923c',
                        '#c084fc', '#4ade80', '#06b6d4', '#f472b6', '#10b981',
                        '#8b5cf6', '#f59e0b', '#fda4af', '#a7f3d0', '#fed7aa',
                        '#f5d0fe', '#2563eb', '#059669', '#d97706', '#4f46e5'
                      ];
                      const currentShadow = shadowColors[index % shadowColors.length];
                      
                      return (
                        <p 
                          key={index}
                          className={`text-center transition-all duration-700 transform px-8 select-none flex items-center justify-center w-full break-words whitespace-normal min-h-[66px] ${
                            isCurrent 
                              ? `text-2xl font-black scale-110 opacity-100 bg-gradient-to-r ${currentGradient} bg-clip-text text-transparent lyric-active` 
                              : 'text-2xl font-bold opacity-25 hover:opacity-60 scale-90 text-neutral-400'
                          }`}
                          style={{
                            filter: isCurrent ? `drop-shadow(0 0 20px ${currentShadow})` : 'none',
                          }}
                        >
                          {line.lineLyric}
                        </p>
                      );
                    })}
                    {lyrics.length === 0 && (
                      <div className="flex flex-col items-center gap-6 py-20 opacity-50">
                         <MusicIcon className="w-16 h-16 text-neutral-700" />
                         <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
                           {isLoadingLyrics ? "Synching Sequence..." : "Lyric Data Unavailable"}
                         </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Hint Overlay - Adjusted for mobile */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-neutral-600 opacity-30 hover:opacity-100 transition-opacity hidden sm:block">
                    点击返回封面
                  </div>
                  <div className="absolute top-4 right-6 sm:hidden">
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-neutral-400">
                      点击返回
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Song Meta */}
            <div className="text-center space-y-3 z-10">
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                {currentSong?.title || '未在播放音乐'}
              </h1>
              <p className="text-xl text-neutral-400 font-medium tracking-wide">
                {currentSong?.artist || '小讯播放器'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-widest">
                  {getStatusText()}
                </span>
                <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                  {currentSong?.album || '未知专辑'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls & Status Panels (RHS) */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-start space-y-6 lg:pt-12">

            {/* Main Controls Panel */}
            <div className="bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/80 p-8 sm:p-10 rounded-[40px] space-y-8 shadow-2xl">

              {/* Progress Slider */}
              <div className="space-y-4">
                <div className="relative h-2 w-full bg-neutral-800 rounded-full overflow-hidden group cursor-pointer">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-black tabular-nums text-neutral-500 tracking-wider">
                  <span>{formatTime(position?.play_time || 0)}</span>
                  <span>{formatTime(position?.total_time || 0)}</span>
                </div>
              </div>

              {/* Interaction Buttons */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    const nextMode = (states?.playMode || 1) % 3 + 1;
                    setMode(nextMode);
                  }}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-neutral-800/30 flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border border-neutral-800 group px-1 sm:px-2 shrink-0"
                  title="切换播放模式"
                >
                  <div className="scale-75 sm:scale-100">{getModeIcon()}</div>
                  <span className="text-[8px] sm:text-[10px] font-bold mt-0.5 sm:mt-1.5 uppercase tracking-tighter text-neutral-400 group-hover:text-neutral-200 transition-colors whitespace-nowrap">{getModeText()}</span>
                </button>

                <div className="flex items-center gap-3 xs:gap-4 sm:gap-10">
                  <button
                    onClick={() => prev()}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-neutral-800/50 flex items-center justify-center text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all border border-neutral-700/50 shrink-0"
                  >
                    <SkipBack className="w-5 h-5 sm:w-7 sm:h-7" />
                  </button>

                  <button
                    onClick={() => isPlaying ? pause() : play()}
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-[30px] sm:rounded-[40px] bg-white text-black flex items-center justify-center hover:scale-105 active:scale-90 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] sm:shadow-[0_20px_50px_rgba(255,255,255,0.15)] ring-4 sm:ring-8 ring-white/5 shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 sm:w-10 sm:h-10 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 sm:w-10 sm:h-10 fill-current ml-1" />
                    )}
                  </button>

                  <button
                    onClick={() => next()}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-neutral-800/50 flex items-center justify-center text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all border border-neutral-700/50 shrink-0"
                  >
                    <SkipForward className="w-5 h-5 sm:w-7 sm:h-7" />
                  </button>
                </div>

                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl transition-all border flex items-center justify-center shrink-0 ${showPlaylist ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-neutral-800/30 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                  title="播放列表"
                >
                  <ListMusic className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-3 shrink-0">
                  <Volume2 className="w-6 h-6 text-neutral-500" />
                  <span className="text-white font-bold text-sm min-w-[20px]">{volume}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={volume * 10}
                  className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  onChange={(e) => setVolume(Math.round(parseInt(e.target.value) / 10))}
                />
              </div>
            </div>

            {/* Playlist Panel (Always visible at bottom now) */}
            <div className={`bg-neutral-900/40 backdrop-blur-2xl border border-neutral-800/80 rounded-[40px] overflow-hidden transition-all duration-500 flex flex-col shadow-2xl ${showPlaylist ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden border-none'}`}>
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-3">
                  <ListMusic className="w-5 h-5 text-purple-400" />
                  <h3 className="font-black text-sm uppercase tracking-widest text-white">播放队列 ({states?.playList?.length || 0})</h3>
                </div>
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  当前处于 {getModeText()}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[400px]">
                {states?.playList?.map((song, idx) => (
                  <button
                    key={idx}
                    onClick={() => play(idx)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${states.playIndex === idx ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${states.playIndex === idx ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                      {states.playIndex === idx && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <div className="w-1 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]" />
                          <div className="w-1 bg-white animate-[music-bar_1s_ease-in-out_infinite_0.1s]" />
                          <div className="w-1 bg-white animate-[music-bar_1.2s_ease-in-out_infinite_0.2s]" />
                        </div>
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className={`text-sm font-bold truncate ${states.playIndex === idx ? 'text-purple-300' : 'text-white'}`}>
                        {song.title}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium truncate uppercase tracking-tighter">
                        {song.artist}
                      </div>
                    </div>
                    {states.playIndex === idx && (
                      <div className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-tighter shrink-0 border border-purple-500/30">
                        正在播放
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #666;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </PageLayout>
  );
}
