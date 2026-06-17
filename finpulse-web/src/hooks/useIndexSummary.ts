import { useQuery } from "@tanstack/react-query";

import {
  getIndexSummary,
} from "../services/marketService";

export function useIndexSummary(
  symbol: string
) {
  return useQuery({
    queryKey: [
      "index-summary",
      symbol,
    ],

    queryFn: () =>
      getIndexSummary(symbol),

    enabled: !!symbol,
  });
}