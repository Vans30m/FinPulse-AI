# FinPulse AI

<div align="center">

### AI-Powered Financial Intelligence Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![Electron](https://img.shields.io/badge/Electron-43.x-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

**FinPulse AI** is a full-stack, real-time financial intelligence platform that combines live market data aggregation, AI-powered market analysis via Google Gemini and Groq, and portfolio management — accessible as a web application and as a cross-platform Electron desktop app.

[Live Demo](https://finpulse-frontend-jrsd.onrender.com) · [Video Walkthrough](docs/finpulse-demo.mp4) · [Report a Bug](https://github.com/Vans30m/FinPulse-AI/issues)

</div>

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [AI / ML Workflows](#ai--ml-workflows)
- [Authentication Flow](#authentication-flow)
- [Environment Configuration](#environment-configuration)
- [Local Development Setup](#local-development-setup)
- [Deployment (Render)](#deployment-render)
- [Desktop App Build (Electron)](#desktop-app-build-electron)
- [Security Architecture](#security-architecture)

---

## System Overview

**Problem Solved:** Retail investors lack a unified, intelligent platform that combines real-time global market data, AI-driven insights, multi-asset portfolio tracking, and financial news — all in one place without expensive Bloomberg/Reuters subscriptions.

**Core Mission:** Democratize institutional-grade financial intelligence for individual investors through an AI-first, multi-source market data platform.

**Target Audience:** Retail investors, day traders, finance students, and quantitative hobbyists tracking global equities, crypto, forex, commodities, and Indian markets (NSE/BSE).

**Architecture Paradigm:** Monorepo (`finpulse-web/`) with a clear client–server separation:
- `frontend/` → React SPA (Vite + TypeScript + Tailwind CSS)
- `backend/` → Express REST API (Node.js + TypeScript + Prisma ORM)
- `electron/` → Electron desktop wrapper that loads the deployed frontend URL

---

## Architecture

```
+----------------------------------------------------------------------+
|                         CLIENT LAYER                                 |
|                                                                      |
|   +-----------------------------+   +-----------------------------+  |
|   |   React SPA (Vite + TSX)    |   |  Electron Desktop App       |  |
|   |   React Router v7           |   |  (Wraps the deployed URL)   |  |
|   |   TanStack Query v5         |   |  finpulse-frontend-jrsd     |  |
|   |   Framer Motion             |   |  .onrender.com              |  |
|   |   Lightweight Charts        |   +-----------------------------+  |
|   |   Recharts                  |                                    |
|   +------------+----------------+                                    |
+----------------+-----------------------------------------------------+
                 |  HTTPS REST (JWT Bearer / X-User-Id)
                 v
+----------------------------------------------------------------------+
|                         API LAYER (Express 5)                        |
|                                                                      |
|  +----------+ +----------+ +----------+ +----------+ +----------+  |
|  |  /auth   | |   /ai    | | /assets  | |/portfolio| |/watchlist|  |
|  +----------+ +----------+ +----------+ +----------+ +----------+  |
|  +----------+ +----------+ +----------+                             |
|  |  /news   | | /search  | | /profile |                             |
|  +----------+ +----------+ +----------+                             |
|                                                                      |
|  Middleware Stack:                                                   |
|  [compression] -> [CORS] -> [globalLimiter] -> [sqlInjectionSanitizer] |
|  -> [authLimiter (auth routes)] -> [protect (JWT middleware)]        |
+---------+------------------------------------------------------------+
          |
    +-----+--------------------------------------------------+
    |                   INTEGRATION LAYER                    |
    |                                                        |
    |  +--------------+  +--------------+  +--------------+  |
    |  | Google Gemini|  |  Groq API    |  | Yahoo Finance|  |
    |  | 2.5 Flash    |  | qwen3.6-27b  |  | (yahoo-fin2) |  |
    |  | (Primary AI) |  | (Fallback AI)|  |              |  |
    |  +--------------+  +--------------+  +--------------+  |
    |  +--------------+  +--------------+  +--------------+  |
    |  |   Finnhub    |  |  Google News |  | Brevo / SMTP |  |
    |  |   (News)     |  |  RSS Feeds   |  |  (OTP Email) |  |
    |  +--------------+  +--------------+  +--------------+  |
    +-------------------------+------------------------------+
                              |
                              v
              +-------------------------------+
              |     DATABASE LAYER (NeonDB)   |
              |    PostgreSQL + Prisma ORM    |
              |    @prisma/adapter-pg         |
              +-------------------------------+
```

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | `^19.2.6` | Core UI framework |
| TypeScript | `~6.0.2` | Static typing |
| Vite | `^8.0.12` | Build tool & dev server |
| React Router DOM | `^7.15.1` | Client-side routing |
| TanStack React Query | `^5.101.0` | Server-state management & caching |
| Framer Motion | `^12.40.0` | Page & component animations |
| Lightweight Charts | `^4.2.1` | TradingView-compatible candlestick/line charts |
| Recharts | `^3.8.1` | Portfolio analytics & comparison charts |
| Tailwind CSS | `^3.4.17` | Utility-first styling |
| `tailwindcss-animate` | `^1.0.7` | CSS animation utilities |
| `tailwind-merge` | `^3.3.0` | Conditional class merging |
| Lucide React | `^0.508.0` | Icon library |
| `@react-oauth/google` | `^0.13.5` | Google OAuth 2.0 client |
| React Hot Toast | `^2.6.0` | Notification system |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | `20.x` | Runtime |
| Express | `^5.2.1` | HTTP framework |
| TypeScript | `^7.0.2` | Static typing |
| `tsx` | `^4.23.11` | TypeScript hot-reload execution for dev |
| `compression` | `^1.8.1` | Gzip response compression |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing |
| `express-rate-limit` | `^8.6.2` | IP-based rate limiting |
| `jsonwebtoken` | `^9.0.3` | JWT access token issuance & verification |
| `bcryptjs` | `^3.0.3` | Password hashing (bcrypt, 10 rounds) |
| `axios` | `^1.19.0` | HTTP client for external API calls |
| `yahoo-finance2` | `^4.0.1` | Yahoo Finance data: quotes, search, summary |
| `rss-parser` | `^3.13.0` | RSS feed parsing for news |
| `cheerio` | `^1.2.0` | HTML scraping/parsing |
| `google-news-rss` | `^0.4.1` | Google News feed utilities |
| `nodemailer` | `^9.0.5` | SMTP email transport (OTP fallback) |
| `node-cache` | `^5.1.2` | In-process key-value caching |
| `dotenv` | `^17.4.2` | Environment variable loading |

### Database & ORM

| Technology | Version | Purpose |
|---|---|---|
| PostgreSQL | hosted on NeonDB | Primary relational database |
| Prisma ORM | `^7.9.1` | Type-safe ORM + migrations |
| `@prisma/adapter-pg` | `^7.9.1` | Postgres connection adapter |
| `pg` | `^8.22.0` | Raw PostgreSQL driver |

### AI / ML

| Service | Model | Role |
|---|---|---|
| Google Gemini API | `gemini-2.5-flash` | **Primary** LLM — market briefs, fear/greed, pick of the day, portfolio advisor, asset analysis |
| Groq API | `qwen/qwen3.6-27b` | **Secondary** LLM fallback when Gemini is unavailable |
| Ollama (optional) | `qwen2.5` (configurable) | **Tertiary** local LLM fallback via OpenAI-compatible endpoint |

### DevOps & Deployment

| Tool | Purpose |
|---|---|
| Render | PaaS for backend (Node web service) + frontend (static site) |
| `render.yaml` | Infrastructure-as-code deployment manifest |
| Electron | `^43.3.0` — Desktop app wrapper |
| `electron-builder` | `^26.15.3` — Windows NSIS installer builder |
| Brevo API | Primary transactional email (OTP, password reset) |
| Resend API | Secondary email fallback |

---

## Directory Structure

```
FinPulse-AI/
+-- docs/
|   +-- finpulse-demo.mp4          # Product demo video
+-- finpulse-web/
    +-- package.json               # Root: Electron scripts & builder config
    +-- electron/
    |   +-- main.js                # Electron BrowserWindow -> loads deployed URL
    |   +-- fp-icon.ico            # Windows app icon (209 KB)
    |
    +-- backend/                   # Express + Prisma API server
    |   +-- prisma/
    |   |   +-- schema.prisma      # Full DB schema (13 models, 7 enums)
    |   +-- prisma.config.ts       # Prisma config (schema + migrations path)
    |   +-- src/
    |   |   +-- index.ts           # Server bootstrap, middleware chain, route mounting
    |   |   +-- prisma.ts          # Singleton Prisma client
    |   |   +-- routes/
    |   |   |   +-- auth.ts        # Registration, OTP, login, PIN, Google OAuth
    |   |   |   +-- ai.ts          # Market brief, global pulse, fear/greed, pick-of-day, advisor
    |   |   |   +-- assets.ts      # Asset details, chart data, AI-enriched fundamentals
    |   |   |   +-- portfolio.ts   # Holdings CRUD, virtual trading, alerts, P&L computation
    |   |   |   +-- watchlists.ts  # Watchlist & item CRUD, live quote enrichment
    |   |   |   +-- news.ts        # Finnhub news, Google News RSS, economic calendar
    |   |   |   +-- search.ts      # Yahoo Finance symbol search with in-memory cache
    |   |   |   +-- profile.ts     # User profile, preferences, sessions, data export
    |   |   +-- utils/
    |   |       +-- auth.ts        # JWT `protect` middleware (Bearer + X-User-Id fallback)
    |   |       +-- security.ts    # Global & auth rate limiters, SQL injection sanitizer
    |   |       +-- aiCache.ts     # In-memory AI response cache (24h TTL, 200-entry LRU cap)
    |   |       +-- chartFallback.ts # Deterministic chart data generator for offline fallback
    |   +-- package.json
    |   +-- tsconfig.json
    |
    +-- frontend/                  # React + Vite SPA
        +-- src/
        |   +-- App.tsx            # Root: routing, auth state, global modals
        |   +-- main.tsx           # Entry: React root, providers
        |   +-- index.css          # Global styles + Tailwind directives
        |   +-- config/
        |   |   +-- api.ts         # API base URL + apiFetch wrapper (30s timeout)
        |   +-- context/
        |   |   +-- ThemeContext    # Dark/light theme state
        |   |   +-- ChartContext    # Global chart modal state
        |   +-- features/
        |   |   +-- auth/
        |   |   |   +-- LoginModal  # Full auth modal: register, OTP, login, PIN set/verify
        |   |   +-- dashboard/
        |   |   |   +-- components/
        |   |   |       +-- AIMarketSentiment.tsx     # AI-powered market sentiment panel
        |   |   |       +-- AIPickOfTheDay.tsx         # AI stock pick with target & stop-loss
        |   |   |       +-- AIBulletSummary.tsx        # LLM-generated market bullet points
        |   |   |       +-- FearGreedIndex.tsx         # AI-computed fear/greed gauge
        |   |   |       +-- GlobalMarketClock.tsx      # Live market open/close status clock
        |   |   |       +-- InvestmentCalculator.tsx   # SIP/lumpsum/compound calculator
        |   |   |       +-- PerformanceComparison.tsx  # Multi-asset performance chart
        |   |   |       +-- MarketFeedStream.tsx       # Live price ticker stream
        |   |   |       +-- MarketScreeners.tsx        # Top gainers/losers/active screener
        |   |   |       +-- Watchlist.tsx              # Full watchlist manager UI
        |   |   |       +-- MarketExplanation.tsx      # Contextual market term explainer
        |   |   |       +-- MarketCompass.tsx          # Directional sentiment compass
        |   |   +-- portfolio/
        |   |       +-- components/
        |   |           +-- PortfolioDashboard.tsx     # Real + virtual portfolio tracker
        |   +-- pages/
        |   |   +-- AssetDetails.tsx   # Full asset page: chart, fundamentals, AI analysis, news
        |   |   +-- StockScreener.tsx  # Advanced stock screener with filters
        |   |   +-- Profile.tsx        # User profile, settings, sessions, data export
        |   |   +-- News.tsx           # Financial news feed
        |   |   +-- Pulse.tsx          # Landing dashboard page
        |   +-- profile/
        |   |   +-- pages/Preferences.tsx  # Investment preferences & risk profile
        |   |   +-- services/profileService # Profile API client
        |   +-- components/
        |   |   +-- layout/            # Header, Footer
        |   |   +-- charts/            # AssetChartModal (Lightweight Charts)
        |   |   +-- asset/             # Asset card subcomponents
        |   |   +-- profile/           # Profile subcomponents
        |   |   +-- ui/                # Reusable UI primitives
        |   +-- hooks/                 # Custom React hooks
        |   +-- services/              # API service layers
        |   +-- types/                 # Shared TypeScript type definitions
        |   +-- constants/             # App-wide constants
        |   +-- utils/                 # Helper utilities
        +-- package.json
        +-- vite.config.ts
        +-- tailwind.config.ts
        +-- tsconfig.app.json

+-- render.yaml                        # Render IaC: backend + frontend services
+-- LICENSE                            # MIT License
+-- README.md                          # This file
```

---

## Database Schema

The database is a **PostgreSQL** instance hosted on **NeonDB**, managed via **Prisma ORM v7**.

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `USER`, `ADMIN` |
| `AuthProvider` | `LOCAL`, `GOOGLE` |
| `UserStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` |
| `PortfolioVisibility` | `PRIVATE`, `PUBLIC`, `SHARED` |
| `AlertType` | `PRICE`, `VOLUME`, `PERCENT_CHANGE` |
| `AlertStatus` | `ACTIVE`, `TRIGGERED`, `MUTED`, `ARCHIVED` |
| `AIModel` | `GEMINI`, `GPT4`, `CLAUDE` |

### Core Models

#### `User`
Central entity. Stores auth credentials, investor profile, and links to all user-owned resources.

| Field | Type | Notes |
|---|---|---|
| `id` | `String` UUID | Primary key |
| `email` | `String` unique | Login identifier; indexed |
| `passwordHash` | `String?` | bcrypt hash; `null` for OAuth users |
| `devicePin` | `String?` | HMAC-SHA256 6-digit PIN for fast re-auth |
| `provider` | `AuthProvider` | `LOCAL` or `GOOGLE` |
| `providerId` | `String?` unique | Google OAuth `sub` claim |
| `role` | `UserRole` | `USER` or `ADMIN`, default `USER` |
| `status` | `UserStatus` | Account status, default `ACTIVE` |
| `riskProfile`, `investmentGoal`, `investmentHorizon`, `experienceLevel` | `String?` | Investor profiling fields |
| `preferredExchange`, `baseCurrency`, `taxCountry` | `String?` | Regional finance preferences |
| `preferences`, `notificationSettings`, `connectedAccounts` | `String?` | JSON-serialized blobs |
| `isDeleted` | `Boolean` | Soft-delete flag, default `false` |
| `lastLogin` | `DateTime?` | Updated on each profile fetch |

#### `Session`
Tracks all active login sessions per user with device fingerprinting.

| Field | Type | Notes |
|---|---|---|
| `device` | `String` | `Windows PC` / `Mobile Device` / `Tablet` |
| `browser` | `String` | `Chrome` / `Firefox` / `Safari` / `Edge` |
| `ipAddress` | `String` | Requester IP (after `::ffff:` strip) |
| `refreshToken` | `String?` | 7-day signed JWT refresh token |
| `expiresAt` | `DateTime` | Session TTL (7 days); indexed |

#### `OtpVerification`
Temporary OTP store for registration and login MFA. Auto-expires after 10 minutes. Unique per email.

#### `Holding`
Real portfolio positions with P&L tracking.

| Field | Type | Notes |
|---|---|---|
| `ticker` | `String` | Stock symbol (e.g., `RELIANCE.NS`, `AAPL`, `BTC-USD`); indexed |
| `marketId` | `String` | `domestic`, `us`, `crypto`, `metals`, `other` |
| `shares` | `Float` | Quantity held |
| `avgCost` | `Float` | Weighted average cost basis |
| `bookedPL` | `Float` | Accumulated realized P&L from partial closes, default `0.0` |

#### `VirtualHolding` / `VirtualBalance` / `VirtualTransaction`
Paper-trading simulation. Each user starts with `$100,000` virtual balance. `VirtualHolding` supports `sl` (Stop-Loss) and `tp` (Take-Profit). Unique constraint on `(userId, ticker)`.

#### `Alert`
Price, volume, or percent-change alerts with repeat and expiry support.

| Field | Type | Notes |
|---|---|---|
| `ticker` | `String` | Asset to monitor; indexed |
| `targetPrice` | `Float` | Trigger threshold |
| `direction` | `String` | `above` or `below` |
| `type` | `AlertType` | `PRICE`, `VOLUME`, or `PERCENT_CHANGE` |
| `status` | `AlertStatus` | `ACTIVE`, `TRIGGERED`, `MUTED`, `ARCHIVED` |
| `repeat` | `Boolean` | Re-arm after trigger |

#### `Watchlist` + `WatchlistItem`
Named watchlists auto-created as "Watchlist 1" if none exist. Items enriched with live Yahoo Finance quotes at fetch time. Unique constraint on `(watchlistId, symbol)`.

#### `AiSession`
Persists user AI interactions: `prompt`, `response`, `model` (`GEMINI`/`GPT4`/`CLAUDE`), with `isFavorite` and `pinned` flags.

#### `Portfolio`
Named portfolio containers with visibility controls (`PRIVATE`/`PUBLIC`/`SHARED`).

### Entity Relationship Overview

```
User --1:1--> Profile
User --1:N--> Session
User --1:N--> OtpVerification    (ephemeral, TTL 10 min)
User --1:N--> Alert
User --1:N--> Portfolio
User --1:N--> Watchlist --1:N--> WatchlistItem
User --1:N--> AiSession
User --1:N--> Holding
User --1:1--> VirtualBalance     (default $100,000)
User --1:N--> VirtualHolding
User --1:N--> VirtualTransaction
```

---

## API Reference

All routes are served from the backend base URL (default: `http://localhost:3000`).

> **Auth Header:** `Authorization: Bearer <jwt_token>` or `X-User-Id: <userId>`
> Lock = Requires authentication

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Server status, version, and healthCheck path |
| `GET` | `/health` | Health check with `status`, `timestamp`, `env`, `frontendUrl` |

---

### Authentication - `/api/auth/`

| Method | Endpoint | Body | Auth | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/google-login` | `{ token?, email?, name?, avatar?, providerId? }` | No | Google OAuth sign-in / auto-register via Google userinfo API |
| `POST` | `/api/auth/register` | `{ email, name, password }` | No | Step 1: send 6-digit OTP to email |
| `POST` | `/api/auth/verify-otp` | `{ email, name, password, code }` | No | Step 2: verify OTP, create User + Profile, return JWT |
| `POST` | `/api/auth/login` | `{ email, password }` | No | Step 1: validate password, send MFA OTP |
| `POST` | `/api/auth/login-verify-otp` | `{ email, password, code }` | No | Step 2: verify MFA OTP, return `{ hasPin, email }` |
| `POST` | `/api/auth/set-pin` | `{ email, pin }` | No | Set/update 6-digit device PIN (HMAC-SHA256) |
| `POST` | `/api/auth/verify-pin` | `{ email, pin }` | No | Verify PIN - issue 30-day JWT |
| `POST` | `/api/auth/forgot-pin` | `{ email }` | No | Send PIN-reset OTP |
| `POST` | `/api/auth/reset-pin-with-otp` | `{ email, code, newPin }` | No | Reset PIN after OTP verification |
| `POST` | `/api/auth/forgot-password` | `{ email }` | No | Send password-reset OTP |
| `POST` | `/api/auth/reset-password` | `{ email, code, newPassword }` | No | Reset password after OTP verification |

---

### AI Insights - `/api/ai/`

All AI endpoints are **read-only GET** requests. Responses are cached in-memory for **24 hours** (configurable via `AI_CACHE_TTL_MS`).

| Endpoint | Description | LLM Chain |
|---|---|---|
| `GET /api/ai/market-brief` | Market mood, confidence score, 11-sector strength grid, top insights, daily risk summary | Gemini - Groq - static fallback |
| `GET /api/ai/global-market-pulse` | Global market sentiment, summary paragraph, 3 key insights | Gemini - Groq - static fallback |
| `GET /api/ai/fear-greed` | Fear & Greed score (0-100), investor takeaways, yesterday/lastWeek/lastMonth comparisons | Gemini - Groq - static fallback |
| `GET /api/ai/pick-of-the-day` | AI-selected stock: BUY/SELL/HOLD, target, stop-loss, confidence, bullish reasons, risks | Gemini - Groq - static fallback |
| `GET /api/ai/portfolio-advisor` | Health score/grade, diversification analysis, risk profile, best opportunity, rebalance suggestions | Gemini - Groq - static fallback |

---

### Assets - `/api/`

| Method | Endpoint | Query / Path | Auth | Description |
|---|---|---|---|---|
| `GET` | `/api/asset-details/:symbol` | `:symbol` = ticker | No | Full AI-enriched asset profile backed by Yahoo Finance `quoteSummary` + Gemini/Groq LLM |
| `GET` | `/api/search` | `?q=<query>` | No | Symbol search via Yahoo Finance (60 req/min rate limit, 1-min cache, max 15 results) |

---

### News - `/api/`

| Method | Endpoint | Query | Description |
|---|---|---|---|
| `GET` | `/api/news` | - | Financial news: Finnhub (primary, 25 items) - Google Business News RSS (fallback) |
| `GET` | `/api/news/google` | - | Force Google Business News RSS feed (25 items) |
| `GET` | `/api/company-news/:symbol` | - | Symbol-specific news from Google News RSS (10 items) |
| `GET` | `/api/economic-calendar` | `?date=YYYY-MM-DD` | Seed-based deterministic economic calendar (3-6 events on weekdays, 1 on weekends) |

---

### Portfolio - Auth Required (JWT)

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| `GET` | `/api/portfolio/holdings` | `?onlyVirtual=bool&virtualTickers=SYM,SYM` | All holdings with live Yahoo Finance quotes, grouped by marketId section |
| `POST` | `/api/portfolio/holdings` | `{ ticker, name, shares, avgCost, marketId }` | Add position (auto-merges with weighted average cost recalculation) |
| `POST` | `/api/portfolio/holdings/:id/close` | `{ sharesToClose, closePrice }` | Partially or fully close position; books realized P&L into `bookedPL` |
| `DELETE` | `/api/portfolio/holdings/:id` | - | Remove holding record |
| `GET` | `/api/portfolio/virtual` | - | Virtual portfolio: balance + holdings |
| `POST` | `/api/portfolio/virtual/trade` | `{ type, symbol, name, shares, price, marketId }` | Execute virtual BUY or SELL (updates balance, upserts VirtualHolding, logs VirtualTransaction) |
| `GET` | `/api/portfolio/virtual/transactions` | - | Full virtual trade history |
| `GET` | `/api/portfolio/alerts` | - | All active/historical alerts for user |
| `POST` | `/api/portfolio/alerts` | `{ ticker, targetPrice, direction, type, expiresAt?, repeat?, notes? }` | Create new price/volume/percent alert |
| `PUT` | `/api/portfolio/alerts/:id` | `{ enabled?, status?, ... }` | Update alert status or settings |
| `DELETE` | `/api/portfolio/alerts/:id` | - | Delete alert |

---

### Watchlists - Auth Required (JWT)

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/api/watchlists` | - | All watchlists with items + live quotes. Auto-creates "Watchlist 1" if user has none |
| `POST` | `/api/watchlists` | `{ name?, isFavorite?, tags? }` | Create new watchlist (auto-names as "Watchlist N" if no name given) |
| `DELETE` | `/api/watchlists/:id` | - | Delete watchlist and all its items |
| `POST` | `/api/watchlists/:listId/items` | `{ symbol, notes? }` | Add ticker (validated by regex `^[A-Z0-9.\-=]{1,20}$`) |
| `DELETE` | `/api/watchlists/:listId/items/:symbol` | - | Remove ticker from watchlist |
| `PUT` | `/api/watchlists/:listId/items/:symbol` | `{ notes?, position? }` | Update item notes or display order |
| `GET` | `/api/watchlists/:listId/ai-analysis` | - | AI analysis for all tickers in a watchlist |

---

### Profile - Auth Required (JWT)

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| `GET` | `/api/profile` | - | Full profile. Updates `lastLogin` and logs session on each call |
| `PUT` | `/api/profile` | `{ name, username, phone, country, timezone, currency, bio, occupation, avatar, riskProfile, investmentGoal, investmentHorizon, experienceLevel, preferredExchange, baseCurrency, taxCountry, connectedAccounts }` | Update profile fields |
| `PUT` | `/api/profile/avatar` | `{ avatar }` | Update avatar URL |
| `PUT` | `/api/profile/preferences` | `{ preferences, notificationSettings }` | Update JSON preferences blob |
| `PUT` | `/api/profile/change-password` | `{ currentPassword, newPassword }` | Change password; invalidates all sessions |
| `GET` | `/api/profile/sessions` | - | List unique active sessions (deduplicated by device + browser + IP) |
| `DELETE` | `/api/profile/session/:id` | - | Revoke a specific session by ID |
| `DELETE` | `/api/profile/sessions` | - | Revoke all sessions except the most recent |
| `DELETE` | `/api/profile` | - | Soft-delete account (`isDeleted = true`), invalidate all sessions |
| `GET` | `/api/profile/watchlist-summary` | - | Asset type breakdown across all watchlists |
| `GET` | `/api/profile/export` | `?format=json\|csv` | Export all user data: profile, portfolios, watchlists, alerts, AI sessions |

---

## AI / ML Workflows

### LLM Orchestration Chain

Every AI endpoint follows a **4-tier fallback chain** before serving a static default:

```
Request - Check In-Memory Cache (24h TTL, 200-entry LRU cap)
                |
           Cache HIT  ---------> Return immediately
                |
           Cache MISS
                |
                |
    - Google Gemini 2.5 Flash
       Endpoint: generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash
       Timeout: 5s (/api/ai/*) | 8s (/api/asset-details/*)
       Keys: GEMINI_API_KEY - GEMINI_API_KEY_SECONDARY (automatic failover)
       Instruction appended: "Respond with ONLY a raw JSON block. No markdown."
                - Fail (rate-limit / network / timeout)
                |
    - Groq API - qwen/qwen3.6-27b
       Endpoint: api.groq.com/openai/v1/chat/completions
       Timeout: 15s | Temperature: 0.3 | Max tokens: 4096
       System: "You are a professional financial AI assistant.
       Output ONLY a valid raw JSON object."
                - Fail
                |
    - Ollama (optional - set OLLAMA_BASE_URL)
       Model: OLLAMA_MODEL env var (default: qwen2.5)
       OpenAI-compatible /v1/chat/completions with response_format: json_object
       Temperature: 0.2 | Optional Bearer auth via OLLAMA_API_KEY
                - Fail
                |
    - Static hardcoded fallback data (sensible market defaults)
```

### JSON Robustness Pipeline

LLM outputs pass through a custom 4-step pipeline to handle malformed responses:

1. **`extractJSON(raw)`** - Strips `<think>...</think>` blocks and markdown fences. Stack-based bracket tracking collects all complete JSON structures; returns the **last** one (actual data, not the schema echo).
2. **Ellipsis sanitization** - Replaces `[ ... ]` - `[]`, `{ ... }` - `{}`, `"key": ...` - `"key": null`, trailing commas, double commas, and Unicode ellipsis.
3. **`repairJSON(str)`** - Closes unclosed strings, brackets, and objects left by token-limit truncation.
4. **`safeParseJSON(rawText)`** - Attempts `JSON.parse(extracted)`; on failure, runs `JSON.parse(repairJSON(extracted))`.

### AI Endpoints & Response Schemas

| Endpoint | Key Output Fields |
|---|---|
| `/api/ai/market-brief` | `{ marketMood, confidence, riskLevel, insights[3], sectorStrength[11]{sector,score,reason}, todayRisk, summary, generatedAt }` |
| `/api/ai/global-market-pulse` | `{ sentiment, summary, insights[3], generatedAt }` |
| `/api/ai/fear-greed` | `{ score, sentiment, description, investorTakeaways[], risk, opportunity, yesterday, lastWeek, lastMonth, generatedAt }` |
| `/api/ai/pick-of-the-day` | `{ symbol, company, recommendation, confidence, aiScore, currentPrice, target, stopLoss, holdingPeriod, risk, summary, bullishReasons[], risks[], generatedAt }` |
| `/api/ai/portfolio-advisor` | `{ healthScore, healthGrade, diversification{...}, riskAnalysis{...}, bestOpportunity{...}, portfolioHealth{outlook,strengths[],weaknesses[],risks[],recommendations[]}, rebalanceSuggestions[], generatedAt }` |

### Asset-Level AI Enrichment (`/api/asset-details/:symbol`)

Performs a **parallel pre-fetch** before invoking the LLM:

1. `yahooFinance.quote(symbol)` - real-time price, change, 52-week range, volume
2. `yahooFinance.quoteSummary(symbol, { modules: ['summaryProfile', 'defaultKeyStatistics', 'financialData', 'calendarEvents', 'recommendationTrend', 'majorHoldersBreakdown'] })`
3. All fetched data injected as **context** into the Gemini/Groq prompt - AI analysis is grounded in real P/E, EPS, revenue, analyst consensus, and institutional ownership figures.

### Caching Strategy

| Layer | TTL | Max Entries | Scope |
|---|---|---|---|
| AI response cache (`aiCache.ts`) | 24 hours (`AI_CACHE_TTL_MS`) | 200 (LRU eviction) | All `/api/ai/*` endpoints |
| Asset data cache (`assets.ts`) | 12 hours | Unbounded Map | Per symbol key |
| Portfolio quote cache (`portfolio.ts`) | 30 seconds | Unbounded Map | Per ticker symbol |
| Search cache (`search.ts`) | 1 minute | 500 entries (LRU) | Per query string |

---

## Authentication Flow

FinPulse AI uses a **multi-step, PIN-secured authentication system** with three pathways:

### 1. Email/Password Registration

```
POST /api/auth/register
    - Generate 6-digit OTP, upsert into OtpVerification (TTL 10 min)
    - Queue OTP email: Brevo API - Resend API - SMTP - console log

POST /api/auth/verify-otp
    -> Validate OTP code + expiry
    - bcrypt.hash(password, 10) - create User + Profile
    -> Delete OtpVerification record
    -> Return: JWT (30d expiry), user object

POST /api/auth/set-pin
    - HMAC-SHA256(pin, JWT_SECRET) - store as devicePin
    -> Return: JWT (30d expiry), user object
```

### 2. Email/Password Login (with MFA)

```
POST /api/auth/login
    -> bcrypt.compare(password, passwordHash)
    -> Generate & email new 6-digit OTP (same email pipeline)

POST /api/auth/login-verify-otp
    -> Validate OTP + re-validate password
    -> Delete OtpVerification record
    -> Return: { hasPin: boolean, email }

POST /api/auth/verify-pin
    -> HMAC verify (with bcrypt fallback + silent migration)
    -> Return: JWT (30d expiry), user object
```

### 3. Google OAuth

```
Frontend (@react-oauth/google) -> access_token

POST /api/auth/google-login { token }
    -> fetch("https://www.googleapis.com/oauth2/v3/userinfo")
    -> Auto-register (provider: GOOGLE) or sync avatar if existing user
    -> Return: JWT (30d) + hasPin flag

if !hasPin -> POST /api/auth/set-pin
if  hasPin -> POST /api/auth/verify-pin
```

### JWT Middleware (`protect`)

```
Authorization: Bearer <token>
    -> jwt.verify(token, JWT_SECRET)
    -> attach req.userId, req.userEmail
    -> next()

Fallback:
X-User-Id: <userId>
    - attach req.userId
    -> next()

Neither present -> 401 Unauthorized
```

### Session Management

- **Max 5 concurrent sessions** per user; `enforceSessionLimit()` prunes oldest on every new session
- **Deduplication:** Sessions identified by `(device, browser, ipAddress)` - same fingerprint refreshes rather than duplicates
- **PIN hash migration:** Legacy bcrypt PINs silently upgraded to HMAC-SHA256 on first successful verify

---

## Environment Configuration

### Backend `finpulse-web/backend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Required | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=verify-full` |
| `JWT_SECRET` | Required | Secret for JWT signing and PIN hashing | Any 32+ character random string |
| `GEMINI_API_KEY` | Required | Google Gemini API key (Primary AI) | `AIzaSy...` |
| `GEMINI_API_KEY_SECONDARY` | Optional | Secondary Gemini key for automatic failover | `AIzaSy...` |
| `GROQ_API_KEY` | Required | Groq API key (Secondary AI - `qwen3.6-27b`) | `gsk_...` |
| `GOOGLE_CLIENT_ID` | Required | Google OAuth Client ID for token verification | `<id>.apps.googleusercontent.com` |
| `FINNHUB_API_KEY` | Required | Finnhub API key for financial news feed | `d8dud89r...` |
| `TWELVEDATA_API_KEY` | Optional | Twelve Data API key (chart data fallback) | `2b1c716b...` |
| `ALPHA_VANTAGE_API_KEY` | Optional | Alpha Vantage key (market data fallback) | `DRX2GT...` |
| `POLYGON_API_KEY` | Optional | Polygon.io key (market data fallback) | `KL1I6l...` |
| `ALPACA_API_KEY` | Optional | Alpaca trading API key | `CKGRX...` |
| `BREVO_API_KEY` | Required | Brevo (Sendinblue) key for transactional email | `xkeysib-...` |
| `SENDER_EMAIL` | Required | From-address for OTP and password reset emails | `afinpulse@gmail.com` |
| `SMTP_HOST` | Optional | SMTP server (fallback when Brevo is unavailable) | `smtp.gmail.com` |
| `SMTP_PORT` | Optional | SMTP port | `465` |
| `SMTP_USER` | Optional | SMTP username / email address | `user@gmail.com` |
| `SMTP_PASS` | Optional | SMTP password or Gmail app password | `xxxx xxxx xxxx xxxx` |
| `SMTP_SECURE` | Optional | Use TLS (`true`) or STARTTLS (`false`) | `true` |
| `RESEND_API_KEY` | Optional | Resend API key (tertiary email fallback) | `re_...` |
| `PORT` | Optional | HTTP server port (default: `3000`) | `3000` |
| `FRONTEND_URL` | Optional | Comma-separated CORS allowed origins | `https://yourapp.com` |
| `NODE_ENV` | Optional | Runtime environment | `production` |
| `OLLAMA_BASE_URL` | Optional | Ollama server URL for optional local LLM | `http://localhost:11434` |
| `OLLAMA_MODEL` | Optional | Ollama model name (default: `qwen2.5`) | `qwen2.5` |
| `OLLAMA_API_KEY` | Optional | Bearer key for secured Ollama deployments | optional |
| `AI_CACHE_TTL_MS` | Optional | AI response cache TTL in ms (default: `86400000`) | `86400000` |

### Frontend `finpulse-web/frontend/.env`

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Required (prod) | Backend base URL - no trailing slash | `https://finpulse-backend.onrender.com` |
| `VITE_BACKEND_URL` | Optional | Backend URL for local dev | `http://localhost:3000` |

> **Local dev note:** When `VITE_API_URL` is unset and Vite is in dev mode, the frontend defaults to `""` (same-origin). Configure a Vite proxy in `vite.config.ts` to forward `/api/*` to `localhost:3000`.

---

## Local Development Setup

### Prerequisites

- **Node.js** `20.x` or later - [download](https://nodejs.org)
- **npm** `10.x` or later (bundled with Node)
- **PostgreSQL** - local install or a free [NeonDB](https://neon.tech) serverless instance

### Step 1 - Clone the Repository

```bash
git clone https://github.com/Vans30m/FinPulse-AI.git
cd FinPulse-AI
```

### Step 2 - Backend Setup

```bash
cd finpulse-web/backend
```

Create and populate `.env` (see [Environment Configuration](#-environment-configuration)):

```bash
touch .env   # add required variables
```

Install dependencies (`postinstall` automatically runs `prisma generate`):

```bash
npm install
```

Run database migrations to create all tables:

```bash
npx prisma migrate dev --name init
```

Optionally inspect the database via Prisma Studio:

```bash
npx prisma studio
```

Start the backend with hot-reload:

```bash
npm run dev
# -> Server starts at http://localhost:3000
```

### Step 3 - Frontend Setup

Open a new terminal tab:

```bash
cd finpulse-web/frontend
```

Create the environment file:

```bash
echo "VITE_BACKEND_URL=http://localhost:3000" > .env
```

Install dependencies:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev
# -> App starts at http://localhost:5173
```

### Step 4 - Verify the Stack

```bash
# Backend health check
curl http://localhost:3000/health
# -> { "status": "ok", "env": "development", ... }

# Asset search
curl "http://localhost:3000/api/search?q=AAPL"

# AI market brief
curl http://localhost:3000/api/ai/market-brief
```

Open **`http://localhost:5173`** in your browser.

---

## Deployment (Render)

The project ships with a fully configured `render.yaml` IaC manifest. Connect your GitHub fork to a new **Render Blueprint** and it auto-provisions both services.

### Provisioned Services

| Service | Name | Type | Region | Root Dir |
|---|---|---|---|---|
| Backend API | `finpulse-backend` | Node web service (free) | Ohio (`us-east-2`) | `finpulse-web/backend` |
| Frontend SPA | `finpulse-frontend` | Static site | Auto | `finpulse-web/frontend` |

### Build & Start Commands

**Backend:**
```bash
npm install && npm run build   # tsc -> dist/
npm start                      # node dist/index.js
```

**Frontend:**
```bash
npm install && npm run build   # tsc -b && vite build -> dist/
# SPA rewrite: /* -> /index.html
```

### Cross-service Environment Wiring

`render.yaml` auto-injects:
- `FRONTEND_URL` on backend <- `RENDER_EXTERNAL_URL` of `finpulse-frontend`
- `VITE_API_URL` on frontend <- `RENDER_EXTERNAL_URL` of `finpulse-backend`

All other secrets must be set manually in the Render dashboard. `JWT_SECRET` is auto-generated by Render.

---

## Desktop App Build (Electron)

The Electron app loads the deployed frontend URL in a native window.

> **Note:** `electron/main.js` is hardcoded to `https://finpulse-frontend-jrsd.onrender.com`. Update this URL if you deploy to a different host.

```bash
cd finpulse-web

# Run in development (opens a native window loading the production URL)
npm run electron

# Build Windows NSIS installer -> finpulse-web/release/
npm run dist
```

**Electron builder configuration:**

- **App ID:** `com.finpulseai.app`
- **Product Name:** `FinPulse AI`
- **Window:** 1400??900 default, 1000??700 minimum
- **Platform:** Windows NSIS installer
- **Icon:** `electron/fp-icon.ico`

---

## Security Architecture

| Layer | Mechanism | Configuration |
|---|---|---|
| **Global Rate Limit** | `express-rate-limit` | 200 requests / 15 min per IP |
| **Auth Rate Limit** | `express-rate-limit` | 20 attempts / 15 min per IP on all `/api/auth/*` routes |
| **Search Rate Limit** | `express-rate-limit` | 60 requests / 1 min per IP on `/api/search` |
| **SQL Injection Guard** | Custom `sqlInjectionSanitizer` middleware | Scans `body`, `query`, `params` for 7 known SQL injection patterns (UNION SELECT, comment markers, OR/AND bypasses, WAITFOR, BENCHMARK) |
| **CORS** | Strict origin allowlist | `localhost:*` (dev) + `FRONTEND_URL` env var; all others blocked |
| **JWT Authentication** | `jsonwebtoken` | 30-day access tokens; `{ userId, email, role }` payload |
| **Password Hashing** | `bcryptjs` | bcrypt with 10 salt rounds |
| **PIN Hashing** | `crypto.createHmac('sha256', JWT_SECRET)` | Fast HMAC for PIN verification |
| **PIN Hash Migration** | Automatic | bcrypt PINs silently upgraded to HMAC on first successful verify |
| **Session Limit** | Server-enforced | Max 5 concurrent sessions; oldest pruned automatically |
| **Soft Delete** | `isDeleted` flag | User records never hard-deleted |
| **Input Sanitization** | Symbol regex guard | Watchlist symbols validated against `^[A-Z0-9.\-=]{1,20}$` to prevent LLM prompt injection |
| **Proxy Trust** | `app.set('trust proxy', 1)` | Correct `req.ip` behind Render's reverse proxy |
| **Request Timeouts** | `apiFetch` wrapper | 30-second client-side abort controller on all frontend API calls |
| **gzip Compression** | `compression` middleware | All responses compressed before transmission |

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Disclaimer

**Educational Purposes Only.** FinPulse AI is a tool for market analysis and virtual portfolio tracking. It does not provide financial advice. Market data may be delayed or incomplete. Always conduct your own due diligence and consult with a certified financial advisor before making real investment decisions.

---

<div align="center">

Built with love by the FinPulse AI team - [Live App](https://finpulse-frontend-jrsd.onrender.com)
