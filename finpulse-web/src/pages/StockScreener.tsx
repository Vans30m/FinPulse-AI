import { useState, useEffect, useMemo } from 'react';
import {
  Globe, ArrowLeft, Download, Bookmark, Plus, TrendingUp, Sparkles, FileText, Check, ChevronDown, MessageSquare, X
} from 'lucide-react';
import StockSearch from '../components/ui/StockSearch';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getFundamentals, getMarketHistory, getAIScore, getCompanyNews } from '../services/marketService';
import toast from 'react-hot-toast';
import { useWatchlists, useAddWatchlistItem, useRemoveWatchlistItem, useCreateWatchlist } from '../hooks/useDashboard';

interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  roe: number;
  roce: number;
  bookValue: number;
  high52w: number;
  low52w: number;
  faceValue: number;
  about: string;
  history: { time: string; price: number }[];
}

const SUGGESTED_COMPANIES = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'MSFT', name: 'Microsoft' },
];

const PEER_GROUPS: Record<string, { category: string[]; peers: { name: string; symbol: string; price: number; pe: number; mCap: number; div: number; npQtr: number; qtrProfitVar: number; salesQtr: number; qtrSalesVar: number; roce: number }[] }> = {
  TECH_US: {
    category: ['Technology', 'Software', 'Infrastructure'],
    peers: [
      { name: 'Apple Inc.', symbol: 'AAPL', price: 189.30, pe: 28.5, mCap: 2950000, div: 0.52, npQtr: 33916, qtrProfitVar: 8.5, salesQtr: 119575, qtrSalesVar: 2.1, roce: 58.2 },
      { name: 'Microsoft Corp.', symbol: 'MSFT', price: 415.50, pe: 35.2, mCap: 3080000, div: 0.72, npQtr: 21920, qtrProfitVar: 33.1, salesQtr: 62020, qtrSalesVar: 17.6, roce: 28.5 },
      { name: 'NVIDIA Corp.', symbol: 'NVDA', price: 875.12, pe: 72.4, mCap: 2185000, div: 0.02, npQtr: 12284, qtrProfitVar: 765.0, salesQtr: 22103, qtrSalesVar: 268.0, roce: 65.4 },
      { name: 'Alphabet Inc.', symbol: 'GOOGL', price: 151.60, pe: 25.4, mCap: 1890000, div: 0.00, npQtr: 20687, qtrProfitVar: 51.8, salesQtr: 86310, qtrSalesVar: 15.4, roce: 22.1 },
      { name: 'Meta Platforms', symbol: 'META', price: 505.20, pe: 24.1, mCap: 1280000, div: 0.40, npQtr: 14017, qtrProfitVar: 201.0, salesQtr: 40111, qtrSalesVar: 27.3, roce: 30.5 },
      { name: 'Amazon.com Inc.', symbol: 'AMZN', price: 178.15, pe: 41.8, mCap: 1850000, div: 0.00, npQtr: 10430, qtrProfitVar: 220.0, salesQtr: 169961, qtrSalesVar: 13.9, roce: 18.2 }
    ]
  },
  IT_INDIA: {
    category: ['Technology', 'IT Services', 'NSE Listed'],
    peers: [
      { name: 'TCS', symbol: 'TCS.NS', price: 3850.20, pe: 29.2, mCap: 168000, div: 1.15, npQtr: 12434, qtrProfitVar: 9.2, salesQtr: 61223, qtrSalesVar: 7.9, roce: 45.2 },
      { name: 'Infosys', symbol: 'INFY.NS', price: 1420.15, pe: 20.5, mCap: 72000, div: 2.10, npQtr: 6212, qtrProfitVar: 3.1, salesQtr: 37923, qtrSalesVar: 1.3, roce: 38.6 },
      { name: 'Wipro Ltd.', symbol: 'WIPRO.NS', price: 460.50, pe: 18.4, mCap: 24000, div: 0.50, npQtr: 2835, qtrProfitVar: -12.4, salesQtr: 22205, qtrSalesVar: -4.4, roce: 20.1 },
      { name: 'HCL Technologies', symbol: 'HCLTECH.NS', price: 1350.80, pe: 22.1, mCap: 36000, div: 1.80, npQtr: 4350, qtrProfitVar: 6.2, salesQtr: 28446, qtrSalesVar: 6.5, roce: 28.4 },
      { name: 'Tech Mahindra', symbol: 'TECHM.NS', price: 1210.40, pe: 24.5, mCap: 11800, div: 2.20, npQtr: 1120, qtrProfitVar: -60.2, salesQtr: 13101, qtrSalesVar: -5.7, roce: 16.5 }
    ]
  },
  BANK_INDIA: {
    category: ['Financials', 'Banking', 'Private Sector Bank'],
    peers: [
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS', price: 1530.80, pe: 18.2, mCap: 142000, div: 1.25, npQtr: 16840, qtrProfitVar: 33.5, salesQtr: 81920, qtrSalesVar: 26.2, roce: 16.2 },
      { name: 'ICICI Bank', symbol: 'ICICIBANK.NS', price: 1080.45, pe: 17.5, mCap: 75000, div: 0.90, npQtr: 10270, qtrProfitVar: 23.6, salesQtr: 43550, qtrSalesVar: 18.4, roce: 15.4 },
      { name: 'SBI', symbol: 'SBIN.NS', price: 780.20, pe: 9.8, mCap: 69000, div: 1.50, npQtr: 14890, qtrProfitVar: -8.1, salesQtr: 112040, qtrSalesVar: 12.1, roce: 12.8 },
      { name: 'Axis Bank', symbol: 'AXISBANK.NS', price: 1045.30, pe: 13.4, mCap: 32000, div: 0.40, npQtr: 5860, qtrProfitVar: 15.4, salesQtr: 28990, qtrSalesVar: 14.1, roce: 13.1 },
      { name: 'Kotak Mahindra', symbol: 'KOTAKBANK.NS', price: 1720.50, pe: 20.2, mCap: 34000, div: 0.50, npQtr: 3180, qtrProfitVar: 7.2, salesQtr: 18450, qtrSalesVar: 9.5, roce: 14.8 }
    ]
  },
  CONGLOMERATE_INDIA: {
    category: ['Conglomerate', 'Energy & Retail', 'BSE Listed'],
    peers: [
      { name: 'Reliance Industries', symbol: 'RELIANCE.NS', price: 2910.45, pe: 26.8, mCap: 235000, div: 0.90, npQtr: 18950, qtrProfitVar: 2.5, salesQtr: 228000, qtrSalesVar: 11.2, roce: 9.63 },
      { name: 'Adani Enterprises', symbol: 'ADANIENT.NS', price: 3120.50, pe: 98.4, mCap: 42000, div: 0.10, npQtr: 1888, qtrProfitVar: 135.0, salesQtr: 26850, qtrSalesVar: 6.8, roce: 11.2 },
      { name: 'Tata Motors Ltd.', symbol: 'TATAMOTORS.NS', price: 955.40, pe: 16.8, mCap: 38000, div: 0.60, npQtr: 7025, qtrProfitVar: 220.0, salesQtr: 111500, qtrSalesVar: 25.0, roce: 15.4 },
      { name: 'ONGC', symbol: 'ONGC.NS', price: 272.30, pe: 6.2, mCap: 34000, div: 4.50, npQtr: 10430, qtrProfitVar: 8.5, salesQtr: 165000, qtrSalesVar: -2.3, roce: 14.1 },
      { name: 'Coal India Ltd.', symbol: 'COALINDIA.NS', price: 440.80, pe: 8.5, mCap: 27000, div: 5.20, npQtr: 9090, qtrProfitVar: 17.2, salesQtr: 36150, qtrSalesVar: 3.1, roce: 42.1 }
    ]
  },
  DEFAULT: {
    category: ['Industrials', 'Capital Goods', 'Aerospace & Defense'],
    peers: [
      { name: 'Bharat Electron', symbol: 'BEL.NS', price: 425.55, pe: 51.32, mCap: 31104.84, div: 0.56, npQtr: 2226.35, qtrProfitVar: 4.62, salesQtr: 10224.43, qtrSalesVar: 11.75, roce: 36.53 },
      { name: 'Hind.Aeronautics', symbol: 'HAL.NS', price: 4440.60, pe: 32.58, mCap: 297023.17, div: 0.90, npQtr: 4196.04, qtrProfitVar: 5.52, salesQtr: 13942.40, qtrSalesVar: 1.77, roce: 31.96 },
      { name: 'Bharat Dynamics', symbol: 'BDL.NS', price: 1409.60, pe: 122.82, mCap: 51627.88, div: 0.33, npQtr: 113.18, qtrProfitVar: -58.51, salesQtr: 480.20, qtrSalesVar: -72.98, roce: 13.84 },
      { name: 'Garden Reach Sh.', symbol: 'GRSE.NS', price: 2765.70, pe: 42.39, mCap: 31701.26, div: 0.50, npQtr: 303.20, qtrProfitVar: 24.14, salesQtr: 2119.21, qtrSalesVar: 29.06, roce: 42.96 },
      { name: 'Data Patterns', symbol: 'DATAPATTNS.NS', price: 4615.50, pe: 94.40, mCap: 25829.37, div: 0.22, npQtr: 138.38, qtrProfitVar: 21.30, salesQtr: 344.85, qtrSalesVar: -12.96, roce: 23.28 }
    ]
  }
};

const getPeerGroup = (symbol: string) => {
  const sym = symbol.toUpperCase();
  if (['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'].includes(sym)) {
    return PEER_GROUPS.TECH_US;
  }
  if (['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS'].includes(sym)) {
    return PEER_GROUPS.IT_INDIA;
  }
  if (['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS'].includes(sym)) {
    return PEER_GROUPS.BANK_INDIA;
  }
  if (['RELIANCE.NS', 'ADANIENT.NS', 'TATAMOTORS.NS', 'ONGC.NS', 'COALINDIA.NS'].includes(sym)) {
    return PEER_GROUPS.CONGLOMERATE_INDIA;
  }
  return PEER_GROUPS.DEFAULT;
};

const getResultDate = (symbol: string) => {
  const sym = symbol.toUpperCase();
  if (sym.includes('RELIANCE')) return '18 July 2026';
  if (sym.includes('TCS')) return '11 July 2026';
  if (sym.includes('INFY') || sym.includes('INFOSYS')) return '15 July 2026';
  if (sym.includes('HDFCBANK')) return '16 July 2026';
  if (sym.includes('AAPL') || sym.includes('APPLE')) return '29 October 2026';
  if (sym.includes('MSFT') || sym.includes('MICROSOFT')) return '24 October 2026';
  if (sym.includes('NVDA') || sym.includes('NVIDIA')) return '18 November 2026';

  // Deterministic calculation
  const day = 10 + (sym.charCodeAt(0) % 20);
  const months = ['July', 'August', 'September', 'October', 'November'];
  const month = months[sym.charCodeAt(sym.length - 1) % months.length];
  return `${day} ${month} 2026`;
};

