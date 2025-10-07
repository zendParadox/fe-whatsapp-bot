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
import { Progress } from "@/components/ui/progress"; // BARU: Untuk budget
import { Skeleton } from "@/components/ui/skeleton"; // BARU: Untuk loading state
import { Button } from "./ui/button";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { startOfMonth, endOfMonth, format } from "date-fns";
// import { format } from "path";
import { DatePickerWithRange } from "./ui/date-range-picker";

// --- INTERFACE & KONSTANTA ---
interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// BARU: Struktur data utama untuk dashboard
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

// --- KOMPONEN BARU ---

// BARU: Komponen untuk kartu perbandingan
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

  // Untuk pengeluaran, kenaikan itu negatif (merah)
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

// BARU: Komponen untuk menampilkan status budget
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
          }`}
        >
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

// BARU: Komponen skeleton untuk loading state
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
  // const [period, setPeriod] = useState<string>("current");
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

  const handleApplyFilter = () => {
    setActiveDateRange(selectedDateRange);
  };

  useEffect(() => {
    async function fetchData() {
      // Pastikan `from` dan `to` ada di state yang AKTIF sebelum memanggil API
      if (!activeDateRange?.from || !activeDateRange?.to) {
        return;
      }

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

  const formatCurrency = (value: number) =>
    `Rp ${value.toLocaleString("id-ID")}`;

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

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard Keuangan</h1>
        <DatePickerWithRange
          date={selectedDateRange}
          onDateChange={setSelectedDateRange}
        />
        <Button onClick={handleApplyFilter}>Terapkan</Button>
      </header>

      {/* BARU: Bagian Ringkasan Utama dengan 4 Kartu */}
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

      {/* BARU: Bagian Grafik Tren dan Pie Chart */}
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

      {/* BARU: Bagian Budget dan Transaksi Terbaru */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPeriod.transactions.length > 0 ? (
              <Table>
                {/* Tabel transaksi bisa dimasukkan di sini, atau disederhanakan */}
                <TableBody>
                  {currentPeriod.transactions.slice(0, 5).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {new Date(tx.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{tx.category.name}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          tx.type === "INCOME"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}{" "}
                        {formatCurrency(Number(tx.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground">
                Belum ada transaksi bulan ini.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
