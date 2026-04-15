import * as React from "react"
import { cn } from "@/lib/utils"

interface ExampleBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  user?: boolean
}

export function ExampleBubble({ children, user, className, ...props }: ExampleBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        user ? "justify-end text-right" : "justify-start text-left",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all",
          user
            ? "rounded-tr-none bg-ai-cyan/10 text-ai-cyan font-medium border border-ai-cyan/20"
            : "rounded-tl-none bg-muted/60 text-foreground border border-border"
        )}
      >
        {/* Support for multiline text or React Nodes */}
        <div className="whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  )
}
