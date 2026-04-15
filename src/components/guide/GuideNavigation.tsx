"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownUp,
  Receipt,
  BarChart3,
  Target,
  Handshake,
  Users,
  Undo2,
  Sparkles,
  Camera,
  Wallet,
  Hash,
  List,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: "FREE" | "PREMIUM" | "NEW";
  color: string;
}

const navItems: NavItem[] = [
  {
    id: "catat",
    label: "Catat Transaksi",
    icon: ArrowDownUp,
    badge: "FREE",
    color: "text-ai-cyan",
  },
  {
    id: "multi",
    label: "Multi-Transaksi",
    icon: Receipt,
    badge: "FREE",
    color: "text-ai-purple",
  },
  {
    id: "laporan",
    label: "Laporan Keuangan",
    icon: BarChart3,
    badge: "FREE",
    color: "text-ai-cyan",
  },
  {
    id: "budget",
    label: "Budget / Anggaran",
    icon: Target,
    badge: "FREE",
    color: "text-ai-purple",
  },
  {
    id: "hutang",
    label: "Hutang & Piutang",
    icon: Handshake,
    badge: "FREE",
    color: "text-ai-pink",
  },
  {
    id: "patungan",
    label: "Split Bill",
    icon: Users,
    badge: "FREE",
    color: "text-orange-500",
  },
  {
    id: "undo",
    label: "Undo / Hapus",
    icon: Undo2,
    badge: "FREE",
    color: "text-ai-cyan",
  },
  {
    id: "ai",
    label: "AI Smart Parser",
    icon: Sparkles,
    badge: "PREMIUM",
    color: "text-ai-purple",
  },
  {
    id: "struk",
    label: "Scan Struk",
    icon: Camera,
    badge: "PREMIUM",
    color: "text-ai-pink",
  },
  {
    id: "kantong",
    label: "Kantong Keuangan",
    icon: Wallet,
    badge: "PREMIUM",
    color: "text-amber-500",
  },
  {
    id: "shared",
    label: "Shared Wallet",
    icon: Users,
    badge: "PREMIUM",
    color: "text-blue-500",
  },
  {
    id: "jumlah",
    label: "Format Jumlah",
    icon: Hash,
    badge: "FREE",
    color: "text-ai-cyan",
  },
  {
    id: "grup-whatsapp",
    label: "GoTEK di Grup",
    icon: Users,
    badge: "NEW",
    color: "text-ai-purple",
  },
];

function BadgePill({ badge }: { badge: NavItem["badge"] }) {
  if (!badge) return null;
  const cls =
    badge === "PREMIUM"
      ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30"
      : badge === "NEW"
        ? "bg-ai-purple/15 text-ai-purple border-ai-purple/30"
        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border leading-none ${cls}`}
    >
      {badge}
    </span>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-ai-cyan to-ai-purple rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </div>
  );
}

export function GuideNavigation() {
  const [activeId, setActiveId] = React.useState<string>("");
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  // Calculate progress: how far down the page the user has scrolled
  const progress = React.useMemo(() => {
    const idx = navItems.findIndex((item) => item.id === activeId);
    if (idx < 0) return 0;
    return Math.round(((idx + 1) / navItems.length) * 100);
  }, [activeId]);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver to track visible sections
  React.useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      }
    }, observerOptions);

    // Observe all section anchors
    const timeoutId = setTimeout(() => {
      navItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setSheetOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const NavList = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="space-y-0.5">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              scrollTo(item.id);
              onItemClick?.();
            }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm
              transition-all duration-200 group relative
              ${
                isActive
                  ? "bg-ai-cyan/10 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="active-nav-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-ai-cyan to-ai-purple"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            <span
              className={`text-xs font-mono w-5 text-center shrink-0 ${isActive ? "text-ai-cyan" : "text-muted-foreground/50"}`}
            >
              {idx + 1}
            </span>
            <Icon
              className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? item.color : ""}`}
            />
            <span className="truncate flex-1">{item.label}</span>
            <BadgePill badge={item.badge} />
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ──────── Desktop Sidebar (xl+) ──────── */}
      <aside className="hidden xl:block sticky top-24 self-start w-64 shrink-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-xl p-4 space-y-4"
        >
          <div>
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
              <List className="h-4 w-4 text-ai-cyan" />
              Daftar Panduan
            </h3>
            <ProgressBar progress={progress} />
            <p className="text-[10px] text-muted-foreground mt-1">
              {progress}% dibaca
            </p>
          </div>

          <NavList />
        </motion.div>
      </aside>

      {/* ──────── Mobile FAB + Sheet (below xl) ──────── */}
      <div className="xl:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Back to Top button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={scrollToTop}
              className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-lg border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Kembali ke atas"
            >
              <ChevronUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-ai-cyan to-ai-purple shadow-2xl shadow-ai-cyan/25 flex items-center justify-center text-white"
              aria-label="Buka daftar panduan"
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-ai-cyan to-ai-purple animate-ping opacity-20" />
              <List className="h-6 w-6 relative z-10" />
              {/* Progress ring (SVG) */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="26"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="28"
                  cy="28"
                  r="26"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 26}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 26 - (progress / 100) * 2 * Math.PI * 26,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </svg>
            </motion.button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl max-h-[75vh] pb-8"
          >
            <SheetHeader className="pb-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <List className="h-4 w-4 text-ai-cyan" />
                Daftar Panduan
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-3">
                  <ProgressBar progress={progress} />
                  <span className="text-xs shrink-0">{progress}%</span>
                </div>
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto px-4 pb-2 -mx-0 mt-2">
              <NavList onItemClick={() => setSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
