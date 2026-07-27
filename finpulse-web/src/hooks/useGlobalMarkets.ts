import { useQuery }
from "@tanstack/react-query";

import {
  fetchGlobalMarkets
}
from "../services/marketService";

export function useGlobalMarkets() {

  return useQuery({
    queryKey: ["globalMarkets"],

    queryFn:
      fetchGlobalMarkets,

    refetchInterval: 2 * 60 * 1000, // 2 minutes – matches backend cache TTL and prevents Yahoo 429s
  });
}