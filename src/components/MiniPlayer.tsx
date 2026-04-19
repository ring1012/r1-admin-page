"use client";

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, ListMusic, Maximize2 } from 'lucide-react';
import { useMusic } from './MusicContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MiniPlayer() {
  const { position, states, play, pause, next, prev, isConnected, ip } = useMusic();
  const pathname = usePathname();

  // Hide on music details page or if not connected
  if (pathname === '/music' || !isConnected) return null;

  const currentSong = states?.playList && states.playIndex !== undefined ? states.playList[states.playIndex] : null;

  const progress = position ? (position.play_time / position.total_time) * 100 : 0;
  const isPlaying = position?.status === 1 || position?.status === 3;

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

  const currentHref = (href: string) => {
    if (!ip) return href;
    return `${href}?ip=${ip}`;
  };

  return (
    <div className="fixed bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-50 pointer-events-none">
      <div className="mx-auto max-w-4xl bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto ring-1 ring-white/5">
        {/* Progress Bar Top */}
        <div className="h-1 w-full bg-neutral-800/50">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-500 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Song Info */}
          <Link href={currentHref('/music')} className="flex items-center gap-3 min-w-0 flex-1 group">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative border border-neutral-700/50 transition-transform duration-500`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                {currentSong?.imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={`/api/img-proxy?url=${encodeURIComponent(currentSong.imgUrl)}`} 
                    alt="Album Art" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-6 h-6 text-neutral-400" />
                )}
                {/* Vinyl effect overlay */}
                {currentSong?.imgUrl && <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight group-hover:text-purple-400 transition-colors">
                {currentSong?.title || '未在播放'}
              </h4>
              <p className="text-[10px] sm:text-xs text-neutral-500 truncate mt-0.5 font-medium uppercase tracking-tighter">
                {currentSong?.artist || '小讯播放器'}
              </p>
            </div>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            <button 
              onClick={() => prev()}
              className="p-2 text-neutral-400 hover:text-white transition-colors hidden xs:block"
              title="上一首"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={() => isPlaying ? pause() : play()}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-purple-500/20"
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause className="fill-current w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="fill-current w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
            </button>
            <button 
              onClick={() => next()}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
              title="下一首"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Right Section / Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-[10px] tabular-nums text-neutral-500 font-black hidden md:block">
              {formatTime(position?.play_time || 0)} / {formatTime(position?.total_time || 0)}
            </div>
            <Link 
              href={currentHref('/music')}
              className="p-2 rounded-xl bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border border-neutral-700/50 flex items-center justify-center sm:w-10 sm:h-10"
              title="详情"
            >
              <Maximize2 className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
