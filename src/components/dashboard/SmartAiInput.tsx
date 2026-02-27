"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, Check, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ParsedTransaction } from "@/lib/gemini";

interface SmartAiInputProps {
  onTransactionAdded: () => void;
  categories: { id?: string; name?: string }[];
  planType?: "FREE" | "PREMIUM";
}

interface FormItem {
  amount: string;
  type: string;
  categoryId: string;
  description: string;
  originalCategory: string;
}

export default function SmartAiInput({ onTransactionAdded, categories, planType = "FREE" }: SmartAiInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // default collapsed, will update from localStorage

  const isFree = planType === "FREE";

  // Load isCollapsed from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("smartAiInputCollapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    } else {
      setIsCollapsed(false); // default to expanded if not set
    }
  }, []);

  // Save isCollapsed to localStorage when it changes
  function toggleCollapsed() {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("smartAiInputCollapsed", String(newValue));
  }

  async function handleAnalyze() {
    if (!input.trim()) return;
    setIsLoading(true);
    setParsedTransactions([]);
    setFormItems([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Gagal menganalisa");

      const json = await res.json();
      const dataArr = json.data as ParsedTransaction[];

      if (!dataArr || dataArr.length === 0) {
        throw new Error("Tidak ada transaksi yang terdeteksi.");
      }

      setParsedTransactions(dataArr);

      const items: FormItem[] = dataArr.map((data) => {
        let matchedCategoryId = "";
        if (data.category) {
          const match = categories.find(
            (c) => c.name?.toLowerCase() === data.category.toLowerCase()
          );
          if (match) {
            matchedCategoryId = match.id || "";
          }
        }

        return {
          amount: String(data.amount),
          type: data.type,
          categoryId: matchedCategoryId,
          description: data.description || "",
          originalCategory: data.category || "",
        };
      });

      setFormItems(items);

    } catch (err) {
      console.error(err);
      toast.error("Gagal menganalisa teks via AI.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateFormItem(index: number, field: keyof FormItem, value: string) {
    setFormItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeFormItem(index: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
    setParsedTransactions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveAll() {
    if (formItems.length === 0) return;

    setIsSaving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of formItems) {
        const payload = {
          amount: Number(item.amount),
          type: item.type,
          category_id: item.categoryId,
          description: item.description,
        };

        try {
          const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} transaksi berhasil disimpan!`);
        setInput("");
        setParsedTransactions([]);
        setFormItems([]);
        onTransactionAdded();
      }
      if (failCount > 0) {
        toast.error(`${failCount} transaksi gagal disimpan.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan transaksi.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleClearAll() {
    setParsedTransactions([]);
    setFormItems([]);
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-neon-cyan/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl -z-10" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
            Smart Entry (AI)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Tampilkan
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Sembunyikan
              </>
            )}
          </Button>
        </div>
        {!isCollapsed && (
          <CardDescription className="flex items-center gap-2">
            Ketik transaksi Anda secara natural, misalnya: &quot;Beli bensin 15k dan makan siang 18k&quot;
            {!isFree && (
              <span className="inline-flex items-center bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-yellow-500/50">
                👑 Premium
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              {isFree ? (
                <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-md flex flex-col items-center justify-center border border-dashed border-muted-foreground/30 p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-sm font-medium">Fitur Premium</p>
                    <p className="text-xs text-muted-foreground mb-2">Upgrade untuk mencatat otomatis dari teks struk / suara Anda.</p>
                    <Button size="sm" variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-500/10" asChild>
                      <a href="/pricing">⭐️ Upgrade Premium</a>
                    </Button>
                  </div>
                </div>
              ) : null}
              <Textarea
                placeholder="Contoh: Beli bensin 50.000 dan makan siang 25.000, Gaji bulanan 5.000.000..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pr-24 min-h-[80px] text-base resize-none"
                disabled={isFree}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isFree) handleAnalyze();
                  }
                }}
              />
              <div className="absolute bottom-3 right-3">
                <Button
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isLoading || !input.trim() || isFree}
                  className="bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 border border-neon-cyan/20"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analisa"}
                </Button>
              </div>
            </div>

            {formItems.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Preview Transaksi ({formItems.length} item)
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Bersihkan
                  </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {formItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-muted/40 p-4 rounded-lg border border-border space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Transaksi #{index + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600"
                          onClick={() => removeFormItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Jumlah</Label>
                          <Input
                            value={item.amount}
                            onChange={(e) => updateFormItem(index, "amount", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Keterangan</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateFormItem(index, "description", e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-1">
                          <Label className="text-xs">Tipe</Label>
                          <Select
                            value={item.type}
                            onValueChange={(v) => updateFormItem(index, "type", v)}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                              <SelectItem value="INCOME">Pemasukan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 sm:col-span-1">
                          <Label className="text-xs">Kategori</Label>
                          <Select
                            value={item.categoryId}
                            onValueChange={(v) => updateFormItem(index, "categoryId", v)}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder={item.originalCategory || "Pilih kategori"} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id ?? c.name} value={(c.id ?? c.name) || "unknown"}>
                                  {c.name}
                                </SelectItem>
                              ))}
                              {!categories.length && (
                                <div className="p-2 text-xs text-muted-foreground">Tidak ada kategori</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button onClick={handleSaveAll} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Simpan Semua ({formItems.length})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
