import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryObj } from "@/types/dashboard";

interface TransactionForm {
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  categoryId: string;
  description: string;
  createdAt: string;
  wallet_id: string;
}

interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: TransactionForm;
  handleFormChange: (key: keyof TransactionForm, value: any) => void;
  amountError: string;
  categories: CategoryObj[];
  categoriesLoading: boolean;
  onAddCategoryClick: () => void;
  isSaving: boolean;
  handleSave: () => void;
  planType?: "FREE" | "PREMIUM";
  wallets?: { id: string; name: string }[];
}

export function TransactionDialog({
  isOpen,
  onOpenChange,
  isEditing,
  form,
  handleFormChange,
  amountError,
  categories,
  categoriesLoading,
  onAddCategoryClick,
  isSaving,
  handleSave,
  planType,
  wallets,
}: TransactionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transaksi" : "Tambah Transaksi Manual"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          {/* Category */}
          <div>
            <Label>Category</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1">
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => handleFormChange("categoryId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Memuat..."
                          : form.category || "Pilih kategori"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Memuat kategori...
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map((c) => (
                        <SelectItem key={c.id ?? c.name} value={c.id ?? c.name}>
                          {c.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        Belum ada kategori
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Tombol Tambah kategori */}
              <div className="w-36">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onAddCategoryClick}
                >
                  + Tambah kategori
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Jika kategori belum ada, tambahkan di sini.
            </p>
          </div>

          {/* Type */}
          <div>
            <Label className="mb-1">Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                handleFormChange("type", v as "INCOME" | "EXPENSE")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Pemasukan (INCOME)</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran (EXPENSE)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wallet Selection (Premium Only) */}
          {planType === "PREMIUM" && wallets && wallets.length > 0 && (
            <div>
              <Label className="mb-1">Kantong (Opsional)</Label>
              <Select
                value={form.wallet_id}
                onValueChange={(v) => handleFormChange("wallet_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kantong" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kantong</SelectItem>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Saldo kantong akan otomatis menyesuaikan.
              </p>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label className="mb-1">Amount</Label>
            <Input
              value={form.amount}
              onChange={(e) => handleFormChange("amount", e.target.value)}
              inputMode="numeric"
            />
            {amountError && (
              <p className="mt-1 text-xs text-red-500">{amountError}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1">Deskripsi (opsional)</Label>
            <Input
              value={form.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
            />
          </div>

          {/* Transaction Date */}
          <div>
            <Label className="mb-1">Tanggal Transaksi</Label>
            <Input
              type="date"
              value={form.createdAt}
              onChange={(e) => handleFormChange("createdAt", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !!amountError}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
