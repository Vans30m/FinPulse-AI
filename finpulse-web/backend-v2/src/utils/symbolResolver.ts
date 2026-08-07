/**
 * Automatically resolve asset category type based on Yahoo symbol format.
 */
export function resolveSymbolType(symbol: string): "Stock" | "Index" | "Crypto" | "Forex" | "Commodities" {
  if (!symbol) return "Stock";
  
  const upperSymbol = symbol.toUpperCase();
  
  if (upperSymbol.endsWith("=X")) {
    return "Forex";
  }
  
  if (upperSymbol.endsWith("-USD")) {
    return "Crypto";
  }
  
  if (upperSymbol.endsWith("=F")) {
    return "Commodities";
  }
  
  if (upperSymbol.startsWith("^") || upperSymbol.endsWith(".NS")) {
    return "Index";
  }
  
  return "Stock";
}
