"use client";

import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
import { useMusic, PlaySong } from '@/components/MusicContext';
import { ConnectionMask } from '@/components/ConnectionMask';
import { Search, Heart, Plus, Play, MoreVertical, ListMusic, Trash2, Cpu, Zap, Library, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
  const [sourceType, setSourceType] = useState<'default' | 'custom'>('default');
  const [musicApi, setMusicApi] = useState('');
  const [customSearchResult, setCustomSearchResult] = useState<any>(null);


  const currentSerial = wsSerial || localSerial;
  const [isSearching, setIsSearching] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaySong[]>([]);
  const [activePopoverIndex, setActivePopoverIndex] = useState<number | null>(null);
  const [showPlaylistsMobile, setShowPlaylistsMobile] = useState(false);

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

  const handleSearch = async () => {
    if (!keyword.trim() || isSearching) return;

    setIsSearching(true);
    
    if (sourceType === 'default') {
      searchMusic(keyword);
    } else {
      try {
        const res = await fetch(`/api/search?musicApi=${encodeURIComponent(musicApi)}&keyword=${encodeURIComponent(keyword)}`);
        if (res.ok) {
          const data = await res.json();
          setCustomSearchResult(data);
        } else {
          console.error('Custom search failed');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }

    if (sourceType === 'default') {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        setIsSearching(false);
      }, 35000);
    }
  };


  useEffect(() => {
    if (searchResult && isSearching) {
      setIsSearching(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [searchResult, isSearching]);

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

  const rawResults = sourceType === 'custom' 
    ? (customSearchResult?.itemList || customSearchResult?.musicList || customSearchResult?.musicinfo || []) 
    : (searchResult?.itemList || searchResult?.musicResult?.itemList || searchResult?.musicList || []);

  const results = rawResults.map((song: any) => ({
    ...song,
    itemId: song.itemId || song.id || '',
    itemType: song.itemType || 0
  }));

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
      <div className="max-w-7xl mx-auto py-6 sm:py-12 px-4 h-[calc(100vh-80px)] flex flex-col pt-4 sm:pt-8">
        {/* Header Setup */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 shrink-0 mb-6 sm:mb-8">
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-black uppercase tracking-widest text-[10px] sm:text-xs">
              <Library className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Music & Playlists</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tighter">音乐与歌单</h1>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Select value={sourceType} onValueChange={(v: any) => setSourceType(v)}>
                  <SelectTrigger className="w-[160px] bg-neutral-900/50 border-neutral-700 h-12 sm:h-14 rounded-[20px] sm:rounded-[24px] text-white backdrop-blur-xl">
                    <SelectValue placeholder="选择源" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                    <SelectItem value="default">小讯默认音乐源</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative w-full md:w-80 flex items-end">
                  <div className="w-full">
                    <Input
                      placeholder="搜歌名、歌手..."
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      className="bg-neutral-900/50 border-neutral-700 h-12 sm:h-14 pl-10 sm:pl-12 rounded-[20px] sm:rounded-[24px] focus:ring-purple-500 text-white w-full backdrop-blur-xl text-sm"
                    />
                    <Search className="w-5 h-5 sm:w-6 sm:h-6 absolute left-3.5 top-3.5 sm:left-4 sm:top-4 text-neutral-400" />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearchDisabled}
                      className={`absolute right-1 top-1 bottom-1 h-10 sm:h-12 rounded-[16px] sm:rounded-[20px] text-white px-4 sm:px-6 font-bold shadow-lg transition-all duration-300 ${isSearchDisabled
                          ? 'bg-neutral-800 cursor-not-allowed opacity-50 text-neutral-500'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30'
                        }`}
                    >
                      {isSearching ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      ) : showPlaylistMode ? '歌单模式' : '搜索'}
                    </Button>
                  </div>
                </div>
              </div>
              
              {sourceType === 'custom' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    placeholder="请输入自定义接口地址 (例如: http://api.example.com)"
                    value={musicApi}
                    onChange={e => setMusicApi(e.target.value)}
                    className="bg-neutral-900/50 border-neutral-700 h-10 rounded-xl focus:ring-purple-500 text-white w-full backdrop-blur-xl text-xs"
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 sm:gap-8">
          {/* Sidebar */}
          <div className={`w-full md:w-72 shrink-0 flex flex-col gap-4 transition-all duration-300 ${!showPlaylistsMobile ? 'max-h-[52px] md:max-h-none overflow-hidden' : 'max-h-[500px] md:max-h-none'}`}>
            <div className="flex items-center justify-between text-white font-bold px-2 py-2 md:py-0 cursor-pointer md:cursor-default" onClick={() => setShowPlaylistsMobile(!showPlaylistsMobile)}>
              <div className="flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-purple-400" />
                <span>我的歌单</span>
                <span className="md:hidden ml-1 text-xs text-neutral-500 font-medium">({playlists.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setShowCreate(true); }} className="p-1.5 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                  <PlusCircle className="w-5 h-5" />
                </button>
                <div className="md:hidden p-1 text-neutral-500">
                  {showPlaylistsMobile ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {showCreate && (
              <div className="bg-neutral-900/80 p-4 rounded-[24px] border border-neutral-800 flex flex-col gap-3 shadow-xl">
                <Input
                  value={newPlaylistName}
                  onChange={e => setNewPlaylistName(e.target.value)}
                  placeholder="新歌单名称"
                  className="bg-neutral-950 border-neutral-800 text-sm h-12 rounded-xl"
                />
                <div className="flex justify-end gap-2 text-sm">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="rounded-xl">取消</Button>
                  <Button size="sm" onClick={createPlaylist} className="bg-purple-600 rounded-xl">创建</Button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {playlists.map(p => (
                <div
                  key={p.uuid}
                  onClick={() => {
                    handlePlaylistSelect(p);
                    if (window.innerWidth < 768) setShowPlaylistsMobile(false);
                  }}
                  className={`group flex items-center justify-between px-4 py-3 sm:py-3.5 rounded-[20px] cursor-pointer transition-all duration-300 ${currentPlaylist?.uuid === p.uuid && showPlaylistMode ? 'bg-purple-500 shadow-lg text-white' : 'bg-transparent text-neutral-400 hover:bg-neutral-800/80 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <ListMusic className={`w-5 h-5 shrink-0 ${currentPlaylist?.uuid === p.uuid && showPlaylistMode ? 'text-white' : 'text-neutral-500'}`} />
                    <span className="font-bold truncate text-sm sm:text-[15px]">{p.name}</span>
                  </div>
                  {p.uuid !== 'default' && (
                    <button onClick={(e) => { e.stopPropagation(); deletePlaylist(p.uuid); }} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden h-full bg-neutral-900/40 rounded-[32px] sm:rounded-[40px] border border-neutral-800/80 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 sm:mb-6 px-1 sm:px-2 relative z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                {showPlaylistMode ? (
                  <>
                    <ListMusic className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <h2 className="text-base sm:text-xl font-black text-white truncate max-w-[120px] sm:max-w-none">{currentPlaylist?.name}</h2>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase">{playlistSongs.length} 首歌</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    <h2 className="text-base sm:text-xl font-black text-white">{results.length > 0 ? '搜索结果' : '音乐列表'}</h2>
                  </>
                )}
              </div>

              {showPlaylistMode && playlistSongs.length > 0 && (
                <Button size="sm" onClick={playCurrentPlaylist} className="h-8 rounded-full bg-purple-600 font-bold px-3 sm:px-4 text-[10px] sm:text-xs">
                  <Play className="w-3 h-3 fill-current mr-1" />
                  <span>一键播放</span>
                </Button>
              )}
              {!showPlaylistMode && results.length > 0 && (
                <Button size="sm" onClick={playAllResults} className="h-8 rounded-full bg-amber-500 font-bold px-3 sm:px-4 text-[10px] sm:text-xs">
                  <Play className="w-3 h-3 fill-current mr-1" />
                  <span>全部播放</span>
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar relative z-10">
              {showPlaylistMode ? (
                playlistSongs.map((song, i) => (
                  <div key={song.itemId || i} className="flex items-center gap-3 bg-neutral-950/30 hover:bg-purple-500/10 p-2.5 sm:p-2 rounded-2xl border border-transparent hover:border-purple-500/30 transition-all group" onClick={() => playSong(song)}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm sm:text-xs truncate">{song.title}</h4>
                      <p className="text-[11px] sm:text-[10px] text-neutral-500 truncate">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); removeFromPlaylist(song.itemId); }} className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-neutral-900 text-neutral-500 hover:text-white rounded-xl border border-neutral-800">
                         <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                       </button>
                       <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-neutral-900 text-purple-400 hover:text-white rounded-xl border border-neutral-800">
                         <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current" />
                       </button>
                    </div>
                  </div>
                ))
              ) : results.length > 0 ? (
                results.slice(0, 100).map((song: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-neutral-950/30 hover:bg-purple-500/10 p-2.5 sm:p-2 rounded-2xl border border-transparent hover:border-purple-500/30 transition-all group">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm sm:text-xs truncate">{song.title}</h4>
                      <p className="text-[11px] sm:text-[10px] text-neutral-500 truncate">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => playSong(song)} className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-neutral-900 text-purple-400 hover:text-white rounded-xl border border-neutral-800">
                        <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-current" />
                      </button>
                      <Popover open={activePopoverIndex === i} onOpenChange={(open) => setActivePopoverIndex(open ? i : null)}>
                        <PopoverTrigger asChild>
                          <button className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center bg-neutral-900 text-purple-400 hover:text-white rounded-xl border border-neutral-800">
                            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="bg-neutral-900/95 backdrop-blur-xl border-neutral-800 text-white rounded-2xl p-1 min-w-[140px] w-auto">
                          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-white/5 mb-1">选择目标歌单</div>
                          {playlists.map(p => (
                            <div key={p.uuid} onClick={() => addToPlaylist(song, p.uuid)} className="hover:bg-purple-500/20 hover:text-purple-300 cursor-pointer rounded-lg px-3 py-2 font-bold text-xs flex items-center gap-2 transition-colors">
                              <ListMusic className="w-3.5 h-3.5 opacity-50" />
                              {p.name}
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ))
              ) : (
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
