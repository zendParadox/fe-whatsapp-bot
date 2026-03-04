/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  rating: number | null;
  created_at: string;
  user: { name: string | null; email: string; whatsapp_jid: string | null };
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function fetchFeedback(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (typeFilter !== "all") params.set("type", typeFilter);
      const res = await fetch(`/api/admin/feedback?${params}`);
      const data = await res.json();
      if (data.error) {
        console.error("API Error:", data.error);
        setFeedbacks([]);
        return;
      }
      setFeedbacks(data.feedbacks || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeedback();
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback Management</h1>
        <p className="text-muted-foreground">View user feedback</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="BUG">Bug</SelectItem>
            <SelectItem value="FEATURE">Feature Request</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[40%]">Message</TableHead>
                  <TableHead className="text-right">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((fb) => (
                  <TableRow key={fb.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{fb.user?.name || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground">
                        {fb.user?.whatsapp_jid || fb.user?.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {fb.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{fb.message}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(fb.created_at), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
                {feedbacks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Belum ada feedback
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{pagination.total} feedback total</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchFeedback(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center text-sm px-2">{pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchFeedback(pagination.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
