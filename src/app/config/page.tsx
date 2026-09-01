"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Eye, EyeOff, RefreshCw, Smartphone, MessageCircle, Loader2, CheckCircle2, AlertCircle, Copy, Link2 } from 'lucide-react';
import { useMusic } from '@/components/MusicContext';
import { PageLayout } from '@/components/layout';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

interface DeviceInfo {
  deviceId: string;
  authCode: string;
  chatId: string;
  botType: string;
}

type BotChoice = 'wx' | 'tg';

export default function ConfigPage() {
  const { serial } = useMusic();

  const [deviceId, setDeviceId] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isBound, setIsBound] = useState<boolean | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const [selectedBot, setSelectedBot] = useState<BotChoice>('wx');
  const [authCode, setAuthCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (serial) {
      setDeviceId(serial);
    }
  }, [serial]);

  const queryDevice = useCallback(async () => {
    if (!deviceId.trim()) return;
    setIsQuerying(true);
    setQueryError(null);
    setDeviceInfo(null);
    setIsBound(null);
    setShowAuthCode(false);

    try {
      const res = await fetch('/api/connector-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId.trim(), path: '/v1/devices/query', method: 'POST', payload: { deviceId: deviceId.trim() } }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (data.error) {
        setQueryError(data.error);
        setIsBound(false);
        return;
      }

      if (data.deviceId && data.authCode !== undefined && data.chatId !== undefined && data.botType !== undefined) {
        const hasAllFields = data.authCode && data.chatId && data.botType;
        if (hasAllFields) {
          setDeviceInfo({
            deviceId: data.deviceId,
            authCode: data.authCode,
            chatId: data.chatId,
            botType: data.botType,
          });
          setIsBound(true);
        } else {
          setIsBound(false);
        }
      } else {
        setIsBound(false);
      }
    } catch (err: any) {
      setQueryError(err.message || '查询失败');
      setIsBound(false);
    } finally {
      setIsQuerying(false);
    }
  }, [deviceId]);

  const generateAuthCode = async () => {
    if (!deviceId.trim()) return;
    setIsGeneratingCode(true);
    setAuthCode('');

    try {
      const res = await fetch('/api/connector-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId.trim(), path: '/v1/devices/auth', method: 'POST', payload: { deviceId: deviceId.trim() } }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (data.authCode) {
        setAuthCode(data.authCode);
      }
    } catch (err: any) {
      setQueryError(err.message || '生成验证码失败');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    await queryDevice();
    setIsRefreshing(false);
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-xs">
            <Settings className="w-4 h-4" />
            <span>System Configuration</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">系统配置</h1>
          <p className="text-neutral-400 text-lg max-w-xl">
            管理设备绑定状态，将音箱绑定到微信或 Telegram 进行远程交互。
          </p>
          {deviceId && (
            <p className="text-neutral-500 text-sm font-mono">
              Device ID: {deviceId}
            </p>
          )}
        </div>

        <Card className="bg-neutral-900/40 border-neutral-800 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-400" />
              设备绑定
            </CardTitle>
            <CardDescription className="text-neutral-500">
              查询并管理设备绑定状态
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <Button
              onClick={queryDevice}
              disabled={!deviceId.trim() || isQuerying}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all"
            >
              {isQuerying ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                '查询绑定状态'
              )}
            </Button>

            {queryError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {queryError}
              </div>
            )}

            {/* Bound Device Info */}
            {isBound === true && deviceInfo && (
              <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  设备已绑定
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-neutral-400">Bot Type</Label>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl h-12 px-4 flex items-center text-white">
                      {deviceInfo.botType === 'wx' ? '微信 (WeChat)' : deviceInfo.botType === 'tg' ? 'Telegram' : deviceInfo.botType}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-neutral-400">Chat ID</Label>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl h-12 px-4 flex items-center text-white font-mono text-sm truncate">
                      {deviceInfo.chatId}
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-neutral-400">Auth Code</Label>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl h-12 px-4 flex items-center justify-between text-white">
                      <span className="font-mono text-sm truncate">
                        {showAuthCode ? deviceInfo.authCode : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAuthCode(!showAuthCode)}
                        className="text-neutral-400 hover:text-white transition-colors ml-2 shrink-0"
                      >
                        {showAuthCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={refreshStatus}
                  disabled={isRefreshing}
                  className="w-full h-12 rounded-2xl font-bold text-sm border-neutral-800 hover:bg-neutral-800 text-neutral-300 transition-all"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  刷新状态
                </Button>
              </div>
            )}

            {/* Not Bound */}
            {isBound === false && !queryError && (
              <div className="space-y-6 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                  <AlertCircle className="w-4 h-4" />
                  设备未绑定
                </div>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  选择要绑定的平台，然后按照步骤完成绑定。
                </p>

                {/* Bot Type Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-neutral-400">
                    选择绑定平台
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedBot('wx')}
                      className={`h-14 rounded-2xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${
                        selectedBot === 'wx'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-neutral-900/40 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      微信 (WeChat)
                    </button>
                    <button
                      disabled
                      className="h-14 rounded-2xl font-bold text-sm transition-all border flex items-center justify-center gap-2 bg-neutral-900/20 text-neutral-600 border-neutral-800/50 cursor-not-allowed opacity-50"
                    >
                      <Smartphone className="w-4 h-4" />
                      Telegram
                      <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded ml-1">SOON</span>
                    </button>
                  </div>
                </div>

                {/* Generate Auth Code */}
                <Button
                  onClick={generateAuthCode}
                  disabled={isGeneratingCode}
                  className="w-full h-14 rounded-3xl font-black text-sm uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all"
                >
                  {isGeneratingCode ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    '生成验证码'
                  )}
                </Button>

                {/* Auth Code Display & QR Code */}
                {authCode && (
                  <div className="space-y-4 p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/15">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      验证码已生成
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
                      <div className="text-3xl font-mono font-black text-white tracking-[0.3em]">{authCode}</div>
                      <div className="text-xs text-neutral-500 mt-2">10 分钟内有效，过期请重新生成</div>
                    </div>

                    {selectedBot === 'wx' && (
                      <div className="space-y-4">
                        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-5 space-y-4">
                          <p className="text-neutral-300 text-sm font-bold">绑定步骤：</p>
                          <ol className="text-neutral-400 text-xs space-y-3 list-decimal list-inside leading-relaxed">
                            <li>扫码关注公众号</li>
                            <li>发送私信：<code className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">/bind {deviceId.trim()} {authCode}</code>
                              <button
                                onClick={() => navigator.clipboard.writeText(`/bind ${deviceId.trim()} ${authCode}`)}
                                className="ml-2 text-neutral-500 hover:text-emerald-400 transition-colors inline-flex"
                                title="复制命令"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </li>
                          </ol>
                        </div>

                        <div className="flex justify-center">
                          <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <Image
                              src="/wx-group.png"
                              alt="WeChat QR Code"
                              width={180}
                              height={180}
                              className="rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={refreshStatus}
                      disabled={isRefreshing}
                      className="w-full h-12 rounded-2xl font-bold text-sm border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 transition-all"
                    >
                      {isRefreshing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      刷新检查绑定状态
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
