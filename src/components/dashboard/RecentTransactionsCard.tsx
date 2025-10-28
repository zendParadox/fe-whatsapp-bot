import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@radix-ui/react-alert-dialog";
import { Edit, Trash } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { AlertDialogHeader } from "../ui/alert-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "../ui/table";

export default function RecentTransactionsCard({
  currentPeriod,
  getCategoryName,
  formatCurrency,
  openEdit,
  handleDeleteConfirmed,
  isDeleting,
}) {
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);

  const totalItems = currentPeriod?.transactions?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // defensif: pastikan page valid saat data berubah
  if (page > totalPages) setPage(totalPages);

  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return (currentPeriod?.transactions || []).slice(start, end);
  }, [currentPeriod, page]);

  // helper: range of page numbers to show around current (desktop)
  const pageNumbersToShow = (() => {
    const around = 2; // show 2 pages before/after current
    const pages = [];
    const start = Math.max(1, page - around);
    const end = Math.min(totalPages, page + around);
    for (let i = start; i <= end; i++) pages.push(i);
    // if close to edges and not full, try to expand to fill (optional)
    return pages;
  })();

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Transaksi Terbaru</CardTitle>
      </CardHeader>

      <CardContent>
        {totalItems > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((tx) => (
                  <TableRow key={tx.id}>
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
                            </AlertDialogHeader>

                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">
                                Transaksi tanggal{" "}
                                {new Date(tx.created_at).toLocaleDateString(
                                  "id-ID"
                                )}{" "}
                                - {getCategoryName(tx.category)} -{" "}
                                {formatCurrency(Number(tx.amount))}
                              </p>
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                              <AlertDialogCancel asChild>
                                <Button variant="outline">Batal</Button>
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteConfirmed(tx)}
                                  disabled={isDeleting}>
                                  {isDeleting ? "Menghapus..." : "Hapus"}
                                </Button>
                              </AlertDialogAction>
                            </div>
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

                {/* Page numbers — make horizontally scrollable if many */}
                <div className="flex gap-1 items-center overflow-x-auto max-w-[36rem] px-1">
                  {/* If there's gap between first page and start, show first + ellipsis */}
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

                  {/* If gap between end and last page */}
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
            Belum ada transaksi bulan ini.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
