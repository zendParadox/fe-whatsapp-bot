import { prisma } from "@/lib/prisma";
import { formatMoneyBot } from "@/lib/phone";

export async function checkBudgetStatus(userId: string, categoryId: string, amount: number, currency: string = "IDR") {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budget = await prisma.budget.findUnique({
    where: {
      user_id_category_id_month_year: {
        user_id: userId,
        category_id: categoryId,
        month: currentMonth,
        year: currentYear,
      },
    },
  });

  if (!budget) return null;

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0);

  const aggregates = await prisma.transaction.aggregate({
    where: {
      user_id: userId,
      category_id: categoryId,
      type: "EXPENSE",
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalExpense = (aggregates._sum.amount?.toNumber() || 0) + amount; 
  const budgetAmount = budget.amount.toNumber();

  if (totalExpense > budgetAmount) {
    const over = totalExpense - budgetAmount;
    return `\n\n⚠️ *PERINGATAN:* Budget kategori ini telah terlampaui sebesar ${formatMoneyBot(over, currency)}!`;
  } else if (totalExpense > budgetAmount * 0.8) {
    const remaining = budgetAmount - totalExpense;
    return `\n\n📝 *Info:* Budget hampir habis. Sisa: ${formatMoneyBot(remaining, currency)}`;
  }

  return null;
}
