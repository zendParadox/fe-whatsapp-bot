"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Wallet,
  Trash2,
  Pencil,
  Lock,
  Landmark,
  Smartphone,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface WalletData {
  id: string;
  name: string;
  icon: string | null;
  balance: number | string;
  created_at: string;
}

interface WalletCardProps {
  wallets: WalletData[];
  planType: "FREE" | "PREMIUM";
  formatCurrency: (value: number) => string;
  onRefresh: () => void;
}

const WALLET_ICON_MAP: Record<string, string> = {
  bca: "🏦",
  mandiri: "🏦",
  bri: "🏦",
  bni: "🏦",
  cimb: "🏦",
  bank: "🏦",
  gopay: "💚",
  shopeepay: "🟠",
  dana: "🔵",
  ovo: "💜",
  cash: "💵",
  tunai: "💵",
  linkaja: "🔴",
};

function getWalletIcon(name: string, icon: string | null) {
  if (icon) return icon;
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(WALLET_ICON_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return "💰";
}

function getWalletTypeIcon(name: string) {
  const lower = name.toLowerCase();
  if (["bca", "mandiri", "bri", "bni", "cimb", "bank"].some((k) => lower.includes(k))) {
    return <Landmark className="w-4 h-4 text-blue-400" />;
  }
  if (["gopay", "shopeepay", "dana", "ovo", "linkaja"].some((k) => lower.includes(k))) {
    return <Smartphone className="w-4 h-4 text-green-400" />;
  }
  return <Banknote className="w-4 h-4 text-yellow-400" />;
}

export default function WalletCard({
  wallets,
  planType,
  formatCurrency,
  onRefresh,
}: WalletCardProps) {
  const isFree = planType === "FREE";
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [editWallet, setEditWallet] = useState<WalletData | null>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  async function handleAdd() {
    if (!newName.trim()) {
      toast.error("Nama kantong wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          balance: Number(newBalance) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Kantong "${newName.trim()}" berhasil dibuat!`);
      setNewName("");
      setNewBalance("");
      setShowAddDialog(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah kantong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editWallet) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/wallets/${editWallet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || undefined,
          balance: editBalance !== "" ? Number(editBalance) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Kantong berhasil diperbarui!");
      setShowEditDialog(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengedit kantong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(wallet: WalletData) {
    if (!confirm(`Hapus kantong "${wallet.name}"? Transaksi tidak akan terhapus.`)) return;
    try {
      const res = await fetch(`/api/wallets/${wallet.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Kantong "${wallet.name}" dihapus.`);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kantong.");
    }
  }

  function openEdit(wallet: WalletData) {
    setEditWallet(wallet);
    setEditName(wallet.name);
    setEditBalance(String(Number(wallet.balance)));
    setShowEditDialog(true);
  }

  // FREE user view
  if (isFree) {
    return (
      <Card className="glass-card border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
          <Lock className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Fitur Kantong — Premium Only</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">⭐️ Upgrade ke Premium</Link>
          </Button>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Kantong Keuangan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 opacity-30">
            {["BCA", "Gopay", "Cash"].map((n) => (
              <div key={n} className="flex items-center justify-between py-2 border-b border-border/20">
                <span className="text-sm">{n}</span>
                <span className="text-sm font-mono">Rp ***</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-neon-cyan" /> Kantong Keuangan
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-8">
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kantong Baru</DialogTitle>
                <DialogDescription>
                  Buat kantong untuk melacak saldo bank atau e-wallet Anda.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Nama Kantong</Label>
                  <Input
                    placeholder="Contoh: BCA, Gopay, Cash"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Saldo Awal</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd} disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {wallets.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total seluruh kantong: <span className="font-semibold text-foreground">{formatCurrency(totalBalance)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {wallets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Belum ada kantong. Tekan &quot;Tambah&quot; untuk mulai.
          </div>
        ) : (
          <div className="space-y-1">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getWalletIcon(w.name, w.icon)}</span>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {w.name}
                      {getWalletTypeIcon(w.name)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      Number(w.balance) >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(Number(w.balance))}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => openEdit(w)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(w)}
                      className="p-1 rounded hover:bg-red-500/10 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kantong</DialogTitle>
            <DialogDescription>Ubah detail kantong &quot;{editWallet?.name}&quot;</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nama</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Saldo</Label>
              <Input
                type="number"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
