"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * TopProgress:
 * - otomatis start ketika pathname berubah
 * - juga mendengarkan window "top-progress" custom events:
 *   window.dispatchEvent(new CustomEvent("top-progress", { detail: { action: "start" } }))
 *   window.dispatchEvent(new CustomEvent("top-progress", { detail: { action: "done" } }))
 *
 * Simple usage:
 * - let component mounted in layout
 * - dispatch events on manual fetches
 */
export default function TopProgress({
  colorClass = "bg-indigo-600",
  height = "h-1",
  showSpinner = false,
}: {
  colorClass?: string; // tailwind class for color, ex: "bg-indigo-600"
  height?: string; // tailwind height class, ex: "h-1"
  showSpinner?: boolean; // not used but reserved
}) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const advanceRef = useRef<number | null>(null);

  // cleanup helper
  function clearTimers() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (advanceRef.current) {
      window.clearInterval(advanceRef.current);
      advanceRef.current = null;
    }
  }

  // start progressing: visible + tween to 70-90% slowly
  function start() {
    clearTimers();
    setVisible(true);
    setPct(6); // immediate small visible
    // advance randomly toward 80-90% but never finish
    let current = 6;
    advanceRef.current = window.setInterval(() => {
      // step reduces as it grows
      const maxTarget = 82 + Math.random() * 8; // 82-90
      const remaining = maxTarget - current;
      const step = Math.max(0.2, Math.random() * Math.min(8, remaining / 3));
      current = Math.min(maxTarget, current + step);
      setPct(current);
      if (current >= maxTarget && advanceRef.current) {
        window.clearInterval(advanceRef.current);
        advanceRef.current = null;
      }
    }, 300);
  }

  // complete: animate to 100% then hide
  function done() {
    clearTimers();
    setPct(100);
    // wait for animation to finish then hide
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      // reset after hidden so next start animates from 0
      setPct(0);
      timeoutRef.current = null;
    }, 300); // match CSS transition duration
  }

  // Listen to pathname change => emulate start then done shortly after navigation finishes
  useEffect(() => {
    // do not start on first mount (only on subsequent path changes)
    // we can detect by using a ref; simpler: always start on pathname change except initial render
    start();
    // auto-done after 600ms — this is optimistic; if your page does heavy data load, you can fire manual events instead
    const t = window.setTimeout(() => done(), 700);
    return () => {
      window.clearTimeout(t);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Listen to global custom events
  useEffect(() => {
    function handler(e: Event) {
      const custom = e as CustomEvent;
      const action = custom?.detail?.action;
      if (action === "start") start();
      else if (action === "done" || action === "complete" || action === "stop")
        done();
      else if (action === "set" && typeof custom.detail.value === "number") {
        // optional: set absolute percent
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
  }, []);

  // Bar style: left negative margin based on pct to create smooth animation
  const barStyle: React.CSSProperties = {
    width: `${pct}%`,
    transition: "width 300ms ease",
  };

  return (
    <>
      {/* container fixed top */}
      <div
        aria-hidden={!visible}
        className={`fixed top-0 left-0 right-0 z-50 pointer-events-none ${height}`}
        style={{ display: visible ? "block" : "none" }}>
        <div
          className={`h-full ${colorClass} dark:bg-opacity-100`}
          style={barStyle}
        />
      </div>

      {/* optional: small progress shadow below for subtle */}
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
