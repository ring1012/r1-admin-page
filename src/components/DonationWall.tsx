"use client";

import { useEffect, useState, useRef } from "react";
import { Coins, ShieldAlert, Users, Award, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Donation {
  name: string;
  platform: string;
  date: string;
  amount: number;
}

interface DanmakuItem {
  id: number;
  name: string;
  amount: number;
  platform: string;
  top: number;
  duration: number;
  colorIdx: number;
}

const GRADIENTS = [
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-500",
  "from-blue-500 to-sky-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-fuchsia-500",
];

export default function DonationWall() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [danmakuItems, setDanmakuItems] = useState<DanmakuItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const idRef = useRef(0);
  const idxRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await fetch("/api/donation");
        if (!res.ok) throw new Error("Failed to fetch donation data");
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setDonations(sorted);
        } else {
          throw new Error("Format is not a list");
        }
      } catch (err: any) {
        console.error("Donation wall fetch error:", err);
        setError(err.message || "Failed to load donations");
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  useEffect(() => {
    if (donations.length === 0) return;

    const spawn = () => {
      const donation = donations[idxRef.current % donations.length];
      idxRef.current++;
      const item: DanmakuItem = {
        id: idRef.current++,
        name: donation.name,
        amount: donation.amount,
        platform: donation.platform,
        top: 8 + Math.random() * 72,
        duration: 10 + Math.random() * 8,
        colorIdx: [...donation.name].reduce((s, c) => s + c.charCodeAt(0), 0) % GRADIENTS.length,
      };
      setDanmakuItems(prev => [...prev.slice(-35), item]);
    };

    for (let i = 0; i < Math.min(donations.length, 10); i++) {
      setTimeout(spawn, i * 500);
    }

    intervalRef.current = setInterval(spawn, 2000 + Math.random() * 2500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [donations]);

  const totalAmount = donations.reduce((sum, item) => sum + item.amount, 0);
  const totalCount = donations.length;

  const getGradient = (name: string) => {
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return GRADIENTS[sum % GRADIENTS.length];
  };

  const getInitials = (name: string) => {
    if (!name) return "R1";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">支持者致谢墙</h2>
            <p className="text-sm text-neutral-400 font-medium">感谢朋友们的捐赠，是支持我开发最大的动力。</p>
          </div>
        </div>
      </div>

      <Card className="bg-neutral-900/40 border-neutral-800 backdrop-blur-md overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        <CardContent className="p-6 md:p-8 space-y-8 relative z-10">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-500">
              <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
              <p className="text-sm font-medium animate-pulse">加载捐赠记录中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
              <ShieldAlert className="w-8 h-8 text-neutral-600" />
              <p className="text-sm text-neutral-500">无法加载捐赠记录</p>
            </div>
          ) : (
            <>
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-lg mx-auto bg-neutral-950/50 p-4 border border-neutral-800/80 rounded-2xl">
                <div className="text-center border-r border-neutral-800/50">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" /> 累计金额
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-mono tabular-nums">
                    ¥{totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    <Users className="w-3.5 h-3.5 text-blue-400" /> 支持人数
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                    {totalCount} <span className="text-xs text-neutral-500 font-normal">人</span>
                  </div>
                </div>
              </div>

              {/* Danmaku Barrage Area */}
              <div className="relative h-52 sm:h-60 overflow-hidden rounded-2xl bg-neutral-950/80 border border-neutral-800/60 shadow-inner">
                {/* Animated background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/[0.03] to-transparent animate-glow-pulse" />

                {/* Subtle particle dots */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-amber-400/30 animate-particle"
                    style={{
                      left: `${5 + (i * 8) % 90}%`,
                      bottom: `${10 + (i * 13) % 80}%`,
                      animationDelay: `${i * 0.8}s`,
                      animationDuration: `${4 + (i % 3) * 2}s`,
                    }}
                  />
                ))}

                {/* Danmaku items */}
                {danmakuItems.map((item) => (
                  <div
                    key={item.id}
                    className="absolute whitespace-nowrap animate-danmaku flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/5 shadow-lg z-20"
                    style={{
                      top: `${item.top}%`,
                      animationDuration: `${item.duration}s`,
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${GRADIENTS[item.colorIdx]} flex items-center justify-center text-white font-bold text-[8px] shrink-0`}>
                      {getInitials(item.name)}
                    </div>
                    <span className="text-sm font-bold text-white truncate max-w-[100px]">{item.name}</span>
                    <span className="text-xs font-mono font-black text-amber-400 tabular-nums">¥{item.amount.toFixed(2)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      item.platform === "微信支付"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : item.platform === "支付宝"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {item.platform}
                    </span>
                  </div>
                ))}

                {/* Edge fade overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none z-10" />
              </div>

              {/* Toggle: Show all / collapse */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-neutral-500 hover:text-neutral-300 font-medium transition-colors cursor-pointer"
                >
                  {showAll ? (
                    <>收起列表 <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>查看全部 {totalCount} 条捐赠记录 <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>

                {/* Supporter Cards Grid (collapsible) */}
                <div className={`overflow-hidden transition-all duration-500 ${showAll ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {donations.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-neutral-950/40 border border-neutral-850 hover:border-neutral-750 rounded-2xl transition-all duration-300 group hover:bg-neutral-900/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(item.name)} flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-md group-hover:scale-105 transition-transform`}>
                            {getInitials(item.name)}
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[120px] sm:max-w-[140px]">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                item.platform === "微信支付"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : item.platform === "支付宝"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              }`}>
                                {item.platform}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-medium font-mono">{item.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-black text-amber-400 font-mono tracking-tight bg-amber-500/5 group-hover:bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/10 transition-colors">
                          +¥{item.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {donations.length === 0 && (
                <div className="text-center text-neutral-500 py-6 text-sm">
                  暂无捐赠记录，期待你的支持！
                </div>
              )}
            </>
          )}

        </CardContent>
      </Card>
    </section>
  );
}