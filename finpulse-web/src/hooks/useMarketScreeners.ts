import { useQuery } from "@tanstack/react-query";

import {
  getMarketScreener,
} from "../services/marketService";

export function useMarketScreener(
  market: string,
  type: string
) {
  return useQuery({
    queryKey: [
      "market-screener",
      market,
      type,
    ],

    queryFn: () =>
      getMarketScreener(
        market,
        type
      ),

    refetchInterval: 60000,
  });
}