import { Edit, Trash, RefreshCw, Search, X } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "../ui/table";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";

interface CategoryObj {
  id?: string;
  name?: string;
}

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  category?: string | CategoryObj | null;
  description?: string | null;
  created_at: string;
}

interface Props {
  currentPeriod: {
    transactions: Transaction[];
  };
  getCategoryName: (category: string | CategoryObj | null | undefined) => string;
  formatCurrency: (value: number) => string;
  openEdit: (tx: Transaction) => void;
  handleDeleteConfirmed: (tx: Transaction) => void;
  handleBulkDelete?: (ids: string[]) => Promise<void>;
  onRefresh?: () => void;
  isDeleting: boolean;
  isRefreshing?: boolean;
}

export default function RecentTransactionsCard({
  currentPeriod,
  getCategoryName,
  formatCurrency,
  openEdit,
  handleDeleteConfirmed,
  handleBulkDelete,
  onRefresh,
  isDeleting,
  isRefreshing = false,
}: Props) {
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const allTransactions = useMemo(() => {
    return currentPeriod?.transactions || [];
  }, [currentPeriod?.transactions]);

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return allTransactions;
    
    const query = searchQuery.toLowerCase();
    return allTransactions.filter((tx) => {
      const categoryName = getCategoryName(tx.category).toLowerCase();
      const description = (tx.description || "").toLowerCase();
      const amount = String(tx.amount);
      const date = new Date(tx.created_at).toLocaleDateString("id-ID");
      
      return (
        categoryName.includes(query) ||
        description.includes(query) ||
        amount.includes(query) ||
        date.includes(query)
      );
    });
  }, [allTransactions, searchQuery, getCategoryName]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Reset selections when data changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [allTransactions]);

  // Ensure page is valid
  if (page > totalPages) setPage(totalPages);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, page]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((tx) => tx.id)));
    }
  };

  const handleBulkDeleteClick = async () => {
    if (selectedIds.size === 0 || !handleBulkDelete) return;
    setIsBulkDeleting(true);
    try {
      await handleBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Page numbers for pagination
  const pageNumbersToShow = (() => {
    const around = 2;
    const pages = [];
    const start = Math.max(1, page - around);
    const end = Math.min(totalPages, page + around);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Transaksi Terbaru</CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1">Refresh</span>
              </Button>
            )}
            
            {/* Bulk Delete Button */}
            {selectedIds.size > 0 && handleBulkDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isBulkDeleting}
                    className="shrink-0"
                  >
                    <Trash className="h-4 w-4" />
                    <span className="ml-1">Hapus ({selectedIds.size})</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus {selectedIds.size} Transaksi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Anda akan menghapus {selectedIds.size} transaksi yang dipilih.
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDeleteClick}
                      disabled={isBulkDeleting}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {isBulkDeleting ? "Menghapus..." : "Hapus Semua"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {totalItems > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === paginated.length && paginated.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((tx) => (
                  <TableRow key={tx.id} className={selectedIds.has(tx.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(tx.id)}
                        onCheckedChange={() => toggleSelect(tx.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(tx.created_at).toLocaleDateString("id-ID")}
                    </TableCell>

                    <TableCell>{getCategoryName(tx.category)}</TableCell>
                    <TableCell>{tx.description || "-"}</TableCell>

                    <TableCell
                      className={`text-right font-medium ${
                        tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}>
                      {tx.type === "INCOME" ? "+" : "-"}{" "}
                      {formatCurrency(Number(tx.amount))}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(tx)}
                          title="Edit">
                          <Edit className="mr-1 h-4 w-4" />
                          Edit
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              title="Hapus">
                              <Trash className="mr-1 h-4 w-4" />
                              Hapus
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Apakah anda yakin ingin menghapus data ini?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Transaksi tanggal{" "}
                                {new Date(tx.created_at).toLocaleDateString(
                                  "id-ID"
                                )}{" "}
                                - {getCategoryName(tx.category)} -{" "}
                                {formatCurrency(Number(tx.amount))}
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteConfirmed(tx)}
                                disabled={isDeleting}
                                className="bg-destructive text-white hover:bg-destructive/90">
                                {isDeleting ? "Menghapus..." : "Hapus"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {searchQuery && (
                  <span className="mr-2 text-primary">
                    Hasil pencarian:
                  </span>
                )}
                Menampilkan{" "}
                {Math.min((page - 1) * itemsPerPage + 1, totalItems)}-
                {Math.min(page * itemsPerPage, totalItems)} dari {totalItems}{" "}
                transaksi
              </div>

              {/* Desktop / Tablet: full controls */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="First page">
                  &laquo;
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page">
                  Prev
                </Button>

                <div className="flex gap-1 items-center overflow-x-auto max-w-[36rem] px-1">
                  {pageNumbersToShow[0] > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant={1 === page ? "default" : "outline"}
                        onClick={() => setPage(1)}>
                        1
                      </Button>
                      {pageNumbersToShow[0] > 2 && (
                        <div className="px-2 select-none text-muted-foreground">
                          …
                        </div>
                      )}
                    </>
                  )}

                  {pageNumbersToShow.map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={n === page ? "default" : "outline"}
                      onClick={() => setPage(n)}>
                      {n}
                    </Button>
                  ))}

                  {pageNumbersToShow[pageNumbersToShow.length - 1] <
                    totalPages && (
                    <>
                      {pageNumbersToShow[pageNumbersToShow.length - 1] <
                        totalPages - 1 && (
                        <div className="px-2 select-none text-muted-foreground">
                          …
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={totalPages === page ? "default" : "outline"}
                        onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page">
                  Next
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Last page">
                  &raquo;
                </Button>
              </div>

              {/* Mobile: compact controls */}
              <div className="flex sm:hidden items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page">
                  Prev
                </Button>

                <div className="text-sm px-2 py-1 bg-muted rounded-md min-w-[84px] text-center">
                  <span className="block font-medium">{page}</span>
                  <span className="text-xs text-muted-foreground">
                    dari {totalPages}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page">
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            {searchQuery 
              ? `Tidak ada transaksi yang cocok dengan "${searchQuery}"`
              : "Belum ada transaksi bulan ini."
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}
