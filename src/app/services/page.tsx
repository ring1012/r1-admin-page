"use client";

import React, { useState, useEffect } from 'react';
import { Cloud, Save, CheckCircle2, AlertCircle, Loader2, ChevronDown, Settings2, Info } from 'lucide-react';
import { useMusic } from '@/components/MusicContext';
import { ConnectionMask } from '@/components/ConnectionMask';
import { PageLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { isConnected, ip, connectDevice, isConnecting } = useMusic();

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

        {/* Tabs — future: music, stories */}
        <div className="flex gap-2">
          <button className="px-5 py-2 rounded-full text-sm font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            🌤 天气
          </button>
          <button
            disabled
            className="px-5 py-2 rounded-full text-sm font-bold bg-neutral-900/40 text-neutral-600 border border-neutral-800 cursor-not-allowed"
            title="即将推出"
          >
            🎵 音乐（即将推出）
          </button>
          <button
            disabled
            className="px-5 py-2 rounded-full text-sm font-bold bg-neutral-900/40 text-neutral-600 border border-neutral-800 cursor-not-allowed"
            title="即将推出"
          >
            📚 故事（即将推出）
          </button>
        </div>

        {/* Weather Config */}
        <WeatherConfigCard />
      </div>
    </PageLayout>
  );
}
