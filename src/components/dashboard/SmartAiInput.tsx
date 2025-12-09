"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, Check, X } from "lucide-react";
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
}

export default function SmartAiInput({ onTransactionAdded, categories }: SmartAiInputProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields state
  const [formData, setFormData] = useState({
    amount: "",
    type: "EXPENSE",
    categoryId: "",
    description: "",
  });

  async function handleAnalyze() {
    if (!input.trim()) return;
    setIsLoading(true);
    setParsedData(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!res.ok) throw new Error("Gagal menganalisa");

      const json = await res.json();
      
      // The API now returns { data: ParsedTransaction[] }
      const dataArr = json.data as ParsedTransaction[];
      
      if (!dataArr || dataArr.length === 0) {
        throw new Error("Tidak ada transaksi yang terdeteksi.");
      }
      
      const data = dataArr[0]; // Take the first one for now
      setParsedData(data); // We might need to update state if we want to show 'next' or 'all'

      // Auto-match category
      let matchedCategoryId = "";
      if (data.category) {
        // Case insensitive match
        const match = categories.find(
          (c) => c.name?.toLowerCase() === data.category.toLowerCase()
        );
        if (match) {
          matchedCategoryId = match.id || "";
        }
      }

      setFormData({
        amount: String(data.amount),
        type: data.type,
        categoryId: matchedCategoryId,
        description: data.description || "",
      });

    } catch (err) {
      console.error(err);
      toast.error("Gagal menganalisa teks via AI.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = {
        amount: Number(formData.amount),
        type: formData.type,
        category_id: formData.categoryId,
        description: formData.description,
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal menyimpan transaksi");

      toast.success("Transaksi berhasil disimpan!");
      setInput("");
      setParsedData(null);
      onTransactionAdded();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan transaksi.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/20 border-neon-cyan/20 shadow-sm relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl -z-10" />

      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
          Smart Entry (AI)
        </CardTitle>
        <CardDescription>
          Ketik transaksi Anda secara natural, misalnya: &quot;Makan siang nasi padang 25rb&quot;
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
             <Textarea
                placeholder="Contoh: Beli bensin 50.000, Gaji bulanan 5.000.000..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pr-24 min-h-[80px] text-base resize-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAnalyze();
                    }
                }}
            />
            <div className="absolute bottom-3 right-3">
                 <Button 
                    size="sm" 
                    onClick={handleAnalyze} 
                    disabled={isLoading || !input.trim()}
                    className="bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 border border-neon-cyan/20"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analisa"}
                </Button>
            </div>
          </div>

          {parsedData && (
            <div className="bg-muted/40 p-4 rounded-lg border border-border space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-muted-foreground">Preview Transaksi</h4>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => setParsedData(null)}
                >
                    <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Jumlah</Label>
                    <Input 
                        value={formData.amount} 
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select 
                        value={formData.type} 
                        onValueChange={(v) => setFormData({...formData, type: v})}
                    >
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                            <SelectItem value="INCOME">Pemasukan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select 
                        value={formData.categoryId} 
                        onValueChange={(v) => setFormData({...formData, categoryId: v})}
                    >
                         <SelectTrigger>
                            <SelectValue placeholder={parsedData.category || "Pilih kategori"} />
                        </SelectTrigger>
                        <SelectContent>
                             {categories.map((c) => (
                            <SelectItem key={c.id ?? c.name} value={(c.id ?? c.name) || "unknown"}>
                                    {c.name}
                                </SelectItem>
                             ))}
                             {!categories.length && <div className="p-2 text-xs text-muted-foreground">Tidak ada kategori</div>}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Keterangan</Label>
                    <Input 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Simpan Transaksi
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
