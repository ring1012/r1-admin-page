"use client";

import React, { useState, useEffect } from 'react';
import { Cloud, Music, BookOpen, Save, CheckCircle2, AlertCircle, Info, Settings2, Loader2 } from 'lucide-react';
import { useMusic } from '@/components/MusicContext';
import { ConnectionMask } from '@/components/ConnectionMask';
import { PageLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// ─── Weather Config Section ────────────────────────────────────────────────────

function WeatherConfigCard() {
  const { weatherConfig, queryWeatherConfig, saveWeatherConfig } = useMusic();

  const [provider, setProvider] = useState('qweather');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [endpointError, setEndpointError] = useState('');

  useEffect(() => {
    queryWeatherConfig();
  }, []);

  useEffect(() => {
    if (weatherConfig) {
      if (weatherConfig.provider) setProvider(weatherConfig.provider);
      if (weatherConfig.endpoint) setEndpoint(weatherConfig.endpoint);
      if (weatherConfig.apiKey) setApiKey(weatherConfig.apiKey);
    }
  }, [weatherConfig]);

  const handleEndpointChange = (val: string) => {
    setEndpoint(val);
    setIsSaved(false);
    if (val && !val.startsWith('https')) {
      setEndpointError('Endpoint 必须以 https 开头');
    } else {
      setEndpointError('');
    }
  };

  const handleSave = () => {
    if (!endpoint.startsWith('https')) {
      setEndpointError('Endpoint 必须以 https 开头');
      return;
    }
    saveWeatherConfig({ provider, endpoint, apiKey });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isValid = endpoint.startsWith('https') && apiKey.trim().length > 0;

  return (
    <Card className="bg-neutral-900/40 border-neutral-800 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-2xl">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-400" />
              天气服务配置
            </CardTitle>
            <CardDescription className="text-neutral-500">
              配置天气数据提供商及鉴权信息，AI 将使用此配置查询实时天气
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-6">
        {/* Provider Select */}
        <div className="space-y-2">
          <Label htmlFor="weather-provider" className="text-xs font-black uppercase tracking-widest text-neutral-400">
            天气服务商
          </Label>
          <Select value={provider} onValueChange={(v) => { setProvider(v); setIsSaved(false); }}>
            <SelectTrigger
              id="weather-provider"
              className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white"
            >
              <SelectValue placeholder="选择天气服务商" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-2xl">
              <SelectItem value="qweather">和风天气 (QWeather)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Endpoint */}
        <div className="space-y-2">
          <Label htmlFor="weather-endpoint" className="text-xs font-black uppercase tracking-widest text-neutral-400">
            API Endpoint
          </Label>
          <Input
            id="weather-endpoint"
            placeholder="https://api.qweather.com"
            value={endpoint}
            onChange={(e) => handleEndpointChange(e.target.value)}
            className={`bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white ${endpointError ? 'border-red-500/60' : ''}`}
          />
          {endpointError ? (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {endpointError}
            </p>
          ) : (
            <p className="text-xs text-neutral-600 mt-1">
              必须以 <code className="text-sky-400 font-mono">https</code> 开头，不需要末尾斜杠
            </p>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label htmlFor="weather-apikey" className="text-xs font-black uppercase tracking-widest text-neutral-400">
            API Key
          </Label>
          <Input
            id="weather-apikey"
            type="password"
            placeholder="your-qweather-api-key"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setIsSaved(false); }}
            className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white"
          />
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/15 text-neutral-400 text-[11px] leading-relaxed space-y-1">
          <div className="flex items-center gap-2 text-sky-400 font-bold mb-1">
            <Info className="w-3 h-3" />
            配置说明
          </div>
          <p>前往 <a href="https://dev.qweather.com" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">dev.qweather.com</a> 注册并获取 API Key。</p>
        </div>

        {/* Save Button */}
        <Button
          className={`w-full h-14 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${isValid
            ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-[0_10px_30px_rgba(14,165,233,0.3)]'
            : 'bg-neutral-800 opacity-40 cursor-not-allowed text-neutral-500'
            }`}
          disabled={!isValid}
          onClick={handleSave}
        >
          {isSaved ? (
            <><CheckCircle2 className="w-5 h-5 mr-2" /> 已保存</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> 保存天气配置</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Music Service Config Section ─────────────────────────────────────────────

function MusicServiceCard() {
  const { musicServiceConfig, queryMusicServiceConfig, saveMusicServiceConfig } = useMusic();

  const [provider, setProvider] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    queryMusicServiceConfig();
  }, []);

  useEffect(() => {
    if (musicServiceConfig?.provider) setProvider(musicServiceConfig.provider);
  }, [musicServiceConfig]);

  const handleSave = () => {
    saveMusicServiceConfig({ provider });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Card className="bg-neutral-900/40 border-neutral-800 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-2xl">
      <CardHeader className="p-8 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-violet-400" />
            音乐服务配置
          </CardTitle>
          <CardDescription className="text-neutral-500">
            选择 AI 播放音乐时使用的数据来源，影响歌曲搜索与播放质量
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-6">
        {/* Provider Select */}
        <div className="space-y-2">
          <Label htmlFor="music-provider" className="text-xs font-black uppercase tracking-widest text-neutral-400">
            音乐来源
          </Label>
          <Select value={provider} onValueChange={(v) => { setProvider(v); setIsSaved(false); }}>
            <SelectTrigger
              id="music-provider"
              className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white"
            >
              <SelectValue placeholder="选择音乐来源" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-2xl">
              <SelectItem value="default">🎵 默认 (Default)</SelectItem>
              <SelectItem value="youtube">▶️ YouTube Music</SelectItem>
              <SelectItem value="bilibili">📺 哔哩哔哩 (Bilibili)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-600 mt-1">
            选择后，AI 响应音乐请求时将优先使用该来源
          </p>
        </div>

        {/* Current Value */}
        {musicServiceConfig && (
          <div className="p-3 rounded-2xl bg-violet-500/5 border border-violet-500/15 text-[11px] text-neutral-400">
            <span className="text-violet-400 font-bold">当前配置：</span>{' '}
            {musicServiceConfig.provider === 'default' ? '默认' :
             musicServiceConfig.provider === 'youtube' ? 'YouTube Music' :
             musicServiceConfig.provider === 'bilibili' ? '哔哩哔哩' :
             musicServiceConfig.provider}
          </div>
        )}

        {/* Save Button */}
        <Button
          className="w-full h-14 rounded-3xl font-black text-sm uppercase tracking-widest transition-all bg-violet-600 hover:bg-violet-700 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)]"
          onClick={handleSave}
        >
          {isSaved ? (
            <><CheckCircle2 className="w-5 h-5 mr-2" /> 已保存</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> 保存音乐配置</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Story Service Config Section ─────────────────────────────────────────────

function StoryServiceCard() {
  const { storyServiceConfig, queryStoryServiceConfig, saveStoryServiceConfig } = useMusic();

  const [provider, setProvider] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    queryStoryServiceConfig();
  }, []);

  useEffect(() => {
    if (storyServiceConfig?.provider) setProvider(storyServiceConfig.provider);
  }, [storyServiceConfig]);

  const handleSave = () => {
    saveStoryServiceConfig({ provider });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Card className="bg-neutral-900/40 border-neutral-800 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-2xl">
      <CardHeader className="p-8 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            故事服务配置
          </CardTitle>
          <CardDescription className="text-neutral-500">
            选择 AI 播放故事或有声读物时使用的数据来源
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-4 space-y-6">
        {/* Provider Select */}
        <div className="space-y-2">
          <Label htmlFor="story-provider" className="text-xs font-black uppercase tracking-widest text-neutral-400">
            故事来源
          </Label>
          <Select value={provider} onValueChange={(v) => { setProvider(v); setIsSaved(false); }}>
            <SelectTrigger
              id="story-provider"
              className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white"
            >
              <SelectValue placeholder="选择故事来源" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-2xl">
              <SelectItem value="youtube">▶️ YouTube</SelectItem>
              <SelectItem value="bilibili">📺 哔哩哔哩 (Bilibili)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-neutral-600 mt-1">
            选择后，AI 响应故事请求时将优先使用该来源
          </p>
        </div>

        {/* Current Value */}
        {storyServiceConfig && (
          <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-neutral-400">
            <span className="text-amber-400 font-bold">当前配置：</span>{' '}
            {storyServiceConfig.provider === 'youtube' ? 'YouTube' :
             storyServiceConfig.provider === 'bilibili' ? '哔哩哔哩' :
             storyServiceConfig.provider}
          </div>
        )}

        {/* Save Button */}
        <Button
          className="w-full h-14 rounded-3xl font-black text-sm uppercase tracking-widest transition-all bg-amber-500 hover:bg-amber-600 text-black shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
          onClick={handleSave}
        >
          {isSaved ? (
            <><CheckCircle2 className="w-5 h-5 mr-2" /> 已保存</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> 保存故事配置</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'weather' | 'music' | 'story';

export default function ServicesPage() {
  const { isConnected, ip, isAiEnabled, aiConfig, queryAiConfig, connectDevice, isConnecting } = useMusic();
  const [activeTab, setActiveTab] = useState<Tab>('weather');

  useEffect(() => {
    if (isConnected) {
      queryAiConfig();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <PageLayout>
        <ConnectionMask
          isConnected={isConnected}
          isConnecting={isConnecting}
          ip={ip}
          onConnect={connectDevice}
          title="服务配置 - 设备未连接"
        />
      </PageLayout>
    );
  }

  // Show a loading screen until the AI configuration status is received
  if (aiConfig === null) {
    return (
      <PageLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-neutral-500 bg-neutral-950">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="font-medium animate-pulse">正在获取 AI 配置状态...</p>
        </div>
      </PageLayout>
    );
  }

  // If AI is not enabled, show a premium notice page and block config
  if (!isAiEnabled) {
    const aiPageHref = ip ? `/ai?ip=${ip}` : '/ai';
    return (
      <PageLayout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden bg-neutral-950">
          {/* Background gradients/glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
          </div>

          <Card className="max-w-md w-full bg-neutral-900/60 border-neutral-800/80 backdrop-blur-3xl rounded-[40px] p-8 text-center space-y-6 relative z-10 shadow-2xl">
            <CardHeader className="p-0 pb-2 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)] border border-blue-500/20 animate-bounce duration-1000">
                <Settings2 className="w-10 h-10 animate-spin-slow" />
              </div>
              <CardTitle className="text-3xl font-black text-white tracking-tight">AI 功能未开启</CardTitle>
              <CardDescription className="text-neutral-400 text-sm mt-2 leading-relaxed">
                当前音箱未启用 AI 引擎。第三方天气、音乐与故事服务配置完全依赖于 AI 的意图识别与工具调用能力。
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 text-neutral-500 text-xs bg-neutral-950/40 border border-neutral-800/50 rounded-3xl p-5 leading-loose">
              <div className="flex items-center justify-center gap-2 text-amber-500 font-bold mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>服务配置被锁定</span>
              </div>
              请先前往 <span className="text-neutral-300 font-semibold">AI 配置</span> 页面开启 AI 服务，开启后此处相关的第三方服务配置项将自动解锁。
            </CardContent>
            <div className="pt-2">
              <Link href={aiPageHref}>
                <Button className="w-full h-14 rounded-3xl font-black text-sm uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-[0_10px_30px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  前往 AI 配置页面启用
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-black uppercase tracking-widest text-xs">
            <Settings2 className="w-4 h-4" />
            <span>Service Configuration</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">服务配置</h1>
          <p className="text-neutral-400 text-lg max-w-xl">
            配置音箱所使用的第三方服务。AI 将使用这些配置为你提供实时信息查询能力。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
              activeTab === 'weather'
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                : 'bg-neutral-900/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            🌤 天气
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
              activeTab === 'music'
                ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                : 'bg-neutral-900/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            🎵 音乐
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
              activeTab === 'story'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-neutral-900/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
          >
            📚 故事
          </button>
        </div>

        {/* Active Card */}
        {activeTab === 'weather' && <WeatherConfigCard />}
        {activeTab === 'music' && <MusicServiceCard />}
        {activeTab === 'story' && <StoryServiceCard />}
      </div>
    </PageLayout>
  );
}
