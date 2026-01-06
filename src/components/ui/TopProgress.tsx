"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopProgress({
  colorClass = "bg-indigo-600",
  height = "h-1",
}: {
  colorClass?: string; 
  height?: string; 
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const advanceRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (advanceRef.current) {
      window.clearInterval(advanceRef.current);
      advanceRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setVisible(true);
    setPct(6); 
    let current = 6;
    advanceRef.current = window.setInterval(() => {
      const maxTarget = 82 + Math.random() * 8; 
      const remaining = maxTarget - current;
      const step = Math.max(0.2, Math.random() * Math.min(8, remaining / 3));
      current = Math.min(maxTarget, current + step);
      setPct(current);
      if (current >= maxTarget && advanceRef.current) {
        window.clearInterval(advanceRef.current);
        advanceRef.current = null;
      }
    }, 300);
  }, [clearTimers]);

  const done = useCallback(() => {
    clearTimers();
    setPct(100);
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setPct(0);
      timeoutRef.current = null;
    }, 300); 
  }, [clearTimers]);

  useEffect(() => {

    start();
    
    const t = window.setTimeout(() => done(), 700);
    return () => {
      window.clearTimeout(t);
      clearTimers();
    };
  }, [pathname, start, done, clearTimers]);

  useEffect(() => {
    function handler(e: Event) {
      const custom = e as CustomEvent;
      const action = custom?.detail?.action;
      if (action === "start") start();
      else if (action === "done" || action === "complete" || action === "stop")
        done();
      else if (action === "set" && typeof custom.detail.value === "number") {
        
        const v = Math.max(0, Math.min(100, custom.detail.value));
        setPct(v);
        if (v >= 100) {
          done();
        } else {
          setVisible(true);
        }
      }
    }

    window.addEventListener("top-progress", handler as EventListener);
    return () =>
      window.removeEventListener("top-progress", handler as EventListener);
  }, [start, done]);

  const barStyle: React.CSSProperties = {
    width: `${pct}%`,
    transition: "width 300ms ease",
  };

  return (
    <>
      <div
        aria-hidden={!visible}
        className={`fixed top-0 left-0 right-0 z-50 pointer-events-none ${height}`}
        style={{ display: visible ? "block" : "none" }}>
        <div
          className={`h-full ${colorClass} dark:bg-opacity-100`}
          style={barStyle}
        />
      </div>

      <style jsx>{`
        /* ensure smoothness on mobile */
        @media (prefers-reduced-motion: no-preference) {
          .top-progress-smooth {
            transition: width 300ms linear;
          }
        }
      `}</style>
    </>
  );
}
