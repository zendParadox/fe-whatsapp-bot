"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function InstallPromptBanner() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to prevent flash
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Check if we're in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      const isStandaloneNavigator =
        (window.navigator as any).standalone === true;
      return isStandaloneMedia || isStandaloneNavigator;
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      return;
    }

    setIsStandalone(false);

    // 2. Check if dismissed within last 7 days
    const dismissedAt = localStorage.getItem("pwaDismissedAt");
    if (dismissedAt) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show if dismissed within 7 days
      }
    }

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 4. Handle Android / Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isIOSDevice) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show banner on iOS if not standalone and not dismissed
    if (isIOSDevice) {
      // Small delay to ensure it doesn't flash immediately on load
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwaDismissedAt", Date.now().toString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-full duration-300 md:hidden">
      <div className="bg-card border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-2xl p-5 pb-8 flex flex-col gap-3 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <Image
              src="/images/gotek-g.png"
              alt="logo"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Install Aplikasi GoTEK</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catat keuangan lebih cepat langsung dari Home Screen Anda.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-muted/50 rounded-lg p-3 text-xs mt-1 border border-border/50">
            <p className="flex items-center gap-2 mb-2">
              <span className="bg-background w-5 h-5 rounded flex items-center justify-center border font-medium">
                1
              </span>
              Ketuk ikon <Share className="w-4 h-4 text-blue-500" /> di menu
              bawah
            </p>
            <p className="flex items-center gap-2">
              <span className="bg-background w-5 h-5 rounded flex items-center justify-center border font-medium">
                2
              </span>
              Pilih <strong>Add to Home Screen</strong>{" "}
              <PlusSquare className="w-4 h-4" />
            </p>
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            className="w-full mt-1 bg-gradient-to-r from-ai-cyan to-ai-purple text-white border-0"
          >
            <Download className="w-4 h-4 mr-2" /> Install Sekarang
          </Button>
        )}
      </div>
    </div>
  );
}
