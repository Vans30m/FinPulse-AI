import { useQuery } from "@tanstack/react-query";

import {
  getMarketHistory,
} from "../services/marketService";

export function useIndexPerformance(
  symbol: string
) {
  return useQuery({
    queryKey: [
      "index-performance",
      symbol,
    ],

    queryFn: async () => {
      const history =
        await getMarketHistory(
          symbol,
          "1y"
        );

      return history;
    },

    enabled: !!symbol,
  });
}