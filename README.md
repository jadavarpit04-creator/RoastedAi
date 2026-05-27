# 🔥 RoastMySite AI

An AI-powered website analysis tool that roasts and audits your website's design, SEO, accessibility, performance, and more — with personality!

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 🎯 Website Analysis
- **7-Category Deep Audit** — UI/UX, SEO, Accessibility, Performance, Mobile, Design, Conversion
- **Professional Mode** — Objective, constructive analysis with actionable recommendations
- **Savage Mode** — Brutally funny roasts with witty metaphors and pop culture references
- **Overall Score** — Aggregated 0-100 score with per-category breakdowns

### 🔍 Tech Stack Analyzer
- **250+ Detection Rules** — Regex + AI hybrid detection for maximum accuracy
- **Quick Scan / Deep Scan** — Fast regex-only or thorough AI-enhanced analysis
- **21 Categories** — Frontend frameworks, backend languages, CSS frameworks, CMS, analytics, hosting, and more
- **AI-Powered Insights** — Security, performance, and recommendation insights
- **Export** — PDF, JSON, CSV, Markdown export support

### 🛡️ Security Scanner
- **OWASP-based vulnerability scanning**
- **Severity ratings** — Critical, High, Medium, Low
- **Actionable remediation suggestions**

### 💳 Payment Integration
- **Razorpay** — Secure payment gateway with subscription management
- **4 Plans** — Free, Starter, Pro, Enterprise
- **Plan-based feature gating** — Daily limits, feature locks, upgrade prompts

### 📊 Additional Features
- **Competitor Comparison** — Compare up to 5 websites side by side
- **PDF Report Export** — Download detailed analysis reports
- **Historical Tracking** — View past analyses and trends
- **API Access** — REST API for programmatic analysis (Pro+)
- **Team Management** — Up to 25 members (Enterprise)
- **White-Label Reports** — Custom branding for agencies (Enterprise)
- **Dark Mode** — Full light/dark theme support
- **Responsive Design** — Mobile-first, works on all devices

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Prisma ORM + SQLite |
| **Authentication** | NextAuth.js v4 + Firebase Google OAuth |
| **Payments** | Razorpay |
| **AI/LLM** | NVIDIA NIM API (OpenAI-compatible) |
| **State Management** | Zustand + TanStack Query |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/jadavarpit04-creator/RoastedAi.git
cd RoastedAi

# Install dependencies
bun install

# Set up environment variables
# .env is the template (already in repo with empty values)
# Copy it to .env.local and fill in your API keys
cp .env .env.local
# Edit .env.local with your API keys

# Push database schema
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env.local` file based on `.env` (template with empty values):

```env
# Database
DATABASE_URL=file:./database/custom.db

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# LLM Configuration (OpenAI-compatible API)
# Supports NVIDIA NIM, OpenAI, Groq, Together AI, etc.
LLM_API_KEY=your_llm_api_key
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=meta/llama-3.3-70b-instruct

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Firebase (Google OAuth)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

---

## 📋 Plans & Pricing

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| **Analyses/Day** | 3 | 10 | Unlimited | Unlimited |
| **Categories** | All 7 | All 7 | All 7 | All 7 |
| **Savage Mode** | ✅ | ✅ | ✅ | ✅ |
| **PDF Export** | ✅ | ✅ | ✅ | ✅ |
| **Competitor Comparison** | ✅ | ✅ | ✅ | ✅ |
| **Security Scanner** | ❌ | ❌ | ✅ | ✅ |
| **Tech Stack Analysis** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | 100/day | 10K/day |
| **Team Members** | ❌ | ❌ | ❌ | 25 |
| **White-Label** | ❌ | ❌ | ❌ | ✅ |
| **Price (INR)** | Free | ₹499/mo | ₹1,499/mo | ₹4,999/mo |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes (analyze, payments, auth, etc.)
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Main application page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── hero-section.tsx  # URL input & analysis trigger
│   ├── results-dashboard.tsx  # Analysis results display
│   ├── navbar.tsx        # Navigation with plan badge
│   ├── tech-analyzer-panel.tsx # Tech stack analyzer
│   └── ...               # Other components
├── lib/
│   ├── ai-service.ts     # AI analysis engine
│   ├── llm-client.ts     # OpenAI-compatible LLM client
│   ├── scanner-service.ts # Security scanner
│   ├── tech-detection-rules.ts # 250+ tech detection patterns
│   ├── plan-config.ts    # Plan features & limits
│   ├── auth.ts           # NextAuth configuration
│   └── db.ts             # Prisma client
├── hooks/                # Custom React hooks
└── prisma/
    └── schema.prisma     # Database schema
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<p align="center">
  Built with 🔥 by <a href="https://github.com/jadavarpit04-creator">Arpit</a>
</p>
