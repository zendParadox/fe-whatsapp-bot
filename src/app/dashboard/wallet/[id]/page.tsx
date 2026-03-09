"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Wallet,
  Users,
  TrendingDown,
  TrendingUp,
  Loader2,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

interface WalletDetail {
  id: string;
  name: string;
  icon: string | null;
  balance: number;
  is_shared: boolean;
  invite_code?: string;
  owner: { name: string; phone: string };
  members: {
    id: string;
    name: string;
    phone: string;
    role: string;
    joined_at: string;
  }[];
}

interface WalletTransaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  category: string;
  created_at: string;
  recorded_by: string;
}

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: walletId } = use(params);
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/wallets/${walletId}/transactions`);
        if (!res.ok) throw new Error("Failed to fetch wallet data");
        const data = await res.json();
        setWallet(data.wallet);
        setTransactions(data.transactions);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data wallet");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [walletId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            {error || "Wallet tidak ditemukan"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-neon-cyan" />
            {wallet.name}
            {wallet.is_shared && (
              <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 gap-1">
                <Users className="w-3 h-3" /> Shared
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Pemilik: {wallet.owner.name || wallet.owner.phone}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card border-border/30">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Saldo</p>
            <p className={`text-lg font-bold font-mono ${wallet.balance >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(wallet.balance)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/30">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" /> Pemasukan
            </p>
            <p className="text-lg font-bold font-mono text-green-500">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/30">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" /> Pengeluaran
            </p>
            <p className="text-lg font-bold font-mono text-red-500">
              {formatCurrency(totalExpense)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members (if shared) */}
      {wallet.is_shared && wallet.members.length > 0 && (
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Anggota ({wallet.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wallet.members.map((m) => (
                <Badge
                  key={m.id}
                  variant="secondary"
                  className="text-xs py-1 px-3"
                >
                  {m.name || m.phone}
                  {m.role === "ADMIN" && (
                    <span className="ml-1 text-amber-500">👑</span>
                  )}
                </Badge>
              ))}
            </div>
            {wallet.invite_code && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Kode Undangan:</span>
                <code className="bg-muted px-2 py-0.5 rounded font-mono">{wallet.invite_code}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(wallet.invite_code!);
                    toast.success("Kode undangan disalin!");
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card className="glass-card border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Riwayat Transaksi ({transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada transaksi di kantong ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Kategori</TableHead>
                    {wallet.is_shared && <TableHead>Dicatat Oleh</TableHead>}
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(tx.created_at), "dd MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tx.category}
                        </Badge>
                      </TableCell>
                      {wallet.is_shared && (
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.recorded_by}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-mono font-semibold ${
                            tx.type === "INCOME"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
