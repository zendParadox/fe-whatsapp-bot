/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
// import { LogoutButton } from "@/components/ui/logout-button";
import LogoutButton from "@/components/ui/LogoutButton";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash } from "lucide-react";
import RecentTransactionsCard from "@/components/dashboard/RecentTransactionsCard";
import { toast } from "sonner";

// --- INTERFACE & KONSTANTA ---
interface CategoryObj {
  id?: string;
  name?: string;
  [k: string]: any;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  category?: string | CategoryObj | null;
  description?: string | null;
  created_at: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

interface DashboardData {
  currentPeriod: {
    summary: Summary;
    transactions: Transaction[];
    topCategories: { category: string; amount: number }[];
    avgDailyExpense: number;
  };
  previousPeriod: {
    summary: { totalExpense: number };
  };
  trendData: { name: string; Pemasukan: number; Pengeluaran: number }[];
  budgetData: { category: string; budget: number; actual: number }[];
}

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// --- KOMPONEN BANTU ---
function ComparisonCard({
  title,
  currentValue,
  previousValue,
  formatter,
}: {
  title: string;
  currentValue: number;
  previousValue: number;
  formatter: (value: number) => string;
}) {
  const difference = currentValue - previousValue;
  const percentageChange =
    previousValue === 0 ? 100 : (difference / previousValue) * 100;
  const isPositive = difference >= 0;
  const isExpense = title.toLowerCase().includes("pengeluaran");
  const isGood = isExpense ? !isPositive : isPositive;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatter(currentValue)}</div>
        <p className={`text-xs ${isGood ? "text-green-500" : "text-red-500"}`}>
          {percentageChange.toFixed(1)}% vs bulan lalu
        </p>
      </CardContent>
    </Card>
  );
}

