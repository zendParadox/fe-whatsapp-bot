/* eslint-disable */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Check,
  Trash2,
  Edit,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Debt {
  id: string;
  amount: number | string;
  type: "HUTANG" | "PIUTANG";
  status: "UNPAID" | "PAID";
  person_name: string;
  description?: string | null;
  due_date?: string | null;
  created_at: string;
}

interface DebtSummary {
  totalHutang: number;
  totalPiutang: number;
  countHutang: number;
  countPiutang: number;
}

interface DebtCardProps {
  onDataChange?: () => void;
}

export default function DebtCard({ onDataChange }: DebtCardProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "HUTANG" | "PIUTANG">("all");
  const [statusFilter, setStatusFilter] = useState<"UNPAID" | "PAID" | "all">("UNPAID");

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [form, setForm] = useState({
    amount: "",
    type: "HUTANG" as "HUTANG" | "PIUTANG",
    person_name: "",
    description: "",
    due_date: "",
  });

  const formatCurrency = (value: number | string) =>
    `Rp ${Number(value).toLocaleString("id-ID")}`;

  // Fetch debts
  async function fetchDebts() {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("type", filter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/debts?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data");

      const data = await res.json();
      setDebts(data.debts);
      setSummary(data.summary);
    } catch (err) {
      console.error("fetchDebts:", err);
      toast.error("Gagal memuat data hutang/piutang");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDebts();
  }, [filter, statusFilter]);

  // Add new debt
  async function handleAdd() {
    if (!form.amount || !form.person_name) {
      toast.error("Jumlah dan nama orang wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          person_name: form.person_name,
          description: form.description || undefined,
          due_date: form.due_date || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan");
      }

      toast.success(`${form.type === "HUTANG" ? "Hutang" : "Piutang"} berhasil ditambahkan`);
      setIsAddOpen(false);
      resetForm();
      fetchDebts();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Edit debt
  function openEdit(debt: Debt) {
    setEditingDebt(debt);
    setForm({
      amount: String(debt.amount),
      type: debt.type,
      person_name: debt.person_name,
      description: debt.description || "",
      due_date: debt.due_date ? debt.due_date.split("T")[0] : "",
    });
    setIsEditOpen(true);
  }

  async function handleEdit() {
    if (!editingDebt) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/debts/${editingDebt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          person_name: form.person_name,
          description: form.description || null,
          due_date: form.due_date || null,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success("Perubahan berhasil disimpan");
      setIsEditOpen(false);
      setEditingDebt(null);
      resetForm();
      fetchDebts();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Mark as paid
  async function handleMarkPaid(debt: Debt) {
    try {
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (!res.ok) throw new Error("Gagal mengubah status");

      toast.success(`${debt.type === "HUTANG" ? "Hutang" : "Piutang"} ditandai lunas`);
      fetchDebts();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // Delete debt
  async function handleDelete() {
    if (!deleteDebt) return;

    try {
      const res = await fetch(`/api/debts/${deleteDebt.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success("Data berhasil dihapus");
      setDeleteDebt(null);
      fetchDebts();
      onDataChange?.();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function resetForm() {
    setForm({
      amount: "",
      type: "HUTANG",
      person_name: "",
      description: "",
      due_date: "",
    });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hutang & Piutang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Hutang & Piutang</CardTitle>
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ArrowDownCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Hutang Saya</span>
                </div>
                <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
                  {formatCurrency(summary.totalHutang)}
                </p>
                <p className="text-xs text-red-500">{summary.countHutang} orang</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ArrowUpCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Piutang Saya</span>
                </div>
                <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                  {formatCurrency(summary.totalPiutang)}
                </p>
                <p className="text-xs text-green-500">{summary.countPiutang} orang</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="HUTANG">Hutang</SelectItem>
                <SelectItem value="PIUTANG">Piutang</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="UNPAID">Belum Lunas</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debt List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {debts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada data</p>
              </div>
            ) : (
              debts.map((debt) => (
                <div
                  key={debt.id}
                  className={`p-3 rounded-lg border ${
                    debt.status === "PAID"
                      ? "bg-muted/50 opacity-60"
                      : debt.type === "HUTANG"
                      ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={debt.type === "HUTANG" ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {debt.type === "HUTANG" ? "Hutang" : "Piutang"}
                        </Badge>
                        {debt.status === "PAID" && (
                          <Badge variant="outline" className="text-xs">
                            Lunas
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm">
                        <User className="h-3 w-3" />
                        <span className="font-medium truncate">{debt.person_name}</span>
                      </div>
                      {debt.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {debt.description}
                        </p>
                      )}
                      {debt.due_date && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Jatuh tempo:{" "}
                            {format(new Date(debt.due_date), "d MMM yyyy", { locale: localeId })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          debt.type === "HUTANG" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(debt.amount)}
                      </p>
                      {debt.status === "UNPAID" && (
                        <div className="flex gap-1 mt-2 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleMarkPaid(debt)}
                            title="Tandai Lunas"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openEdit(debt)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setDeleteDebt(debt)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Hutang/Piutang</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: "HUTANG" | "PIUTANG") =>
                    setForm({ ...form, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HUTANG">Hutang (Saya berhutang)</SelectItem>
                    <SelectItem value="PIUTANG">Piutang (Orang berhutang)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="100000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Orang</Label>
              <Input
                value={form.person_name}
                onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                placeholder="Nama orang yang berhutang/di-hutangi"
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan (opsional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Contoh: Pinjam untuk modal usaha"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Jatuh Tempo (opsional)</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAdd} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hutang/Piutang</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: "HUTANG" | "PIUTANG") =>
                    setForm({ ...form, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HUTANG">Hutang</SelectItem>
                    <SelectItem value="PIUTANG">Piutang</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Orang</Label>
              <Input
                value={form.person_name}
                onChange={(e) => setForm({ ...form, person_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Jatuh Tempo</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDebt} onOpenChange={() => setDeleteDebt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDebt && (
                <>
                  Anda akan menghapus {deleteDebt.type === "HUTANG" ? "hutang" : "piutang"}{" "}
                  sebesar {formatCurrency(deleteDebt.amount)} dari {deleteDebt.person_name}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
