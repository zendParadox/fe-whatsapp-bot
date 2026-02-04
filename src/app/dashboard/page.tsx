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
import ProfileMenu from "@/components/dashboard/ProfileMenu";
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
import SmartAiInput from "@/components/dashboard/SmartAiInput";
import WhatsAppBotBanner from "@/components/dashboard/WhatsAppBotBanner";
import AiAnalysisButton from "@/components/dashboard/AiAnalysisButton";
import AiAnalysisModal from "@/components/dashboard/AiAnalysisModal";
import BudgetCard from "@/components/dashboard/BudgetCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface UserProfile {
  name: string | null;
  avatar_url: string | null;
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
  const [refreshKey, setRefreshKey] = useState(0);

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  // AI Analysis modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiMonthName, setAiMonthName] = useState("");
  const [aiYear, setAiYear] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch AI analysis
  async function fetchAiAnalysis() {
    setIsAiLoading(true);
    setAiError(null);
    setIsAiModalOpen(true);
    try {
      const res = await fetch("/api/ai-analysis");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memuat analisis");
      }
      const data = await res.json();
      setAiAnalysis(data.analysis);
      setAiMonthName(data.monthName);
      setAiYear(data.year);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setIsAiLoading(false);
    }
  }

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data.user);
        }
      } catch {
        // Silently fail
      }
    }
    fetchProfile();
  }, []);

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

        if (res.status === 401 || res.status === 403) {
          router.push("/unauthorized");
          return;
        }

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
    fetchData();
  }, [activeDateRange, refreshKey]);

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
              <h1 className="text-2xl sm:text-3xl font-bold">
                GoTEK
              </h1>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Ringkasan & laporan keuangan Anda
              </span>
            </div>
          </div>

          {/* Mobile: Profile Menu */}
          <div className="md:hidden">
            <ProfileMenu 
              variant="icon" 
              userName={userProfile?.name}
              avatarUrl={userProfile?.avatar_url}
            />
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

            {/* Profile Menu with Logout */}
            <ProfileMenu 
              variant="full" 
              userName={userProfile?.name}
              avatarUrl={userProfile?.avatar_url}
            />
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
          </div>
        </div>
      </header>

      {/* WhatsApp Bot Welcome Banner */}
      <WhatsAppBotBanner />

      {/* Smart Analysis Input */}
      <SmartAiInput 
        categories={categories} 
        onTransactionAdded={() => setRefreshKey(k => k + 1)} 
      />

      {/* AI Analysis Button */}
      <div className="flex justify-center sm:justify-start">
        <AiAnalysisButton onClick={fetchAiAnalysis} isLoading={isAiLoading} />
      </div>

      {/* AI Analysis Modal */}
      <AiAnalysisModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        analysis={aiAnalysis}
        monthName={aiMonthName}
        year={aiYear}
        isLoading={isAiLoading}
        error={aiError}
      />

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
        <div className="lg:col-span-2">
          <BudgetCard
            budgetData={budgetData}
            categories={categories}
            month={activeDateRange?.from ? activeDateRange.from.getMonth() + 1 : new Date().getMonth() + 1}
            year={activeDateRange?.from ? activeDateRange.from.getFullYear() : new Date().getFullYear()}
            onBudgetChange={() => setRefreshKey(k => k + 1)}
            formatter={formatCurrency}
          />
        </div>
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

      {/* Footer */}
      <footer className="mt-12 py-6 border-t text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} GoTEK. All rights reserved.
        </p>
        <p className="mt-2">
          Jika ada kendala, hubungi{" "}
          <a 
            href="https://t.me/rafliramadhaniii" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-neon-cyan hover:underline font-medium"
          >
            Telegram Support
          </a>
        </p>
      </footer>
    </div>
  );
}
