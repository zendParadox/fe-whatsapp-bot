/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import RecentTransactionsCard from "@/components/dashboard/RecentTransactionsCard";
import WhatsAppBotBanner from "@/components/dashboard/WhatsAppBotBanner";
import AiAnalysisButton from "@/components/dashboard/AiAnalysisButton";
import AiAnalysisModal from "@/components/dashboard/AiAnalysisModal";
import ExportReportButtons from "@/components/dashboard/ExportReportButtons";
import WalletCard from "@/components/dashboard/WalletCard";
import BudgetCard from "@/components/dashboard/BudgetCard";
import DebtCard from "@/components/dashboard/DebtCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/phone";

import {
  CategoryObj,
  Transaction,
  DashboardData,
  UserProfile,
} from "@/types/dashboard";
import { ComparisonCard } from "@/components/dashboard/ComparisonCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { TransactionDialog } from "@/components/dashboard/TransactionDialog";
import { AddCategoryDialog } from "@/components/dashboard/AddCategoryDialog";
import InstallPromptBanner from "@/components/InstallPromptBanner";

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

// --- KOMPONEN UTAMA DASHBOARD ---
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    createdAt: "", // ISO date string for editing
    wallet_id: "none",
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
        if ((apiData as any).currency)
          setUserCurrency((apiData as any).currency);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

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

  const [userCurrency, setUserCurrency] = useState<string>("IDR");

  const formatCurrency = (value: number) => formatMoney(value, userCurrency);

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
        typeof tx.category === "string"
          ? tx.category
          : (tx.category?.name ?? ""),
      type: tx.type,
      amount: String(tx.amount),
      categoryId: categoryId,
      description: tx.description ?? "",
      createdAt: new Date(tx.created_at).toISOString().split("T")[0], // Format: YYYY-MM-DD
      wallet_id: tx.wallet_id || "none", // Assuming backend returns wallet_id if any, though GET doesn't strictly need it to just show. We'll set it to none or existing
    });
    setIsDialogOpen(true);
  }

  function openAdd() {
    setEditingTx(null);
    setForm({
      category: "",
      type: "EXPENSE",
      amount: "",
      categoryId: "",
      description: "",
      createdAt: new Date().toISOString().split("T")[0],
      wallet_id: "none",
    });
    setIsDialogOpen(true);
  }

  function handleFormChange<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
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
      if (form.createdAt)
        payload.created_at = new Date(form.createdAt).toISOString();
      if (form.wallet_id !== "none") payload.wallet_id = form.wallet_id;

      let res;
      if (editingTx) {
        res = await fetch(`/api/transactions/${editingTx.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(
          `Gagal menyimpan ${editingTx ? "perubahan" : "transaksi"}: ${res.status} ${text ?? ""}`,
        );
      }

      setIsDialogOpen(false);
      setEditingTx(null);

      // refresh data via refreshKey (triggers useEffect)
      setRefreshKey((k) => k + 1);

      // show success toast
      toast.success(
        editingTx
          ? "Perubahan transaksi berhasil disimpan."
          : "Transaksi baru berhasil ditambahkan.",
      );
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
      // refresh data via refreshKey (triggers useEffect)
      setRefreshKey((k) => k + 1);
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
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold tracking-tighter"
              >
                <h1 className="bg-gradient-to-r text-3xl from-ai-cyan to-ai-purple bg-clip-text text-transparent dark:text-glow">
                  GoTEK
                </h1>
              </Link>
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
              planType={userProfile?.plan_type || data?.plan_type}
              premiumValidUntil={userProfile?.premium_valid_until}
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
              planType={userProfile?.plan_type || data?.plan_type}
              premiumValidUntil={userProfile?.premium_valid_until}
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
      {/* <SmartAiInput 
        categories={categories} 
        onTransactionAdded={() => setRefreshKey(k => k + 1)} 
        planType={data.plan_type || "FREE"}
      /> */}

      {/* AI Analysis Button + Export Buttons */}
      <div className="flex flex-col justify-center sm:justify-center items-center sm:items-center gap-3">
        <AiAnalysisButton
          onClick={fetchAiAnalysis}
          isLoading={isAiLoading}
          planType={data.plan_type || "FREE"}
        />
        <ExportReportButtons
          transactions={currentPeriod.transactions}
          summary={currentPeriod.summary}
          planType={data.plan_type || "FREE"}
          formatCurrency={formatCurrency}
          dateRange={activeDateRange}
        />
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

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-ai-purple/10 to-ai-pink/10 border-ai-purple/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-ai-purple">
              Total Saldo (Keseluruhan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-ai-cyan to-ai-purple bg-clip-text text-transparent">
              {formatCurrency(data.totalSaldo)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Akumulasi sepanjang waktu
            </p>
          </CardContent>
        </Card>
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
                    label
                  >
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
        <div className="lg:col-span-2 space-y-6">
          <BudgetCard
            budgetData={budgetData}
            categories={categories}
            month={
              activeDateRange?.from
                ? activeDateRange.from.getMonth() + 1
                : new Date().getMonth() + 1
            }
            year={
              activeDateRange?.from
                ? activeDateRange.from.getFullYear()
                : new Date().getFullYear()
            }
            onBudgetChange={() => setRefreshKey((k) => k + 1)}
            formatter={formatCurrency}
          />
          <WalletCard
            wallets={data.wallets || []}
            planType={data.plan_type || "FREE"}
            formatCurrency={formatCurrency}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
          <DebtCard
            onDataChange={() => setRefreshKey((k) => k + 1)}
            wallets={data.wallets || []}
            planType={data.plan_type || "FREE"}
          />
        </div>
        <div className="lg:col-span-3 overflow-x-auto relative">
          <RecentTransactionsCard
            currentPeriod={currentPeriod}
            getCategoryName={getCategoryName}
            formatCurrency={formatCurrency}
            openEdit={openEdit}
            onAdd={openAdd}
            handleDeleteConfirmed={handleDeleteConfirmed}
            isDeleting={isDeleting}
            handleBulkDelete={async (ids) => {
              for (const id of ids) {
                await fetch(`/api/transactions/${id}`, { method: "DELETE" });
              }
              setRefreshKey((k) => k + 1);
              toast.success(`${ids.length} transaksi berhasil dihapus.`);
            }}
          />
        </div>
      </div>

      {/* Dialogs */}
      <TransactionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingTx}
        form={form}
        handleFormChange={handleFormChange}
        amountError={amountError}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onAddCategoryClick={() => setIsAddCategoryOpen(true)}
        isSaving={isSaving}
        handleSave={handleSave}
        planType={data.plan_type as "FREE" | "PREMIUM"}
        wallets={data.wallets}
      />

      <AddCategoryDialog
        isOpen={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategory={handleAddCategory}
        addingCategory={addingCategory}
      />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} GoTEK. All rights reserved.</p>
        <p className="mt-2">
          Jika ada kendala, hubungi{" "}
          <a
            href="https://t.me/rafliramadhaniii"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ai-cyan hover:underline font-medium"
          >
            Telegram Support
          </a>
        </p>
      </footer>

      <InstallPromptBanner />
    </div>
  );
}
