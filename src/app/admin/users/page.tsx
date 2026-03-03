/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  whatsapp_jid: string | null;
  plan_type: string;
  created_at: string;
  premium_valid_until: string | null;
  _count: { transactions: number; debts: number };
}

interface UserDetail {
  user: UserRow & { currency: string; avatar_url: string | null; _count: any };
  recentTransactions: any[];
  subscriptions: any[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function fetchUsers(page = 1, searchQuery = search) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.error) {
        console.error("API Error:", data.error);
        setUsers([]);
        return;
      }
      setUsers(data.users || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openUserDetail(userId: string) {
    setDetailLoading(true);
    setDialogOpen(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.error) {
        console.error("API Error:", data.error);
        return;
      }
      setSelectedUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all platform users</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers(1, search)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => fetchUsers(1, search)}>Cari</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Nomor HP</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">Registrasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openUserDetail(user.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{user.name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{user.whatsapp_jid || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          user.plan_type === "PREMIUM"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {user.plan_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{user._count.transactions}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada user ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {pagination.total} users total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8" />
              <Skeleton className="h-48" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama</span>
                  <p className="font-medium">{selectedUser.user.name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email</span>
                  <p className="font-medium">{selectedUser.user.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">WhatsApp</span>
                  <p className="font-medium">{selectedUser.user.whatsapp_jid || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Plan</span>
                  <p className="font-medium">{selectedUser.user.plan_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Transaksi</span>
                  <p className="font-medium">{selectedUser.user._count?.transactions ?? 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Registrasi</span>
                  <p className="font-medium">
                    {format(new Date(selectedUser.user.created_at), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium mb-2">Transaksi Terbaru</h4>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {selectedUser.recentTransactions.slice(0, 10).map((tx: any) => (
                    <div key={tx.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className={tx.type === "INCOME" ? "text-green-600" : "text-red-600"}>
                        {tx.type === "INCOME" ? "+" : "-"}{Number(tx.amount).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {tx.category?.name || "—"} · {format(new Date(tx.created_at), "dd/MM")}
                      </span>
                    </div>
                  ))}
                  {selectedUser.recentTransactions.length === 0 && (
                    <p className="text-muted-foreground text-xs">Belum ada transaksi</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
