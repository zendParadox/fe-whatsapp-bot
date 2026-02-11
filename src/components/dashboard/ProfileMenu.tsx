"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileMenuProps {
  userName?: string | null;
  avatarUrl?: string | null;
  variant?: "full" | "icon";
}

export default function ProfileMenu({
  userName,
  avatarUrl,
  variant = "icon",
}: ProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = () => {
    if (!userName) return "?";
    const names = userName.trim().split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        toast.success("Berhasil logout");
      } else {
        throw new Error("Logout failed");
      }
    } catch {
      toast.error("Gagal logout");
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const handleGoToProfile = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      {variant === "icon" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {getInitials()}
              </span>
            </div>
          )}
        </button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-full overflow-hidden">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {getInitials()}
                </span>
              </div>
            )}
          </div>
          <span className="hidden sm:inline">{userName || "Profile"}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Profile Info */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {userName || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menu Akun
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleGoToProfile}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Pengaturan Profil
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/feedback");
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
            >
              <span className="w-4 h-4 flex items-center justify-center">💬</span>
              Beri Masukan
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? "Logging out..." : "Keluar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
