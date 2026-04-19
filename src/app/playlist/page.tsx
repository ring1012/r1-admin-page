"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import { useMusic, PlaySong } from '@/components/MusicContext';
import { ConnectionMask } from '@/components/ConnectionMask';
import { Search, Heart, Plus, Play, MoreVertical, ListMusic, Trash2, Cpu, Zap, Library, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Playlist {
  uuid: string;
  name: string;
  desc: string;
  alias?: string;
}

export default function MusicPage() {
  const { isConnected, ip, searchMusic, searchResult, play, serial: wsSerial, isConnecting, connectDevice, playList } = useMusic();
  const [keyword, setKeyword] = useState('');
  const [localSerial, setLocalSerial] = useState('default-serial');

  const currentSerial = wsSerial || localSerial;
  const [isSearching, setIsSearching] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaySong[]>([]);
  const [activePopoverIndex, setActivePopoverIndex] = useState<number | null>(null);

  // Create Playlist Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Fetch Playlists First Time
  useEffect(() => {
    const savedSerial = localStorage.getItem('r1_serial');
    if (savedSerial) {
      setLocalSerial(savedSerial);
    }
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlist?action=list', {
        headers: { 'x-r1-serial': currentSerial }
      });
      if (res.ok) {
        let data = await res.json();
        // Ensure "我的收藏" is always there
        if (!data.some((p: any) => p.uuid === 'default')) {
          data = [{ uuid: 'default', name: '我的收藏', desc: '默认收藏歌单' }, ...data];
        } else {
          // Fix name if it was the old one
          data = data.map((p: any) => p.uuid === 'default' ? { ...p, name: '我的收藏' } : p);
        }
        setPlaylists(data);
        if (data.length > 0 && !currentPlaylist) {
          setCurrentPlaylist(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [currentSerial]);

  // Fetch songs when playlist changes
  useEffect(() => {
    if (currentPlaylist) {
      const fetchSongs = async () => {
        try {
          const res = await fetch(`/api/playlist?action=get_songs&uuid=${currentPlaylist.uuid}`, {
            headers: { 'x-r1-serial': currentSerial }
          });
          if (res.ok) {
            setPlaylistSongs(await res.json());
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchSongs();
    }
  }, [currentPlaylist, currentSerial]);

  const handleSearch = () => {
    if (!keyword.trim() || isSearching) return;

    setIsSearching(true);
    searchMusic(keyword);

    // Auto-reset searching state after 35s fallback
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setIsSearching(false);
    }, 35000);
  };

  // Reset searching state when searchResult arrives
  useEffect(() => {
    if (searchResult && isSearching) {
      setIsSearching(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [searchResult, isSearching]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const addToPlaylist = async (song: any, targetUuid: string, playlistName?: string) => {
    try {
      await fetch('/api/playlist?action=add_song', {
        method: 'POST',
        headers: {
          'x-r1-serial': currentSerial,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uuid: targetUuid,
          name: playlistName,
          song: song
        })
      });
      // reload playlist if it's the current one
      if (currentPlaylist && (currentPlaylist.uuid === targetUuid || (!targetUuid && currentPlaylist.uuid === 'default'))) {
        setPlaylistSongs(prev => {
          if (!prev.some(s => s.itemId === song.itemId)) {
            return [...prev, song];
          }
          return prev;
        });
      }
      setActivePopoverIndex(null);
    } catch (e) {
      console.error(e);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName) return;
    try {
      const res = await fetch('/api/playlist?action=create', {
        method: 'POST',
        headers: {
          'x-r1-serial': currentSerial,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newPlaylistName })
      });
      if (res.ok) {
        setShowCreate(false);
        setNewPlaylistName('');
        fetchPlaylists();
      }
    } catch (e) { }
  };

  const handlePlaylistSelect = (p: Playlist) => {
    setCurrentPlaylist(p);
    setKeyword(`歌单:${p.name}`);
  };

  const deletePlaylist = async (uuid: string) => {
    try {
      const res = await fetch(`/api/playlist?action=delete&uuid=${uuid}`, {
        method: 'DELETE',
        headers: { 'x-r1-serial': currentSerial }
      });
      if (res.ok) {
        if (currentPlaylist?.uuid === uuid) {
          setCurrentPlaylist(playlists[0]);
        }
        fetchPlaylists();
      }
    } catch (e) { }
  };

  const playSong = (song: any) => {
    playList({
      index: 0,
      itemList: [{ ...song, itemType: song.itemType || 0 }],
      pageIndex: 0,
      totalPage: 1
    });
  };

  const playAllResults = () => {
    if (results.length === 0) return;
    playList({
      index: 0,
      itemList: results.map((s: any) => ({ ...s, itemType: s.itemType || 0 })),
      pageIndex: 0,
      totalPage: 1
    });
  };

  const playCurrentPlaylist = () => {
    if (playlistSongs.length === 0) return;
    playList({
      index: 0,
      itemList: playlistSongs.map((s: any) => ({ ...s, itemType: s.itemType || 0 })),
      pageIndex: 0,
      totalPage: 1
    });
  };

  const parseSearchResultList = () => {
    if (!searchResult) return [];
    if (searchResult.itemList) return searchResult.itemList;
    if (searchResult.musicList) return searchResult.musicList;
    return [];
  };

  const results = parseSearchResultList();
  const showPlaylistMode = keyword.startsWith('歌单：') || keyword.startsWith('歌单:');
  const isSearchDisabled = isSearching || showPlaylistMode;

  const removeFromPlaylist = async (songId: string) => {
    if (!currentPlaylist) return;
    try {
      const res = await fetch(`/api/playlist?action=remove_song&uuid=${currentPlaylist.uuid}&songId=${songId}`, {
        method: 'DELETE',
        headers: { 'x-r1-serial': currentSerial }
      });
      if (res.ok) {
        setPlaylistSongs(prev => prev.filter(s => s.itemId !== songId));
      }
    } catch (e) { }
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <ConnectionMask 
          isConnected={isConnected} 
          isConnecting={isConnecting} 
          ip={ip || ''} 
          onConnect={connectDevice}
          title="音箱设备未连接"
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 h-[calc(100vh-80px)] flex flex-col pt-8">
        {/* Header Setup */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-black uppercase tracking-widest text-xs">
              <Library className="w-4 h-4" />
              <span>Music & Playlists</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">音乐与歌单</h1>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-80 flex items-end">
              <div className="w-full">
                <Input
                  placeholder="搜歌名、歌手..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="bg-neutral-900/50 border-neutral-700 h-14 pl-12 rounded-[24px] focus:ring-purple-500 text-white w-full backdrop-blur-xl"
                />
                <Search className="w-6 h-6 absolute left-4 top-4 text-neutral-400" />
                <Button
                  onClick={handleSearch}
                  disabled={isSearchDisabled}
                  className={`absolute right-1 top-1 bottom-1 h-12 rounded-[20px] text-white px-6 font-bold shadow-lg transition-all duration-300 ${isSearchDisabled
                      ? 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
                      : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                    }`}
                >
                  {isSearching ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>搜索中</span>
                    </div>
                  ) : showPlaylistMode ? '歌单模式' : '搜索'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-8">
          {/* Sidebar / Playlists */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
            <div className="flex items-center justify-between text-white font-bold px-2">
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-purple-400" />
                我的歌单
              </div>
              <button onClick={() => setShowCreate(true)} className="p-1 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>

            {showCreate && (
              <div className="bg-neutral-900/80 p-4 rounded-[24px] border border-neutral-800 flex flex-col gap-3 shadow-xl">
                <Input
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="新歌单名称"
                  className="bg-neutral-950 border-neutral-800 text-sm h-12 rounded-xl"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-neutral-400 font-bold hover:text-white rounded-xl">取消</Button>
                  <Button size="sm" onClick={createPlaylist} className="bg-purple-600 hover:bg-purple-500 font-bold rounded-xl shadow-lg">创建</Button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {playlists.map(p => (
                <div
                  key={p.uuid}
                  onClick={() => handlePlaylistSelect(p)}
                  className={`group flex items-center justify-between px-4 py-3.5 rounded-[20px] cursor-pointer transition-all duration-300 ${currentPlaylist?.uuid === p.uuid && showPlaylistMode ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white' : 'bg-transparent text-neutral-400 hover:bg-neutral-800/80 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <ListMusic className={`w-5 h-5 shrink-0 ${currentPlaylist?.uuid === p.uuid && showPlaylistMode ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                    <span className="font-bold truncate text-[15px]">{p.name} {p.alias && <span className="text-xs opacity-60 ml-1 font-medium">({p.alias})</span>}</span>
                  </div>
                  {p.uuid !== 'default' && (
                    <button onClick={(e) => { e.stopPropagation(); deletePlaylist(p.uuid); }} className={`opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500 text-red-300 hover:text-white rounded-lg transition-all ${currentPlaylist?.uuid === p.uuid && showPlaylistMode ? 'hover:bg-rose-500 text-rose-200' : ''}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Unified Result Area */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden h-full bg-neutral-900/40 rounded-[40px] border border-neutral-800/80 p-6 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

            {/* Area Header */}
            <div className="flex items-center justify-between mb-6 px-2 relative z-10">
              <div className="flex items-center gap-3">
                {showPlaylistMode ? (
                  <>
                    <ListMusic className="w-5 h-5 text-purple-400" />
                    <h2 className="text-xl font-black text-white">{currentPlaylist?.name} <span className="text-[10px] text-neutral-500 font-bold ml-2 uppercase tracking-widest">{playlistSongs.length} 首歌</span></h2>
                  </>
                ) : results.length > 0 ? (
                  <>
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-black text-white">搜索结果 <span className="text-[10px] text-neutral-500 font-bold ml-2 uppercase tracking-widest">{results.length} ITEMS</span></h2>
                  </>
                ) : (
                  <>
                    <Library className="w-5 h-5 text-neutral-600" />
                    <h2 className="text-xl font-black text-neutral-600 italic">音乐列表...</h2>
                  </>
                )}
              </div>

              {showPlaylistMode && (
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest">
                    正在查看本地歌单
                  </div>
                  <Button
                    size="sm"
                    onClick={playCurrentPlaylist}
                    className="h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 flex items-center gap-2 shadow-lg shadow-purple-900/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>一键播放</span>
                  </Button>
                </div>
              )}
              {!showPlaylistMode && results.length > 0 && (
                <Button
                  size="sm"
                  onClick={playAllResults}
                  className="h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 flex items-center gap-2 shadow-lg shadow-amber-900/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>全部播放</span>
                </Button>
              )}
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar relative z-10">
              {showPlaylistMode ? (
                /* Playlist Songs */
                playlistSongs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-4 mt-12">
                    <div className="w-20 h-20 bg-neutral-900 rounded-[32px] flex items-center justify-center -rotate-6 shadow-xl">
                      <ListMusic className="w-8 h-8 text-neutral-800" />
                    </div>
                    <p className="font-bold text-sm uppercase tracking-widest opacity-50">Empty Playlist</p>
                  </div>
                ) : (
                  playlistSongs.map((song, i) => (
                    <div key={song.itemId || i} className="flex items-center gap-2 bg-neutral-950/30 hover:bg-purple-500/10 p-1.5 rounded-xl border border-transparent hover:border-purple-500/30 transition-all duration-200 group cursor-pointer" onClick={() => playSong(song)}>
                      <div className="w-6 flex justify-center shrink-0">
                        <span className="text-neutral-500 font-bold text-[10px] group-hover:hidden">{i + 1}</span>
                        <Play className="w-3 h-3 text-white hidden group-hover:block fill-current" />
                      </div>
                      <div className="flex-1 min-w-0 px-2 line-clamp-1">
                        <span className="font-bold text-white text-xs truncate mr-2">{song.title}</span>
                        <span className="text-[10px] text-neutral-500 truncate font-medium uppercase tracking-tighter">{song.artist}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromPlaylist(song.itemId); }}
                          className="w-8 h-8 flex items-center justify-center bg-neutral-900 hover:bg-red-500 text-neutral-500 hover:text-white rounded-lg transition-all border border-neutral-800 hover:border-red-500"
                          title="从歌单移除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center bg-neutral-900 hover:bg-purple-500 text-neutral-400 hover:text-white rounded-lg transition-all border border-neutral-800 hover:border-purple-500" onClick={(e) => { e.stopPropagation(); playSong(song); }}>
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : results.length > 0 ? (
                /* Search Results */
                results.slice(0, 100).map((song: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-neutral-950/30 hover:bg-purple-500/10 p-1.5 rounded-xl border border-transparent hover:border-purple-500/30 transition-all duration-200 group">
                    <div className="flex-1 min-w-0 px-2 line-clamp-1">
                      <span className="font-bold text-white text-xs truncate mr-2">{song.title}</span>
                      <span className="text-[10px] text-neutral-500 truncate font-medium uppercase tracking-tighter">{song.artist}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pr-1">
                      <button
                        onClick={() => playSong(song)}
                        className="w-8 h-8 flex items-center justify-center bg-neutral-900 hover:bg-purple-500 text-neutral-400 hover:text-white rounded-lg transition-all border border-neutral-800 hover:border-purple-500"
                        title="立即播放"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <Popover open={activePopoverIndex === i} onOpenChange={(open) => setActivePopoverIndex(open ? i : null)}>
                        <PopoverTrigger asChild>
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-neutral-900 hover:bg-purple-500 text-neutral-400 hover:text-white rounded-lg transition-all border border-neutral-800 hover:border-purple-500"
                            title="添加到歌单"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="bg-neutral-900/95 backdrop-blur-xl border-neutral-800 text-white rounded-2xl shadow-2xl overflow-hidden p-1 min-w-[140px] w-auto">
                          <div className="px-3 py-2 text-[8px] font-black uppercase tracking-widest text-neutral-500 border-b border-white/5 mb-1">选择目标歌单</div>
                          {playlists.map(p => (
                            <div
                              key={p.uuid}
                              onClick={() => addToPlaylist(song, p.uuid)}
                              className="hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer rounded-lg px-3 py-2 font-bold text-xs transition-colors flex items-center gap-2"
                            >
                              <ListMusic className="w-3 h-3 opacity-50" />
                              {p.name}
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))
              ) : (
                /* Empty/Initial State */
                <div className="h-full flex flex-col items-center justify-center text-neutral-700 gap-4 mt-12">
                  <Search className="w-12 h-12 opacity-20" />
                  <div className="text-center">
                    <p className="font-black text-xs uppercase tracking-widest opacity-20">Ready to search</p>
                    <p className="text-[10px] font-medium opacity-10 mt-1 italic">Enter a keyword or select a playlist</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
