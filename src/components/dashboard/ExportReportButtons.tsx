"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, Lock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

interface CategoryObj {
  id?: string;
  name?: string;
  [k: string]: unknown;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  category?: string | CategoryObj | null;
  description?: string | null;
  created_at: string;
}

interface ExportReportButtonsProps {
  transactions: Transaction[];
  summary: { totalIncome: number; totalExpense: number; balance: number };
  planType: "FREE" | "PREMIUM";
  formatCurrency: (value: number) => string;
  dateRange?: { from?: Date; to?: Date };
}

function getCategoryName(category?: string | CategoryObj | null): string {
  if (!category) return "-";
  if (typeof category === "string") return category;
  return category.name ?? "-";
}

export default function ExportReportButtons({
  transactions,
  summary,
  planType,
  formatCurrency,
  dateRange,
}: ExportReportButtonsProps) {
  const isFree = planType === "FREE";

  const periodLabel = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "dd MMM yyyy", { locale: idLocale })} - ${format(dateRange.to, "dd MMM yyyy", { locale: idLocale })}`
    : "Periode Terkini";

  async function handleExportPDF() {
    if (isFree) return;
    toast.info("Mengunduh laporan PDF...");

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(0, 200, 200);
      doc.text("GoTEK", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Laporan Keuangan", 14, 27);
      doc.text(`Periode: ${periodLabel}`, 14, 33);
      doc.text(`Dicetak: ${format(new Date(), "dd MMMM yyyy, HH:mm", { locale: idLocale })}`, 14, 39);

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Ringkasan", 14, 50);

      autoTable(doc, {
        startY: 54,
        head: [["Keterangan", "Jumlah"]],
        body: [
          ["Total Pemasukan", formatCurrency(summary.totalIncome)],
          ["Total Pengeluaran", formatCurrency(summary.totalExpense)],
          ["Saldo Akhir", formatCurrency(summary.balance)],
        ],
        theme: "grid",
        headStyles: { fillColor: [0, 180, 200], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10 },
        margin: { left: 14 },
      });

      // Transactions table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 90;
      doc.setFontSize(12);
      doc.text("Detail Transaksi", 14, finalY + 10);

      const tableData = transactions.map((tx, i) => [
        String(i + 1),
        format(new Date(tx.created_at), "dd/MM/yyyy"),
        tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
        getCategoryName(tx.category),
        tx.description || "-",
        formatCurrency(Number(tx.amount)),
      ]);

      autoTable(doc, {
        startY: finalY + 14,
        head: [["#", "Tanggal", "Tipe", "Kategori", "Keterangan", "Jumlah"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [100, 60, 200], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 10 },
          5: { halign: "right" },
        },
        margin: { left: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `GoTEK Premium Report — Halaman ${i} dari ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`GoTEK_Laporan_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
      toast.success("Laporan PDF berhasil diunduh!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Gagal mengekspor PDF.");
    }
  }

  async function handleExportExcel() {
    if (isFree) return;
    toast.info("Mengunduh laporan Excel...");

    try {
      const XLSX = await import("xlsx");

      // Summary sheet
      const summaryData = [
        ["GoTEK - Laporan Keuangan"],
        [`Periode: ${periodLabel}`],
        [`Dicetak: ${format(new Date(), "dd MMMM yyyy, HH:mm", { locale: idLocale })}`],
        [],
        ["Keterangan", "Jumlah"],
        ["Total Pemasukan", summary.totalIncome],
        ["Total Pengeluaran", summary.totalExpense],
        ["Saldo Akhir", summary.balance],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];

      // Transactions sheet
      const txHeaders = ["No", "Tanggal", "Tipe", "Kategori", "Keterangan", "Jumlah"];
      const txData = transactions.map((tx, i) => [
        i + 1,
        format(new Date(tx.created_at), "dd/MM/yyyy"),
        tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran",
        getCategoryName(tx.category),
        tx.description || "-",
        Number(tx.amount),
      ]);
      const wsTransactions = XLSX.utils.aoa_to_sheet([txHeaders, ...txData]);
      wsTransactions["!cols"] = [
        { wch: 5 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 30 },
        { wch: 18 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");
      XLSX.utils.book_append_sheet(wb, wsTransactions, "Transaksi");

      XLSX.writeFile(wb, `GoTEK_Laporan_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
      toast.success("Laporan Excel berhasil diunduh!");
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Gagal mengekspor Excel.");
    }
  }

  if (isFree) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled className="gap-2 opacity-60">
          <Lock className="w-4 h-4" />
          <FileText className="w-4 h-4" /> PDF
        </Button>
        <Button variant="outline" size="sm" disabled className="gap-2 opacity-60">
          <Lock className="w-4 h-4" />
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </Button>
        <Button variant="link" size="sm" asChild className="text-xs text-amber-500">
          <Link href="/pricing">⭐️ Upgrade untuk Export</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2 hover:border-red-500/50 hover:text-red-500 transition-colors">
        <FileText className="w-4 h-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 hover:border-green-500/50 hover:text-green-500 transition-colors">
        <FileSpreadsheet className="w-4 h-4" /> Excel
      </Button>
    </div>
  );
}
