"use client";

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, AlertTriangle, ChevronUp } from 'lucide-react';
import { useMusic } from './MusicContext';

export function EqPanel() {
  const { eqData, queryEq, setEq, isConnected } = useMusic();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isConnected) {
      queryEq();
    }
  }, [isConnected]);

  if (!isConnected) return null;

  // Default values
  const bands = [
    { key: 'band0', label: '60 Hz', value: eqData?.band0 ?? 0, min: -15, max: 15 },
    { key: 'band1', label: '230 Hz', value: eqData?.band1 ?? 0, min: -15, max: 15 },
    { key: 'band2', label: '910 Hz', value: eqData?.band2 ?? 0, min: -15, max: 15 },
    { key: 'band3', label: '3.6 kHz', value: eqData?.band3 ?? 0, min: -15, max: 15 },
    { key: 'band4', label: '14 kHz', value: eqData?.band4 ?? 0, min: -15, max: 15 },
  ];

  const nxpEffects = [
    { key: 'nxpVolume', label: 'NXP音量 (Volume)', value: eqData?.nxpVolume ?? 0, min: -3000, max: 0, desc: '单位: mB (软增益/衰减控制)' },
  ];

  const effects = [
    { key: 'bassBoost', label: '动态低音', value: eqData?.bassBoost ?? 0, min: 0, max: 1000 },
  ];

  const aospEffects = [
    { key: 'loudness', label: '响度增强 (Loudness)', value: eqData?.loudness ?? 0, min: 0, max: 1500, desc: '单位: mB (0 ~ 1500)' },
  ];


  const eqPresets = [
    // --- AI 大师级调音 (针对 R1 硬件优化) ---
    { name: 'R1 默认 (Harman)', values: [0, 0, 0, 0, 0] },
    { name: 'R1 签名 (Signature)', values: [2, 1, 0, 1, 2] },
    { name: '极深低音 (Deep Impact)', values: [8, 5, 0, -2, -3] },
    { name: '丝滑人声 (Pure Silk)', values: [0, 2, 6, 2, 0] },
    { name: '通透水晶 (Crystal Air)', values: [-2, -1, 1, 5, 8] },
    { name: '深夜模式 (Midnight)', values: [5, 2, -2, 2, 4] },
    { name: '现场舞台 (Live Stage)', values: [4, 1, -1, 3, 6] },
    { name: '温暖爵士 (Warm Jazz)', values: [4, 5, 2, 0, -2] },
    { name: '电子能量 (Electronic)', values: [7, 3, -1, 3, 7] },
    { name: '清脆播客 (Podcast)', values: [-6, 0, 7, 4, -2] },
    
    // --- 传统标准预设 ---
    { name: '流行 (Pop)', values: [3, 2, 0, 1, 2] },
    { name: '摇滚 (Rock)', values: [5, 3, -1, 2, 5] },
    { name: '爵士 (Jazz)', values: [4, 2, -2, 2, 0] },
    { name: '古典 (Classical)', values: [5, 3, 0, 2, 4] },
    { name: '人声 (Vocal)', values: [0, 2, 5, 3, 0] },
    { name: '电子 (Basic)', values: [6, 4, 0, 2, 5] },
    { name: '民谣 (Folk)', values: [2, 1, 0, 2, 3] },
    { name: '蓝调 (Blues)', values: [3, 4, 2, -2, 2] },
    { name: '舞曲 (Dance)', values: [4, 2, 0, 2, 4] },
  ];

  const handleSliderChange = (key: string, value: number) => {
    setEq({ [key]: value });
  };

  const applyPreset = (values: number[]) => {
    const data: Record<string, number> = {};
    values.forEach((val, i) => {
      data[`band${i}`] = val;
    });
    setEq(data);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:right-8 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800 text-white shadow-2xl flex items-center justify-center hover:bg-neutral-800 transition-all ring-1 ring-white/5 hover:scale-105"
          title="音效控制"
        >
          <SlidersHorizontal className="w-5 h-5 text-purple-400" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop for closing on click outside */}
      <div
        className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed bottom-4 right-2 left-2 sm:left-auto sm:right-8 z-50 sm:w-96 max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500 ring-1 ring-white/5 flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the panel
        >

          {/* Header */}
          <div className="shrink-0 p-4 border-b border-neutral-800 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-widest text-white">音效控制 (EQ)</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronUp className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-6">

            {/* Section: Presets Dropdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">预设效果</h4>
              <div className="relative group">
                <select
                  onChange={(e) => {
                    const preset = eqPresets.find(p => p.name === e.target.value);
                    if (preset) applyPreset(preset.values);
                  }}
                  className="w-full bg-neutral-800 border border-neutral-700 text-white text-sm rounded-2xl px-4 py-3 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all hover:bg-neutral-750"
                  value={eqPresets.find(p => bands.every((b, i) => b.value === p.values[i]))?.name || ""}
                >
                  <option value="" disabled>选择预设音效...</option>
                  {eqPresets.map(preset => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 group-hover:text-purple-400 transition-colors">
                  <ChevronUp className="w-4 h-4 rotate-180" />
                </div>
              </div>
            </div>

            {/* Section: Equalizer */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">5段均衡器 (dB)</h4>
              {bands.map(band => (
                <div key={band.key} className="space-y-2 group">
                  <div className="flex justify-between text-xs font-bold text-neutral-300">
                    <span>{band.label}</span>
                    <span className="text-purple-400 w-8 text-right">{band.value}</span>
                  </div>
                  <input
                    type="range"
                    min={band.min}
                    max={band.max}
                    value={band.value}
                    onChange={(e) => handleSliderChange(band.key, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>


            {/* Section: Dynamic Enhancements */}
            <div className="space-y-4 pt-4 border-t border-neutral-800/50">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">动态增强</h4>
              {effects.map(effect => (
                <div key={effect.key} className="space-y-2 group">
                  <div className="flex justify-between text-xs font-bold text-neutral-300">
                    <span>{effect.label}</span>
                    <span className="text-blue-400 w-10 text-right">{effect.value}</span>
                  </div>
                  <input
                    type="range"
                    min={effect.min}
                    max={effect.max}
                    value={effect.value}
                    onChange={(e) => handleSliderChange(effect.key, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Section: Loudness */}
            <div className="space-y-4 pt-4 border-t border-neutral-800/50">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">响度增强</h4>
              {aospEffects.map(effect => (
                <div key={effect.key} className="space-y-2 group">
                  <div className="flex justify-between text-xs font-bold text-neutral-300">
                    <span>{effect.label}</span>
                    <span className="text-emerald-400 w-12 text-right">{effect.value}</span>
                  </div>
                  <input
                    type="range"
                    min={effect.min}
                    max={effect.max}
                    value={effect.value}
                    onChange={(e) => handleSliderChange(effect.key, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              ))}
            </div>

            {/* Section: Native Volume */}
            <div className="space-y-4 pt-4 border-t border-neutral-800/50 pb-2">
              <div className="flex items-start gap-2 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                <SlidersHorizontal className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest">输出增益微调</h4>
                  <p className="text-[10px] text-neutral-400 mt-1 leading-tight font-medium">
                    直接调整 NXP 算法层输出增益。建议仅在音源音量极小时进行补偿。
                  </p>
                </div>
              </div>

              {nxpEffects.map(effect => (
                <div key={effect.key} className="space-y-2 group">
                  <div className="flex justify-between items-end text-xs font-bold text-neutral-300">
                    <div className="flex flex-col">
                      <span>{effect.label}</span>
                      <span className="text-[9px] text-neutral-500 font-normal">{effect.desc}</span>
                    </div>
                    <span className="text-purple-400 w-12 text-right">{effect.value}</span>
                  </div>
                  <input
                    type="range"
                    min={effect.min}
                    max={effect.max}
                    value={effect.value}
                    onChange={(e) => handleSliderChange(effect.key, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
        <style jsx global>{`
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
      </div>
    </>
  );
}
