import { useQuery }
from "@tanstack/react-query";

import {
  fetchGlobalMarkets
}
from "../services/marketService";

export function useGlobalMarkets() {
  return useQuery({
    queryKey: ["globalMarkets"],
    queryFn: fetchGlobalMarkets,
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 5000, // 5 seconds stale time
  });
}