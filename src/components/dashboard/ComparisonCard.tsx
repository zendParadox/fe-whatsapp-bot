import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComparisonCard({
  title,
  currentValue,
  previousValue,
  formatter,
}: {
  title: string;
  currentValue: number;
  previousValue: number;
  formatter: (value: number) => string;
}) {
  const difference = currentValue - previousValue;
  const percentageChange =
    previousValue === 0 ? 100 : (difference / previousValue) * 100;
  const isPositive = difference >= 0;
  const isExpense = title.toLowerCase().includes("pengeluaran");
  const isGood = isExpense ? !isPositive : isPositive;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatter(currentValue)}</div>
        <p className={`text-xs ${isGood ? "text-green-500" : "text-red-500"}`}>
          {percentageChange.toFixed(1)}% vs bulan lalu
        </p>
      </CardContent>
    </Card>
  );
}
