"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAnalysisButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export default function AiAnalysisButton({ onClick, isLoading }: AiAnalysisButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse" />
      <Sparkles className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      <span className="relative">
        {isLoading ? "Memuat..." : "Lihat Analisis Bulan Sebelumnya"}
      </span>
    </Button>
  );
}
