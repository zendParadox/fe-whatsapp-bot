# 🤖 GoTEK - Financial Tracker with WhatsApp Bot

<p align="center">
  <img src="https://img.shields.io/badge/version-1.5.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Next.js-15.5.9-black.svg" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748.svg" alt="Prisma">
</p>

Aplikasi pencatat keuangan pribadi berbasis web dengan integrasi **WhatsApp Bot** untuk mencatat transaksi via chat. Dilengkapi AI Parser (Gemini) untuk memahami pesan natural language.

## ✨ Fitur Utama

### 📊 Dashboard

- Ringkasan pemasukan & pengeluaran
- Grafik keuangan interaktif
- Widget budget tracker
- **Hutang & Piutang Tracker** (BARU!)

### 📱 WhatsApp Bot

Catat keuangan langsung dari WhatsApp:

```
keluar 50k kopi @minuman
masuk 1.5jt gaji @kerja
hutang 100k @Budi modal
cek budget
laporan bulan
```

### 🎯 Budget Management

- Set budget per kategori
- Alert ketika budget hampir habis
- Visual progress bar

### 📒 Hutang & Piutang

- Catat hutang (Anda pinjam) dan piutang (orang pinjam)
- Tandai lunas dengan mudah
- Summary net balance

### 👥 Kantong Grup & Patungan (Split Bill)

- Undang bot ke grup WA komunitas, keluarga, atau teman kos
- Catat pengeluaran bersama dengan mudah (contoh: `patungan 200k @Andi @Budi @gotek`)
- **Anti-Spam (Silent Mode)**: Bot 100% diam dan hanya merespons jika di-tag secara eksplisit (`@gotek`, `@bot`, atau `@asisten`)

### 🤖 AI Parser (Gemini)

Bot memahami pesan natural language:

```
"hari ini makan siang 35rb, bensin 50rb, pulsa 25rb"
```

Otomatis diparse menjadi 3 transaksi!

### 🔐 Authentication

- Register & Login dengan JWT
- Forgot Password via WhatsApp
- Middleware protection

## 🛠️ Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | Next.js 15, React 19, TypeScript |
| Styling  | Tailwind CSS, Shadcn/UI          |
| Backend  | Next.js API Routes               |
| Database | PostgreSQL (Supabase)            |
| ORM      | Prisma                           |
| Auth     | JWT, bcrypt                      |
| AI       | Google Gemini API                |
| Bot      | Golang + WhatsApp Web API        |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, register, forgot-password
│   │   ├── transactions/   # CRUD transaksi
│   │   ├── budgets/        # Budget management
│   │   ├── debts/          # Hutang & piutang
│   │   ├── whatsapp-webhook/  # Webhook dari bot
│   │   └── ai-analysis/    # AI financial analysis
│   ├── dashboard/          # Main dashboard
│   ├── profile/            # User profile
│   └── login/, register/   # Auth pages
├── components/
│   ├── ui/                 # Shadcn components
│   └── dashboard/          # Dashboard widgets
└── lib/
    ├── auth.ts             # Auth utilities
    ├── gemini.ts           # Gemini AI parser
    └── whatsapp/           # Bot utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Google Gemini API key
- Golang WhatsApp Bot (optional)

### Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/your-username/fe-whatsapp-bot.git
   cd fe-whatsapp-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment**

   ```bash
   cp .env.example .env
   ```

   Fill in your `.env`:

   ```env
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-secret-key"
   GEMINI_API_KEY="your-gemini-api-key"
   GOLANG_BOT_URL="https://your-bot-url.com"
   ```

4. **Setup database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 📱 WhatsApp Bot Commands

| Command          | Description     | Example                            |
| ---------------- | --------------- | ---------------------------------- |
| `masuk/keluar`   | Catat transaksi | `keluar 50k kopi @minuman`         |
| `hutang/piutang` | Catat hutang    | `hutang 100k @Budi modal`          |
| `cek hutang`     | Lihat daftar    | `cek hutang`                       |
| `lunas`          | Tandai lunas    | `lunas @Budi`                      |
| `budget`         | Set budget      | `budget 1jt @makan`                |
| `cek budget`     | Lihat status    | `cek budget`                       |
| `patungan`       | Split bill grup | `patungan 200k @Andi @Budi @gotek` |
| `laporan hari`   | Laporan harian  | `laporan hari`                     |
| `laporan bulan`  | Laporan bulanan | `laporan bulan`                    |
| `undo`           | Hapus terakhir  | `undo`                             |
| `help`           | Panduan         | `help`                             |

## 🌐 Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import di [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy!

### Database (Supabase)

1. Create project di [Supabase](https://supabase.com)
2. Copy connection string ke `DATABASE_URL`

## 📄 API Endpoints

| Method   | Endpoint                    | Description       |
| -------- | --------------------------- | ----------------- |
| POST     | `/api/auth/login`           | User login        |
| POST     | `/api/auth/register`        | User register     |
| POST     | `/api/auth/forgot-password` | Request reset     |
| POST     | `/api/auth/reset-password`  | Reset password    |
| GET/POST | `/api/transactions`         | CRUD transactions |
| GET/POST | `/api/budgets`              | CRUD budgets      |
| GET/POST | `/api/debts`                | CRUD debts        |
| POST     | `/api/whatsapp-webhook`     | Bot webhook       |

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 📝 License

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/zendParadox">zendParadox</a>
</p>
