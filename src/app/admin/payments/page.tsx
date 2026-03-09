"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  CheckCircle, XCircle, FileImage, 
  ExternalLink, Loader2, RefreshCw, AlertCircle
} from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface User {
  name: string | null;
  whatsapp_jid: string | null;
  email: string | null;
}

interface ManualPayment {
  id: string;
  amount: number;
  months: number;
  receipt_image_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  created_at: string;
  user: User;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  
  // Modal state
  const [selectedPayment, setSelectedPayment] = useState<ManualPayment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/payments?status=${statusFilter}&limit=50`);
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setPayments(data.payments || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedPayment) return;
    if (action === "REJECT" && !rejectNotes.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: action === "REJECT" ? rejectNotes : null })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Gagal ${action.toLowerCase()} pembayaran`);

      toast.success(`Pembayaran berhasil di-${action.toLowerCase()}`);
      setSelectedPayment(null);
      setRejectNotes("");
      fetchPayments(); // Refresh daftar
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">⏳ Menunggu</Badge>;
      case "APPROVED": return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">✅ Diterima</Badge>;
      case "REJECTED": return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">❌ Ditolak</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verifikasi Pembayaran</h1>
          <p className="text-muted-foreground mt-1">Kelola bukti transfer manual dari pengguna.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Daftar Transfer Masuk</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Menunggu Verifikasi</SelectItem>
                <SelectItem value="APPROVED">Sudah Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="ALL">Semua Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Memuat data pembayaran...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-red-500">
              <AlertCircle className="h-8 w-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
              <FileImage className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">Tidak Ada Bukti Transfer</h3>
              <p className="max-w-sm mt-1">Belum ada pengguna yang mengunggah bukti transfer manual untuk filter ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Nominal & Durasi</TableHead>
                    <TableHead>Tanggal Submit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {payment.user.name?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{payment.user.name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{payment.user.whatsapp_jid?.split('@')[0] || payment.user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono font-medium">Rp {payment.amount.toLocaleString('id-ID')}</span>
                          <span className="text-xs text-muted-foreground font-semibold">{payment.months} Bulan Premium</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(payment.created_at), "dd MMM yyyy", { locale: id })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(payment.created_at), "HH:mm", { locale: id })} WIB
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL & VERIFICATION MODAL */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        {selectedPayment && (
          <DialogContent className="sm:max-w-[600px] h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b bg-background z-10">
              <DialogTitle>Verifikasi Pembayaran</DialogTitle>
              <DialogDescription>
                Cek bukti transfer dan mutasi rekening sebelum menyetujui.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pengguna</p>
                  <p className="font-semibold">{selectedPayment.user.name || "Anonim"}</p>
                  <p className="text-xs text-muted-foreground">{selectedPayment.user.whatsapp_jid || selectedPayment.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nominal Transfer</p>
                  <p className="text-2xl font-bold font-mono text-neon-cyan">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground mt-1 bg-muted inline-block px-2 py-1 rounded-md">
                    Untuk {selectedPayment.months} Bulan Premium
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Bukti Transfer (Screenshot)</h4>
                  <a href={selectedPayment.receipt_image_url} target="_blank" rel="noreferrer" className="text-xs flex items-center text-neon-cyan hover:underline">
                    Buka Gambar Penuh <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                {/* Changed aspect ratio to auto height to support very long screenshots naturally */}
                <div className="relative w-full border bg-black border-border shadow-md rounded-lg overflow-hidden flex justify-center">
                   <Image
                    src={selectedPayment.receipt_image_url} 
                    alt="Bukti Transfer" 
                    className="max-w-full h-auto object-contain"
                    width={600}
                    height={800}
                    unoptimized
                  />
                </div>
              </div>

              {selectedPayment.status === "PENDING" && (
                <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-semibold text-red-500">Alasan Penolakan (Hanya diisi jika Ditolak):</label>
                  <Input 
                    placeholder="Contoh: Mutasi belum masuk / Gambar tidak jelas" 
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                  />
                </div>
              )}

              {selectedPayment.status !== "PENDING" && (
                <div className="p-4 bg-muted rounded-lg text-sm">
                  <span className="font-semibold">Status Saat Ini: </span> 
                  {getStatusBadge(selectedPayment.status)} 
                  {selectedPayment.notes && <p className="mt-2 text-muted-foreground">Catatan: {selectedPayment.notes}</p>}
                </div>
              )}
            </div>

            {selectedPayment.status === "PENDING" && (
              <DialogFooter className="p-6 pt-4 border-t bg-background gap-2 sm:gap-0 z-10 w-full">
                <Button 
                  variant="destructive" 
                  disabled={isProcessing}
                  onClick={() => handleAction("REJECT")}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Tolak</>}
                </Button>
                
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing}
                  onClick={() => handleAction("APPROVE")}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Setujui & Aktifkan Premium</>}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
