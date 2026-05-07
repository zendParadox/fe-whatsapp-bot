export interface CategoryObj {
  id?: string;
  name?: string;
}

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  category?: string | CategoryObj | null;
  description?: string | null;
  created_at: string;
  wallet_id?: string | null;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface DashboardData {
  currentPeriod: {
    summary: Summary;
    transactions: Transaction[];
    topCategories: { category: string; amount: number }[];
    avgDailyExpense: number;
  };
  previousPeriod: {
    summary: { totalExpense: number };
  };
  trendData: { name: string; Pemasukan: number; Pengeluaran: number }[];
  budgetData: { category: string; budget: number; actual: number }[];
  totalSaldo: number;
  plan_type?: "FREE" | "PREMIUM";
  wallets?: {
    id: string;
    name: string;
    icon: string | null;
    balance: number | string;
    created_at: string;
  }[];
}

export interface UserProfile {
  name: string | null;
  avatar_url: string | null;
  plan_type?: string;
  premium_valid_until?: string | null;
}
