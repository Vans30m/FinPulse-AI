/**
 * Shared utility for resolving asset types from Yahoo Finance symbols.
 * Used site-wide to determine how to open/display an asset.
 */

export type AssetType = "Stock" | "Index" | "Crypto" | "Forex" | "Commodities";

/**
 * Determines the asset type from a Yahoo Finance symbol.
 */
export function resolveAssetType(symbol: string): AssetType {
  if (!symbol) return "Stock";
  const upper = symbol.toUpperCase();
  if (upper.endsWith("=X")) return "Forex";
  if (upper.endsWith("-USD") || upper.endsWith("-USDT")) return "Crypto";
  if (upper.endsWith("=F")) return "Commodities";
  if (
    upper.startsWith("^") ||
    upper.endsWith(".NS") && (
      upper.startsWith("^CNX") ||
      upper.startsWith("^NSE") ||
      upper.startsWith("^BSESN") ||
      upper.startsWith("^NSEI") ||
      upper.startsWith("^BSEI") ||
      [
        "^GSPC", "^IXIC", "^DJI", "^RUT", "^NDX", "^VIX",
        "^FTSE", "^GDAXI", "^FCHI", "^N225", "^HSI",
        "^TWII", "^KS11", "^AXJO", "^STOXX50E",
      ].includes(upper)
    )
  ) return "Index";
  // Symbols starting with ^ are always indices
  if (upper.startsWith("^")) return "Index";
  return "Stock";
}

/**
 * Returns true if the symbol represents a market index.
 * Indices: symbols starting with ^, or known index tickers.
 */
export function isIndexSymbol(symbol: string): boolean {
  if (!symbol) return false;
  const upper = symbol.toUpperCase();

  // All ^ prefix = indices
  if (upper.startsWith("^")) return true;

  // Known index symbols without ^ prefix
  const knownIndices = [
    "NIFTY50", "NIFTY", "SENSEX", "BANKNIFTY",
    "^NSEI", "^BSESN", "^GSPC", "^IXIC", "^DJI",
    "^RUT", "^NDX", "^VIX", "^FTSE", "^GDAXI",
    "^FCHI", "^N225", "^HSI", "^TWII", "^KS11",
    "^AXJO", "^STOXX50E", "^CNX", "^NSE",
  ];

  if (knownIndices.some((idx) => upper.startsWith(idx))) return true;

  return false;
}
