import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  Globe,
  LineChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import data from './data/mockData.json'
import logo from './assets/Logo.png'

type TradingViewWidgetProps = {
  scriptSrc: string
  config: Record<string, unknown>
  className?: string
}

function TradingViewWidget({
  scriptSrc,
  config,
  className,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''
    const script = document.createElement('script')
    script.src = scriptSrc
    script.async = true
    script.type = 'text/javascript'
    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [scriptSrc, JSON.stringify(config)])

  return <div ref={containerRef} className={className}></div>
}

function App() {
  const {
    hero,
    heroMetrics,
    heroPanels,
    marketCards,
    briefingCards,
    heatmap,
    watchlist,
    alerts,
  } = data
  const navItems = [
    { id: 'pulse', label: 'Pulse' },
    { id: 'markets', label: 'Markets' },
    { id: 'briefing', label: 'Briefing' },
    { id: 'watchlist', label: 'Watchlist' },
    { id: 'alerts', label: 'Alerts' },
  ]
  const [activeSection, setActiveSection] = useState('pulse')

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section))
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible?.target.id) {
          setActiveSection(visible.target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [navItems])

  const handleNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    event.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(id)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-night-900 text-slate-200">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-hero opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-graph opacity-70" />
      <div className="pointer-events-none absolute left-10 top-20 h-40 w-40 rounded-full bg-cyan-400/20 blur-[90px]" />
      <div className="pointer-events-none absolute right-16 top-24 h-48 w-48 rounded-full bg-emerald-400/20 blur-[120px]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-night-900/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10">
              <img src={logo} alt="FinPulse logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">FinPulse</p>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                AI Market Pulse
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => handleNavClick(event, item.id)}
                className={`rounded-full px-3 py-2 transition ${
                  activeSection === item.id
                    ? 'bg-white/10 text-white'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
              to="/signin"
            >
              Sign in
            </Link>
            <button className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-night-950 shadow-glow transition hover:brightness-110">
              Create watchlist
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]" id="pulse">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles className="h-3 w-3" />
              {hero.eyebrow}
            </div>
            <h1 className="text-4xl font-semibold text-white md:text-5xl">
              {hero.title}
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              {hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-sm font-semibold text-night-950 shadow-glow transition hover:brightness-110">
                Create watchlist
              </button>
              <button className="rounded-full border border-white/15 px-5 py-2 text-sm text-slate-200 transition hover:border-cyan-300/60">
                View live briefing
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <div key={metric.label} className="glass-panel px-4 py-3">
                  <p className="text-2xl font-semibold text-white">
                    {metric.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {heroPanels.map((panel) => (
              <div key={panel.title} className="glass-card p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                  <LineChart className="h-4 w-4 text-cyan-300" />
                  {panel.title}
                </div>
                <p className="mt-3 text-sm text-slate-200">{panel.body}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{panel.footer.label}</span>
                  <button className="inline-flex items-center gap-1 text-cyan-300">
                    {panel.footer.action}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        <section className="glass-panel p-6" aria-label="Live market strip">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Live Market Pulse</h2>
              <p className="text-sm text-slate-400">
                Streaming prices and sentiment shifts across key assets.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <Globe className="h-4 w-4" />
              Global data sync
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-5">
            {marketCards.map((card, index) => (
              <motion.div
                key={card.symbol}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-night-800/60 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {card.symbol}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {card.price}
                </p>
                <div
                  className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                    card.direction === 'up'
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {card.direction === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {card.change}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" id="markets">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">TradingView Widgets</h2>
                <p className="text-sm text-slate-400">
                  Mobile-optimized market views with lightweight embeds.
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-300">
                Live
              </span>
            </div>
            <div className="mt-4 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-800/70">
                <TradingViewWidget
                  className="min-h-[90px]"
                  scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
                  config={{
                    symbols: [
                      { proName: 'NSE:NIFTY', title: 'NIFTY 50' },
                      { proName: 'BSE:SENSEX', title: 'SENSEX' },
                      { proName: 'FX_IDC:USDINR', title: 'USD/INR' },
                      { proName: 'TVC:GOLD', title: 'Gold' },
                      { proName: 'BINANCE:BTCUSDT', title: 'Bitcoin' },
                    ],
                    showSymbolLogo: true,
                    isTransparent: false,
                    displayMode: 'adaptive',
                    colorTheme: 'dark',
                    locale: 'en',
                  }}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-800/70">
                  <TradingViewWidget
                    className="min-h-[360px]"
                    scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
                    config={{
                      colorTheme: 'dark',
                      dateRange: '12M',
                      showChart: true,
                      locale: 'en',
                      width: '100%',
                      height: 360,
                      largeChartUrl: '',
                      isTransparent: false,
                      tabs: [
                        {
                          title: 'Indices',
                          symbols: [
                            { s: 'NSE:NIFTY' },
                            { s: 'BSE:SENSEX' },
                            { s: 'NSE:BANKNIFTY' },
                          ],
                        },
                        {
                          title: 'Commodities',
                          symbols: [{ s: 'TVC:GOLD' }, { s: 'TVC:SILVER' }],
                        },
                      ],
                    }}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-800/70">
                  <TradingViewWidget
                    className="min-h-[360px]"
                    scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
                    config={{
                      symbol: 'NSE:RELIANCE',
                      width: '100%',
                      height: 360,
                      locale: 'en',
                      dateRange: '12M',
                      colorTheme: 'dark',
                      trendLineColor: '#00D1FF',
                      underLineColor: 'rgba(0, 209, 255, 0.2)',
                      isTransparent: false,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-card p-5" id="briefing">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">AI Briefing</h2>
                <span className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                  Fresh
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {briefingCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-white/10 bg-night-800/60 p-4">
                    <p className="text-sm font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-sm text-slate-300">{card.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold text-white">Sentiment Heatmap</h2>
              <p className="text-sm text-slate-400">
                Analyst mood and news flow by sector.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {heatmap.map((tile) => (
                  <div
                    key={tile.sector}
                    className={`rounded-2xl border px-3 py-3 text-sm ${
                      tile.sentiment === 'positive'
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                        : tile.sentiment === 'negative'
                        ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                        : 'border-white/10 bg-white/5 text-slate-200'
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] opacity-80">
                      {tile.sector}
                    </p>
                    <p className="mt-2 text-base font-semibold">{tile.score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" id="watchlist">
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Watchlist Preview</h2>
              <button className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                Manage
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {watchlist.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-night-800/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {item.symbol}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {item.price}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.sentiment === 'positive'
                          ? 'bg-emerald-400/15 text-emerald-300'
                          : item.sentiment === 'negative'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6" id="alerts">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Alerts Timeline</h2>
              <Bell className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-4 space-y-4">
              {alerts.map((alert) => (
                <div key={`${alert.time}-${alert.title}`} className="flex gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-cyan-300 shadow-glow" />
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{alert.time}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-slate-300">
                        {alert.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {alert.title}
                    </p>
                    <p className="text-sm text-slate-300">{alert.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App