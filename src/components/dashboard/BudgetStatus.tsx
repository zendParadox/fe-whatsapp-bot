import { Progress } from "@/components/ui/progress";

export function BudgetStatus({
  item,
  formatter,
}: {
  item: { category: string; budget: number; actual: number };
  formatter: (value: number) => string;
}) {
  const percentage = (item.actual / item.budget) * 100;
  const isOverBudget = percentage > 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{item.category}</span>
        <span
          className={`font-mono ${
            isOverBudget ? "text-red-500" : "text-muted-foreground"
          }`}
        >
          {formatter(item.actual)} / {formatter(item.budget)}
        </span>
      </div>
      <Progress
        value={Math.min(percentage, 100)}
        className={isOverBudget ? "[&>div]:bg-red-500" : ""}
      />
    </div>
  );
}
