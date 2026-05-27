<div align="center">

# 🔥 RoastMySite AI

**AI-powered website roaster that brutally (and helpfully) audits your site's design, SEO, accessibility, performance, and more — with personality!**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&style=flat-square)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&style=flat-square)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)

[🚀 Quick Start](#-quick-start) · [✨ Features](#-features) · [🛠️ Tech Stack](#-tech-stack) · [⚙️ Configuration](#-configuration) · [📁 Structure](#-project-structure) · [🤝 Contributing](#-contributing)

</div>

---

## 🎯 What is RoastMySite AI?

Ever launched a website and wondered *"Is this actually good?"* — RoastMySite AI gives you the honest answer. It doesn't just analyze your website, it **roasts** it with witty, savage commentary while providing genuinely useful, actionable feedback across 7 critical categories.

Choose between **Professional Mode** for constructive, objective analysis or **Savage Mode** for brutally funny roasts with pop-culture references and witty metaphors. Either way, you'll walk away knowing exactly what to fix.

---

## ✨ Features

### 🎯 7-Category Deep Audit
Every analysis covers 7 critical website categories with individual 0-100 scores and an overall aggregated score:

| Category | What We Check |
|----------|---------------|
| 🎨 **UI/UX** | Navigation, layout consistency, visual hierarchy, user flow |
| 🔍 **SEO** | Meta tags, headings, structured data, keyword optimization |
| ♿ **Accessibility** | ARIA labels, contrast ratios, keyboard navigation, alt text |
| ⚡ **Performance** | Load times, bundle size, lazy loading, caching strategy |
| 📱 **Mobile** | Responsive design, touch targets, viewport config, mobile UX |
| 🖌️ **Design** | Color palette, typography, spacing, visual consistency |
| 💰 **Conversion** | CTA placement, trust signals, user journey, friction points |

### 🔥 Dual Roast Modes
- **Professional Mode** — Objective, constructive analysis with clear recommendations and prioritized action items
- **Savage Mode** — Brutally funny roasts with witty metaphors, pop culture references, and sarcastic commentary *(still includes real recommendations!)*

### 🔍 Tech Stack Analyzer
- **250+ Detection Rules** — Regex pattern matching + AI hybrid detection
- **Quick Scan** — Fast regex-only analysis (instant results)
- **Deep Scan** — Thorough AI-enhanced analysis with insights
- **21 Categories** — Frontend frameworks, backend languages, CSS frameworks, CMS, analytics, hosting, CDNs, and more
- **AI Insights** — Security warnings, performance recommendations, and technology suggestions
- **Export** — PDF, JSON, CSV, Markdown formats

### 🛡️ Security Scanner
- **OWASP Top 10** based vulnerability scanning
- **Severity Ratings** — Critical, High, Medium, Low with color-coded indicators
- **Remediation** — Actionable fix suggestions with code examples where applicable

### 📊 Competitor Comparison
- Compare up to **5 websites** side by side
- Score breakdown across all categories
- Visual comparison charts

### 💳 Payment & Plans
- **Razorpay** integration — Secure payment gateway with subscription management
- **4 Plans** — Free, Starter, Pro, Enterprise with plan-based feature gating
- **Indian GST** support — 18% GST with invoice generation
- **Coupon System** — Percentage or fixed discount coupons with usage limits

### 🔐 Authentication & Security
- **NextAuth.js v4** — Secure session management
- **Firebase Google OAuth** — One-click sign-in
- **API Key Management** — Generate, revoke, and manage API keys (Pro+)
- **Role-Based Access** — User, Admin roles with feature gating

---

## 🏗️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | [Next.js 16](https://nextjs.org/) | React framework with App Router & Turbopack |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Type-safe development |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Utility-first CSS + accessible components |
| **Database** | [Prisma ORM](https://www.prisma.io/) + SQLite | Type-safe database queries |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) + [Firebase](https://firebase.google.com/) | OAuth authentication |
| **Payments** | [Razorpay](https://razorpay.com/) | Payment gateway & subscriptions |
| **AI/LLM** | [NVIDIA NIM API](https://build.nvidia.com/) | OpenAI-compatible LLM (swap to any provider) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight client state management |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | Smooth page transitions & interactions |
| **Icons** | [Lucide React](https://lucide.dev/) | Beautiful open-source icons |

> **💡 LLM Flexibility:** The AI engine uses an OpenAI-compatible client, so you can swap NVIDIA NIM for **OpenAI**, **Groq**, **Together AI**, **Ollama**, or any OpenAI-compatible API by just changing 3 environment variables.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** or **Bun** runtime
- **npm**, **yarn**, or **bun** package manager
- An **LLM API key** (NVIDIA NIM, OpenAI, Groq, etc.)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/jadavarpit04-creator/RoastedAi.git
cd RoastedAi

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp .env .env.local
# Edit .env.local and add your API keys (see Configuration section)

# 4. Create database directory and push schema
mkdir -p database
bun run db:push

# 5. Start development server
bun run dev
```

Open **http://localhost:3000** in your browser. That's it! 🎉

---

## ⚙️ Configuration

### Environment Variables

The `.env` file in the repo is a template with empty values. Copy it to `.env.local` and fill in your keys:

```env
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Database (required)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_URL=file:../database/custom.db

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  LLM Configuration (required)
#  Works with any OpenAI-compatible API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LLM_API_KEY=your_llm_api_key
LLM_BASE_URL=https://integrate.api.nvidia.com/v1
LLM_MODEL=meta/llama-3.3-70b-instruct

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Razorpay Payment Gateway (optional)
#  Leave empty to disable payments
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  NextAuth (required for auth)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  Firebase - Google OAuth (optional)
#  Required only for Google sign-in
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### LLM Provider Examples

| Provider | `LLM_BASE_URL` | `LLM_MODEL` | Get API Key |
|----------|----------------|-------------|-------------|
| **NVIDIA NIM** | `https://integrate.api.nvidia.com/v1` | `meta/llama-3.3-70b-instruct` | [build.nvidia.com](https://build.nvidia.com/) |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o` | [platform.openai.com](https://platform.openai.com/) |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | [console.groq.com](https://console.groq.com/) |
| **Together AI** | `https://api.together.xyz/v1` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` | [together.ai](https://together.ai/) |
| **Ollama (local)** | `http://localhost:11434/v1` | `llama3.3` | No key needed |

---

## 📋 Plans & Pricing

| Feature | Free | Starter | Pro | Enterprise |
|---------|:----:|:-------:|:---:|:----------:|
| **Analyses/Day** | 3 | 10 | Unlimited | Unlimited |
| **7-Category Audit** | ✅ | ✅ | ✅ | ✅ |
| **Savage Mode** | ✅ | ✅ | ✅ | ✅ |
| **PDF Export** | ✅ | ✅ | ✅ | ✅ |
| **Competitor Comparison** | ✅ | ✅ | ✅ | ✅ |
| **Security Scanner** | ❌ | ❌ | ✅ | ✅ |
| **Tech Stack Analysis** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | 100/day | 10K/day |
| **Team Members** | ❌ | ❌ | ❌ | 25 |
| **White-Label Reports** | ❌ | ❌ | ❌ | ✅ |
| **Priority Support** | ❌ | ❌ | ❌ | ✅ |
| **Price (INR)** | Free | ₹499/mo | ₹1,499/mo | ₹4,999/mo |

---

## 📁 Project Structure

```
RoastedAi/
├── prisma/
│   └── schema.prisma           # Database schema (14 models)
├── public/                     # Static assets (logo, favicon, etc.)
├── scripts/
│   ├── dev.sh                  # Dev server with auto-restart
│   ├── build.sh                # Production build script
│   └── start.sh                # Production start script
├── src/
│   ├── app/
│   │   ├── api/                # 32 API route handlers
│   │   │   ├── analyze/        # Website analysis endpoint
│   │   │   ├── tech-analyze/   # Tech stack analyzer
│   │   │   ├── scanner/        # Security scanner
│   │   │   ├── compare/        # Competitor comparison
│   │   │   ├── auth/           # NextAuth routes
│   │   │   ├── payments/       # Razorpay payment flow
│   │   │   ├── subscriptions/  # Subscription management
│   │   │   ├── invoices/       # Invoice generation
│   │   │   ├── coupons/        # Coupon validation
│   │   │   ├── api-keys/       # API key management
│   │   │   ├── teams/          # Team management
│   │   │   ├── white-label/    # White-label config
│   │   │   ├── export/         # PDF export
│   │   │   ├── user/           # User profile & stats
│   │   │   └── admin/          # Admin billing dashboard
│   │   ├── layout.tsx          # Root layout (theme, providers)
│   │   ├── page.tsx            # Main application page
│   │   └── globals.css         # Global styles & Tailwind
│   ├── components/
│   │   ├── ui/                 # 35+ shadcn/ui components
│   │   ├── hero-section.tsx    # Landing page hero with URL input
│   │   ├── results-dashboard.tsx # Analysis results with score rings
│   │   ├── tech-analyzer-panel.tsx # Tech stack analyzer UI
│   │   ├── scanner-dashboard.tsx # Security scanner UI
│   │   ├── navbar.tsx          # Navigation with auth & plan badge
│   │   ├── pricing-section.tsx # Pricing cards with plan comparison
│   │   ├── compare-dialog.tsx  # Multi-site competitor comparison
│   │   ├── billing-dashboard.tsx # Payment & subscription management
│   │   └── ...                 # 20+ more components
│   ├── lib/
│   │   ├── ai-service.ts       # AI analysis engine (prompt + parsing)
│   │   ├── llm-client.ts       # OpenAI-compatible LLM client
│   │   ├── scanner-service.ts  # Security scanner engine
│   │   ├── scanner-types.ts    # Scanner type definitions
│   │   ├── tech-detection-rules.ts # 250+ regex detection rules
│   │   ├── plan-config.ts      # Plan features, limits & pricing
│   │   ├── auth.ts             # NextAuth configuration
│   │   ├── firebase.ts         # Firebase admin SDK
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── types.ts            # Shared TypeScript types
│   │   └── utils.ts            # Utility functions
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-analysis-store.ts # Zustand analysis state
│   │   ├── use-plan-features.ts # Plan feature gating hook
│   │   └── use-mobile.ts       # Mobile detection hook
│   └── types/
│       └── next-auth.d.ts      # NextAuth type extensions
├── .env                        # Environment template (tracked)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on **port 3000** with Turbopack |
| `bun run build` | Create optimized production build |
| `bun run lint` | Run ESLint to check code quality |
| `bun run db:push` | Push Prisma schema changes to database |
| `bun run db:generate` | Regenerate Prisma client from schema |
| `bun run db:migrate` | Create and apply database migrations |
| `bun run db:reset` | Reset database (⚠️ deletes all data) |

---

## 🌐 API Endpoints

### Core Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze a website (7-category audit) |
| `POST` | `/api/tech-analyze` | Detect tech stack (quick/deep scan) |
| `POST` | `/api/scanner` | Run security vulnerability scan |
| `POST` | `/api/compare` | Compare multiple websites side by side |
| `GET` | `/api/export/pdf` | Export analysis as PDF report |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/auth/[...nextauth]` | NextAuth.js handlers |
| `GET` | `/api/auth/google-status` | Check Google OAuth status |

### User & Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get user profile |
| `GET` | `/api/user/stats` | Get usage statistics |
| `GET` | `/api/user/usage` | Get daily usage data |
| `POST` | `/api/payments/create-order` | Create Razorpay payment order |
| `POST` | `/api/payments/verify` | Verify payment |
| `POST` | `/api/payments/refund` | Request refund |
| `GET` | `/api/payments/history` | Get payment history |
| `POST` | `/api/subscriptions` | Manage subscriptions |
| `GET` | `/api/invoices` | Get invoices |

### API Access (Pro+)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/analyze` | API key-based analysis endpoint |
| `GET` | `/api/api-keys` | List API keys |
| `POST` | `/api/api-keys` | Create new API key |
| `DELETE` | `/api/api-keys/[id]` | Revoke API key |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Development Guidelines

- Follow the existing TypeScript coding patterns
- Use shadcn/ui components for UI — don't build from scratch
- Test with `bun run lint` before submitting
- Keep the Prisma schema backward-compatible
- Write descriptive commit messages

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — The React Framework for the Web
- [shadcn/ui](https://ui.shadcn.com/) — Beautifully designed accessible components
- [Prisma](https://www.prisma.io/) — Next-generation Node.js & TypeScript ORM
- [NVIDIA NIM](https://build.nvidia.com/) — Fast AI inference APIs
- [Framer Motion](https://www.framer.com/motion/) — Production-ready motion library
- [Razorpay](https://razorpay.com/) — Payment gateway for India

---

<div align="center">

**Built with 🔥 by [Arpit Jadav](https://github.com/jadavarpit04-creator)**

[⬆ Back to Top](#-roastmysite-ai)

</div>
