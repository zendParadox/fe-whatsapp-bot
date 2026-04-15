import * as React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

type TipProps = React.HTMLAttributes<HTMLDivElement>;

export function Tip({ children, className, ...props }: TipProps) {
  return (
    <div
      className={cn(
        "mt-4 flex gap-3 rounded-xl border border-ai-cyan/20 bg-ai-cyan/5 p-4 text-sm leading-relaxed",
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0">
        <Sparkles className="h-5 w-5 text-ai-cyan" />
      </div>
      <div>
        <span className="font-bold text-ai-cyan">TIP:&nbsp;</span>
        <span className="text-muted-foreground">{children}</span>
      </div>
    </div>
  )
}
