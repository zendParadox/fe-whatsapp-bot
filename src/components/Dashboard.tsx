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
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipe data untuk transaksi yang diterima dari API
interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
}

// Tipe data untuk ringkasan
interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// Tipe data untuk chart
interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

const PIE_CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
];
const BAR_CHART_COLORS = ["#22C55E", "#EF4444"]; // Hijau untuk Pemasukan, Merah untuk Pengeluaran

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [pieChartData, setPieChartData] = useState<ChartData[]>([]);
  // BARU: State untuk data grafik batang
  const [barChartData, setBarChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<string>("current");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Ganti dengan endpoint API Anda yang sesungguhnya
        const res = await fetch(`/api/transactions?month=${month}`);
        if (!res.ok) {
          throw new Error("Gagal mengambil data transaksi");
        }
        const data = await res.json();

        // Proses data untuk ringkasan dan chart
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryMap: { [key: string]: number } = {};

        data.transactions.forEach((tx: Transaction) => {
          if (tx.type === "INCOME") {
            totalIncome += Number(tx.amount);
          } else {
            totalExpense += Number(tx.amount);
            categoryMap[tx.category] =
              (categoryMap[tx.category] || 0) + Number(tx.amount);
          }
        });

        const newSummary = {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
        };

        setTransactions(data.transactions);
        setSummary(newSummary);
        setPieChartData(
          Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
        );

        // BARU: Menyiapkan data untuk grafik batang
        setBarChartData([
          { name: "Pemasukan", value: newSummary.totalIncome },
          { name: "Pengeluaran", value: newSummary.totalExpense },
        ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [month]);

  if (isLoading) return <div className="text-center p-8">Memuat data...</div>;
  if (error)
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;

  const formatCurrency = (value: number) =>
    `Rp ${value.toLocaleString("id-ID")}`;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Keuangan</h1>
        <Select onValueChange={setMonth} defaultValue={month}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Bulan Ini</SelectItem>
            <SelectItem value="last">Bulan Lalu</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {/* Bagian Ringkasan Utama */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(summary.totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(summary.totalExpense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bagian Grafik */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* ======================= DIUBAH ======================= */}
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("id-ID", {
                      notation: "compact",
                    }).format(value as number)
                  }
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#8884d8" barSize={50}>
                  {barChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_CHART_COLORS[index % BAR_CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* ======================================================== */}
      </div>

      {/* Tabel Transaksi Terbaru */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.created_at).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.type === "INCOME"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell>{tx.description || "-"}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Number(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
