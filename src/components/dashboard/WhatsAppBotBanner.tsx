"use client";

import { useState, useEffect } from "react";
import { X, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const BOT_PHONE_NUMBER = "6285161007446";
const WA_LINK = `https://wa.me/${BOT_PHONE_NUMBER}?text=Halo%20GoTEK%20Bot!`;
const STORAGE_KEY = "gotek_hide_whatsapp_banner";

export default function WhatsAppBotBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check localStorage if user dismissed the banner permanently
    const hidden = localStorage.getItem(STORAGE_KEY);
    if (hidden !== "true") {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-[2px] shadow-lg shadow-green-500/20">
      {/* Inner container with glass effect */}
      <div className="relative rounded-[14px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 sm:p-6">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group"
          aria-label="Tutup banner"
        >
          <X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
        </button>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* WhatsApp Icon */}
          <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
              🎉 Selamat! Akun Anda Sudah Aktif
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-3">
              Mulai catat keuangan Anda dengan mengirim pesan ke WhatsApp Bot kami. 
              Cukup ketik seperti <span className="font-medium text-emerald-600 dark:text-emerald-400">&quot;beli kopi 25rb&quot;</span> dan bot akan mencatatnya untuk Anda!
            </p>
            
            {/* Phone number display */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-slate-500 dark:text-slate-400">Nomor Bot:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                +62 851-6100-7446
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Button
                asChild
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 group"
              >
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat WhatsApp Bot
                  <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              </Button>

              {/* Don't show again checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dont-show-again"
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  className="border-slate-300 dark:border-slate-600"
                />
                <Label
                  htmlFor="dont-show-again"
                  className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                >
                  Jangan tampilkan lagi
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
