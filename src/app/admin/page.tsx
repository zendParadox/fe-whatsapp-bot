/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Crown, TrendingUp, Activity, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface StatsData {
  overview: {
    totalUsers: number;
    premiumUsers: number;
    freeUsers: number;
    totalTransactions: number;
    totalFeedback: number;
    activeUsers7d: number;
  };
  registrations: { today: number; thisWeek: number; thisMonth: number };
  recentUsers: {
    id: string;
    name: string | null;
    email: string;
    whatsapp_jid: string | null;
    plan_type: string;
    created_at: string;
    _count: { transactions: number };
  }[];
  recentFeedback: {
    id: string;
    type: string;
    message: string;
    created_at: string;
    user: { name: string | null; whatsapp_jid: string | null };
  }[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!data || ("error" in data && data.error)) {
    return <div className="text-red-500 p-6">Failed to load admin data: {(data as any)?.error || "Unknown error"}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview & management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data.overview.totalUsers}
          icon={Users}
          subtitle={`${data.registrations.today} hari ini`}
        />
        <StatCard
          title="Premium Users"
          value={data.overview.premiumUsers}
          icon={Crown}
          subtitle={`${data.overview.freeUsers} free users`}
        />
        <StatCard
          title="Total Transaksi"
          value={data.overview.totalTransactions.toLocaleString()}
          icon={TrendingUp}
        />
        <StatCard
          title="User Aktif (7d)"
          value={data.overview.activeUsers7d}
          icon={Activity}
          subtitle={`${data.registrations.thisMonth} registrasi bulan ini`}
        />
      </div>

      {/* Recent Users & Feedback */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> User Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Transaksi</TableHead>
                  <TableHead className="text-right">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.whatsapp_jid || user.email}
                        </div>
                      </div>
                    </TableCell>
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
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {format(new Date(user.created_at), "dd/MM/yy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Feedback Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentFeedback.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada feedback.</p>
            ) : (
              <div className="space-y-3">
                {data.recentFeedback.slice(0, 8).map((fb) => (
                  <div key={fb.id} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {fb.type}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {fb.user?.name || "Anonymous"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(fb.created_at), "dd/MM/yy")}
                      </span>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{fb.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
