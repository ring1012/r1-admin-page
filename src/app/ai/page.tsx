"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Cpu, Save, Zap, AlertCircle, CheckCircle2, Info, Loader2, ArrowLeft } from 'lucide-react';
import { useMusic } from '@/components/MusicContext';
import { PageLayout } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AiConfigPage() {
  const { isConnected, ip, aiConfig, isAiEnabled, queryAiConfig, saveAiConfig } = useMusic();

  const [formData, setFormData] = useState({
    choice: 'OpenAi',
    key: '',
    systemPrompt: '你是一个智能音箱',
    model: 'Qwen/Qwen3-8B',
    endpoint: 'https://api-inference.modelscope.cn/v1',
    extraBody: '{"enable_thinking":false}'
  });

  const [enabled, setEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Sync with AI Config from device
  useEffect(() => {
    if (isConnected) {
      queryAiConfig();
    }
  }, [isConnected]);

  useEffect(() => {
    if (aiConfig) {
      // Strictly pick only the keys we expect in formData to avoid garbage data (like indexed strings)
      const validKeys = ['choice', 'key', 'systemPrompt', 'model', 'endpoint', 'extraBody'];
      const filteredConfig: any = {};

      validKeys.forEach(key => {
        if (aiConfig[key] !== undefined) {
          filteredConfig[key] = aiConfig[key];
        }
      });

      setFormData(prev => ({
        ...prev,
        ...filteredConfig
      }));
    }
    setEnabled(isAiEnabled);
  }, [aiConfig, isAiEnabled]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null); // Reset test on change
    setIsSaved(false);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({ success: false, message: `测试请求失败: ${error.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    // Strictly pick only valid formatting to avoid persisting junk
    const validKeys = ['choice', 'key', 'systemPrompt', 'model', 'endpoint', 'extraBody'];
    const filteredConfig: any = {};
    validKeys.forEach(key => {
      filteredConfig[key] = (formData as any)[key];
    });

    saveAiConfig(filteredConfig, enabled);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!isConnected) {
    return (
      <PageLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-neutral-950">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 animate-pulse border border-red-500/20">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">设备未连接</h2>
          <p className="text-neutral-400 max-w-md mb-8">
            无法连接到 R1 音箱。请确保 IP 地址正确且音箱已连接到网络。
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

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-xs">
              <Cpu className="w-4 h-4" />
              <span>AI Engine Configuration</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">AI 配置</h1>
            <p className="text-neutral-400 text-lg max-w-xl">
              配置智能音箱的 AI 引擎。支持 OpenAI 协议兼容的所有大模型。（Gemini暂不支持）
            </p>
          </div>

          {/* AI Toggle */}
          <div className="flex items-center gap-4 bg-neutral-900/50 p-6 rounded-[32px] border border-neutral-800 backdrop-blur-xl">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-white uppercase tracking-wider">AI 功能状态</div>
              <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">
                {enabled ? '已启用 - 随时响应' : '已禁用 - 仅本地响应'}
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative w-16 h-8 rounded-full transition-all duration-500 p-1 flex items-center ${enabled ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-neutral-700'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-500 transform ${enabled ? 'translate-x-8' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-neutral-900/40 border-neutral-800 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-2xl">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      接口配置
                    </CardTitle>
                    <CardDescription className="text-neutral-500">
                      配置 AI 提供商及身份验证信息
                    </CardDescription>
                  </div>
                  {/* Bridge Info Badge */}
                  <div className="hidden sm:flex flex-col items-end">
                    <div className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">Bridge Endpoint</div>
                    <div className="px-3 py-1 bg-neutral-950 border border-neutral-800 rounded-full text-[10px] font-mono text-neutral-500">
                      https://r1-py.thd.dpdns.org
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="choice" className="text-xs font-black uppercase tracking-widest text-neutral-400">服务商协议</Label>
                      <Select value={formData.choice} onValueChange={(val) => handleChange('choice', val)}>
                        <SelectTrigger id="choice" className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white">
                          <SelectValue placeholder="选择协议" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-2xl">
                          <SelectItem value="OpenAi">OpenAI Compatible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-xs font-black uppercase tracking-widest text-neutral-400">模型标识 (Model)</Label>
                      <Input
                        id="model"
                        placeholder="Qwen/Qwen3-8B"
                        value={formData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endpoint" className="text-xs font-black uppercase tracking-widest text-neutral-400">接口地址 (Endpoint)</Label>
                    <Input
                      id="endpoint"
                      placeholder="https://api.openai.com/v1"
                      value={formData.endpoint}
                      onChange={(e) => handleChange('endpoint', e.target.value)}
                      className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-xs font-black uppercase tracking-widest text-neutral-400">API 秘钥 (Key)</Label>
                    <Input
                      id="key"
                      type="password"
                      placeholder="ai平台密钥"
                      value={formData.key}
                      onChange={(e) => handleChange('key', e.target.value)}
                      className="bg-neutral-950 border-neutral-800 rounded-2xl h-12 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt" className="text-xs font-black uppercase tracking-widest text-neutral-400">系统提示词 (System Prompt)</Label>
                    <Textarea
                      id="systemPrompt"
                      placeholder="你是一个智能音箱助理..."
                      value={formData.systemPrompt}
                      onChange={(e) => handleChange('systemPrompt', e.target.value)}
                      className="bg-neutral-950 border-neutral-800 rounded-2xl min-h-[100px] text-white resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extraBody" className="text-xs font-black uppercase tracking-widest text-neutral-400">附加请求体 (JSON)</Label>
                    <Textarea
                      id="extraBody"
                      placeholder='{"enable_thinking":true, "temperature":0.7}'
                      value={formData.extraBody}
                      onChange={(e) => handleChange('extraBody', e.target.value)}
                      className="bg-neutral-950 border-neutral-800 rounded-2xl min-h-[80px] text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Sidebar */}
          <div className="space-y-6">
            <Card className="bg-neutral-900/40 border-neutral-800 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-2xl sticky top-8">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  操作面板
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className={`w-full h-16 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${isTesting ? 'opacity-50' : 'hover:bg-neutral-800'}`}
                    onClick={handleTest}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-5 h-5 mr-2" />
                    )}
                    测试连接
                  </Button>

                  <Button
                    className={`w-full h-16 rounded-3xl font-black text-sm uppercase tracking-widest transition-all ${(!enabled || testResult?.success) ? 'bg-blue-500 hover:bg-blue-600 shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : 'bg-neutral-800 opacity-50 cursor-not-allowed'}`}
                    disabled={(enabled && !testResult?.success) || isSaved}
                    onClick={handleSave}
                  >
                    {isSaved ? (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    {isSaved ? '已保存' : '保存配置'}
                  </Button>
                </div>

                {/* Status Messages */}
                <div className="space-y-4 pt-4 border-t border-neutral-800">
                  {testResult && (
                    <div className={`p-4 rounded-3xl text-xs font-bold flex gap-3 ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                      {testResult.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                      <span className="leading-relaxed">{testResult.message}</span>
                    </div>
                  )}

                  {!testResult && (
                    <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-neutral-400 text-[10px] leading-loose">
                      <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                        <Info className="w-3 h-3" />
                        <div>测试说明</div>
                      </div>
                      测试将模拟 AI 对话并验证是否能正确触发 <code className="text-blue-300 font-mono">get_current_temperature</code> 函数调用。{enabled ? '通过测试后方可保存。' : '当前已禁用 AI，可直接保存配置。'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