function BudgetStatus({
  item,
  formatter,
}: {
  item: { category: string; budget: number; actual: number };
  formatter: (value: number) => string;
}) {
  const percentage = (item.actual / item.budget) * 100;
  const isOverBudget = percentage > 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{item.category}</span>
        <span
          className={`font-mono ${
            isOverBudget ? "text-red-500" : "text-muted-foreground"
          }`}>
          {formatter(item.actual)} / {formatter(item.budget)}
        </span>
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className={isOverBudget ? "[&>div]:bg-red-500" : ""}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

// --- KOMPONEN UTAMA DASHBOARD ---
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<any | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedDateRange, setSelectedDateRange] = useState<any | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [activeDateRange, setActiveDateRange] = useState<any | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // states for edit/delete
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    category: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    amount: "",
    categoryId: "",
    description: "",
  });
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // categories state
  const [categories, setCategories] = useState<CategoryObj[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // add category dialog state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  // toast/snackbar state
  // const [toast, setToast] = useState<null | {
  //   message: string;
  //   type?: "success" | "error";
  // }>(null);

  const handleApplyFilter = () => {
    setActiveDateRange(selectedDateRange);
  };

  useEffect(() => {
    async function fetchData() {
      if (!activeDateRange?.from || !activeDateRange?.to) return;

      setIsLoading(true);
      setError(null);

      const from = format(activeDateRange.from, "yyyy-MM-dd");
      const to = format(activeDateRange.to, "yyyy-MM-dd");

      try {
        const res = await fetch(`/api/dashboard?from=${from}&to=${to}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil data dashboard");
        }
        const apiData: DashboardData = await res.json();
        setData(apiData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [activeDateRange]);

  // fetch categories (sekali saat mount)
  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setCategoriesLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Gagal mengambil kategori");
      const json = await res.json();
      setCategories(json);
    } catch (err) {
      console.error("fetchCategories:", err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }

  const formatCurrency = (value: number) =>
    `Rp ${value.toLocaleString("id-ID")}`;

  function openEdit(tx: Transaction) {
    setEditingTx(tx);

    let categoryId = "";
    if (tx.category && typeof tx.category !== "string") {
      categoryId = (tx.category as any).id ?? "";
    } else {
      // jika category hanya string (nama), coba cari id dari nama
      if (typeof tx.category === "string" && categories.length > 0) {
        const match = categories.find((c) => c.name === tx.category);
        categoryId = match ? (match.id as string) : "";
      }
    }

    setForm({
      category:
        typeof tx.category === "string" ? tx.category : tx.category?.name ?? "",
      type: tx.type,
      amount: String(tx.amount),
      categoryId: categoryId,
      description: tx.description ?? "",
    });
    setIsDialogOpen(true);
  }

  function handleFormChange<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  // validation: amount > 0
  const amountNumber = Number(form.amount);
  const amountError =
    !form.amount || isNaN(amountNumber) || amountNumber <= 0
      ? "Jumlah harus lebih dari 0"
      : "";

  async function handleSave() {
    if (!editingTx) return;

    // if invalid, block
    if (amountError) {
      toast.error(amountError);
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = {
        amount: Number(form.amount),
        type: form.type,
      };

      if (form.description !== undefined)
        payload.description = form.description;
      if (form.categoryId) payload.category_id = form.categoryId;

      const res = await fetch(`/api/transactions/${editingTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(
          `Gagal menyimpan perubahan: ${res.status} ${text ?? ""}`
        );
      }

      setIsDialogOpen(false);
      setEditingTx(null);

      // refresh data
      const from = format(activeDateRange.from, "yyyy-MM-dd");
      const to = format(activeDateRange.to, "yyyy-MM-dd");
      const refreshed = await fetch(`/api/dashboard?from=${from}&to=${to}`);
      if (refreshed.ok) setData(await refreshed.json());

      // show success toast
      toast.success("Perubahan transaksi berhasil disimpan.");
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan. Periksa console.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteConfirmed(tx?: Transaction) {
    const target = tx ?? deletingTx;
    if (!target) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setDeletingTx(null);
      // refresh data
      const from = format(activeDateRange.from, "yyyy-MM-dd");
      const to = format(activeDateRange.to, "yyyy-MM-dd");
      const refreshed = await fetch(`/api/dashboard?from=${from}&to=${to}`);
      if (refreshed.ok) setData(await refreshed.json());
      toast.success("Transaksi dihapus.");
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menghapus.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Add category flow (from edit dialog)
  async function handleAddCategory() {
    const name = newCategoryName?.trim();
    if (!name) {
      toast.error("Nama kategori tidak boleh kosong.");
      return;
    }
    setAddingCategory(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Gagal menambah kategori: ${res.status} ${text ?? ""}`);
      }
      const created = await res.json();
      // re-fetch categories atau push ke state
      await fetchCategories();

      // isi form dengan category baru
      setForm((s) => ({
        ...s,
        categoryId: created.id ?? created.name,
        category: created.name,
      }));

      setIsAddCategoryOpen(false);
      setNewCategoryName("");
      toast.success("Kategori berhasil ditambahkan.");
    } catch (err) {
      console.error("handleAddCategory:", err);
      toast.error("Gagal menambahkan kategori.");
    } finally {
      setAddingCategory(false);
    }
  }

  // auto-hide toast after 3s
  // useEffect(() => {
  //   if (!toast) return;
  //   const t = setTimeout(() => toast(null), 3000);
  //   return () => clearTimeout(t);
  // }, [toast]);

  if (isLoading)
    return (
      <div className="container mx-auto p-4 md:p-8">
        <DashboardSkeleton />
      </div>
    );
  if (error)
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  if (!data)
    return (
      <div className="text-center p-8">Tidak ada data untuk ditampilkan.</div>
    );

  const { currentPeriod, previousPeriod, trendData, budgetData } = data;
  const pieChartData = currentPeriod.topCategories.map((c) => ({
    name: c.category,
    value: c.amount,
  }));

  function getCategoryName(category?: string | CategoryObj | null) {
    if (!category) return "-";
    if (typeof category === "string") return category;
    return category.name ?? "-";
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="w-full border-b p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Judul */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Dashboard Keuangan
              </h1>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Ringkasan & laporan keuangan Anda
              </span>
            </div>
          </div>

          {/* Mobile: FAB logout (ikon-only) */}
          <div className="md:hidden flex items-center">
            {/* beri margin kiri agar tidak menempel ke pinggir */}
            <div className="mr-1">
              <LogoutButton
                variant="icon"
                className="bg-white/90 dark:bg-slate-800/90"
              />
            </div>
          </div>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-3">
            <DatePickerWithRange
              date={selectedDateRange}
              onDateChange={setSelectedDateRange}
              className="w-full sm:w-auto"
            />
            <Button onClick={handleApplyFilter} className="whitespace-nowrap">
              Terapkan
            </Button>

            {/* Logout full button */}
            <LogoutButton variant="full" />
          </div>
        </div>

        {/* Mobile: DatePicker + Apply di bawah header (responsive) */}
        <div className="mt-4 md:hidden space-y-3">
          <DatePickerWithRange
            date={selectedDateRange}
            onDateChange={setSelectedDateRange}
            className="w-full"
          />
          <div className="flex gap-3">
            <Button onClick={handleApplyFilter} className="flex-1">
              Terapkan
            </Button>
            {/* spacing kanan agar FAB tidak overlap */}
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ComparisonCard
          title="Total Pemasukan"
          currentValue={currentPeriod.summary.totalIncome}
          previousValue={0}
          formatter={formatCurrency}
        />
        <ComparisonCard
          title="Total Pengeluaran"
          currentValue={currentPeriod.summary.totalExpense}
          previousValue={previousPeriod.summary.totalExpense}
          formatter={formatCurrency}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentPeriod.summary.balance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Rata-rata Pengeluaran Harian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentPeriod.avgDailyExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tren Keuangan (6 Bulan Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(val) =>
                    new Intl.NumberFormat("id-ID", {
                      notation: "compact",
                    }).format(val)
                  }
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="Pemasukan" stroke="#22C55E" />
                <Line type="monotone" dataKey="Pengeluaran" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kategori Pengeluaran Teratas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label>
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                🎉 Belum ada pengeluaran bulan ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2  overflow-x-auto">
          <CardHeader>
            <CardTitle>Status Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetData.length > 0 ? (
              budgetData.map((item) => (
                <BudgetStatus
                  key={item.category}
                  item={item}
                  formatter={formatCurrency}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Anda belum mengatur budget.
              </div>
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-3 overflow-x-auto">
          <RecentTransactionsCard
            currentPeriod={currentPeriod}
            getCategoryName={getCategoryName}
            formatCurrency={formatCurrency}
            openEdit={openEdit}
            handleDeleteConfirmed={handleDeleteConfirmed}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(v) => setIsDialogOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            {/* Category: Select dari daftar kategori user */}
            <div>
              <Label>Category</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => handleFormChange("categoryId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          categoriesLoading
                            ? "Memuat..."
                            : form.category || "Pilih kategori"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Memuat kategori...
                        </div>
                      ) : categories.length > 0 ? (
                        categories.map((c) => (
                          <SelectItem
                            key={c.id ?? c.name}
                            value={c.id ?? c.name}>
                            {c.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">
                          Belum ada kategori
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tombol Tambah kategori */}
                <div className="w-36">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsAddCategoryOpen(true)}>
                    + Tambah kategori
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Jika kategori belum ada, tambahkan di sini.
              </p>
            </div>

            {/* Type */}
            <div>
              <Label className="mb-1">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  handleFormChange("type", v as "INCOME" | "EXPENSE")
                }>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">INCOME</SelectItem>
                  <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label className="mb-1">Amount</Label>
              <Input
                value={form.amount}
                onChange={(e) => handleFormChange("amount", e.target.value)}
                inputMode="numeric"
              />
              {amountError && (
                <p className="mt-1 text-xs text-red-500">{amountError}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <Label className="mb-1">Deskripsi (opsional)</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !!amountError}>
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog (sub-dialog) */}
      <Dialog
        open={isAddCategoryOpen}
        onOpenChange={(v) => setIsAddCategoryOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <div>
              <Label className="mb-1">Nama Kategori</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Mis. Makanan, Transport, Gaji"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddCategoryOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddCategory} disabled={addingCategory}>
              {addingCategory ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
