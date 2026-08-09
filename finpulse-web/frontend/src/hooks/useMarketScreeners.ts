import { useQuery } from "@tanstack/react-query";
import { getMarketScreener } from "../services/marketService";

export function useMarketScreener(market: string, type: string) {
  return useQuery({
    queryKey: ["market-screener", market, type],
    queryFn: () => getMarketScreener(market, type),

    // Speed & reliability improvements:
    // 1. staleTime matches backend cache TTL (10 min) — serve cached data instantly on tab switch
    // 2. refetchInterval is longer than cache TTL so we never fetch mid-cache
    // 3. refetchOnWindowFocus disabled — no surprise re-fetches when user alt-tabs
    // 4. enabled only for "gainers" and "losers" — "active" type is removed
    staleTime: 10 * 60 * 1000,      // 10 min — matches backend screener cache TTL
    refetchInterval: 10 * 60 * 1000, // Re-poll every 10 min (was 60s — 10x reduction in Yahoo calls)
    refetchOnWindowFocus: false,
    enabled: type === "gainers" || type === "losers", // "active" removed from product
  });
}