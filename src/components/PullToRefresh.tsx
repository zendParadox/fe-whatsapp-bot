"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function PullToRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  const [startY, setStartY] = useState(0);
  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const pullThreshold = 100; // Jarak tarik dalam pixel untuk memicu reload

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;

    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;

    if (diff > 0) {
      const damping = 0.5;
      const move = Math.min(diff * damping, pullThreshold + 20);
      setPullDist(move);
    }
  };

  const handleTouchEnd = () => {
    if (pullDist >= pullThreshold) {
      triggerRefresh();
    } else {
      setPullDist(0);
    }
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setPullDist(60);

    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-y-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDist}px)`,
        transition:
          pullDist === 0 || pullDist === 60 ? "transform 0.3s ease" : "none",
      }}
    >
      {/* Indikator Loading */}
      <div
        style={{
          position: "absolute",
          top: -50,
          left: 0,
          right: 0,
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: pullDist / pullThreshold,
        }}
      >
        <div
          className={`w-8 h-8 border-4 border-primary border-t-transparent rounded-full ${isRefreshing ? "animate-spin" : ""}`}
        />
      </div>

      {children}
    </div>
  );
}
