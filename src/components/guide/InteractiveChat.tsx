"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, User, Bot } from "lucide-react";
import Image from "next/image";

interface InteractiveChatProps {
  userMessage: string;
  delay?: number;
}

export function InteractiveChat({
  userMessage,
  delay = 0,
}: InteractiveChatProps) {
  const [showBot, setShowBot] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      const botTimer = setTimeout(() => {
        setIsTyping(false);
        setShowBot(true);
      }, 1500);
      return () => clearTimeout(botTimer);
    }, 1000 + delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="space-y-4 w-full">
      {/* User Message */}
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: delay / 1000 }}
        className="flex justify-end gap-3"
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-ai-cyan/10 border border-ai-cyan/20 px-4 py-2.5 shadow-sm">
          <p className="text-sm font-medium text-ai-cyan leading-relaxed whitespace-pre-wrap">
            {userMessage}
          </p>
        </div>
        <div className="h-8 w-8 rounded-full bg-ai-cyan/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-ai-cyan" />
        </div>
      </motion.div>

      {/* Bot Response */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-full bg-ai-purple/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-ai-purple" />
            </div>
            <div className="bg-muted/50 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
              <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce delay-75" />
              <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce delay-150" />
            </div>
          </motion.div>
        )}

        {showBot && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-full bg-ai-purple/10 flex items-center justify-center flex-shrink-0">
              {/* <Bot className="h-4 w-4 text-ai-purple" /> */}
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                <Image
                  src="/images/gotek.webp"
                  alt="Logo"
                  width={35}
                  height={35}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-muted/80 border border-border px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-foreground">
                  Berhasil Dicatat!
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Transaksi Anda telah berhasil tersimpan ke dalam sistem.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