const getDynamicQuarters = () => {
  const quarters = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();



  let yr = currentYear;
  let qIndex = 0;
  if (currentMonth >= 9) qIndex = 3;
  else if (currentMonth >= 6) qIndex = 2;
  else if (currentMonth >= 3) qIndex = 1;
  else qIndex = 0;

  const qNames = ['Mar', 'Jun', 'Sep', 'Dec'];
  for (let i = 0; i < 13; i++) {
    quarters.unshift(`${qNames[qIndex]} ${yr}`);
    qIndex--;
    if (qIndex < 0) {
      qIndex = 3;
      yr--;
    }
  }
  return quarters;
};

const getDynamicYears = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const latestFiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const years = ['Mar 2006', 'Mar 2007'];
  for (let i = 5; i >= 0; i--) {
    years.push(`Mar ${latestFiscalYear - i}`);
  }
  return years;
};

const getInsightsYears = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const latestFiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  const years = [];
  for (let i = 10; i >= 0; i--) {
    years.push(`Mar ${latestFiscalYear - i}`);
  }
  return years;
};

export default function StockScreener() {
  const [selectedStock, setSelectedStock] = useState<StockDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'workbook' | 'shareholding' | 'documents'>('analysis');
  const [timeframe, setTimeframe] = useState<'1mo' | '3mo' | '1yr' | 'max'>('1yr');
  const [shareholdingPeriod, setShareholdingPeriod] = useState<'quarterly' | 'yearly'>('quarterly');
  const [workbookTab, setWorkbookTab] = useState<'peers' | 'quarters' | 'pnl' | 'balance-sheet' | 'cash-flow' | 'ratios' | 'insights'>('quarters');
  const [companyNews, setCompanyNews] = useState<any[]>([]);
  const [activeDocumentModal, setActiveDocumentModal] = useState<{
    type: 'transcript' | 'summary';
    title: string;
    content: string;
  } | null>(null);

  const handleDownloadAnnualReport = (yr: string) => {
    if (!selectedStock) return;
    const filename = `${selectedStock.symbol}_Annual_Report_FY${yr}.txt`;
    const content = `==================================================
ANNUAL REPORT - FISCAL YEAR ${yr}
==================================================
COMPANY: ${selectedStock.name} (${selectedStock.symbol})
PRICE: ${currencySymbol}${selectedStock.price.toFixed(2)}
MARKET CAP: ${currencySymbol}${selectedStock.marketCap.toFixed(2)} Cr

Financial Highlights for FY ${yr}:
- Revenue: Formatted and audited figures aggregated from BSE.
- Operating Margin (OPM): ${selectedStock.roce.toFixed(2)}% ROCE.
- Return on Equity (ROE): ${selectedStock.roe.toFixed(2)}%.
- Face Value: ${currencySymbol}${selectedStock.faceValue.toFixed(2)} per share.

Business Overview:
${selectedStock.about}

This report was dynamically generated and aggregated from the FinPulse AI terminal.
==================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded Annual Report for FY ${yr}`);
  };

  const handleDownloadPPT = (date: string) => {
    if (!selectedStock) return;
    const filename = `${selectedStock.symbol}_Investor_Presentation_${date.replace(' ', '_')}.txt`;
    const content = `==================================================
INVESTOR PRESENTATION - ${date}
==================================================
COMPANY: ${selectedStock.name} (${selectedStock.symbol})

Slide Outline:

[Slide 1: Title & Executive Summary]
- Welcoming remarks for ${selectedStock.name}'s ${date} Earnings Concall.
- Presenters: CFO, Managing Director, and Investor Relations lead.

[Slide 2: Q1 FY27 Operational Highlights]
- Core volumes grew in line with sector expectations.
- Operational EBITDA margins maintained at strong thresholds.
- Strategic advancements in product development and market penetration.

[Slide 3: Segment Performance Overview]
- Strong traction observed in core business segments.
- Emerging initiatives scaling up in high-margin sectors.

[Slide 4: Financial Walkthrough]
- Key Ratios: ROCE of ${selectedStock.roce.toFixed(2)}%, ROE of ${selectedStock.roe.toFixed(2)}%.
- Debt-to-Equity remains healthy.

[Slide 5: Guidance & Outlook]
- Expecting stable demand conditions.
- Capital expenditure targets outlined for the remainder of the fiscal year.
==================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded Investor Presentation for ${date}`);
  };

  const showTranscript = (date: string) => {
    if (!selectedStock) return;
    const content = `[Operator]: Good afternoon everyone, and welcome to ${selectedStock.name}'s Q1 Earnings Conference Call. We have with us today the senior leadership team.

[Managing Director]: Thank you, and welcome. We are pleased to report steady growth for the period ending ${date}. Our core revenues increased due to stronger market demand and solid operational execution. Our margins have stabilized, and we continue to prioritize cost optimizations.

[CFO]: Summarizing our numbers: our pricing strategy has yielded great return ratios, with our ROCE currently standing at ${selectedStock.roce.toFixed(2)}% and ROE at ${selectedStock.roe.toFixed(2)}%. Cash flow from operations remains healthy, and we are well-positioned for our next capital expenditure cycle.

[Operator]: We will now open the floor for investor questions.

[Analyst]: Could you share color on segment demand and the margin outlook?

[Managing Director]: Segment demand is robust. We expect margin stability to hold through the next two quarters as supply chains normalize.`;

    setActiveDocumentModal({
      type: 'transcript',
      title: `${selectedStock.symbol} Concall Transcript - ${date}`,
      content
    });
  };

  const showAISummary = (date: string) => {
    if (!selectedStock) return;
    const content = `### 🌟 FinPulse AI Concall Summary for ${selectedStock.name} (${date})

#### 📈 Key Takeaways:
- **Steady Operational Performance**: Core business volumes grew constructively, showcasing resilience.
- **Return Metrics Profile**: Strong profitability ratios with ROCE at **${selectedStock.roce.toFixed(2)}%** and ROE at **${selectedStock.roe.toFixed(2)}%**.
- **Margin Environment**: CFO highlighted operational margin resilience, expecting cost efficiency initiatives to carry forward.

#### 🔍 Key Strengths Discussed:
1. Robust order pipeline backing long-term revenue visibility.
2. Healthy cash flow from operations backing upcoming planned capital expenditures.

#### ⚠️ Watchouts & Risks:
1. Short-term headwinds from raw material pricing.
2. Premium valuations (P/E ratio of **${selectedStock.peRatio.toFixed(1)}x** is premium relative to peers).`;

    setActiveDocumentModal({
      type: 'summary',
      title: `🤖 AI Concall Summary - ${selectedStock.symbol} (${date})`,
      content
    });
  };

  // Watchlist integration
  const { data: watchlists = [] } = useWatchlists();
  const addWatchlistItemMutation = useAddWatchlistItem();
  const removeWatchlistItemMutation = useRemoveWatchlistItem();
  const createWatchlistMutation = useCreateWatchlist();

  // Find if current selectedStock is in any watchlist
  const watchlistItem = useMemo(() => {
    if (!selectedStock) return null;
    for (const list of watchlists) {
      const found = list.items?.find((item: any) => item.symbol.toUpperCase() === selectedStock.symbol.toUpperCase());
      if (found) {
        return { ...found, listId: list.id };
      }
    }
    return null;
  }, [watchlists, selectedStock]);

  const isFollowing = !!watchlistItem;

  const handleFollowToggle = async () => {
    if (!selectedStock) return;

    if (isFollowing) {
      removeWatchlistItemMutation.mutate(watchlistItem.id, {
        onSuccess: () => {
          toast.success(`Removed ${selectedStock.symbol} from watchlist`);
        },
        onError: (err: any) => {
          toast.error(`Failed to remove: ${err.message || err}`);
        }
      });
    } else {
      let targetListId = watchlists[0]?.id;
      if (!targetListId) {
        createWatchlistMutation.mutate({ name: "My Watchlist" }, {
          onSuccess: (newList) => {
            addWatchlistItemMutation.mutate({
              listId: newList.id,
              item: { symbol: selectedStock.symbol, notes: "Added from Screener" }
            });
          },
          onError: (err: any) => {
            toast.error(`Failed to create watchlist: ${err.message || err}`);
          }
        });
      } else {
        addWatchlistItemMutation.mutate({
          listId: targetListId,
          item: { symbol: selectedStock.symbol, notes: "Added from Screener" }
        });
      }
    }
  };

  // Shareholding Pattern calculation
  const shareholdingData = useMemo(() => {
    if (!selectedStock) return null;

    const quarters = [
      'Jun 2023', 'Sep 2023', 'Dec 2023', 'Mar 2024',
      'Jun 2024', 'Sep 2024', 'Dec 2024', 'Mar 2025',
      'Jun 2025', 'Sep 2025', 'Dec 2025', 'Mar 2026'
    ];

    let hash = 0;
    for (let i = 0; i < selectedStock.symbol.length; i++) {
      hash = selectedStock.symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash) % 100;

    const initialPromoters = 35 + (seed % 35);
    const initialFIIs = 5 + ((seed * 7) % 20);
    const initialDIIs = 5 + ((seed * 3) % 15);
    const initialPublic = 100 - (initialPromoters + initialFIIs + initialDIIs);

    const promotersValues: number[] = [];
    const fiiValues: number[] = [];
    const diiValues: number[] = [];
    const publicValues: number[] = [];
    const shareholdersValues: number[] = [];

    let p = initialPromoters;
    let f = initialFIIs;
    let d = initialDIIs;
    let pub = initialPublic;
    let sh = 15000 + (seed * 2000);

    for (let i = 0; i < quarters.length; i++) {
      const driftSeed = Math.sin(seed + i);
      const dp = parseFloat((driftSeed * 0.15).toFixed(2));
      const df = parseFloat((Math.cos(seed + i) * 0.2).toFixed(2));
      const dd = parseFloat((Math.sin(seed * 2 + i) * 0.1).toFixed(2));

      p = parseFloat(Math.max(10, Math.min(95, p + dp)).toFixed(2));
      f = parseFloat(Math.max(0, Math.min(50, f + df)).toFixed(2));
      d = parseFloat(Math.max(0, Math.min(50, d + dd)).toFixed(2));
      pub = parseFloat((100 - (p + f + d)).toFixed(2));

      sh = Math.round(sh * (1 + (Math.sin(i * 1.5) * 0.05)));

      promotersValues.push(p);
      fiiValues.push(f);
      diiValues.push(d);
      publicValues.push(pub);
      shareholdersValues.push(sh);
    }

    return {
      quarters,
      rows: [
        { label: 'Promoters +', values: promotersValues, isPercent: true },
        { label: 'FIIs +', values: fiiValues, isPercent: true },
        { label: 'DIIs +', values: diiValues, isPercent: true },
        { label: 'Public +', values: publicValues, isPercent: true },
        { label: 'No. of Shareholders', values: shareholdersValues, isPercent: false }
      ]
    };
  }, [selectedStock]);
  const healthScore = useMemo(() => {
    if (!selectedStock) return 50;
    let score = 50;
    if (selectedStock.roce > 20) score += 15;
    else if (selectedStock.roce > 12) score += 5;
    if (selectedStock.roe > 15) score += 15;
    else if (selectedStock.roe > 10) score += 5;
    if (selectedStock.peRatio >= 10 && selectedStock.peRatio <= 25) score += 15;
    else if (selectedStock.peRatio < 10) score += 5;
    if (selectedStock.dividendYield > 1.5) score += 10;
    const highPct = (selectedStock.price / selectedStock.high52w);
    if (highPct > 0.8) score += 10;
    return Math.min(100, Math.max(10, score));
  }, [selectedStock]);

  const isIndian = selectedStock?.symbol.endsWith('.NS');
  const currencySymbol = isIndian ? '₹' : '$';
  const peerData = selectedStock ? getPeerGroup(selectedStock.symbol) : null;

  const technicals = useMemo(() => {
    if (!selectedStock) return null;
    let hash = 0;
    for (let i = 0; i < selectedStock.symbol.length; i++) {
      hash = selectedStock.symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    const rsi = 30 + (seed % 45); // 30 to 75
    const beta = 0.5 + (seed % 100) / 100; // 0.5 to 1.5
    const macd = (seed % 2) === 0 ? 'Bullish Crossover' : 'Bearish Crossover';
    const trend = rsi > 60 ? 'Strong Bullish' : rsi < 40 ? 'Bearish' : 'Neutral Consolidation';
    return { rsi, beta, macd, trend };
  }, [selectedStock]);

  const downloadQuarterlyReport = (quarter: string, index: number) => {
    if (!selectedStock) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const unit = isIndian ? 'Rs. Crores' : 'USD Millions';
    const currency = isIndian ? '₹' : '$';

    const rowsHTML = quarterlyResults.map(row => {
      const val = row.values[index];
      const displayVal = row.isPercent
        ? `${val.toFixed(1)}%`
        : row.label.startsWith('EPS')
          ? `${currency}${val.toFixed(2)}`
          : `${currency}${val.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
      return `
        <tr style="${row.bold ? 'font-weight: bold; background-color: #f8fafc;' : ''}">
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0;">${row.label}</td>
          <td style="padding: 10px 12px; border: 1px solid #e2e8f0;" align="right">${displayVal}</td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedStock.symbol} Financial Report - ${quarter}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f1f5f9;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #475569;
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
            }
            td {
              padding: 10px 12px;
              font-size: 11px;
              border: 1px solid #e2e8f0;
            }
            .footer {
              margin-top: 40px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              font-size: 10px;
              color: #94a3b8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${selectedStock.name} (${selectedStock.symbol})</h1>
            <div class="subtitle">Financial Report — ${quarter} (${unit})</div>
          </div>

          <table>
            <thead>
              <tr>
                <th align="left">Metric / Feature</th>
                <th align="right">Value</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="footer">
            Generated by FinPulse-AI on ${new Date().toLocaleString()} | Confidential & Proprietary
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Interactive Chart Legend States
  const [showPrice, setShowPrice] = useState(true);
  const [showDMA50, setShowDMA50] = useState(false);
  const [showDMA200, setShowDMA200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  // Compute DMA50, DMA200, and mock volumes
  const chartData = useMemo(() => {
    if (!selectedStock) return [];

    const raw = selectedStock.history.map((item) => ({
      time: item.time,
      price: item.price,
      volume: Math.floor(1000 + Math.random() * 8000) * 1000 // mock volume in thousands
    }));

    // Calculate MA helper
    const calculateMA = (data: any[], period: number, key: string) => {
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          data[i][key] = null;
        } else {
          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += data[i - j].price;
          }
          data[i][key] = Math.round((sum / period) * 100) / 100;
        }
      }
    };

    calculateMA(raw, 5, 'dma50'); // 5 period MA as 50 DMA
    calculateMA(raw, 10, 'dma200'); // 10 period MA as 200 DMA

    return raw;
  }, [selectedStock]);

  // Compute dynamic Quarterly Results based on stock fundamentals
  const quarterlyResults = useMemo(() => {
    if (!selectedStock) return [];

    // Scale base quarterly sales by market cap
    const baseSales = selectedStock.marketCap / 12;
    const quarters = getDynamicQuarters();

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const sales: number[] = [];
    const expenses: number[] = [];
    const opProfit: number[] = [];
    const opm: number[] = [];
    const otherIncome: number[] = [];
    const interest: number[] = [];
    const depreciation: number[] = [];
    const pbt: number[] = [];
    const taxRate: number[] = [];
    const netProfit: number[] = [];
    const eps: number[] = [];

    quarters.forEach((_q, idx) => {
      const multiplier = 0.85 + ((seed * (idx + 1)) % 30) / 100;
      const qSales = baseSales * multiplier;

      const expenseRatio = 0.70 + ((seed * (idx + 5)) % 15) / 100;
      const qExpenses = qSales * expenseRatio;

      const qOpProfit = qSales - qExpenses;
      const qOpm = (qOpProfit / qSales) * 100;

      const qOtherIncome = qSales * 0.005;
      const qInterest = qSales * 0.015;
      const qDepreciation = qSales * 0.025;

      const qPbt = qOpProfit + qOtherIncome - qInterest - qDepreciation;
      const qTaxRate = 25 + ((seed * (idx + 8)) % 10);
      const qNetProfit = qPbt * (1 - qTaxRate / 100);

      const sharesOutstanding = selectedStock.marketCap / selectedStock.price;
      const qEps = qNetProfit / sharesOutstanding;

      sales.push(qSales);
      expenses.push(qExpenses);
      opProfit.push(qOpProfit);
      opm.push(qOpm);
      otherIncome.push(qOtherIncome);
      interest.push(qInterest);
      depreciation.push(qDepreciation);
      pbt.push(qPbt);
      taxRate.push(qTaxRate);
      netProfit.push(qNetProfit);
      eps.push(qEps);
    });

    return [
      { label: 'Sales +', values: sales, bold: false },
      { label: 'Expenses +', values: expenses, bold: false },
      { label: 'Operating Profit', values: opProfit, bold: true },
      { label: 'OPM %', values: opm, bold: false, isPercent: true },
      { label: 'Other Income +', values: otherIncome, bold: false },
      { label: 'Interest', values: interest, bold: false },
      { label: 'Depreciation', values: depreciation, bold: false },
      { label: 'Profit before tax', values: pbt, bold: true },
      { label: 'Tax %', values: taxRate, bold: false, isPercent: true },
      { label: 'Net Profit +', values: netProfit, bold: true },
      { label: 'EPS in ' + (isIndian ? 'Rs' : 'USD'), values: eps, bold: false }
    ];
  }, [selectedStock, isIndian]);

  // Compute dynamic annual Profit & Loss statements based on fundamentals
  const pnlResults = useMemo(() => {
    if (!selectedStock) return { rows: [], growth: { sales: {}, profit: {}, cagr: {}, roe: {} } };

    const years = getDynamicYears();
    const baseAnnualSales = selectedStock.marketCap / 3.5;

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const sales: number[] = [];
    const expenses: number[] = [];
    const opProfit: number[] = [];
    const opm: number[] = [];
    const otherIncome: number[] = [];
    const interest: number[] = [];
    const depreciation: number[] = [];
    const pbt: number[] = [];
    const taxRate: number[] = [];
    const netProfit: number[] = [];
    const eps: number[] = [];
    const divPayout: number[] = [];

    years.forEach((_yr, idx) => {
      // Simulate historical growth from 2006/2007 vs recent years
      let scale = 1;
      if (idx === 0) scale = 0.08; // 2006
      else if (idx === 1) scale = 0.11; // 2007
      else if (idx === 2) scale = 0.75; // 2021
      else if (idx === 3) scale = 0.85; // 2022
      else if (idx === 4) scale = 0.92; // 2023
      else if (idx === 5) scale = 1.0;  // 2024
      else if (idx === 6) scale = 1.08; // 2025
      else if (idx === 7) scale = 1.15; // 2026

      const multiplier = 0.90 + ((seed * (idx + 3)) % 20) / 100;
      const yrSales = baseAnnualSales * scale * multiplier;

      const expenseRatio = 0.72 + ((seed * (idx + 7)) % 12) / 100;
      const yrExpenses = yrSales * expenseRatio;

      const yrOpProfit = yrSales - yrExpenses;
      const yrOpm = (yrOpProfit / yrSales) * 100;

      const yrOtherIncome = yrSales * 0.008;
      const yrInterest = yrSales * 0.012;
      const yrDepreciation = yrSales * 0.02;

      const yrPbt = yrOpProfit + yrOtherIncome - yrInterest - yrDepreciation;
      const yrTaxRate = 22 + ((seed * (idx + 11)) % 10);
      const yrNetProfit = yrPbt * (1 - yrTaxRate / 100);

      const sharesOutstanding = selectedStock.marketCap / selectedStock.price;
      const yrEps = yrNetProfit / sharesOutstanding;
      const yrDivPayout = 5 + ((seed * (idx + 13)) % 35); // 5-40%

      sales.push(yrSales);
      expenses.push(yrExpenses);
      opProfit.push(yrOpProfit);
      opm.push(yrOpm);
      otherIncome.push(yrOtherIncome);
      interest.push(yrInterest);
      depreciation.push(yrDepreciation);
      pbt.push(yrPbt);
      taxRate.push(yrTaxRate);
      netProfit.push(yrNetProfit);
      eps.push(yrEps);
      divPayout.push(yrDivPayout);
    });

    // Deterministic growth values for the bottom 4 boxes
    const gSales5 = 10 + (seed % 15);
    const gSales3 = 8 + (seed % 10);
    const gSalesTTM = -5 - (seed % 10);

    const gProfit5 = 5 + (seed % 12);
    const gProfit3 = -10 - (seed % 15);
    const gProfitTTM = -40 - (seed % 40);

    const cagr10 = 10 + (seed % 10);
    const cagr5 = 45 + (seed % 40);
    const cagr3 = 30 + (seed % 30);
    const cagr1 = 5 + (seed % 20);

    const roe5 = 15 + (seed % 10);
    const roe3 = 14 + (seed % 8);
    const roeLast = 4 + (seed % 6);

    return {
      rows: [
        { label: 'Sales +', values: sales, bold: false },
        { label: 'Expenses +', values: expenses, bold: false },
        { label: 'Operating Profit', values: opProfit, bold: true },
        { label: 'OPM %', values: opm, bold: false, isPercent: true },
        { label: 'Other Income +', values: otherIncome, bold: false },
        { label: 'Interest', values: interest, bold: false },
        { label: 'Depreciation', values: depreciation, bold: false },
        { label: 'Profit before tax', values: pbt, bold: true },
        { label: 'Tax %', values: taxRate, bold: false, isPercent: true },
        { label: 'Net Profit +', values: netProfit, bold: true },
        { label: 'EPS in ' + (isIndian ? 'Rs' : 'USD'), values: eps, bold: false },
        { label: 'Dividend Payout %', values: divPayout, bold: false, isPercent: true }
      ],
      growth: {
        sales: { y10: '12%', y5: `${gSales5}%`, y3: `${gSales3}%`, ttm: `${gSalesTTM}%` },
        profit: { y10: '15%', y5: `${gProfit5}%`, y3: `${gProfit3}%`, ttm: `${gProfitTTM}%` },
        cagr: { y10: `${cagr10}%`, y5: `${cagr5}%`, y3: `${cagr3}%`, y1: `${cagr1}%` },
        roe: { y10: '18%', y5: `${roe5}%`, y3: `${roe3}%`, last: `${roeLast}%` }
      }
    };
  }, [selectedStock, isIndian]);

  // Compute dynamic annual Balance Sheets based on fundamentals
  const balanceSheetResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getDynamicYears();
    const baseAssetsVal = selectedStock.marketCap / 3.0;

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const equity: number[] = [];
    const reserves: number[] = [];
    const borrowings: number[] = [];
    const otherLiabilities: number[] = [];
    const totalLiabilities: number[] = [];

    const fixedAssets: number[] = [];
    const cwip: number[] = [];
    const investments: number[] = [];
    const otherAssets: number[] = [];
    const totalAssets: number[] = [];

    years.forEach((_yr, idx) => {
      let scale = 1;
      if (idx === 0) scale = 0.07;
      else if (idx === 1) scale = 0.10;
      else if (idx === 2) scale = 0.70;
      else if (idx === 3) scale = 0.82;
      else if (idx === 4) scale = 0.90;
      else if (idx === 5) scale = 1.0;
      else if (idx === 6) scale = 1.10;
      else if (idx === 7) scale = 1.25;

      const multiplier = 0.92 + ((seed * (idx + 4)) % 15) / 100;
      const totalVal = baseAssetsVal * scale * multiplier;

      // Liabilities breakdown
      const eqVal = Math.round(totalVal * 0.05);
      const resVal = Math.round(totalVal * 0.65);
      const borVal = Math.round(totalVal * 0.15);
      const othLiabVal = Math.round(totalVal - (eqVal + resVal + borVal));
      const totLiab = eqVal + resVal + borVal + othLiabVal;

      // Assets breakdown
      const fixVal = Math.round(totalVal * 0.45);
      const cwipVal = Math.round(totalVal * 0.05);
      const invVal = Math.round(totalVal * 0.10);
      const othAssetVal = Math.round(totalVal - (fixVal + cwipVal + invVal));
      const totAsset = fixVal + cwipVal + invVal + othAssetVal;

      equity.push(eqVal);
      reserves.push(resVal);
      borrowings.push(borVal);
      otherLiabilities.push(othLiabVal);
      totalLiabilities.push(totLiab);

      fixedAssets.push(fixVal);
      cwip.push(cwipVal);
      investments.push(invVal);
      otherAssets.push(othAssetVal);
      totalAssets.push(totAsset);
    });

    return [
      { label: 'Equity Capital', values: equity, bold: false },
      { label: 'Reserves', values: reserves, bold: false },
      { label: 'Borrowings +', values: borrowings, bold: false },
      { label: 'Other Liabilities +', values: otherLiabilities, bold: false },
      { label: 'Total Liabilities', values: totalLiabilities, bold: true },
      { label: 'Fixed Assets +', values: fixedAssets, bold: false },
      { label: 'CWIP', values: cwip, bold: false },
      { label: 'Investments', values: investments, bold: false },
      { label: 'Other Assets +', values: otherAssets, bold: false },
      { label: 'Total Assets', values: totalAssets, bold: true }
    ];
  }, [selectedStock]);

  // Compute dynamic annual Cash Flows based on fundamentals
  const cashFlowResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getDynamicYears();
    const baseAnnualSales = selectedStock.marketCap / 3.5;

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const cfo: number[] = [];
    const cfi: number[] = [];
    const cff: number[] = [];
    const netCash: number[] = [];
    const freeCash: number[] = [];
    const cfoOpRatio: number[] = [];

    years.forEach((_yr, idx) => {
      let scale = 1;
      if (idx === 0) scale = 0.08;
      else if (idx === 1) scale = 0.11;
      else if (idx === 2) scale = 0.75;
      else if (idx === 3) scale = 0.85;
      else if (idx === 4) scale = 0.92;
      else if (idx === 5) scale = 1.0;
      else if (idx === 6) scale = 1.08;
      else if (idx === 7) scale = 1.15;

      const multiplier = 0.90 + ((seed * (idx + 3)) % 20) / 100;
      const yrSales = baseAnnualSales * scale * multiplier;

      const expenseRatio = 0.72 + ((seed * (idx + 7)) % 12) / 100;
      const yrExpenses = yrSales * expenseRatio;
      const yrOpProfit = yrSales - yrExpenses;

      const cfoVal = Math.round(yrOpProfit * (0.80 + ((seed * (idx + 9)) % 15) / 100));
      const cfiVal = -Math.round(cfoVal * (0.50 + ((seed * (idx + 10)) % 20) / 100));
      const cffVal = Math.round(cfoVal * (-0.30 + ((seed * (idx + 11)) % 40) / 100));

      const netVal = cfoVal + cfiVal + cffVal;
      const fcfVal = cfoVal + cfiVal;
      const cfoOpPercent = (cfoVal / (yrOpProfit || 1)) * 100;

      cfo.push(cfoVal);
      cfi.push(cfiVal);
      cff.push(cffVal);
      netCash.push(netVal);
      freeCash.push(fcfVal);
      cfoOpRatio.push(cfoOpPercent);
    });

    return [
      { label: 'Cash from Operating Activity +', values: cfo, bold: false },
      { label: 'Cash from Investing Activity +', values: cfi, bold: false },
      { label: 'Cash from Financing Activity +', values: cff, bold: false },
      { label: 'Net Cash Flow', values: netCash, bold: true },
      { label: 'Free Cash Flow', values: freeCash, bold: false },
      { label: 'CFO/OP', values: cfoOpRatio, bold: false, isPercent: true }
    ];
  }, [selectedStock]);

  // Compute dynamic annual Ratios statement based on fundamentals
  const ratiosResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getDynamicYears();

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const debtorDays: number[] = [];
    const inventoryDays: number[] = [];
    const daysPayable: number[] = [];
    const cashConversionCycle: number[] = [];
    const workingCapitalDays: number[] = [];
    const roce: number[] = [];

    years.forEach((_yr, idx) => {
      const db = 40 + ((seed * (idx + 2)) % 95);
      const inv = 30 + ((seed * (idx + 5)) % 320);
      const pay = 20 + ((seed * (idx + 7)) % 110);

      const ccc = db + inv - pay;
      const wc = Math.round(ccc * 0.35 + ((seed * (idx + 9)) % 45));
      const rocVal = 8 + ((seed * (idx + 12)) % 40);

      debtorDays.push(db);
      inventoryDays.push(inv);
      daysPayable.push(pay);
      cashConversionCycle.push(ccc);
      workingCapitalDays.push(wc);
      roce.push(rocVal);
    });

    return [
      { label: 'Debtor Days', values: debtorDays, bold: false },
      { label: 'Inventory Days', values: inventoryDays, bold: false },
      { label: 'Days Payable', values: daysPayable, bold: false },
      { label: 'Cash Conversion Cycle', values: cashConversionCycle, bold: true },
      { label: 'Working Capital Days', values: workingCapitalDays, bold: false },
      { label: 'ROCE %', values: roce, bold: true, isPercent: true }
    ];
  }, [selectedStock]);

  // Compute dynamic Insights statement based on fundamentals
  const insightsResults = useMemo(() => {
    if (!selectedStock) return [];

    const years = getInsightsYears();

    // Deterministic hash seed based on company symbol
    const getHashSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };
    const seed = getHashSeed(selectedStock.symbol);

    const employees: number[] = [];
    const rnd: number[] = [];
    const exportShare: number[] = [];
    const commsShare: number[] = [];
    const healthShare: number[] = [];
    const orderBook: number[] = [];
    const rndPct: number[] = [];

    years.forEach((_yr, idx) => {
      const empVal = Math.round((200 + (seed % 900)) * (1 + idx * 0.05));
      const rndVal = 1.0 + ((seed * (idx + 1)) % 7) / 2;
      const expVal = 5 + ((seed * (idx + 2)) % 30);
      const commVal = 15 + ((seed * (idx + 3)) % 35);
      const healVal = 8 + ((seed * (idx + 4)) % 22);
      const orderVal = Math.round((selectedStock.marketCap / 14) * (0.6 + ((seed * (idx + 5)) % 10) / 10));

      employees.push(empVal);
      rnd.push(rndVal);
      exportShare.push(expVal);
      commsShare.push(commVal);
      healthShare.push(healVal);
      orderBook.push(orderVal);
      rndPct.push(rndVal);
    });

    return [
      { label: 'Permanent Employees', desc: 'Count · Standalone data', values: employees, isPercent: false },
      { label: 'R&D Expenditure as % of Turnover', desc: '% · Standalone data', values: rnd, isPercent: true },
      { label: 'Export Revenue Share of Total Turnover', desc: '% · Standalone data', values: exportShare, isPercent: true },
      { label: 'Communications Segment Revenue Share', desc: '%', values: commsShare, isPercent: true },
      { label: 'Healthcare (Imeds) Segment Revenue Share', desc: '%', values: healthShare, isPercent: true },
      { label: 'Order Book Position', desc: isIndian ? 'Rs Crore · Standalone data' : 'USD Millions · Standalone data', values: orderBook, isPercent: false },
      { label: 'R&D Expenditure (Percentage of Turnover)', desc: '% · Standalone data', values: rndPct, isPercent: true }
    ];
  }, [selectedStock, isIndian]);

  const creditRatings = useMemo(() => {
    if (!selectedStock) return [];

    // Hash-based seed
    let hash = 0;
    for (let i = 0; i < selectedStock.symbol.length; i++) {
      hash = selectedStock.symbol.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);

    const isIndian = selectedStock.symbol.endsWith('.NS');
    const agencies = isIndian
      ? ['CRISIL Ltd', 'ICRA Ltd', 'CARE Ratings', 'India Ratings', 'SMERA Ratings']
      : ['S&P Global', 'Moody\'s', 'Fitch Ratings', 'DBRS Morningstar'];

    const ratings = [];
    const baseYears = [2026, 2025, 2024, 2023];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 4; i++) {
      const year = baseYears[i];
      const monthIdx = (seed + i * 3) % 12;
      const month = months[monthIdx];
      const day = 1 + ((seed + i * 7) % 28);
      const date = `${day} ${month} ${year}`;

      const agency = agencies[(seed + i) % agencies.length];

      // Upgrade or Downgrade based on financials
      const health = selectedStock.roce + selectedStock.roe;
      let label = 'Rating update';
      let status = 'Stable';
      if (health > 35 && (seed + i) % 2 === 0) {
        label = 'Rating upgrade';
        status = 'Positive';
      } else if (health < 15 && (seed + i) % 3 === 0) {
        label = 'Rating downgrade';
        status = 'Negative';
      }

      ratings.push({ label, date, agency, status });
    }

    return ratings;
  }, [selectedStock]);

  // Handle stock selection and fetch data
  const handleSelectStock = async (symbol: string) => {
    setIsLoading(true);
    try {
      const [fundamentals, historyData, _aiScore, newsData] = await Promise.all([
        getFundamentals(symbol),
        getMarketHistory(symbol, timeframe).catch(() => []),
        getAIScore(symbol).catch(() => ({ score: 70 })),
        getCompanyNews(symbol).catch(() => [])
      ]);

      const history = historyData.map((h: any, idx: number) => ({
        time: new Date(h.date || Date.now() - (historyData.length - idx) * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        price: h.price
      })).filter((item: any) => typeof item.price === 'number');

      setCompanyNews(newsData);

      const isIndian = symbol.endsWith('.NS');

      const details: StockDetails = {
        symbol: symbol.toUpperCase(),
        name: fundamentals.name || symbol,
        price: fundamentals.price || 150,
        changePercent: fundamentals.changePercent || 0,
        marketCap: fundamentals.marketCap ? (fundamentals.marketCap / 10000000) : (5000 + Math.random() * 20000), // formatted Cr/M
        peRatio: fundamentals.peRatio || (15 + Math.random() * 30),
        dividendYield: isIndian ? 1.25 : 0.65,
        roe: 14.5 + Math.random() * 10,
        roce: 16.2 + Math.random() * 12,
        bookValue: (fundamentals.price || 150) / 4.2,
        high52w: (fundamentals.price || 150) * 1.25,
        low52w: (fundamentals.price || 150) * 0.75,
        faceValue: isIndian ? 10.00 : 1.00,
        about: `${fundamentals.name || symbol} is a leading enterprise in its sector, engaged in operations, manufacturing, research, development, and marketing of high-technology products and services globally.`,
        history: history.length > 0 ? history : [
          { time: 'Jan', price: (fundamentals.price || 150) * 0.9 },
          { time: 'Mar', price: (fundamentals.price || 150) * 0.95 },
          { time: 'Jun', price: (fundamentals.price || 150) * 1.05 },
          { time: 'Sep', price: (fundamentals.price || 150) * 0.98 },
          { time: 'Dec', price: (fundamentals.price || 150) }
        ]
      };

      setSelectedStock(details);
    } catch (error) {
      console.error("Error loading stock details:", error);
      toast.error("Failed to load details for " + symbol);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch again if timeframe changes for selected stock
  useEffect(() => {
    if (selectedStock) {
      handleSelectStock(selectedStock.symbol);
    }
  }, [timeframe]);

  // Scroll Spy state and listener
  useEffect(() => {
    if (!selectedStock) return;

    const handleScroll = () => {
      // Check if we are at the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;

      const sections = [
        { id: 'screener-analysis', tab: 'analysis' },
        { id: 'screener-workbook', tab: 'workbook' },
        { id: 'screener-shareholding', tab: 'shareholding' },
        { id: 'screener-documents', tab: 'documents' }
      ];

      if (isAtBottom) {
        setActiveTab('documents');
        return;
      }

      // Otherwise, find the section closest to the top of the viewport
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveTab(sections[i].tab as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedStock]);

  return (
    <div className="min-h-[85vh] bg-[#090d16] text-slate-200 font-sans transition-colors duration-300 relative w-full p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl border border-white/5">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-night-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
          <div className="h-10 w-10 border-4 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 1. LANDING SEARCH VIEW */}
      {!selectedStock ? (
        <div className="min-h-[70vh] flex flex-col justify-center items-center max-w-2xl mx-auto text-center space-y-8 py-12 px-4 sm:px-6 bg-[#f8f9fa] dark:bg-night-950 rounded-3xl border border-slate-200 dark:border-white/5 mt-8 shadow-sm">
          {/* Logo & Subtitle */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-800 dark:text-white font-extrabold text-5xl tracking-tight">
                screener
              </span>
              <svg
                className="h-10 w-10 text-emerald-500 dark:text-emerald-450"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-medium">
              Stock analysis and screening tool for investors in India & global markets.
            </p>
          </div>

          {/* Search bar wrapper */}
          <div className="w-full bg-white dark:bg-night-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/5 p-2">
            <StockSearch
              placeholder="Search for a company"
              onSelect={(asset) => handleSelectStock(asset.symbol)}
            />
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs md:text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Or analyse:</span>
              {SUGGESTED_COMPANIES.map((company) => (
                <button
                  key={company.symbol}
                  onClick={() => handleSelectStock(company.symbol)}
                  className="px-3.5 py-1.5 bg-white hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-cyan-500/10 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-cyan-400 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm font-medium transition-all"
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (

        // 2. DETAILED ANALYSIS VIEW
        <div className="space-y-6 animate-fadeIn relative">
          {/* Ambient background glows for glassmorphic elements */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-400/10 dark:bg-purple-650/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-blue-300/5 dark:bg-blue-900/5 rounded-full blur-3xl pointer-events-none" />

          {/* Streamlined Combined Company Header Row */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSelectedStock(null)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold text-xs transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Search</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block shrink-0" />

              <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate leading-none">
                  {selectedStock.name}
                </h1>
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 text-[9px] font-black uppercase rounded tracking-wider shrink-0 leading-none">
                  {selectedStock.symbol}
                </span>
              </div>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 shrink-0" />

              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white leading-none">
                  {currencySymbol}{selectedStock.price.toFixed(2)}
                </span>
                <span className={`font-mono text-[10px] font-black leading-none ${selectedStock.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
              <div className="w-full sm:w-60 bg-white dark:bg-night-900 rounded-xl border border-slate-200 dark:border-white/5 p-0.5 shadow-sm">
                <StockSearch
                  placeholder="Search another company"
                  onSelect={(asset) => handleSelectStock(asset.symbol)}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm whitespace-nowrap">
                  <Download className="h-3.5 w-3.5" /> Export Excel
                </button>
                <button
                  onClick={handleFollowToggle}
                  disabled={addWatchlistItemMutation.isPending || removeWatchlistItemMutation.isPending || createWatchlistMutation.isPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm whitespace-nowrap ${isFollowing
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-600 hover:bg-blue-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-night-950'
                    }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Following
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Follow
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Main content wrapper with sticky left sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full relative mt-4">
            {/* Sticky Left Sidebar Navbar */}
            <div className="hidden lg:flex lg:flex-col gap-1.5 w-52 shrink-0 sticky top-24 self-start bg-transparent p-0 z-20">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2">Sections</div>
              {[
                { id: 'screener-analysis', label: 'Analysis', tab: 'analysis' },
                { id: 'screener-workbook', label: 'Financial Workbook', tab: 'workbook' },
                { id: 'screener-shareholding', label: 'Shareholding Pattern', tab: 'shareholding' },
                { id: 'screener-documents', label: 'Document Hub', tab: 'documents' },
              ].map((tab) => (
                <button
                  key={tab.tab}
                  onClick={() => {
                    setActiveTab(tab.tab as any);
                    const el = document.getElementById(tab.id);
                    if (el) {
                      const headerOffset = 90; // Adjust for sticky header height
                      const elementPosition = el.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.scrollY - headerOffset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 text-left w-full ${activeTab === tab.tab
                    ? 'border-l-2 border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400 pl-4 font-black bg-slate-50/50 dark:bg-white/[0.01]'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border-l border-transparent pl-3 hover:bg-slate-50/30 dark:hover:bg-white/[0.005]'
                    }`}
                  title={tab.label}
                >
                  {tab.label}
                </button>
              ))}   {/* ERROR WAS COMING (FIX)*/}
            </div>

            {/* Right main content container */}
            <div className="flex-1 min-w-0 space-y-6 w-full">
              {/* Tab Selection Navigation Bar (Mobile / Tablet only) */}
              <div className="lg:hidden flex items-center gap-1 bg-slate-100/70 dark:bg-white/[0.02] backdrop-blur-md p-1 rounded-full border border-slate-200/50 dark:border-white/5 shadow-inner mt-2 w-full overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1 min-w-max">
                  {[
                    { id: 'screener-analysis', label: 'Analysis', tab: 'analysis' },
                    { id: 'screener-workbook', label: 'Financial Workbook', tab: 'workbook' },
                    { id: 'screener-shareholding', label: 'Shareholding Pattern', tab: 'shareholding' },
                    { id: 'screener-documents', label: 'Document Hub', tab: 'documents' },
                  ].map((tab) => (
                    <button
                      key={tab.tab}
                      onClick={() => {
                        setActiveTab(tab.tab as any);
                        const el = document.getElementById(tab.id);
                        if (el) {
                          const headerOffset = 90; // Adjust for sticky header height
                          const elementPosition = el.getBoundingClientRect().top;
                          const offsetPosition = elementPosition + window.scrollY - headerOffset;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full transition-all duration-300 whitespace-nowrap ${activeTab === tab.tab
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 dark:from-cyan-400 dark:to-teal-400 dark:text-slate-950 dark:shadow-cyan-400/20 transform scale-105'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-white/5'
                        }`}
                      title={tab.label}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Chart & Key Metrics Grid */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Chart Section */}
                  <div id="screener-chart" className="border-b border-slate-200/60 dark:border-white/10 pb-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10">
                          <TrendingUp className="h-4.5 w-4.5" />
                        </span>
                        Share Price & Volume
                      </h3>

                      {/* Timeframe Selectors */}
                      <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1 shadow-inner">
                        {(['1mo', '3mo', '1yr', 'max'] as const).map((tf) => (
                          <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${timeframe === tf
                              ? 'bg-white text-slate-855 dark:bg-white/10 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Composed Chart Container */}
                    <div className="h-72 w-full font-mono text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" className="dark:stroke-white/5" />
                          <XAxis dataKey="time" stroke="#888888" tickLine={false} axisLine={false} />

                          {/* Left Axis for Volume */}
                          <YAxis yAxisId="left" stroke="#888888" tickLine={false} axisLine={false} orientation="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />

                          {/* Right Axis for Price */}
                          <YAxis yAxisId="right" stroke="#888888" tickLine={false} axisLine={false} orientation="right" domain={['auto', 'auto']} tickFormatter={(v) => `${currencySymbol}${v}`} />

                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(9, 13, 26, 0.95)',
                              borderRadius: '16px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff'
                            }}
                          />

                          {/* Render Volume Bars */}
                          {showVolume && (
                            <Bar yAxisId="left" dataKey="volume" fill="#93c5fd" opacity={0.35} barSize={8} radius={[2, 2, 0, 0]} />
                          )}

                          {/* Render Price Line */}
                          {showPrice && (
                            <Line yAxisId="right" type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2.2} dot={false} name="Price" />
                          )}

                          {/* Render 50 DMA */}
                          {showDMA50 && (
                            <Line yAxisId="right" type="monotone" dataKey="dma50" stroke="#f59e0b" strokeWidth={1.8} dot={false} strokeDasharray="4 4" name="50 DMA" />
                          )}

                          {/* Render 200 DMA */}
                          {showDMA200 && (
                            <Line yAxisId="right" type="monotone" dataKey="dma200" stroke="#ef4444" strokeWidth={1.8} dot={false} strokeDasharray="4 4" name="200 DMA" />
                          )}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Checkboxes Legend Row at the bottom */}
                    <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-100 dark:border-white/5 text-xs font-bold text-slate-655 dark:text-slate-350">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>Price on {isIndian ? 'NSE' : 'NASDAQ'}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showDMA50} onChange={(e) => setShowDMA50(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>50 DMA</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showDMA200} onChange={(e) => setShowDMA200(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>200 DMA</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors">
                        <input type="checkbox" checked={showVolume} onChange={(e) => setShowVolume(e.target.checked)} className="rounded text-blue-650 focus:ring-blue-500 accent-blue-600 dark:accent-cyan-400 h-4 w-4" />
                        <span>Volume</span>
                      </label>
                    </div>
                  </div>

                  {/* Key Financial Ratios */}
                  <div id="screener-key-ratios" className="border-b border-slate-200/60 dark:border-white/10 pb-8 mt-6">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4 sm:mb-5 pb-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10">
                        <Bookmark className="h-4 w-4" />
                      </span>
                      Key Financial Ratios
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {[
                        { label: 'Market Cap', value: `${currencySymbol}${selectedStock.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${isIndian ? 'Cr.' : 'M'}`, desc: 'Total market value', icon: '💰' },
                        { label: 'Current Price', value: `${currencySymbol}${selectedStock.price.toFixed(2)}`, desc: 'Latest trading price', icon: '📈' },
                        { label: 'High / Low', value: `${currencySymbol}${selectedStock.high52w.toFixed(0)} / ${currencySymbol}${selectedStock.low52w.toFixed(0)}`, desc: '52-week stock range', icon: '↕️' },
                        { label: 'Stock P/E', value: `${selectedStock.peRatio.toFixed(1)}x`, desc: 'Price-to-earnings multiple', icon: '📊' },
                        { label: 'Book Value', value: `${currencySymbol}${selectedStock.bookValue.toFixed(1)}`, desc: 'Net asset value per share', icon: '📕' },
                        { label: 'Dividend Yield', value: `${selectedStock.dividendYield.toFixed(2)}%`, desc: 'Annual dividend return', icon: '💸' },
                        { label: 'ROCE', value: `${selectedStock.roce.toFixed(2)}%`, desc: 'Capital deployment return', icon: '⚡' },
                        { label: 'ROE', value: `${selectedStock.roe.toFixed(2)}%`, desc: 'Return on equity', icon: '🎯' },
                        { label: 'Face Value', value: `${currencySymbol}${selectedStock.faceValue.toFixed(2)}`, desc: 'Par value per share', icon: '💎' },
                      ].map((ratio) => (
                        <div key={ratio.label} className="bg-slate-50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] border border-slate-150/40 dark:border-white/[0.03] p-3 sm:p-4 rounded-2xl flex items-start gap-2 sm:gap-3 transition-all">
                          <span className="text-lg sm:text-xl pt-0.5 shrink-0">{ratio.icon}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{ratio.label}</span>
                            <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 break-all">{ratio.value}</span>
                            <span className="text-[8px] text-slate-400 mt-1 font-semibold leading-tight">{ratio.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: AI Advisor & Profile */}
                <div className="lg:col-span-1 space-y-6">

                  {/* AI Strength & Risk Advisor */}
                  <div id="screener-analysis" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-8 space-y-6 relative overflow-hidden text-slate-800 dark:text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Score Header */}
                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                      {/* Circular Progress Ring */}
                      <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
                        <svg className="absolute transform -rotate-90 w-16 h-16">
                          <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="transparent" />
                          <circle cx="32" cy="32" r="28" stroke="url(#healthGrad)" strokeWidth="4" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * healthScore) / 100} strokeLinecap="round" />
                          <defs>
                            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#22c55e" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="font-mono text-base font-black text-white">{healthScore}</span>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="h-3 w-3 animate-pulse" /> AI Health Index
                        </span>
                        <h3 className="text-sm font-extrabold text-white mt-0.5">
                          {healthScore >= 75 ? 'Excellent Health' : healthScore >= 60 ? 'Strong Performance' : 'Stable Outlook'}
                        </h3>
                      </div>
                    </div>

                    {/* Pros List */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Strategic Strengths
                      </h4>
                      <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-black">✓</span>
                          <span>Healthy dividend payout ratio maintained.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-black">✓</span>
                          <span>High capital efficiency (ROCE of {selectedStock.roce.toFixed(2)}%).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-black">✓</span>
                          <span>Consistent historical growth trajectory.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Cons List */}
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-455" /> Risk Factors
                      </h4>
                      <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400 font-black">✗</span>
                          <span>Trading high relative to book value ({(selectedStock.price / selectedStock.bookValue).toFixed(1)}x).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-400 font-black">✗</span>
                          <span>P/E ratio of {selectedStock.peRatio.toFixed(1)}x is premium.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Company Profile Section */}
                  <div className="border-b border-slate-200/60 dark:border-white/10 pb-8 space-y-4 mt-6">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-blue-600 dark:text-cyan-400" /> Company Profile
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed line-clamp-4" title={selectedStock.about}>
                      {selectedStock.about}
                    </p>
                    <div className="pt-2.5 border-t border-slate-100 dark:border-white/5">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Key Drivers</h4>
                      <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-3">
                        <li className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{selectedStock.roce > 18 ? 'High capital efficiency with' : 'Stable'} ROCE of {selectedStock.roce.toFixed(2)}%</span>
                        </li>
                        <li className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{selectedStock.peRatio > 25 ? 'Premium valuation multiple' : 'Reasonable pricing'} at {selectedStock.peRatio.toFixed(1)}x P/E</span>
                        </li>
                        <li className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>Strong return on equity (ROE) of {selectedStock.roe.toFixed(2)}%</span>
                        </li>
                        {selectedStock.dividendYield > 0.5 && (
                          <li className="flex items-center gap-2 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>Consistent dividend yield of {selectedStock.dividendYield.toFixed(2)}%</span>
                          </li>
                        )}
                        <li className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>52-Week Range: {currencySymbol}{selectedStock.low52w.toFixed(0)} - {currencySymbol}{selectedStock.high52w.toFixed(0)}</span>
                        </li>
                      </ul>
                      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
                        <button className="flex-1 text-center py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-300 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
                          Related Party
                        </button>
                        <button className="flex-1 text-center py-1.5 bg-blue-50 dark:bg-cyan-950/20 text-blue-600 dark:text-cyan-400 border border-blue-100 dark:border-cyan-900/30 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
                          Product Segments
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Technical Indicator Summary */}
                  {technicals && (
                    <div className="space-y-3 mt-6 pb-8">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Technical Summary
                        </h3>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-xs">
                        <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-150/40 dark:border-white/[0.03] p-2 sm:p-2.5 rounded-2xl flex flex-col justify-center items-center text-center">
                          <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider">RSI</span>
                          <span className="font-mono text-[10px] sm:text-xs font-black text-slate-800 dark:text-white mt-1">{technicals.rsi.toFixed(0)}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-150/40 dark:border-white/[0.03] p-2 sm:p-2.5 rounded-2xl flex flex-col justify-center items-center text-center">
                          <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider">Beta</span>
                          <span className="font-mono text-[10px] sm:text-xs font-black text-slate-800 dark:text-white mt-1">{technicals.beta.toFixed(1)}x</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-150/40 dark:border-white/[0.03] p-2 sm:p-2.5 rounded-2xl flex flex-col justify-center items-center text-center">
                          <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider">MACD</span>
                          <span className={`font-black text-[8px] sm:text-[9px] mt-1 ${technicals.macd.includes('Bullish') ? 'text-emerald-500' : 'text-rose-500'}`}>{technicals.macd.split(' ')[0]}</span>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-150/40 dark:border-white/[0.03] p-2 sm:p-2.5 rounded-2xl flex flex-col justify-center items-center text-center">
                          <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider">Trend</span>
                          <span className="font-black text-[8px] sm:text-[9px] text-slate-800 dark:text-white mt-1 truncate w-full">{technicals.trend.split(' ').pop()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unified Financial Statements Workbook Terminal */}
              <div id="screener-workbook" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-8 mt-6 w-full relative">

                {/* Terminal Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/10">
                          <FileText className="h-4.5 w-4.5" />
                        </span>
                        Financial Workbook
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        Consolidated Figures in {isIndian ? 'Rs. Crores' : 'USD Millions'}
                      </p>
                    </div>
                  </div>

                  {/* Workbook Tabs */}
                  <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1 text-[10px] font-black uppercase tracking-wider overflow-x-auto custom-scrollbar w-full">
                    {[
                      { id: 'peers', label: 'Peers' },
                      { id: 'quarters', label: 'Quarters' },
                      { id: 'pnl', label: 'P&L' },
                      { id: 'balance-sheet', label: 'Bal. Sheet' },
                      { id: 'cash-flow', label: 'Cash Flow' },
                      { id: 'ratios', label: 'Ratios' },
                      { id: 'insights', label: 'AI Insights' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setWorkbookTab(t.id as any)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-bold shrink-0 ${workbookTab === t.id
                          ? 'bg-white text-blue-600 dark:bg-white/10 dark:text-cyan-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workbook Content Panel */}
                <div className="w-full">

                  {/* Tab 1: Peer Comparison */}
                  {workbookTab === 'peers' && peerData && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-450 uppercase tracking-wider">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>Industry:</span>
                          {peerData.category.map((cat, idx) => (
                            <span key={cat} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-slate-300 dark:text-slate-700 font-normal">&gt;</span>}
                              <span className={idx === peerData.category.length - 1 ? "text-blue-600 dark:text-cyan-400 font-black" : ""}>{cat}</span>
                            </span>
                          ))}
                        </div>
                        <span className="text-blue-650 bg-blue-50 dark:text-cyan-400 dark:bg-cyan-950/20 px-2.5 py-1 rounded-lg">
                          Part of {isIndian ? 'BSE Industrials' : 'NASDAQ 105'}
                        </span>
                      </div>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-450 tracking-wider">
                              <th className="py-2.5 px-3 w-8 text-center font-sans">S.No.</th>
                              <th className="py-2.5 px-3 w-40 text-left font-sans">Name</th>
                              <th className="py-2.5 px-3 text-right font-sans">Price {currencySymbol}</th>
                              <th className="py-2.5 px-3 text-right font-sans">P/E</th>
                              <th className="py-2.5 px-3 text-right font-sans">Mar Cap {isIndian ? 'Cr.' : 'M'}</th>
                              <th className="py-2.5 px-3 text-right font-sans">Div Yield %</th>
                              <th className="py-2.5 px-3 text-right font-sans">NP Qtr {isIndian ? 'Cr.' : 'M'}</th>
                              <th className="py-2.5 px-3 text-right font-sans">Qtr Profit Var %</th>
                              <th className="py-2.5 px-3 text-right font-sans">Sales Qtr {isIndian ? 'Cr.' : 'M'}</th>
                              <th className="py-2.5 px-3 text-right font-sans">Qtr Sales Var %</th>
                              <th className="py-2.5 px-3 text-right font-sans">ROCE %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-350">
                            {peerData.peers.map((peer, idx) => {
                              const isSelf = peer.symbol.toUpperCase() === selectedStock.symbol.toUpperCase();
                              const displayPrice = isSelf ? selectedStock.price : peer.price;
                              const displayPE = isSelf ? selectedStock.peRatio : peer.pe;
                              const displayMCap = isSelf ? selectedStock.marketCap : peer.mCap;
                              const displayDiv = isSelf ? selectedStock.dividendYield : peer.div;
                              const displayROCE = isSelf ? selectedStock.roce : peer.roce;

                              return (
                                <tr
                                  key={peer.symbol}
                                  onClick={() => !isSelf && handleSelectStock(peer.symbol)}
                                  className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${isSelf ? 'bg-blue-500/5 font-black text-slate-900 dark:text-white border-y border-blue-500/20' : ''}`}
                                >
                                  <td className="py-3 px-3 text-center">{idx + 1}</td>
                                  <td className="py-3 px-3 font-sans text-left font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                    {peer.name}
                                    {isSelf && <span className="text-[8px] bg-blue-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-black uppercase px-1 rounded">YOU</span>}
                                  </td>
                                  <td className="py-3 px-3 text-right">{displayPrice.toFixed(2)}</td>
                                  <td className="py-3 px-3 text-right">{displayPE.toFixed(2)}</td>
                                  <td className="py-3 px-3 text-right">{displayMCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                  <td className="py-3 px-3 text-right">{displayDiv.toFixed(2)}%</td>
                                  <td className="py-3 px-3 text-right">{peer.npQtr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                  <td className={`py-3 px-3 text-right font-bold ${peer.qtrProfitVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {peer.qtrProfitVar >= 0 ? '+' : ''}{peer.qtrProfitVar.toFixed(1)}%
                                  </td>
                                  <td className="py-3 px-3 text-right">{peer.salesQtr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                  <td className={`py-3 px-3 text-right font-bold ${peer.qtrSalesVar >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {peer.qtrSalesVar >= 0 ? '+' : ''}{peer.qtrSalesVar.toFixed(1)}%
                                  </td>
                                  <td className="py-3 px-3 text-right font-bold">{displayROCE.toFixed(2)}%</td>
                                </tr>
                              );
                            })}

                            {/* Median Row */}
                            <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-t-2 border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white">
                              <td className="py-3 px-3 font-sans"></td>
                              <td className="py-3 px-3 font-sans text-left text-[9px] uppercase tracking-wider text-slate-400">Median ({peerData.peers.length} Co.)</td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.price : p.price), 0) / peerData.peers.length).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.peRatio : p.pe), 0) / peerData.peers.length).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.marketCap : p.mCap), 0) / peerData.peers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.dividendYield : p.div), 0) / peerData.peers.length).toFixed(2)}%
                              </td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + p.npQtr, 0) / peerData.peers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="py-3 px-3 text-right text-emerald-500">
                                +{(peerData.peers.reduce((acc, p) => acc + p.qtrProfitVar, 0) / peerData.peers.length).toFixed(1)}%
                              </td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + p.salesQtr, 0) / peerData.peers.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </td>
                              <td className="py-3 px-3 text-right text-emerald-500">
                                +{(peerData.peers.reduce((acc, p) => acc + p.qtrSalesVar, 0) / peerData.peers.length).toFixed(1)}%
                              </td>
                              <td className="py-3 px-3 text-right">
                                {(peerData.peers.reduce((acc, p) => acc + (p.symbol.toUpperCase() === selectedStock.symbol.toUpperCase() ? selectedStock.roce : p.roce), 0) / peerData.peers.length).toFixed(2)}%
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Quarterly Results */}
                  {workbookTab === 'quarters' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Statement of Operations (13 Quarters)</span>
                        <button className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-cyan-950/20 text-blue-650 dark:text-cyan-400 border border-blue-100 dark:border-cyan-900/30 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
                          Product Segments
                        </button>
                      </div>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-455 tracking-wider">
                              <th className="py-2.5 px-3 w-40 text-left font-sans">Features</th>
                              {getDynamicQuarters().map((q) => (
                                <th key={q} className="py-2.5 px-1 text-right font-mono">{q.replace(' 20', ' ')}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-350">
                            {quarterlyResults.map((row) => (
                              <tr key={row.label} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${row.bold ? 'font-bold bg-slate-50/20 dark:bg-white/[0.01] text-slate-900 dark:text-white' : ''}`}>
                                <td className="py-2.5 px-3 text-left font-sans truncate">{row.label}</td>
                                {row.values.map((v, i) => (
                                  <td key={i} className="py-2.5 px-1 text-right">
                                    {row.isPercent ? v.toFixed(1) + '%' : v.toFixed(1)}
                                  </td>
                                ))}
                              </tr>
                            ))}

                            {/* Raw PDF Row */}
                            <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors text-slate-400">
                              <td className="py-2.5 px-3 text-left font-sans">Raw PDF</td>
                              {getDynamicQuarters().map((quarter, i) => (
                                <td key={i} className="py-2.5 px-1 text-right">
                                  <button
                                    onClick={() => downloadQuarterlyReport(quarter, i)}
                                    className="inline-flex items-center justify-center cursor-pointer"
                                    title={`Download PDF Report for ${quarter}`}
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Result Notification Badge */}
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/80 dark:bg-blue-950/20 text-blue-755 dark:text-cyan-400 border border-blue-100 dark:border-cyan-900/30 rounded-xl text-[10px] font-bold shadow-sm">
                          Upcoming result date: {getResultDate(selectedStock.symbol)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Profit & Loss */}
                  {workbookTab === 'pnl' && (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Annual Profit & Loss Statement (Historical)</span>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-455 tracking-wider">
                              <th className="py-2.5 px-3 w-40 text-left font-sans">Features</th>
                              {getDynamicYears().map((q) => (
                                <th key={q} className="py-2.5 px-1 text-right font-mono">{q}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-350">
                            {pnlResults.rows.map((row) => (
                              <tr key={row.label} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${row.bold ? 'font-bold bg-slate-50/20 dark:bg-white/[0.01] text-slate-900 dark:text-white' : ''}`}>
                                <td className="py-2.5 px-3 text-left font-sans truncate">{row.label}</td>
                                {row.values.map((v, i) => (
                                  <td key={i} className="py-2.5 px-1 text-right">
                                    {row.isPercent ? v.toFixed(0) + '%' : v.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Growth indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                        <div className="bg-slate-50 dark:bg-white/[0.01] p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Compounded Sales Growth</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 text-[10px] sm:text-xs font-bold font-mono">
                            <div>10Y: <span className="text-emerald-500">+{pnlResults?.growth?.sales?.y10}</span></div>
                            <div>5Y: <span className="text-emerald-500">+{pnlResults?.growth?.sales?.y5}</span></div>
                            <div>3Y: <span className="text-emerald-500">+{pnlResults?.growth?.sales?.y3}</span></div>
                            {pnlResults?.growth?.sales?.ttm !== undefined && (
                              <div>TTM: <span className="text-emerald-500">+{pnlResults?.growth?.sales?.ttm}</span></div>
                            )}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/[0.01] p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Compounded Profit Growth</span>
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 text-[10px] sm:text-xs font-bold font-mono">
                            <div>10Y: <span className="text-emerald-500">+{pnlResults?.growth?.profit?.y10}</span></div>
                            <div>5Y: <span className="text-emerald-500">+{pnlResults?.growth?.profit?.y5}</span></div>
                            <div>3Y: <span className="text-emerald-500">+{pnlResults?.growth?.profit?.y3}</span></div>
                            {pnlResults?.growth?.profit?.ttm !== undefined && (
                              <div>TTM: <span className="text-emerald-500">+{pnlResults?.growth?.profit?.ttm}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Balance Sheet */}
                  {workbookTab === 'balance-sheet' && (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Annual Balance Sheet (Assets & Liabilities)</span>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-455 tracking-wider">
                              <th className="py-2.5 px-3 w-40 text-left font-sans">Features</th>
                              {getDynamicYears().map((q) => (
                                <th key={q} className="py-2.5 px-1 text-right font-mono">{q}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-350">
                            {balanceSheetResults.map((row) => (
                              <tr key={row.label} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${row.bold ? 'font-bold bg-slate-50/20 dark:bg-white/[0.01] text-slate-900 dark:text-white' : ''}`}>
                                <td className="py-2.5 px-3 text-left font-sans truncate">{row.label}</td>
                                {row.values.map((v, i) => (
                                  <td key={i} className="py-2.5 px-1 text-right">
                                    {v.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab 5: Cash Flow */}
                  {workbookTab === 'cash-flow' && (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Statement of Cash Flows (Annual)</span>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-455 tracking-wider">
                              <th className="py-2.5 px-3 w-40 text-left font-sans">Features</th>
                              {getDynamicYears().map((q) => (
                                <th key={q} className="py-2.5 px-1 text-right font-mono">{q}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-350">
                            {cashFlowResults.map((row) => (
                              <tr key={row.label} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${row.bold ? 'font-bold bg-slate-50/20 dark:bg-white/[0.01] text-slate-900 dark:text-white' : ''}`}>
                                <td className="py-2.5 px-3 text-left font-sans truncate">{row.label}</td>
                                {row.values.map((v, i) => (
                                  <td key={i} className="py-2.5 px-1 text-right">
                                    {row.isPercent ? v.toFixed(0) + '%' : v.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab 6: Ratios */}
                  {workbookTab === 'ratios' && (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Financial Performance Ratios</span>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-455 tracking-wider">
                              <th className="py-2.5 px-3 w-40 text-left font-sans">Features</th>
                              {getDynamicYears().map((q) => (
                                <th key={q} className="py-2.5 px-1 text-right font-mono">{q}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-medium text-slate-700 dark:text-slate-350">
                            {ratiosResults.map((row) => (
                              <tr key={row.label} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors ${row.bold ? 'font-bold bg-slate-50/20 dark:bg-white/[0.01] text-slate-900 dark:text-white' : ''}`}>
                                <td className="py-2.5 px-3 text-left font-sans truncate">{row.label}</td>
                                {row.values.map((v, i) => (
                                  <td key={i} className="py-2.5 px-1 text-right font-semibold">
                                    {row.isPercent ? v.toFixed(0) + '%' : v.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab 7: AI Insights */}
                  {workbookTab === 'insights' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 shrink-0">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">AI Calculated Business Metrics</span>
                        <span className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer">Flag error</span>
                      </div>

                      <div className="w-full overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[1000px]">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-455 tracking-wider">
                              <th className="py-2.5 px-3 w-60 text-left font-sans">Features</th>
                              {getInsightsYears().map((q) => (
                                <th key={q} className="py-2.5 px-1 text-right font-mono">{q}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-bold text-slate-900 dark:text-slate-100">
                            {insightsResults.map((row) => (
                              <tr key={row.label} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                                <td className="py-3 px-3 text-left font-sans">
                                  <div className="font-extrabold text-slate-955 dark:text-white truncate">{row.label}</div>
                                  <div className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5">{row.desc}</div>
                                </td>
                                {row.values.map((v, i) => (
                                  <td key={i} className="py-3 px-1 text-right font-semibold">
                                    {row.isPercent ? v.toFixed(2) + '%' : v.toLocaleString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              <div id="screener-shareholding" className="scroll-mt-28 border-b border-slate-200/60 dark:border-white/10 pb-8 mt-6 w-full relative overflow-hidden">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      Shareholding Pattern
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Numbers in percentages</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quarterly/Yearly Switcher */}
                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-1 text-[10px] font-black uppercase tracking-wider shadow-inner">
                      <button
                        onClick={() => setShareholdingPeriod('quarterly')}
                        className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all font-bold ${shareholdingPeriod === 'quarterly' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                      >
                        Quarterly
                      </button>
                      <button
                        onClick={() => setShareholdingPeriod('yearly')}
                        className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-all font-bold ${shareholdingPeriod === 'yearly' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                      >
                        Yearly
                      </button>
                    </div>

                  </div>
                </div>

                {/* Visual stacked bar for latest shareholding */}
                {shareholdingData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-4 mt-4">
                    {[
                      { label: 'Promoters', value: shareholdingData.rows[0].values[shareholdingData.rows[0].values.length - 1], color: 'from-blue-500 to-indigo-600' },
                      { label: 'FIIs', value: shareholdingData.rows[1].values[shareholdingData.rows[1].values.length - 1], color: 'from-teal-400 to-emerald-500' },
                      { label: 'DIIs', value: shareholdingData.rows[2].values[shareholdingData.rows[2].values.length - 1], color: 'from-amber-400 to-orange-500' },
                      { label: 'Public', value: shareholdingData.rows[3].values[shareholdingData.rows[3].values.length - 1], color: 'from-rose-400 to-pink-500' }
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50/50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 p-4 rounded-2xl flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                          <span>{item.label}</span>
                          <span className="font-mono text-slate-900 dark:text-white font-black">{item.value.toFixed(2)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div style={{ width: `${item.value}%` }} className={`h-full rounded-full bg-gradient-to-r ${item.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scrollable Table */}
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse table-fixed text-[9px] md:text-[10px] xl:text-xs min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] font-black uppercase text-slate-450 tracking-wider">
                        <th className="py-2.5 px-3.5 w-44 sm:w-52 md:w-60 text-left font-sans">Sector</th>
                        {(shareholdingPeriod === 'quarterly' ? shareholdingData?.quarters : shareholdingData?.quarters.filter((_, i) => i % 4 === 3))?.map((q) => (
                          <th key={q} className="py-2.5 px-2.5 text-right font-mono">{q}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.02] font-mono font-bold text-slate-900 dark:text-slate-100">
                      {shareholdingData?.rows.map((row) => (
                        <tr key={row.label} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-3.5 text-left font-sans font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5">
                            {row.label.includes('Promoters') && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                            {row.label.includes('FIIs') && <span className="h-2 w-2 rounded-full bg-teal-400 shrink-0" />}
                            {row.label.includes('DIIs') && <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />}
                            {row.label.includes('Public') && <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />}
                            {row.label.includes('Shareholders') && <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />}
                            {row.label}
                          </td>
                          {(shareholdingPeriod === 'quarterly' ? row.values : row.values.filter((_, i) => i % 4 === 3)).map((v, i) => (
                            <td key={i} className="py-3 px-2.5 text-right font-semibold">
                              {row.isPercent ? v.toFixed(2) + '%' : v.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Full Width Documents Card */}
              <div id="screener-documents" className="scroll-mt-28 pb-8 mt-6 w-full relative">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight mb-5 pb-3 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/10">
                    <FileText className="h-4 w-4" />
                  </span>
                  Documents Hub
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Column 1: Announcements */}
                  <div className="bg-slate-50/40 dark:bg-white/[0.01] border-l-4 border-l-emerald-500 border border-slate-200/40 dark:border-white/5 p-4 rounded-2xl flex flex-col h-full hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 group">
                    <div className="flex flex-col gap-2.5 mb-3 shrink-0">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-black uppercase tracking-wider">Announcements</h4>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-[10px] md:text-xs max-h-[250px] custom-scrollbar">
                      {companyNews.length > 0 ? (
                        companyNews.map((item, index) => {
                          const timeStr = item.providerPublishTime
                            ? new Date(item.providerPublishTime).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                            : 'Recent';
                          return (
                            <a
                              key={item.uuid || index}
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block space-y-1 group/item cursor-pointer"
                            >
                              <div className="font-extrabold text-slate-800 dark:text-slate-200 group-hover/item:text-emerald-650 dark:group-hover/item:text-emerald-400 leading-snug transition-colors">
                                {item.title}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                {timeStr} • {item.publisher || 'News Source'}
                              </div>
                            </a>
                          );
                        })
                      ) : (
                        <div className="text-slate-450 text-[10px] font-bold text-center py-8">
                          No recent announcements or news found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Annual reports */}
                  <div className="bg-slate-50/40 dark:bg-white/[0.01] border-l-4 border-l-blue-500 border border-slate-200/40 dark:border-white/5 p-4 rounded-2xl flex flex-col h-full hover:shadow-lg hover:border-blue-500/30 transition-all duration-300 group">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 mb-4 shrink-0">
                      <Globe className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Annual reports</h4>
                    </div>
                    <div className="flex-1 space-y-3.5 pr-1 text-[11px] md:text-xs">
                      {['2026', '2025', '2024', '2023'].map((yr) => (
                        <div
                          key={yr}
                          onClick={() => handleDownloadAnnualReport(yr)}
                          className="group/item cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/[0.02] p-1.5 rounded-xl transition-all border border-transparent hover:border-blue-500/10"
                        >
                          <div className="font-extrabold text-blue-600 dark:text-cyan-400 flex items-center justify-between">
                            <span>Financial Year {yr}</span>
                            <Download className="h-3 w-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Report aggregated from {isIndian ? 'bse' : 'sec filing'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Credit ratings */}
                  <div className="bg-slate-50/40 dark:bg-white/[0.01] border-l-4 border-l-amber-500 border border-slate-200/40 dark:border-white/5 p-4 rounded-2xl flex flex-col h-full hover:shadow-lg hover:border-amber-500/30 transition-all duration-300 group">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-4 shrink-0">
                      <Bookmark className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Credit ratings</h4>
                    </div>
                    <div className="flex-1 space-y-3.5 pr-1 text-[11px] md:text-xs">
                      {creditRatings.map((r, idx) => (
                        <a
                          key={idx}
                          href={`https://www.google.com/search?q=${encodeURIComponent(selectedStock.name + ' ' + r.agency + ' ' + r.label + ' ' + r.date)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group/item cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/[0.02] p-1.5 rounded-xl transition-all border border-transparent hover:border-amber-500/10"
                        >
                          <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                            <span>{r.label}</span>
                            <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${r.status === 'Positive'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : r.status === 'Negative'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-blue-500/10 text-blue-500'
                              }`}>
                              {r.status}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{r.date} • {r.agency}</div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: Concalls */}
                  <div className="bg-slate-50/40 dark:bg-white/[0.01] border-l-4 border-l-purple-500 border border-slate-200/40 dark:border-white/5 p-4 rounded-2xl flex flex-col h-full hover:shadow-lg hover:border-purple-500/30 transition-all duration-300 group">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                      <div className="flex items-center gap-2 text-purple-650 dark:text-purple-400">
                        <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <h4 className="text-xs font-black uppercase tracking-wider">Concalls</h4>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3.5 pr-1 text-[10px] md:text-xs">
                      {[
                        { date: 'Jun 2026', ppt: false },
                        { date: 'Jun 2025', ppt: true },
                        { date: 'May 2024', ppt: true },
                        { date: 'May 2023', ppt: true },
                        { date: 'May 2022', ppt: true }
                      ].map((c) => (
                        <div key={c.date} className="flex flex-wrap items-center justify-between gap-1.5 py-1 border-b border-slate-100/50 dark:border-white/[0.02] last:border-0 pb-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-350 font-mono text-[10px]">{c.date}</span>
                          <div className="flex flex-wrap gap-1 shrink-0">
                            <button
                              onClick={() => showTranscript(c.date)}
                              className="px-2 py-0.5 border border-purple-500/20 text-purple-650 dark:text-purple-400 hover:bg-purple-500/10 rounded text-[8px] font-black tracking-wider transition-all"
                            >
                              Transcript
                            </button>
                            <button
                              onClick={() => showAISummary(c.date)}
                              className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white dark:from-purple-500 dark:to-indigo-500 rounded text-[8px] font-black tracking-wider shadow-sm transition-all"
                            >
                              AI Summary
                            </button>
                            <button
                              disabled={!c.ppt}
                              onClick={() => c.ppt && handleDownloadPPT(c.date)}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider transition-all border ${c.ppt ? 'border-purple-500/20 text-purple-650 dark:text-purple-400 hover:bg-purple-500/10' : 'border-slate-200 dark:border-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed'}`}
                            >
                              PPT
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div> {/* Closes Right main content container */}
          </div> {/* Closes Main content wrapper with sticky left sidebar */}
        </div>
      )}

      {/* Document Viewer Modal */}
      {activeDocumentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn relative">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 z-10">
              <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {activeDocumentModal.type === 'summary' ? <Sparkles className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>
                {activeDocumentModal.title}
              </h3>
              <button
                onClick={() => setActiveDocumentModal(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs leading-relaxed z-10 max-h-[50vh] whitespace-pre-wrap selection:bg-purple-500/30">
              {activeDocumentModal.content}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-4 flex justify-end gap-3 bg-slate-950/40 z-10">
              <button
                onClick={() => {
                  const filename = `${activeDocumentModal.title.replace(/[\s-]/g, '_')}.txt`;
                  const blob = new Blob([activeDocumentModal.content], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", filename);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("Document downloaded!");
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
              >
                <Download className="h-3.5 w-3.5" /> Download TXT
              </button>
              <button
                onClick={() => setActiveDocumentModal(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
