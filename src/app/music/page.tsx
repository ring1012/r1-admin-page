"use client";

import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, ListMusic, Volume2, Settings, ArrowLeft, Disc, Music as MusicIcon, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { useMusic } from '@/components/MusicContext';
import Link from 'next/link';
import { PageLayout } from '@/components/layout';

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
  const [showPlaylist, setShowPlaylist] = useState(true);

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

  const currentSong = states?.playList?.[states?.playIndex] || null;
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
            {/* Rotating Disc */}
            <div className="relative group">
              {/* Outer Glow */}
              <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-tr from-purple-500 via-blue-500 to-emerald-500 ${isPlaying ? 'animate-pulse' : ''}`} />

              {/* Spinning Disc Container */}
              <div className={`relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-8 border-neutral-900 shadow-2xl p-2 bg-neutral-950 overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`}>
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

              {/* Tonearm/Needle Visualization (Static but decor) */}
              <div className="absolute -right-4 top-0 w-2 h-32 bg-neutral-700 origin-top rotate-[15deg] hidden sm:block rounded-full shadow-lg border border-neutral-600/50" />
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
      `}</style>
    </PageLayout>
  );
}
