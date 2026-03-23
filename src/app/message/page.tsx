"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function MessagePageContent() {
  const searchParams = useSearchParams();
  const ip = searchParams.get("ip");

  const [initialData, setInitialData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const res = await fetch('/api/commands');
        if (res.ok) {
          const data = await res.json();
          // The API might return the array directly or wrapped in an object
          setInitialData(Array.isArray(data) ? data : (data.commands || []));
        }
      } catch (error) {
        console.error("Failed to fetch commands:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommands();
  }, []);

  const selectedItem = initialData.find((item: any) => item.name === selectedName);

  // When a new item is selected, initialize the form data with its values
  useEffect(() => {
    if (selectedItem) {
      const initialFormState: Record<string, any> = {};
      Object.entries(selectedItem).forEach(([key, value]) => {
        if (key !== "name" && key !== "modifiable") {
          initialFormState[key] = value;
        }
      });
      setFormData(initialFormState);
      setSubmitStatus(null);
    } else {
      setFormData({});
    }
  }, [selectedItem]);

  const handleInputChange = (key: string, value: string) => {
    // If original value was number, parse it
    const originalValue = selectedItem?.[key as keyof typeof selectedItem];
    let parsedValue: string | number = value;

    if (typeof originalValue === "number") {
      const num = Number(value);
      if (!isNaN(num) && value !== "") {
        parsedValue = num;
      }
    }

    setFormData((prev) => ({ ...prev, [key]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip) {
      setSubmitStatus({ type: 'error', message: "No IP parameter provided in the URL." });
      return;
    }
    if (!selectedItem) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const targetUrl = `http://${ip}/api/message`;

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          what: formData.what,
          arg1: formData.arg1,
          arg2: formData.arg2,
          obj: formData.obj,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      setSubmitStatus({ type: 'success', message: "Message sent successfully!" });
    } catch (error: any) {
      setSubmitStatus({ type: 'error', message: error.message || "Failed to send message." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-neutral-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="font-medium tracking-wide">Fetching commands...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/20 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      <Card className="w-full max-w-lg shadow-2xl bg-neutral-900/80 backdrop-blur-xl border-neutral-800 text-neutral-100 z-10 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            小讯配置
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium tracking-wide">
            {ip ? (
              <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                Connected to {ip}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-yellow-500">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
                Waiting for target IP parameter
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 flex flex-col">
              <Label className="text-neutral-300 text-sm font-semibold tracking-wide uppercase">Command Payload</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-200 hover:text-neutral-100 transition-colors h-12"
                  >
                    {selectedName
                      ? initialData.find((item) => item.name === selectedName)?.name
                      : "Search predefined commands..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-neutral-950 border-neutral-800 text-neutral-200">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Search command..." className="text-neutral-200" />
                    <CommandList>
                      <CommandEmpty>No matching command found.</CommandEmpty>
                      <CommandGroup>
                        {initialData.map((item) => (
                          <CommandItem
                            key={item.name}
                            value={item.name}
                            onSelect={(currentValue) => {
                              setSelectedName(currentValue === selectedName ? "" : currentValue);
                              setOpen(false);
                            }}
                            className="text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 cursor-pointer aria-selected:bg-neutral-800 transition-colors"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-purple-400",
                                selectedName === item.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {item.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedItem && (
              <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                {Object.entries(selectedItem).map(([key, value]) => {
                  if (key === "name" || key === "modifiable") return null;

                  const isModifiable = selectedItem.modifiable.includes(key);

                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-neutral-400 text-xs font-semibold tracking-wider uppercase flex justify-between items-center">
                        <span>{key}</span>
                        {!isModifiable && <span className="text-neutral-600 text-[10px] bg-neutral-800/50 px-2 py-0.5 rounded-sm">LOCKED</span>}
                      </Label>
                      <Input
                        id={key}
                        value={formData[key] ?? ""}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        disabled={!isModifiable}
                        className={cn(
                          "bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-purple-500/50 focus-visible:border-purple-500/50 h-11 transition-all",
                          !isModifiable && "opacity-50 cursor-not-allowed bg-neutral-900/50 text-neutral-400 select-none shadow-inner"
                        )}
                        type={typeof selectedItem[key as keyof typeof selectedItem] === "number" ? "number" : "text"}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {submitStatus && (
              <div className={cn(
                "p-4 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2",
                submitStatus.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              )}>
                {submitStatus.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={!selectedItem || !ip || isSubmitting}
              className="w-full h-12 bg-neutral-100 text-neutral-950 hover:bg-neutral-300 font-bold tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-neutral-500" />
                  <span className="text-neutral-500">Processing...</span>
                </>
              ) : (
                "Deploy Command"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MessagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 text-neutral-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="font-medium tracking-wide">Initializing environment...</p>
      </div>
    }>
      <MessagePageContent />
    </Suspense>
  );
}
