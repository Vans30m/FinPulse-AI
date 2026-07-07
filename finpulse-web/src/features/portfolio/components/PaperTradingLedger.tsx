import { ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';

export interface VirtualTransaction {
  id: string;
  timestamp: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  name: string;
  shares: number;
  price: number;
  totalValue: number;
}

interface PaperTradingLedgerProps {
  transactions: VirtualTransaction[];
  activeCurrency: string;
}

export default function PaperTradingLedger({ transactions, activeCurrency }: PaperTradingLedgerProps) {
  return (
    <div className="glass-panel overflow-hidden shadow-lg transition-all duration-300 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.01] via-transparent to-purple-500/[0.02] pointer-events-none" />
      
      <div className="p-6 bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            <span>Paper Trading Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Historical logs of all virtual market orders executed in this session.</p>
        </div>
        <span className="rounded-full bg-indigo-550/10 dark:bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {transactions.length} Orders Logged
        </span>
      </div>

      <div className="w-full overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400 font-medium">
            No virtual trades executed yet. Place an order to start tracking performance!
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-4">Asset</th>
                <th className="py-4 px-4 text-center">Type</th>
                <th className="py-4 px-4 text-right">Shares / Qty</th>
                <th className="py-4 px-4 text-right">Execution Price</th>
                <th className="py-4 px-6 text-right">Total Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850/40">
              {[...transactions].reverse().map((tx) => {
                const isBuy = tx.type === 'BUY';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/30 dark:hover:bg-white/[0.005] transition-colors group align-middle font-mono">
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-black rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200">
                          {tx.symbol}
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans truncate max-w-[150px]">
                          {tx.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                        isBuy 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-slate-600 dark:text-slate-300">
                      {tx.shares.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-slate-600 dark:text-slate-300">
                      {activeCurrency}{tx.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-bold text-slate-900 dark:text-white">
                      {activeCurrency}{tx.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
