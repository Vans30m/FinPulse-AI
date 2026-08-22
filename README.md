# FinPulse-AI

FinPulse-AI is a comprehensive, AI-driven financial analysis and portfolio management platform. It combines real-time market data, advanced technical charting, and artificial intelligence to provide actionable market sentiment, personalized stock screening, and virtual portfolio tracking in a sleek, unified dashboard.

## Features

### AI & Intelligence
- **AI Market Sentiment:** Analyzes current market conditions to provide sentiment scores.
- **AI Pick of the Day:** Recommends a daily asset with supporting technical and fundamental rationale.
- **AIBulletSummary:** Generates rapid, bite-sized summaries of market movements.
- **Trending Sector Streaks:** Identifies sectors experiencing sustained momentum.

### Charts & Technical Analysis
- **Advanced Interactive Charting:** Built with Lightweight Charts for professional-grade candlestick and line charts.
- **Market Compass & Indicators:** Visualizes market direction and specific technical signals.
- **Fear & Greed Index:** Real-time gauge of market emotions.
- **Global Market Clock:** Tracks open/close times across major global exchanges.

### Portfolio & Watchlist
- **Virtual Trading:** Simulate trades and track a virtual balance without risking real capital.
- **Portfolio Tracking:** Track holdings, average costs, and booked P&L across multiple markets.
- **Watchlists:** Create multiple custom watchlists with tagging and positional sorting.

### News & Market Analysis
- **Integrated News Feed:** Aggregates top financial news using Finnhub API and Google News RSS feeds.
- **Stock Screener:** Filter and discover assets based on customized metrics.

### Authentication & User Features
- **Secure Authentication:** JWT-based login, OTP verification, and Google OAuth integration.
- **User Profiles:** Manage preferences, risk profiles, investment goals, and session history.
- **Multi-Platform:** Accessible via web browser or as a dedicated Electron desktop tool.

## Architecture

```mermaid
graph TD
    User([User]) --> Frontend
    User --> Desktop[Electron Tool]
    Desktop -.-> Frontend
    
    subgraph Client
        Frontend[React / Vite Frontend]
    end
    
    subgraph Backend API
        API[Express / Node.js]
        API --> Auth[Authentication & Sessions]
        API --> AI_R[AI & LLM Services]
        API --> MD[Market Data]
        API --> News_R[News Aggregation]
        API --> DB_Layer[Prisma ORM]
    end
    
    Frontend <-->|REST API / JSON| API
    
    subgraph External Services
        Groq[Groq / Gemini AI]
        YF[Yahoo Finance]
        OAuth[Google OAuth]
        DB[(PostgreSQL)]
        Finnhub[Finnhub API]
        GoogleNews[Google News RSS]
    end
    
    AI_R <--> Groq
    MD <--> YF
    Auth <--> OAuth
    DB_Layer <--> DB
    News_R <--> Finnhub
    News_R <--> GoogleNews
```

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React 19, Vite, Tailwind CSS | UI components, build tooling, styling |
| **State / Data** | Tanstack Query, Context API | Server-state management and data fetching |
| **Charts / UI** | Lightweight Charts, Framer Motion | Professional financial charts and animations |
| **Backend** | Node.js, Express | REST API and business logic |
| **Database** | PostgreSQL, Prisma ORM | Relational data storage and schema management |
| **AI** | Groq (Qwen), Gemini | Generative AI for market sentiment and analysis |
| **Market Data** | Yahoo Finance (`yahoo-finance2`) | Real-time and historical financial data |
| **Authentication** | JWT, bcrypt, `@react-oauth/google` | Secure access and session handling |
| **Desktop** | Electron | Desktop tool wrapper |
| **Deployment** | Render | Managed hosting for static frontend and Node backend |

## Project Structure

```text
FinPulse-AI/                  # Repository root
├── finpulse-web/             # Main web application project
│   ├── backend/              # Node.js / Express server
│   │   ├── prisma/           # PostgreSQL Schema (schema.prisma)
│   │   └── src/
│   │       ├── routes/       # API endpoints (ai, assets, auth, portfolio, etc.)
│   │       └── utils/        # Caching and helper functions
│   ├── frontend/             # React / Vite application
│   │   └── src/
│   │       ├── components/   # Reusable UI elements
│   │       ├── features/     # Domain-specific components (auth, dashboard, portfolio)
│   │       ├── pages/        # Main route views (Pulse, AssetDetails, Screener, etc.)
│   │       ├── services/     # API client functions (Tanstack Query)
│   │       └── App.tsx       # Application router
│   └── electron/             # Desktop tool wrapper
│       └── main.js           # Electron entry point loading the web URL
└── render.yaml               # Infrastructure-as-code for Render deployment
```

