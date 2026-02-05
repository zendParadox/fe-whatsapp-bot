"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface AiAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: string | null;
  monthName: string;
  year: number;
  isLoading: boolean;
  error: string | null;
}

export default function AiAnalysisModal({
  open,
  onOpenChange,
  analysis,
  monthName,
  year,
  isLoading,
  error,
}: AiAnalysisModalProps) {
  // Simple markdown-like rendering for basic formatting
  const renderContent = (content: string) => {
    // Split by lines and process
    const lines = content.split("\n");

    return lines.map((line, index) => {
      // Headers
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
            {line.replace("## ", "")}
          </h2>
        );
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <li key={index} className="ml-4 mb-1">
            {line.replace(/^[-•] /, "")}
          </li>
        );
      }

      // Numbered lists
      if (/^\d+\. /.test(line)) {
        return (
          <li key={index} className="ml-4 mb-1 list-decimal">
            {line.replace(/^\d+\. /, "")}
          </li>
        );
      }

      // Bold text
      if (line.includes("**")) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={index} className="mb-2">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      }

      // Empty lines
      if (line.trim() === "") {
        return <br key={index} />;
      }

      // Regular paragraphs
      return (
        <p key={index} className="mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Analisis AI - {monthName} {year}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
                <div className="animate-spin">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-300">
                    Menganalisis data keuangan...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AI sedang memproses transaksi bulan {monthName}
                  </p>
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-600 dark:text-red-400 font-medium">
                Gagal memuat analisis
              </p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          )}

          {!isLoading && !error && analysis && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {renderContent(analysis)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
