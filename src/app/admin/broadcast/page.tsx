/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const FILTER_OPTIONS = [
  { value: "all", label: "Semua User" },
  { value: "1d", label: "Aktif 1 Hari Terakhir" },
  { value: "7d", label: "Aktif 7 Hari Terakhir" },
  { value: "30d", label: "Aktif 30 Hari Terakhir" },
  { value: "premium", label: "Premium Only" },
  { value: "free", label: "Free Only" },
];

interface BroadcastLogItem {
  id: string;
  message: string;
  filter: string;
  total_sent: number;
  total_failed: number;
  created_at: string;
}

export default function AdminBroadcastPage() {
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [history, setHistory] = useState<BroadcastLogItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch preview count when filter changes
  useEffect(() => {
    setPreviewLoading(true);
    fetch(`/api/admin/broadcast/preview?filter=${filter}`)
      .then((r) => r.json())
      .then((data) => setPreviewCount(data.count))
      .catch(() => setPreviewCount(null))
      .finally(() => setPreviewLoading(false));
  }, [filter]);

  // Fetch broadcast history
  useEffect(() => {
    fetch("/api/admin/broadcast/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.logs || []))
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, []);

  async function handleSendBroadcast() {
    setConfirmOpen(false);
    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, filter }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim broadcast");
        return;
      }
      toast.success(`Broadcast sedang dikirim ke ${data.totalRecipients} user (delay 75 detik/pesan)`);
      setMessage("");
      // Refresh history
      const histRes = await fetch("/api/admin/broadcast/history");
      const histData = await histRes.json();
      setHistory(histData.logs || []);
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    } finally {
      setSending(false);
    }
  }

  const filterLabel = FILTER_OPTIONS.find((f) => f.value === filter)?.label || filter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Broadcast Message</h1>
        <p className="text-muted-foreground">Kirim pesan WhatsApp ke banyak user sekaligus</p>
      </div>

      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Tulis Pesan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-1.5 block">Target User</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm pb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              {previewLoading ? (
                <span className="text-muted-foreground">Loading...</span>
              ) : (
                <span className="font-medium">{previewCount ?? 0} user</span>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Pesan</label>
            <Textarea
              placeholder="Tulis pesan broadcast... (support *bold* _italic_ ~strikethrough~)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} karakter · WhatsApp formatting: *bold* _italic_ ~coret~
            </p>
          </div>

          {/* Send Button */}
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!message.trim() || previewCount === 0 || sending}
            className="w-full sm:w-auto"
          >
            {sending ? (
              <>Mengirim...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Kirim Broadcast ke {previewCount ?? 0} user
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              Pesan akan dikirim ke <strong>{previewCount}</strong> user ({filterLabel})
              dengan delay 75 detik per pesan. Estimasi waktu:{" "}
              <strong>~{Math.ceil(((previewCount || 0) * 75) / 60)} menit</strong>.
              <br /><br />
              Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendBroadcast}>
              Ya, Kirim Broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Riwayat Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
              <TableRow>
                <TableHead>Pesan</TableHead>
                <TableHead>Filter</TableHead>
                <TableHead className="text-right">Terkirim</TableHead>
                <TableHead className="text-right">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm">{log.message}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {FILTER_OPTIONS.find((f) => f.value === log.filter)?.label || log.filter}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{log.total_sent}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && !historyLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada broadcast
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