## 🎥 Project Demo Video

Watch a full walkthrough of **FinPulse-AI** here:

[![Watch the FinPulse-AI Demo](https://youtu.be/pr6GPR8tfd4)

> Prefer a direct file download? [Download the 100MB demo video](./docs/finpulse-demo.mp4)

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database
- Appropriate API keys (Groq, Gemini, Google OAuth)

### Clone the repository
```bash
git clone https://github.com/your-username/FinPulse-AI.git
cd FinPulse-AI/finpulse-web
```

### Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/finpulse
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173

# AI APIs
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# OAuth & Email
GOOGLE_CLIENT_ID=your_google_client_id
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass

# News API
FINNHUB_API_KEY=your_finnhub_api_key
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3000
```

### Database Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### Run the Backend
```bash
# Still in the backend directory
npm run dev
```

### Run the Frontend
```bash
# In a new terminal, from finpulse-web/frontend
npm install
npm run dev
```

### Run the Desktop Tool (Optional)
```bash
# From finpulse-web
npm install
npm run electron
```

## API / Backend Overview

The backend uses RESTful conventions with the following major route domains:

| Route Prefix | Purpose |
| --- | --- |
| `/api/auth` | User registration, login, session validation, OAuth handling |
| `/api/ai` | AI generation for market sentiment, picks, and bullet summaries |
| `/api/assets` | Financial data fetching (quotes, historical charts, fundamentals) |
| `/api/portfolio` | Virtual holdings, balances, and transaction history |
| `/api/watchlists` | CRUD operations for custom watchlists and their items |
| `/api/news` | Aggregation and parsing of recent financial news |
| `/api/profile` | User preferences, risk profile, and avatar management |
| `/api/search` | Asset and stock search query processing |

## AI Features

FinPulse-AI leverages a robust fallback system prioritizing **Google Gemini (2.5-flash)**, falling back to **Groq (qwen/qwen3.6-27b)** if needed. 

- **Data Processing**: AI models process structured prompts containing real-time market data and indices.
- **Strict JSON Returns**: Prompts enforce raw JSON generation, which the backend parses directly.
- **Application**: The data drives the frontend "Pulse" dashboard, surfacing daily picks, sentiment scores, and sector rotation streaks.
- **Caching**: AI responses are aggressively cached to respect rate limits and improve dashboard load times.

## Database

Built on **PostgreSQL** and managed via **Prisma**, core models include:
- **Identity & Security**: `User`, `Profile`, `Session`, `OtpVerification`
- **Investment Management**: `Portfolio`, `Watchlist`, `WatchlistItem`, `Alert`
- **Virtual Trading**: `VirtualBalance`, `VirtualHolding`, `VirtualTransaction`
- **Activity**: `AiSession`, `Holding`

## Deployment

The project is natively configured for deployment on **Render**:
- **Backend Service**: Configured as a Node.js Web Service.
- **Frontend Service**: Configured as a Static Site (Vite build) with client-side routing rewrites (`/*` -> `/index.html`).
- **Infrastructure as Code**: The provided `render.yaml` automatically orchestrates both services and injects the dynamically generated API URL into the frontend build process.

## Performance & Reliability

- **API Fallbacks**: The AI router implements a try-catch cascade (Primary Gemini -> Secondary Gemini -> Groq -> Static Mock) to ensure the dashboard always renders.
- **Caching (`node-cache`)**: Employed in the backend to store AI inferences and heavy external market data responses.
- **Asynchronous UI**: The frontend leverages `Tanstack Query` for asynchronous fetching, aggressive stale-time management, and loading states, ensuring a responsive interface.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Disclaimer

**Educational Purposes Only.** FinPulse-AI is a tool for market analysis and virtual portfolio tracking. It does not provide financial advice. Market data may be delayed, inaccurate, or incomplete. Always conduct your own due diligence and consult with a certified financial advisor before making actual investments.
