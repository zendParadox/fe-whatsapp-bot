// // prisma/seed.ts

// import { PrismaClient, TransactionType } from "@prisma/client";

// const prisma = new PrismaClient();

// // Helper untuk membuat tanggal acak dalam N hari terakhir
// function getRandomDate(daysAgo: number): Date {
//   const today = new Date();
//   const pastDate = new Date(today);
//   pastDate.setDate(today.getDate() - Math.floor(Math.random() * daysAgo));
//   return pastDate;
// }

// async function main() {
//   console.log("🌱 Memulai proses seeding...");

//   // 1. Membersihkan database
//   console.log("🗑️  Membersihkan data lama...");
//   await prisma.transaction.deleteMany({});
//   await prisma.budget.deleteMany({});
//   await prisma.category.deleteMany({});
//   await prisma.user.deleteMany({});
//   console.log("✅ Data lama berhasil dibersihkan.");

//   // 2. Membuat satu user utama
//   console.log("👤 Membuat user...");
//   const user = await prisma.user.create({
//     data: {
//       email: "budi.santoso@email.com",
//       name: "Budi Santoso",
//       password: "hashed_password_abc", // Di aplikasi nyata, ini harus di-hash
//     },
//   });
//   console.log(`✅ User berhasil dibuat dengan ID: ${user.id}`);

//   // 3. Membuat daftar kategori
//   console.log("🏷️  Membuat kategori...");
//   const categoryNames = [
//     // Pemasukan
//     "Gaji",
//     "Bonus",
//     "Investasi",
//     "Hadiah Diterima",
//     // Pengeluaran
//     "Makanan & Minuman",
//     "Transportasi",
//     "Tagihan",
//     "Belanja",
//     "Hiburan",
//     "Kesehatan",
//     "Pendidikan",
//     "Keluarga",
//   ];

//   const createdCategories = await Promise.all(
//     categoryNames.map((name) =>
//       prisma.category.create({
//         data: {
//           name,
//           user_id: user.id,
//         },
//       })
//     )
//   );
//   const categoryMap = new Map(createdCategories.map((c) => [c.name, c.id]));
//   console.log("✅ Kategori berhasil dibuat.");

//   // 4. Membuat data budget untuk 5 bulan terakhir
//   console.log("🎯 Membuat data budget...");
//   const budgetsToCreate = [];
//   const expenseCategoryIds = createdCategories
//     .filter(
//       (c) => !["Gaji", "Bonus", "Investasi", "Hadiah Diterima"].includes(c.name)
//     )
//     .map((c) => c.id);

//   for (let i = 0; i < 5; i++) {
//     // 5 bulan terakhir
//     const date = new Date();
//     date.setMonth(date.getMonth() - i);
//     const month = date.getMonth() + 1;
//     const year = date.getFullYear();

//     for (const categoryId of expenseCategoryIds) {
//       budgetsToCreate.push({
//         amount: Math.floor(Math.random() * 1500000) + 500000, // Budget antara 500rb - 2jt
//         month,
//         year,
//         category_id: categoryId,
//         user_id: user.id,
//       });
//     }
//   }
//   await prisma.budget.createMany({ data: budgetsToCreate });
//   console.log(`✅ ${budgetsToCreate.length} data budget berhasil dibuat.`);

//   // 5. Membuat data transaksi acak (150 transaksi)
//   console.log("🔄 Membuat data transaksi...");
//   const transactionsToCreate = [];
//   const incomeCategoryIds = [
//     categoryMap.get("Gaji")!,
//     categoryMap.get("Bonus")!,
//   ];

//   // Buat 5 transaksi gaji (1 per bulan)
//   for (let i = 0; i < 5; i++) {
//     const date = new Date();
//     date.setMonth(date.getMonth() - i, 1); // Tanggal 1 setiap bulan
//     transactionsToCreate.push({
//       type: TransactionType.INCOME,
//       amount: 5000000 + Math.floor(Math.random() * 1000000), // Gaji 5-6jt
//       description: "Gaji Bulanan",
//       created_at: date,
//       user_id: user.id,
//       category_id: categoryMap.get("Gaji")!,
//     });
//   }

//   // Buat 145 transaksi pengeluaran acak
//   for (let i = 0; i < 145; i++) {
//     transactionsToCreate.push({
//       type: TransactionType.EXPENSE,
//       amount: Math.floor(Math.random() * 300000) + 10000, // Pengeluaran 10rb - 310rb
//       description: `Transaksi acak #${i + 1}`,
//       created_at: getRandomDate(150), // Acak dalam 150 hari terakhir
//       user_id: user.id,
//       category_id:
//         expenseCategoryIds[
//           Math.floor(Math.random() * expenseCategoryIds.length)
//         ],
//     });
//   }
//   await prisma.transaction.createMany({ data: transactionsToCreate });
//   console.log(
//     `✅ ${transactionsToCreate.length} data transaksi berhasil dibuat.`
//   );
// }

// main()
//   .catch((e) => {
//     console.error("❌ Terjadi error saat seeding:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     console.log("🌱 Proses seeding selesai.");
//     await prisma.$disconnect();
//   });
