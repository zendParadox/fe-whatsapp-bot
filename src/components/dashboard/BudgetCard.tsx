/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash, Plus } from "lucide-react";
import { toast } from "sonner";

interface CategoryObj {
  id?: string;
  name?: string;
}

interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  category_id: string;
  category: CategoryObj;
}

interface BudgetWithActual {
  id: string;
  category: string;
  categoryId: string;
  budget: number;
  actual: number;
}

interface BudgetCardProps {
  budgetData: { category: string; budget: number; actual: number }[];
  categories: CategoryObj[];
  month: number;
  year: number;
  onBudgetChange: () => void;
  formatter: (value: number) => string;
}

export default function BudgetCard({
  budgetData,
  categories,
  month,
  year,
  onBudgetChange,
  formatter,
}: BudgetCardProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form, setForm] = useState({
    categoryId: "",
    amount: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch budgets
  useEffect(() => {
    fetchBudgets();
  }, [month, year]);

  async function fetchBudgets() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Gagal mengambil budget");
      const data = await res.json();
      setBudgets(data);
    } catch (err) {
      console.error("fetchBudgets:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Combine budgetData with fetched budgets for actual spending
  const budgetWithActual: BudgetWithActual[] = budgets.map((b) => {
    const actualData = budgetData.find(
      (bd) => bd.category.toLowerCase() === (b.category?.name || "").toLowerCase()
    );
    return {
      id: b.id,
      category: b.category?.name || "Uncategorized",
      categoryId: b.category_id,
      budget: Number(b.amount),
      actual: actualData?.actual || 0,
    };
  });

  // Get categories that don't have budget yet
  const availableCategories = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id)
  );

  function openAddDialog() {
    setEditingBudget(null);
    setForm({ categoryId: "", amount: "" });
    setIsDialogOpen(true);
  }

  function openEditDialog(budget: Budget) {
    setEditingBudget(budget);
    setForm({
      categoryId: budget.category_id,
      amount: String(budget.amount),
    });
    setIsDialogOpen(true);
  }

  function handleFormChange<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  const amountNumber = Number(form.amount);
  const amountError =
    !form.amount || isNaN(amountNumber) || amountNumber <= 0
      ? "Jumlah harus lebih dari 0"
      : "";

  async function handleSave() {
    if (amountError) {
      toast.error(amountError);
      return;
    }

    if (!editingBudget && !form.categoryId) {
      toast.error("Pilih kategori terlebih dahulu");
      return;
    }

    setIsSaving(true);

    try {
      if (editingBudget) {
        // Update
        const res = await fetch(`/api/budgets/${editingBudget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(form.amount) }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal mengupdate budget");
        }
        toast.success("Budget berhasil diperbarui");
      } else {
        // Create
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category_id: form.categoryId,
            amount: Number(form.amount),
            month,
            year,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Gagal membuat budget");
        }
        toast.success("Budget berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      setEditingBudget(null);
      fetchBudgets();
      onBudgetChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus budget");
      toast.success("Budget berhasil dihapus");
      setDeletingId(null);
      fetchBudgets();
      onBudgetChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  function BudgetStatusItem({ item }: { item: BudgetWithActual }) {
    const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
    const isOverBudget = percentage > 100;
    const budget = budgets.find((b) => b.id === item.id);

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium flex-1">{item.category}</span>
          <span
            className={`font-mono text-xs mr-2 ${
              isOverBudget ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {formatter(item.actual)} / {formatter(item.budget)}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => budget && openEditDialog(budget)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600">
                  <Trash className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Budget</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus budget untuk kategori "{item.category}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isDeleting ? "Menghapus..." : "Hapus"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <Progress
          value={Math.min(percentage, 100)}
          className={isOverBudget ? "[&>div]:bg-red-500" : ""}
        />
      </div>
    );
  }

  return (
    <>
      <Card className="overflow-x-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Status Budget</CardTitle>
          <Button size="sm" onClick={openAddDialog} disabled={availableCategories.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat...</div>
          ) : budgetWithActual.length > 0 ? (
            budgetWithActual.map((item) => (
              <BudgetStatusItem key={item.id} item={item} />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              Anda belum mengatur budget. Klik tombol "Tambah" untuk membuat budget baru.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Edit Budget" : "Tambah Budget Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Category Select - only for new budget */}
            {!editingBudget && (
              <div>
                <Label className="mb-2">Kategori</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => handleFormChange("categoryId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.filter(c => c.id).length > 0 ? (
                      availableCategories.filter(c => c.id).map((c) => (
                        <SelectItem key={c.id} value={c.id!}>
                          {c.name || "Unnamed"}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Semua kategori sudah memiliki budget
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show category name when editing */}
            {editingBudget && (
              <div>
                <Label className="mb-2">Kategori</Label>
                <Input value={editingBudget.category?.name || ""} disabled />
              </div>
            )}

            {/* Amount */}
            <div>
              <Label className="mb-2">Jumlah Budget (Rp)</Label>
              <Input
                value={form.amount}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                inputMode="numeric"
                placeholder="Contoh: 500000"
              />
              {amountError && form.amount && (
                <p className="mt-1 text-xs text-red-500">{amountError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !!amountError}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
